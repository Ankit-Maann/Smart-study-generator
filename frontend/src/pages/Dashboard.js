import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Radar, Doughnut } from 'react-chartjs-2';
import { useStudy } from '../context/StudyContext';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, RadialLinearScale, ArcElement, Filler, Tooltip, Legend
);

function StatCard({ icon, label, value, color, sub }) {
  return (
    <div className="stat-card" style={{ borderTop: `3px solid ${color}` }}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

function WeakAreaBadge({ topic, score }) {
  const color = score < 40 ? '#ef4444' : score < 60 ? '#f59e0b' : '#22c55e';
  return (
    <div className="weak-badge" style={{ borderLeft: `4px solid ${color}` }}>
      <span className="weak-topic">{topic}</span>
      <div className="weak-bar-wrap">
        <div className="weak-bar" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="weak-score">{score}%</span>
    </div>
  );
}

export default function Dashboard() {
  const { profile, studentId } = useStudy();

  // Derived stats
  const topics = profile?.topics || [];
  const quizHistory = profile?.quizHistory || [];
  const sessions = profile?.studySessions || [];

  const avgScore = quizHistory.length > 0
    ? Math.round(quizHistory.reduce((s, q) => s + (q.score / q.total) * 100, 0) / quizHistory.length)
    : 0;

  const totalStudyMins = sessions.reduce((s, ses) => s + (ses.duration || 0), 0);
  const weakTopics = topics.filter((t) => t.score < 65).sort((a, b) => a.score - b.score).slice(0, 5);
  const strongTopics = topics.filter((t) => t.score >= 75).slice(0, 3);

  // Charts
  const recentQuizzes = quizHistory.slice(-7);
  const quizChartData = {
    labels: recentQuizzes.map((q, i) => q.topic?.slice(0, 10) || `Quiz ${i + 1}`),
    datasets: [{
      label: 'Quiz Score (%)',
      data: recentQuizzes.map((q) => Math.round((q.score / q.total) * 100)),
      fill: true,
      borderColor: '#818cf8',
      backgroundColor: 'rgba(129,140,248,0.12)',
      tension: 0.45,
      pointBackgroundColor: '#818cf8',
      pointRadius: 5,
      pointHoverRadius: 7,
    }],
  };

  const topicBarData = {
    labels: topics.slice(0, 8).map((t) => t.name?.slice(0, 12) || ''),
    datasets: [{
      label: 'Topic Mastery (%)',
      data: topics.slice(0, 8).map((t) => t.score),
      backgroundColor: topics.slice(0, 8).map((t) =>
        t.score >= 75 ? 'rgba(16,185,129,0.7)' : t.score >= 50 ? 'rgba(245,158,11,0.7)' : 'rgba(239,68,68,0.7)'
      ),
      borderRadius: 8,
      borderSkipped: false,
    }],
  };

  const radarData = {
    labels: topics.slice(0, 6).map((t) => t.name?.slice(0, 10) || `T${topics.indexOf(t) + 1}`),
    datasets: [{
      label: 'Mastery',
      data: topics.slice(0, 6).map((t) => t.score),
      backgroundColor: 'rgba(139,92,246,0.15)',
      borderColor: '#8b5cf6',
      pointBackgroundColor: '#8b5cf6',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
    }],
  };

  const sessionDoughnut = {
    labels: ['Study Time', 'Remaining'],
    datasets: [{
      data: [Math.min(totalStudyMins, 600), Math.max(0, 600 - totalStudyMins)],
      backgroundColor: ['rgba(139,92,246,0.85)', 'rgba(255,255,255,0.06)'],
      borderWidth: 0,
      hoverOffset: 6,
    }],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15,12,41,0.9)',
        titleColor: 'rgba(255,255,255,0.85)',
        bodyColor: 'rgba(255,255,255,0.65)',
        borderColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true, max: 100,
        grid: { color: 'rgba(255,255,255,0.06)' },
        ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 11 } },
      },
      x: {
        grid: { display: false },
        ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 11 } },
      },
    },
  };

  const hasDemoData = topics.length === 0;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">📊 Learning Dashboard</h1>
          <p className="page-sub">Real-time overview of your study progress</p>
        </div>
        <div className="student-chip">
          🆔 {studentId.slice(0, 16)}
        </div>
      </div>

      {hasDemoData && (
        <div className="info-banner">
          ℹ️ <strong>No data yet.</strong> Start by uploading study material, taking a quiz, or generating a study plan.
        </div>
      )}

      {/* Stats Row */}
      <div className="stats-grid">
        <StatCard icon="📝" label="Quizzes Taken" value={quizHistory.length} color="#3b82f6" sub={`Avg ${avgScore}%`} />
        <StatCard icon="📚" label="Topics Studied" value={topics.length} color="#6366f1" sub={`${strongTopics.length} mastered`} />
        <StatCard icon="⏱️" label="Study Time" value={`${Math.floor(totalStudyMins / 60)}h ${totalStudyMins % 60}m`} color="#22c55e" />
        <StatCard icon="⚡" label="Weak Areas" value={weakTopics.length} color="#ef4444" sub="Need attention" />
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3 className="chart-title">📈 Quiz Score Trend</h3>
          {recentQuizzes.length > 0
            ? <Line data={quizChartData} options={chartOptions} />
            : <div className="empty-chart">Take some quizzes to see your trend</div>
          }
        </div>
        <div className="chart-card">
          <h3 className="chart-title">🎯 Topic Mastery</h3>
          {topics.length > 0
            ? <Bar data={topicBarData} options={chartOptions} />
            : <div className="empty-chart">Study topics to track mastery</div>
          }
        </div>
        <div className="chart-card">
          <h3 className="chart-title">🕸️ Skills Radar</h3>
          {topics.length >= 3
            ? <Radar data={radarData} options={{ responsive: true, plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(15,12,41,0.9)', titleColor: 'rgba(255,255,255,0.85)', bodyColor: 'rgba(255,255,255,0.65)' } }, scales: { r: { min: 0, max: 100, ticks: { stepSize: 25, color: 'rgba(255,255,255,0.35)', backdropColor: 'transparent', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.1)' }, pointLabels: { color: 'rgba(255,255,255,0.6)', font: { size: 11 } }, angleLines: { color: 'rgba(255,255,255,0.08)' } } } }} />
            : <div className="empty-chart">Need 3+ topics for radar view</div>
          }
        </div>
        <div className="chart-card">
          <h3 className="chart-title">⏳ Study Goal (10h)</h3>
          <Doughnut data={sessionDoughnut} options={{ responsive: true, plugins: { legend: { position: 'bottom', labels: { color: 'rgba(255,255,255,0.5)', font: { size: 11 }, boxWidth: 12 } }, tooltip: { backgroundColor: 'rgba(15,12,41,0.9)', titleColor: 'rgba(255,255,255,0.85)', bodyColor: 'rgba(255,255,255,0.65)' } }, cutout: '72%' }} />
          <div className="doughnut-center">{Math.round((totalStudyMins / 600) * 100)}%</div>
        </div>
      </div>

      {/* Weak Areas */}
      {weakTopics.length > 0 && (
        <div className="section-card">
          <h3 className="section-title">🔴 Areas Needing Attention</h3>
          <div className="weak-list">
            {weakTopics.map((t) => <WeakAreaBadge key={t.name} topic={t.name} score={t.score} />)}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {quizHistory.length > 0 && (
        <div className="section-card">
          <h3 className="section-title">🕐 Recent Quiz Activity</h3>
          <table className="activity-table">
            <thead>
              <tr><th>Topic</th><th>Score</th><th>Date</th><th>Status</th></tr>
            </thead>
            <tbody>
              {quizHistory.slice(-5).reverse().map((q, i) => {
                const pct = Math.round((q.score / q.total) * 100);
                return (
                  <tr key={i}>
                    <td>{q.topic}</td>
                    <td><strong>{q.score}/{q.total}</strong></td>
                    <td>{new Date(q.date).toLocaleDateString()}</td>
                    <td><span className={`badge ${pct >= 70 ? 'badge-success' : pct >= 50 ? 'badge-warn' : 'badge-fail'}`}>{pct}%</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
