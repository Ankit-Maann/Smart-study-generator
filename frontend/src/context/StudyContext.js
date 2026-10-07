import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getProfile } from '../services/api';

const StudyContext = createContext(null);

export function StudyProvider({ children }) {
  const [studentId] = useState(() => {
    const stored = localStorage.getItem('studyAgentStudentId');
    if (stored) return stored;
    const newId = `student_${Date.now()}`;
    localStorage.setItem('studyAgentStudentId', newId);
    return newId;
  });

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notifications, setNotifications] = useState([]);

  const refreshProfile = useCallback(async () => {
    try {
      const data = await getProfile(studentId);
      setProfile(data.profile);
    } catch (err) {
      console.warn('Profile fetch failed:', err.message);
    }
  }, [studentId]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  };

  return (
    <StudyContext.Provider
      value={{
        studentId,
        profile,
        loading,
        setLoading,
        activeTab,
        setActiveTab,
        notifications,
        addNotification,
        refreshProfile,
      }}
    >
      {children}
    </StudyContext.Provider>
  );
}

export function useStudy() {
  const ctx = useContext(StudyContext);
  if (!ctx) throw new Error('useStudy must be used inside StudyProvider');
  return ctx;
}
