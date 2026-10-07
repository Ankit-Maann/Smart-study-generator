/**
 * Study Agent — Core agentic orchestration for personalized study plans,
 * topic importance ranking, exam predictions, and weak area detection.
 */
const { generateText, chat } = require('../utils/graniteClient');

// ── In-memory student profile store (replace with DB in production) ──────────
const studentProfiles = new Map();

function getProfile(studentId) {
  if (!studentProfiles.has(studentId)) {
    studentProfiles.set(studentId, {
      studentId,
      topics: [],          // { name, score, attempts, lastStudied }
      studySessions: [],   // { date, duration, topics, score }
      flashcardStats: {},  // topicId → { correct, wrong }
      quizHistory: [],     // { date, topic, score, total }
      uploadedMaterials: [], // { id, name, type, summary }
      examDates: [],       // { subject, date }
      studyPlan: null,
    });
  }
  return studentProfiles.get(studentId);
}

// ── Agent: Summarize uploaded study material ─────────────────────────────────
async function summarizeMaterial(content, subject, level = 'undergraduate') {
  const prompt = `You are an expert academic tutor. A ${level} student has shared the following study material on "${subject}".

Create a structured summary with:
1. **Key Concepts** (bullet points, ≤10 items)
2. **Detailed Explanation** (2–3 paragraphs, plain English)
3. **Important Formulas / Definitions** (if applicable)
4. **Common Exam Topics** from this material

Study Material:
"""
${content}
"""

Provide a well-organized, student-friendly summary.`;

  return generateText(prompt, { max_new_tokens: 1200 });
}

// ── Agent: Generate flashcards from material ─────────────────────────────────
async function generateFlashcards(content, subject, count = 10) {
  const prompt = `You are a study tool. Based on this study material about "${subject}", generate exactly ${count} flashcards.

Format each flashcard STRICTLY as:
Q: [question]
A: [answer]

Make questions test conceptual understanding, not just rote recall. Cover diverse aspects of the material.

Study Material:
"""
${content}
"""

Generate ${count} Q&A flashcards:`;

  const raw = await generateText(prompt, { max_new_tokens: 1500 });

  // Parse Q: A: pairs
  const flashcards = [];
  const pairs = raw.split(/\n(?=Q:)/);
  for (const pair of pairs) {
    const qMatch = pair.match(/Q:\s*(.+)/);
    const aMatch = pair.match(/A:\s*([\s\S]+?)(?=\nQ:|$)/);
    if (qMatch && aMatch) {
      flashcards.push({
        question: qMatch[1].trim(),
        answer: aMatch[1].trim(),
      });
    }
  }
  return flashcards.slice(0, count);
}

// ── Agent: Generate a concept map (textual, structured) ──────────────────────
async function generateConceptMap(content, subject) {
  const prompt = `You are an expert in knowledge visualization. For the topic "${subject}", analyze the following material and produce a structured concept map in JSON format.

Output ONLY valid JSON with this structure:
{
  "centralConcept": "main topic name",
  "branches": [
    {
      "concept": "branch concept",
      "description": "brief description",
      "subConcepts": ["sub1", "sub2"],
      "importance": "high|medium|low"
    }
  ]
}

Study Material:
"""
${content}
"""

Output the JSON concept map:`;

  const raw = await generateText(prompt, { max_new_tokens: 1000 });
  try {
    const jsonStart = raw.indexOf('{');
    const jsonEnd = raw.lastIndexOf('}') + 1;
    return JSON.parse(raw.slice(jsonStart, jsonEnd));
  } catch {
    return { centralConcept: subject, branches: [], rawOutput: raw };
  }
}

// ── Agent: Generate a practice quiz ─────────────────────────────────────────
async function generateQuiz(topic, difficulty = 'medium', count = 5) {
  const prompt = `Generate a ${difficulty}-difficulty multiple-choice quiz about "${topic}" with exactly ${count} questions.

Format STRICTLY as JSON array:
[
  {
    "question": "...",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "correctIndex": 0,
    "explanation": "why this answer is correct"
  }
]

Output only the JSON array, no extra text:`;

  const raw = await generateText(prompt, { max_new_tokens: 1500 });
  try {
    const start = raw.indexOf('[');
    const end = raw.lastIndexOf(']') + 1;
    return JSON.parse(raw.slice(start, end));
  } catch {
    return [];
  }
}

