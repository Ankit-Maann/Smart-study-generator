/**
 * Study Routes — REST API endpoints for material processing, generation, and student management.
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const agent = require('../agents/studyAgent');

// ── Multer storage for uploaded files ────────────────────────────────────────
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.txt', '.md', '.pdf', '.png', '.jpg', '.jpeg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error(`File type ${ext} not supported`));
  },
});

// ── GET /api/study/profile/:studentId ────────────────────────────────────────
router.get('/profile/:studentId', (req, res) => {
  const profile = agent.getProfile(req.params.studentId);
  res.json({ success: true, profile });
});

// ── POST /api/study/summarize ─────────────────────────────────────────────────
// Body: { content, subject, level, studentId }
router.post('/summarize', async (req, res) => {
  try {
    const { content, subject = 'General', level = 'undergraduate', studentId = 'default' } = req.body;
    if (!content) return res.status(400).json({ error: 'content is required' });

    const summary = await agent.summarizeMaterial(content, subject, level);

    // Record in profile
    const profile = agent.getProfile(studentId);
    profile.uploadedMaterials.push({
      id: uuidv4(),
      name: subject,
      type: 'text',
      summary: summary.slice(0, 300) + '...',
      addedAt: new Date().toISOString(),
    });

    res.json({ success: true, summary });
  } catch (err) {
    console.error('[summarize]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/study/summarize-upload ─────────────────────────────────────────
// Multipart: file + subject + studentId
router.post('/summarize-upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { subject = 'General', level = 'undergraduate', studentId = 'default' } = req.body;

    // For text files read buffer; for images describe via prompt
    const ext = path.extname(req.file.originalname).toLowerCase();
    let content;

    if (['.txt', '.md'].includes(ext)) {
      content = req.file.buffer.toString('utf8').slice(0, 6000);
    } else if (['.png', '.jpg', '.jpeg'].includes(ext)) {
      // For image uploads we inform Granite (vision not available in base granite-13b; describe context)
      content = `[Image uploaded: ${req.file.originalname}] The student has uploaded a textbook page image for subject "${subject}". Please provide a comprehensive study guide for this subject based on common curriculum topics.`;
    } else {
      content = `Document: ${req.file.originalname} for subject "${subject}". Provide a study guide.`;
    }

    const summary = await agent.summarizeMaterial(content, subject, level);

    const profile = agent.getProfile(studentId);
    profile.uploadedMaterials.push({
      id: uuidv4(),
      name: req.file.originalname,
      type: ext.replace('.', ''),
      summary: summary.slice(0, 300) + '...',
      addedAt: new Date().toISOString(),
    });

    res.json({ success: true, summary, fileName: req.file.originalname });
  } catch (err) {
    console.error('[summarize-upload]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/study/flashcards ────────────────────────────────────────────────
// Body: { content, subject, count, studentId }
router.post('/flashcards', async (req, res) => {
  try {
    const { content, subject = 'General', count = 10, studentId = 'default' } = req.body;
    if (!content) return res.status(400).json({ error: 'content is required' });

    const flashcards = await agent.generateFlashcards(content, subject, Math.min(count, 20));
    res.json({ success: true, flashcards, total: flashcards.length });
  } catch (err) {
    console.error('[flashcards]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/study/concept-map ───────────────────────────────────────────────
// Body: { content, subject }
router.post('/concept-map', async (req, res) => {
  try {
    const { content, subject = 'General' } = req.body;
    if (!content) return res.status(400).json({ error: 'content is required' });

    const conceptMap = await agent.generateConceptMap(content, subject);
    res.json({ success: true, conceptMap });
  } catch (err) {
    console.error('[concept-map]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/study/quiz ──────────────────────────────────────────────────────
// Body: { topic, difficulty, count, studentId }
router.post('/quiz', async (req, res) => {
  try {
    const { topic, difficulty = 'medium', count = 5, studentId = 'default' } = req.body;
    if (!topic) return res.status(400).json({ error: 'topic is required' });

    const questions = await agent.generateQuiz(topic, difficulty, Math.min(count, 10));
    res.json({ success: true, questions, topic, difficulty });
  } catch (err) {
    console.error('[quiz]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/study/quiz-result ───────────────────────────────────────────────
// Body: { studentId, topic, correct, total }
router.post('/quiz-result', (req, res) => {
  try {
    const { studentId = 'default', topic, correct, total } = req.body;
    agent.recordQuizResult(studentId, topic, correct, total);
    const profile = agent.getProfile(studentId);
    res.json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/study/study-plan ────────────────────────────────────────────────
// Body: { studentId, examDate, subjectFocus }
router.post('/study-plan', async (req, res) => {
  try {
    const { studentId = 'default', examDate, subjectFocus = 'General Studies' } = req.body;
    const profile = agent.getProfile(studentId);
    const plan = await agent.buildStudyPlan(profile, examDate, subjectFocus);

    profile.studyPlan = { generatedAt: new Date().toISOString(), examDate, subjectFocus, days: plan };
    res.json({ success: true, studyPlan: profile.studyPlan });
  } catch (err) {
    console.error('[study-plan]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/study/exam-predictions ─────────────────────────────────────────
// Body: { subject, syllabus, pastExamHints }
router.post('/exam-predictions', async (req, res) => {
  try {
    const { subject, syllabus = '', pastExamHints = '' } = req.body;
    if (!subject) return res.status(400).json({ error: 'subject is required' });

    const predictions = await agent.predictExamTopics(subject, syllabus, pastExamHints);
    res.json({ success: true, predictions });
  } catch (err) {
    console.error('[exam-predictions]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/study/tutor-chat ────────────────────────────────────────────────
// Body: { messages, subject, studentLevel, studentId }
router.post('/tutor-chat', async (req, res) => {
  try {
    const { messages = [], subject = 'General', studentLevel = 'undergraduate' } = req.body;
    if (messages.length === 0) return res.status(400).json({ error: 'messages array is required' });

    const reply = await agent.tutorChat(messages, subject, studentLevel);
    res.json({ success: true, reply });
  } catch (err) {
    console.error('[tutor-chat]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/study/session ───────────────────────────────────────────────────
// Body: { studentId, durationMinutes, topics }
router.post('/session', (req, res) => {
  try {
    const { studentId = 'default', durationMinutes = 30, topics = [] } = req.body;
    agent.addStudySession(studentId, durationMinutes, topics);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/study/voice-query ───────────────────────────────────────────────
// Body: { transcript, subject, studentId } — transcript from browser Web Speech API
router.post('/voice-query', async (req, res) => {
  try {
    const { transcript, subject = 'General', studentId = 'default' } = req.body;
    if (!transcript) return res.status(400).json({ error: 'transcript is required' });

    // Treat as a tutor chat message
    const reply = await agent.tutorChat(
      [{ role: 'user', content: transcript }],
      subject,
      'undergraduate'
    );
    res.json({ success: true, reply, transcript });
  } catch (err) {
    console.error('[voice-query]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
