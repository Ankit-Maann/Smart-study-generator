import React from 'react';
import { StudyProvider, useStudy } from './context/StudyContext';
import Sidebar from './components/Sidebar';
import Notifications from './components/Notifications';
import Dashboard from './pages/Dashboard';
import UploadSummarize from './pages/UploadSummarize';
import Flashcards from './pages/Flashcards';
import PracticeQuiz from './pages/PracticeQuiz';
import StudyPlan from './pages/StudyPlan';
import ExamPredictions from './pages/ExamPredictions';
import AITutor from './pages/AITutor';
import ConceptMap from './pages/ConceptMap';
import './App.css';

function AppContent() {
  const { activeTab, loading } = useStudy();

  const pages = {
    dashboard: <Dashboard />,
    upload: <UploadSummarize />,
    flashcards: <Flashcards />,
    quiz: <PracticeQuiz />,
    studyplan: <StudyPlan />,
    predict: <ExamPredictions />,
    tutor: <AITutor />,
    concepts: <ConceptMap />,
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-area">
        {loading && (
          <div className="global-loader">
            <div className="loader-bar" />
          </div>
        )}
        {pages[activeTab] || <Dashboard />}
      </main>
      <Notifications />
    </div>
  );
}

export default function App() {
  return (
    <StudyProvider>
      <AppContent />
    </StudyProvider>
  );
}
