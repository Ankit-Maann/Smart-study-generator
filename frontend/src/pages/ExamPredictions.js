import React, { useState } from 'react';
import { useStudy } from '../context/StudyContext';
import { getExamPredictions } from '../services/api';

const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'History', 'Literature', 'Economics', 'General'];

const ALERT_STYLES = {
  warning: { bg: '#fff7ed', border: '#f59e0b', icon: '⚠️' },
  info:    { bg: '#eff6ff', border: '#3b82f6', icon: 'ℹ️' },
  tip:     { bg: '#f0fdf4', border: '#22c55e', icon: '💡' },
};

const PROB_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' };

function TopicCard({ topic }) {
  return (
    <div className="predict-topic-card">
      <div className="ptc-header">
        <div className="ptc-name">{topic.topic}</div>
        <span className="ptc-prob" style={{ background: PROB_COLORS[topic.probability] || '#6366f1' }}>
          {topic.probability?.toUpperCase()} PROBABILITY
        </span>
      </div>
      <div className="ptc-reason">📊 {topic.reason}</div>
      {topic.studyTip && (
        <div className="ptc-tip">💡 <strong>Study Tip:</strong> {topic.studyTip}</div>
      )}
    </div>
  );
}

function AlertCard({ alert }) {
  const style = ALERT_STYLES[alert.type] || ALERT_STYLES.info;
  return (
    <div className="alert-card" style={{ background: style.bg, borderLeft: `4px solid ${style.border}` }}>
      <span className="alert-icon">{style.icon}</span>
      <div>
        {alert.topic && <div className="alert-topic">{alert.topic}</div>}
        <div className="alert-msg">{alert.message}</div>
      </div>
    </div>
  );
}

export default function ExamPredictions() {
  const { addNotification, setLoading } = useStudy();

  const [subject, setSubject] = useState('General');
  const [syllabus, setSyllabus] = useState('');
  const [pastHints, setPastHints] = useState('');
  const [predictions, setPredictions] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePredict = async () => {
    setIsLoading(true);
    setLoading(true);
    try {
      const data = await getExamPredictions(subject, syllabus, pastHints);
      setPredictions(data.predictions);
      addNotification('Exam predictions ready!', 'success');
    } catch (err) {
      addNotification(`Error: ${err.response?.data?.error || err.message}`, 'error');
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">🔮 Exam Predictions</h1>
          <p className="page-sub">AI-powered topic predictions and study alerts based on your syllabus</p>
        </div>
      </div>

      <div className="predict-grid">
        {/* Input Card */}
        <div className="section-card predict-input">
          <h3 className="section-title">Prediction Settings</h3>

          <div className="form-row">
            <label>Subject</label>
            <select value={subject} onChange={(e) => setSubject(e.target.value)} className="form-select">
              {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div className="form-row">
            <label>Syllabus / Topics Covered (optional)</label>
            <textarea
              className="form-textarea"
              rows={4}
              placeholder="e.g., Chapter 1-5: Mechanics, Thermodynamics, Optics..."
              value={syllabus}
              onChange={(e) => setSyllabus(e.target.value)}
            />
          </div>

          <div className="form-row">
            <label>Past Exam Patterns (optional)</label>
            <textarea
              className="form-textarea"
              rows={4}
              placeholder="e.g., Kinematics appears every year, 30% of questions from thermodynamics..."
              value={pastHints}
              onChange={(e) => setPastHints(e.target.value)}
            />
          </div>

          <button className="btn-primary btn-full" onClick={handlePredict} disabled={isLoading}>
            {isLoading ? <><span className="spinner" />Analyzing...</> : '🔮 Predict Exam Topics'}
          </button>
        </div>

        {/* Results Panel */}
        <div className="predict-results">
          {!predictions && !isLoading && (
            <div className="section-card">
              <div className="empty-result">
                <div className="empty-icon">🔮</div>
                <p>Enter your subject and optionally your syllabus to get AI-powered exam predictions</p>
              </div>
            </div>
          )}
          {isLoading && (
            <div className="section-card">
              <div className="processing-state">
                <div className="granite-loader">🔷</div>
                <p>IBM Granite is predicting important exam topics...</p>
              </div>
            </div>
          )}
          {predictions && (
            <>
              {/* Alerts */}
              {predictions.alerts?.length > 0 && (
                <div className="section-card">
                  <h3 className="section-title">🚨 Study Alerts</h3>
                  <div className="alerts-list">
                    {predictions.alerts.map((alert, i) => <AlertCard key={i} alert={alert} />)}
                  </div>
                </div>
              )}

              {/* High Priority Topics */}
              {predictions.highPriorityTopics?.length > 0 && (
                <div className="section-card">
                  <h3 className="section-title">📌 High-Priority Topics</h3>
                  <div className="topics-grid">
                    {predictions.highPriorityTopics.map((t, i) => <TopicCard key={i} topic={t} />)}
                  </div>
                </div>
              )}

              {/* Overall Advice */}
              {predictions.overallAdvice && (
                <div className="section-card advice-card">
                  <h3 className="section-title">🎯 Overall Strategy</h3>
                  <div className="advice-text">{predictions.overallAdvice}</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
