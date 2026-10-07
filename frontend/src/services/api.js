import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000, // IBM Granite can take time on large inputs
});

// ── Study API calls ──────────────────────────────────────────────────────────

export const getProfile = (studentId) =>
  api.get(`/study/profile/${studentId}`).then((r) => r.data);

export const summarizeText = (content, subject, level, studentId) =>
  api.post('/study/summarize', { content, subject, level, studentId }).then((r) => r.data);

export const summarizeFile = (formData) =>
  api.post('/study/summarize-upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);

export const generateFlashcards = (content, subject, count, studentId) =>
  api.post('/study/flashcards', { content, subject, count, studentId }).then((r) => r.data);

export const generateConceptMap = (content, subject) =>
  api.post('/study/concept-map', { content, subject }).then((r) => r.data);

export const generateQuiz = (topic, difficulty, count, studentId) =>
  api.post('/study/quiz', { topic, difficulty, count, studentId }).then((r) => r.data);

export const submitQuizResult = (studentId, topic, correct, total) =>
  api.post('/study/quiz-result', { studentId, topic, correct, total }).then((r) => r.data);

export const generateStudyPlan = (studentId, examDate, subjectFocus) =>
  api.post('/study/study-plan', { studentId, examDate, subjectFocus }).then((r) => r.data);

export const getExamPredictions = (subject, syllabus, pastExamHints) =>
  api.post('/study/exam-predictions', { subject, syllabus, pastExamHints }).then((r) => r.data);

export const sendTutorMessage = (messages, subject, studentLevel) =>
  api.post('/study/tutor-chat', { messages, subject, studentLevel }).then((r) => r.data);

export const sendVoiceQuery = (transcript, subject, studentId) =>
  api.post('/study/voice-query', { transcript, subject, studentId }).then((r) => r.data);

export const recordSession = (studentId, durationMinutes, topics) =>
  api.post('/study/session', { studentId, durationMinutes, topics }).then((r) => r.data);

export const checkHealth = () =>
  api.get('/health').then((r) => r.data);

export default api;
