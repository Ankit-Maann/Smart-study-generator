import React, { useState } from 'react';
import { useStudy } from '../context/StudyContext';
import { generateFlashcards } from '../services/api';

const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'History', 'Literature', 'Economics', 'General'];

export default function Flashcards() {
  const { studentId, setLoading, addNotification } = useStudy();

  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('General');
  const [count, setCount] = useState(10);
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [mode, setMode] = useState('generate'); // 'generate' | 'study'
  const [stats, setStats] = useState({ known: 0, review: 0 });

  const handleGenerate = async () => {
    if (!topic.trim()) {
      addNotification('Please enter a topic', 'warning');
      return;
    }
    setIsGenerating(true);
    setLoading(true);
    try {
      const data = await generateFlashcards(topic, subject, count, studentId);
      setCards(data.flashcards);
      setCurrentIndex(0);
      setFlipped(false);
      setKnownCards(new Set());
      setStats({ known: 0, review: 0 });
      setMode('study');
      addNotification(`${data.flashcards.length} flashcards ready!`, 'success');
    } catch (err) {
      addNotification(`Error: ${err.response?.data?.error || err.message}`, 'error');
    } finally {
      setIsGenerating(false);
      setLoading(false);
    }
  };

  const markKnown = () => {
    setKnownCards((prev) => new Set([...prev, currentIndex]));
    setStats((s) => ({ ...s, known: s.known + 1 }));
    next();
  };

  const markReview = () => {
    setStats((s) => ({ ...s, review: s.review + 1 }));
    next();
  };

  const next = () => {
    setFlipped(false);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setMode('done');
    }
  };

  const prev = () => {
    setFlipped(false);
    setCurrentIndex((i) => Math.max(0, i - 1));
  };

  const restart = () => {
    setCurrentIndex(0);
    setFlipped(false);
    setKnownCards(new Set());
    setStats({ known: 0, review: 0 });
    setMode('study');
  };

  const progress = cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">🃏 Flashcard Studio</h1>
          <p className="page-sub">AI-generated flashcards from any topic — powered by IBM Granite</p>
        </div>
        {cards.length > 0 && (
          <button className="btn-outline" onClick={() => { setMode('generate'); setCards([]); }}>
            + New Set
          </button>
        )}
      </div>

      {mode === 'generate' && (
        <div className="center-panel">
          <div className="section-card" style={{ maxWidth: 520 }}>
            <h3 className="section-title">Generate Flashcards</h3>

            <div className="form-row">
              <label>Topic / Content</label>
              <textarea
                className="form-textarea"
                rows={5}
                placeholder="Enter the topic or paste content to generate flashcards from..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            <div className="form-row">
              <label>Subject</label>
              <select value={subject} onChange={(e) => setSubject(e.target.value)} className="form-select">
                {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div className="form-row">
              <label>Number of Cards: <strong>{count}</strong></label>
              <input type="range" min={5} max={20} value={count} onChange={(e) => setCount(+e.target.value)} className="form-range" />
            </div>

            <button className="btn-primary btn-full" onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? <><span className="spinner" />Generating...</> : '🃏 Generate Flashcards'}
            </button>
          </div>
        </div>
      )}

      {mode === 'study' && cards.length > 0 && (
        <div className="flashcard-study">
          {/* Progress */}
          <div className="fc-progress-bar">
            <div className="fc-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="fc-progress-label">
            Card {currentIndex + 1} of {cards.length} &nbsp;|&nbsp;
            <span style={{ color: '#22c55e' }}>✓ {stats.known}</span> known &nbsp;
            <span style={{ color: '#f59e0b' }}>↻ {stats.review}</span> review
          </div>

          {/* Card */}
          <div
            className={`flashcard-3d ${flipped ? 'is-flipped' : ''}`}
            onClick={() => setFlipped(!flipped)}
          >
            <div className="fc-face fc-front">
              <div className="fc-side-label">Question</div>
              <div className="fc-text">{cards[currentIndex]?.question}</div>
              <div className="fc-tap-hint">Tap to reveal answer</div>
            </div>
            <div className="fc-face fc-back">
              <div className="fc-side-label fc-answer-label">Answer</div>
              <div className="fc-text">{cards[currentIndex]?.answer}</div>
            </div>
          </div>

          {/* Controls */}
          {flipped && (
            <div className="fc-actions">
              <button className="btn-review" onClick={markReview}>↻ Review Again</button>
              <button className="btn-known" onClick={markKnown}>✓ Got It!</button>
            </div>
          )}
          <div className="fc-nav">
            <button className="btn-outline" onClick={prev} disabled={currentIndex === 0}>← Prev</button>
            <button className="btn-outline" onClick={next}>Skip →</button>
          </div>
        </div>
      )}

      {mode === 'done' && (
        <div className="center-panel">
          <div className="section-card done-card">
            <div className="done-icon">🎉</div>
            <h2>Session Complete!</h2>
            <div className="done-stats">
              <div className="done-stat"><span className="done-num" style={{ color: '#22c55e' }}>{stats.known}</span><span>Known</span></div>
              <div className="done-stat"><span className="done-num" style={{ color: '#f59e0b' }}>{stats.review}</span><span>Review</span></div>
              <div className="done-stat"><span className="done-num">{cards.length}</span><span>Total</span></div>
            </div>
            <div className="done-pct">
              Mastery: <strong>{Math.round((stats.known / cards.length) * 100)}%</strong>
            </div>
            <div className="done-actions">
              <button className="btn-primary" onClick={restart}>🔄 Restart</button>
              <button className="btn-outline" onClick={() => { setMode('generate'); setCards([]); }}>+ New Set</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
