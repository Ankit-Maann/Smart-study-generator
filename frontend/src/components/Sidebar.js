import React from 'react';
import { useStudy } from '../context/StudyContext';

const NAV_ITEMS = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { id: 'upload',    icon: '📤', label: 'Upload & Summarize' },
  { id: 'flashcards',icon: '🃏', label: 'Flashcards' },
  { id: 'quiz',      icon: '📝', label: 'Practice Quiz' },
  { id: 'studyplan', icon: '🗓️', label: 'Study Plan' },
  { id: 'predict',   icon: '🔮', label: 'Exam Predictions' },
  { id: 'tutor',     icon: '🤖', label: 'AI Tutor' },
  { id: 'concepts',  icon: '🗺️', label: 'Concept Map' },
];

export default function Sidebar() {
  const { activeTab, setActiveTab } = useStudy();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-icon">🎓</span>
        <div>
          <div className="logo-title">StudyAgent</div>
          <div className="logo-sub">Powered by IBM Granite</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="ibm-badge">
          <span style={{ fontSize: '1.2rem', filter: 'drop-shadow(0 0 6px rgba(99,102,241,0.7))' }}>🔷</span>
          <div>
            <div className="ibm-badge-text">IBM Cloud</div>
            <div className="ibm-badge-sub">watsonx.ai · Granite</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
