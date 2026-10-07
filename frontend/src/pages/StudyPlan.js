import React, { useState } from 'react';
import { useStudy } from '../context/StudyContext';
import { generateStudyPlan } from '../services/api';

const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'History', 'Literature', 'Economics', 'General'];
const PRIORITY_COLORS = { High: '#ef4444', Medium: '#f59e0b', Low: '#22c55e' };

function PlanDay({ day }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`plan-day ${open ? 'open' : ''}`}>
      <div className="plan-day-header" onClick={() => setOpen(!open)}>
        <div className="plan-day-num">Day {day.day}</div>
        <div className="plan-day-topics">{day.topics?.join(', ')}</div>
        <div className="plan-day-right">
          <span className="plan-time">⏱ {day.estimatedTime}</span>
          <span className="plan-priority" style={{ background: PRIORITY_COLORS[day.priority] || '#6366f1' }}>
            {day.priority}
          </span>
          <span className="plan-chevron">{open ? '▲' : '▼'}</span>
        </div>
      </div>
      {open && (
        <div className="plan-day-body">
          {day.focusReason && <div className="plan-reason">📌 {day.focusReason}</div>}
          <ul className="plan-activities">
            {(day.activities || []).map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function StudyPlan() {
  const { studentId, profile, setLoading, addNotification, refreshProfile } = useStudy();

  const [subject, setSubject] = useState('General');
  const [examDate, setExamDate] = useState('');
  const [plan, setPlan] = useState(profile?.studyPlan || null);
  const [isGenerating, setIsGenerating] = useState(false);

  const weakTopics = profile?.topics?.filter((t) => t.score < 65) || [];

  const today = new Date().toISOString().split('T')[0];
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  const handleGenerate = async () => {
    setIsGenerating(true);
    setLoading(true);
    try {
      const data = await generateStudyPlan(studentId, examDate, subject);
      setPlan(data.studyPlan);
      await refreshProfile();
      addNotification('Study plan generated!', 'success');
    } catch (err) {
      addNotification(`Error: ${err.response?.data?.error || err.message}`, 'error');
    } finally {
      setIsGenerating(false);
      setLoading(false);
    }
  };

  const highPriority = plan?.days?.filter((d) => d.priority === 'High').length || 0;
  const totalHours = plan?.days?.reduce((sum, d) => {
    const match = (d.estimatedTime || '').match(/(\d+(\.\d+)?)/);
    return sum + (match ? parseFloat(match[1]) : 0);
  }, 0) || 0;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">🗓️ Personalized Study Plan</h1>
          <p className="page-sub">AI-generated adaptive schedule based on your weak areas and exam date</p>
        </div>
      </div>

      <div className="plan-grid">
        {/* Config Card */}
        <div className="section-card plan-config">
          <h3 className="section-title">Plan Settings</h3>

          <div className="form-row">
            <label>Subject / Focus Area</label>
            <select value={subject} onChange={(e) => setSubject(e.target.value)} className="form-select">
              {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div className="form-row">
            <label>Exam Date (optional)</label>
            <input
              type="date"
              className="form-input"
              value={examDate}
              min={minDateStr}
              onChange={(e) => setExamDate(e.target.value)}
            />
          </div>

          {weakTopics.length > 0 && (
            <div className="plan-weak-notice">
              <div className="plan-weak-title">⚠️ Detected Weak Areas</div>
              {weakTopics.map((t) => (
                <div key={t.name} className="plan-weak-item">
                  <span>{t.name}</span>
                  <span className="plan-weak-score">{t.score}%</span>
                </div>
              ))}
              <div className="plan-weak-hint">These will be prioritized in your plan.</div>
            </div>
          )}

          <button className="btn-primary btn-full" onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? <><span className="spinner" />Generating Plan...</> : '✨ Generate Study Plan'}
          </button>

          {plan && (
            <div className="plan-meta">
              <div className="plan-meta-item">
                <span>📅 Generated</span>
                <strong>{new Date(plan.generatedAt).toLocaleDateString()}</strong>
              </div>
              <div className="plan-meta-item">
                <span>📘 Subject</span>
                <strong>{plan.subjectFocus}</strong>
              </div>
              <div className="plan-meta-item">
                <span>📆 Exam</span>
                <strong>{plan.examDate ? new Date(plan.examDate).toLocaleDateString() : 'Not set'}</strong>
              </div>
              <div className="plan-meta-item">
                <span>📋 Days</span>
                <strong>{plan.days?.length || 0}</strong>
              </div>
              <div className="plan-meta-item">
                <span>🔴 High Priority</span>
                <strong>{highPriority} days</strong>
              </div>
              <div className="plan-meta-item">
                <span>⏱ Total Time</span>
                <strong>~{totalHours.toFixed(0)}h</strong>
              </div>
            </div>
          )}
        </div>

        {/* Plan Days */}
        <div className="section-card plan-days-card">
          {!plan && !isGenerating && (
            <div className="empty-result">
              <div className="empty-icon">🗓️</div>
              <p>Generate a study plan to see your personalized schedule</p>
            </div>
          )}
          {isGenerating && (
            <div className="processing-state">
              <div className="granite-loader">🔷</div>
              <p>IBM Granite is building your personalized plan...</p>
            </div>
          )}
          {plan && plan.days?.length > 0 && (
            <>
              <h3 className="section-title">Your {plan.days.length}-Day Plan</h3>
              <div className="plan-legend">
                <span className="legend-dot" style={{ background: '#ef4444' }} />High
                <span className="legend-dot" style={{ background: '#f59e0b' }} />Medium
                <span className="legend-dot" style={{ background: '#22c55e' }} />Low
              </div>
              <div className="plan-list">
                {plan.days.map((day, i) => <PlanDay key={i} day={day} />)}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