// ── Agent: Build a personalized study plan ───────────────────────────────────
async function buildStudyPlan(profile, examDate, subjectFocus) {
  const weakTopics = profile.topics
    .filter((t) => t.score < 60)
    .map((t) => t.name)
    .join(', ') || 'general topics';

  const strongTopics = profile.topics
    .filter((t) => t.score >= 75)
    .map((t) => t.name)
    .join(', ') || 'none identified yet';

  const daysUntilExam = examDate
    ? Math.max(1, Math.ceil((new Date(examDate) - new Date()) / 86400000))
    : 14;

  const prompt = `You are a personalized academic coach. Create a detailed ${daysUntilExam}-day study plan for a student focusing on "${subjectFocus}".

Student Profile:
- Weak areas (score < 60%): ${weakTopics}
- Strong areas (score ≥ 75%): ${strongTopics}
- Days until exam: ${daysUntilExam}
- Past quiz average: ${profile.quizHistory.length > 0
    ? Math.round(profile.quizHistory.reduce((s, q) => s + (q.score / q.total) * 100, 0) / profile.quizHistory.length)
    : 'N/A'}%

Create a day-by-day plan. For each day specify:
- Day number and date offset
- Topic(s) to cover
- Recommended activities (reading, flashcards, practice problems, video)
- Estimated study time
- Priority level (High/Medium/Low)

Format as JSON array:
[
  {
    "day": 1,
    "dateOffset": "+1 day",
    "topics": ["Topic A"],
    "activities": ["Read chapter 3", "Do 20 flashcards"],
    "estimatedTime": "2 hours",
    "priority": "High",
    "focusReason": "weak area"
  }
]

Output only the JSON array:`;

  const raw = await generateText(prompt, { max_new_tokens: 2000 });
  try {
    const start = raw.indexOf('[');
    const end = raw.lastIndexOf(']') + 1;
    return JSON.parse(raw.slice(start, end));
  } catch {
    return [];
  }
}

// ── Agent: Predict important exam topics ─────────────────────────────────────
async function predictExamTopics(subject, syllabus = '', pastExamHints = '') {
  const prompt = `You are an exam prediction expert for "${subject}".
${syllabus ? `Syllabus: ${syllabus}` : ''}
${pastExamHints ? `Past exam patterns: ${pastExamHints}` : ''}

Predict the top exam topics and give actionable study alerts. Format as JSON:
{
  "highPriorityTopics": [
    { "topic": "...", "reason": "...", "probability": "high|medium", "studyTip": "..." }
  ],
  "alerts": [
    { "type": "warning|info|tip", "message": "...", "topic": "..." }
  ],
  "overallAdvice": "..."
}

Output only the JSON:`;

  const raw = await generateText(prompt, { max_new_tokens: 1000 });
  try {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}') + 1;
    return JSON.parse(raw.slice(start, end));
  } catch {
    return { highPriorityTopics: [], alerts: [], overallAdvice: raw };
  }
}

// ── Agent: Answer a student question (tutor chat) ────────────────────────────
async function tutorChat(messages, subject, studentLevel = 'undergraduate') {
  const systemPrompt = `You are an expert tutor for ${subject} at the ${studentLevel} level. 
You explain concepts clearly, use examples, and guide students toward understanding rather than just giving answers. 
Keep responses focused, accurate, and appropriately detailed for a student context.`;

  return chat(messages, systemPrompt, { max_new_tokens: 800 });
}

// ── Profile management helpers ───────────────────────────────────────────────
function updateTopicScore(studentId, topic, score) {
  const profile = getProfile(studentId);
  const existing = profile.topics.find((t) => t.name === topic);
  if (existing) {
    existing.score = Math.round((existing.score * existing.attempts + score) / (existing.attempts + 1));
    existing.attempts += 1;
    existing.lastStudied = new Date().toISOString();
  } else {
    profile.topics.push({ name: topic, score, attempts: 1, lastStudied: new Date().toISOString() });
  }
}

function recordQuizResult(studentId, topic, correct, total) {
  const profile = getProfile(studentId);
  profile.quizHistory.push({
    date: new Date().toISOString(),
    topic,
    score: correct,
    total,
  });
  updateTopicScore(studentId, topic, Math.round((correct / total) * 100));
}

function addStudySession(studentId, durationMinutes, topics) {
  const profile = getProfile(studentId);
  profile.studySessions.push({
    date: new Date().toISOString(),
    duration: durationMinutes,
    topics,
  });
}

module.exports = {
  getProfile,
  summarizeMaterial,
  generateFlashcards,
  generateConceptMap,
  generateQuiz,
  buildStudyPlan,
  predictExamTopics,
  tutorChat,
  updateTopicScore,
  recordQuizResult,
  addStudySession,
};
