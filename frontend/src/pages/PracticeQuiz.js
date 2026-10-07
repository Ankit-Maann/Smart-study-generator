import React, { useState } from 'react';
import { useStudy } from '../context/StudyContext';
import { generateQuiz, submitQuizResult } from '../services/api';

const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'History', 'Literature', 'Economics', 'General'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

export default function PracticeQuiz() {
  const { studentId, setLoading, addNotification, refreshProfile } = useStudy();

  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('General');
  const [difficulty, setDifficulty] = useState('Medium');
  const [count, setCount] = useState(5);

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [phase, setPhase] = useState('config'); // 'config' | 'quiz' | 'results'

  const handleGenerate = async () => {
    if (!topic.trim()) {
      addNotification('Please enter a topic', 'warning');
      return;
    }
    setIsGenerating(true);
    setLoading(true);
    try {
      const data = await generateQuiz(topic, difficulty.toLowerCase(), count, studentId);
      if (data.questions.length === 0) {
        addNotification('No questions generated. Try a different topic.', 'warning');
        return;
      }
      setQuestions(data.questions);
      setAnswers({});
      setSubmitted(false);
      setScore(null);
      setPhase('quiz');
    } catch (err) {
      addNotification(`Error: ${err.response?.data?.error || err.message}`, 'error');
    } finally {
      setIsGenerating(false);
      setLoading(false);
    }
  };

  const handleAnswer = (qIndex, optIndex) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qIndex]: optIndex }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      addNotification('Please answer all questions before submitting', 'warning');
      return;
    }
    const correct = questions.filter((q, i) => answers[i] === q.correctIndex).length;
    setScore(correct);
    setSubmitted(true);
    setPhase('results');

    try {
      await submitQuizResult(studentId, topic, correct, questions.length);
      await refreshProfile();
      addNotification(`Quiz submitted! Score: ${correct}/${questions.length}`, correct >= questions.length * 0.7 ? 'success' : 'warning');
    } catch (err) {
      console.warn('Failed to save quiz result:', err.message);
    }
  };

  const resetQuiz = () => {
    setPhase('config');
    setQuestions([]);
    setAnswers({});
    setSubmitted(false);
    setScore(null);
  };

  const answeredCount = Object.keys(answers).length;
  const pct = score !== null ? Math.round((score / questions.length) * 100) : 0;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">📝 Practice Quiz</h1>
          <p className="page-sub">AI-generated adaptive quizzes — test your understanding with IBM Granite</p>
        </div>
        {phase !== 'config' && (
          <button className="btn-outline" onClick={resetQuiz}>+ New Quiz</button>
        )}
      </div>

      {phase === 'config' && (
        <div className="center-panel">
          <div className="section-card" style={{ maxWidth: 500 }}>
            <h3 className="section-title">Configure Quiz</h3>

            <div className="form-row">
              <label>Topic</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Photosynthesis, Newton's Laws, WWII..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              />
            </div>

            <div className="form-row">
              <label>Subject</label>
              <select value={subject} onChange={(e) => setSubject(e.target.value)} className="form-select">
                {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div className="form-row">
              <label>Difficulty</label>
              <div className="difficulty-select">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    className={`diff-btn ${difficulty === d ? 'active' : ''} diff-${d.toLowerCase()}`}
                    onClick={() => setDifficulty(d)}
                  >
                    {d === 'Easy' ? '🟢' : d === 'Medium' ? '🟡' : '🔴'} {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-row">
              <label>Number of Questions: <strong>{count}</strong></label>
              <input type="range" min={3} max={10} value={count} onChange={(e) => setCount(+e.target.value)} className="form-range" />
            </div>

            <button className="btn-primary btn-full" onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? <><span className="spinner" />Generating Questions...</> : '🚀 Start Quiz'}
            </button>
          </div>
        </div>
      )}

      {phase === 'quiz' && questions.length > 0 && (
        <div className="quiz-container">
          <div className="quiz-header">
            <div className="quiz-topic">{topic} — {difficulty} — {count} Questions</div>
            <div className="quiz-progress">{answeredCount}/{questions.length} answered</div>
          </div>
          <div className="quiz-progress-bar">
            <div className="quiz-progress-fill" style={{ width: `${(answeredCount / questions.length) * 100}%` }} />
          </div>

          {questions.map((q, qi) => (
            <div key={qi} className="question-card">
              <div className="question-num">Q{qi + 1} of {questions.length}</div>
              <div className="question-text">{q.question}</div>
              <div className="options-list">
                {q.options.map((opt, oi) => (
                  <button
                    key={oi}
                    className={`option-btn
                      ${answers[qi] === oi ? 'selected' : ''}
                      ${submitted && oi === q.correctIndex ? 'correct' : ''}
                      ${submitted && answers[qi] === oi && oi !== q.correctIndex ? 'wrong' : ''}
                    `}
                    onClick={() => handleAnswer(qi, oi)}
                  >
                    <span className="option-letter">{String.fromCharCode(65 + oi)}</span>
                    {opt.replace(/^[A-D]\.\s*/, '')}
                  </button>
                ))}
              </div>
              {submitted && q.explanation && (
                <div className="explanation">
                  💡 <strong>Explanation:</strong> {q.explanation}
                </div>
              )}
            </div>
          ))}

          {!submitted && (
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <button className="btn-primary" onClick={handleSubmit} disabled={answeredCount < questions.length}>
                Submit Quiz ({answeredCount}/{questions.length})
              </button>
            </div>
          )}
        </div>
      )}

      {phase === 'results' && score !== null && (
        <div className="center-panel">
          <div className="section-card results-card">
            <div className="result-circle" style={{ background: pct >= 70 ? '#dcfce7' : pct >= 50 ? '#fef9c3' : '#fee2e2' }}>
              <div className="result-pct" style={{ color: pct >= 70 ? '#16a34a' : pct >= 50 ? '#ca8a04' : '#dc2626' }}>
                {pct}%
              </div>
              <div className="result-label">{score}/{questions.length} correct</div>
            </div>
            <div className="result-msg">
              {pct >= 80 ? '🏆 Excellent work!' : pct >= 60 ? '👍 Good effort!' : '📖 Keep studying!'}
            </div>
            <div className="result-breakdown">
              <div className="rb-item rb-correct">✓ {score} correct</div>
              <div className="rb-item rb-wrong">✗ {questions.length - score} incorrect</div>
            </div>
            <div className="result-actions">
              <button className="btn-primary" onClick={handleGenerate}>🔄 Retake Quiz</button>
              <button className="btn-outline" onClick={resetQuiz}>+ New Quiz</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
