import React from 'react';
import { useStudy } from '../context/StudyContext';

export default function Notifications() {
  const { notifications } = useStudy();

  if (notifications.length === 0) return null;

  return (
    <div className="notifications-container">
      {notifications.map((n) => (
        <div key={n.id} className={`notification notification-${n.type}`}>
          <span className="notification-icon">
            {n.type === 'success' ? '✅' : n.type === 'error' ? '❌' : n.type === 'warning' ? '⚠️' : 'ℹ️'}
          </span>
          {n.message}
        </div>
      ))}
    </div>
  );
}
