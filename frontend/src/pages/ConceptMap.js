import React, { useState } from 'react';
import { useStudy } from '../context/StudyContext';
import { generateConceptMap } from '../services/api';

const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'History', 'Literature', 'Economics', 'General'];
const IMPORTANCE_COLOR = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' };

function BranchNode({ branch, index }) {
  const [expanded, setExpanded] = useState(true);
  const color = IMPORTANCE_COLOR[branch.importance] || '#6366f1';

  return (
    <div className="cm-branch" style={{ borderColor: color }}>
      <div className="cm-branch-header" onClick={() => setExpanded(!expanded)} style={{ background: color + '18' }}>
        <div className="cm-branch-name" style={{ color }}>
          <span className="cm-node-num">{index + 1}</span>
          {branch.concept}
        </div>
        <div className="cm-branch-importance" style={{ background: color }}>{branch.importance}</div>
        <span>{expanded ? '▲' : '▼'}</span>
      </div>
      {expanded && (
        <div className="cm-branch-body">
          {branch.description && <p className="cm-desc">{branch.description}</p>}
          {branch.subConcepts?.length > 0 && (
            <div className="cm-subs">
              {branch.subConcepts.map((s, i) => (
                <span key={i} className="cm-sub-chip" style={{ borderColor: color }}>{s}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ConceptMap() {
  const { addNotification, setLoading } = useStudy();

  const [subject, setSubject] = useState('General');
  const [content, setContent] = useState('');
  const [map, setMap] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!content.trim()) {
      addNotification('Please enter content or a topic description', 'warning');
      return;
    }
    setIsGenerating(true);
    setLoading(true);
    try {
      const data = await generateConceptMap(content, subject);
      setMap(data.conceptMap);
      addNotification('Concept map generated!', 'success');
    } catch (err) {
      addNotification(`Error: ${err.response?.data?.error || err.message}`, 'error');
    } finally {
      setIsGenerating(false);
      setLoading(false);
    }
  };

  const highCount = map?.branches?.filter((b) => b.importance === 'high').length || 0;
  const medCount  = map?.branches?.filter((b) => b.importance === 'medium').length || 0;
  const lowCount  = map?.branches?.filter((b) => b.importance === 'low').length || 0;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">🗺️ Concept Map</h1>
          <p className="page-sub">Visual knowledge structure generated from your study material</p>
        </div>
      </div>

      <div className="cm-grid">
        {/* Input */}
        <div className="section-card cm-input">
          <h3 className="section-title">Input</h3>

          <div className="form-row">
            <label>Subject</label>
            <select value={subject} onChange={(e) => setSubject(e.target.value)} className="form-select">
              {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div className="form-row">
            <label>Content / Topic</label>
            <textarea
              className="form-textarea"
              rows={10}
              placeholder="Paste your study notes or describe the topic to map..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <button className="btn-primary btn-full" onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? <><span className="spinner" />Generating Map...</> : '🗺️ Generate Concept Map'}
          </button>
        </div>

        {/* Map Output */}
        <div className="section-card cm-output">
          {!map && !isGenerating && (
            <div className="empty-result">
              <div className="empty-icon">🗺️</div>
              <p>Your concept map will appear here</p>
            </div>
          )}
          {isGenerating && (
            <div className="processing-state">
              <div className="granite-loader">🔷</div>
              <p>IBM Granite is mapping the knowledge structure...</p>
            </div>
          )}
          {map && (
            <>
              <div className="cm-central-node">{map.centralConcept}</div>
              <div className="cm-stats">
                <span style={{ color: '#ef4444' }}>🔴 {highCount} high</span>
                <span style={{ color: '#f59e0b' }}>🟡 {medCount} medium</span>
                <span style={{ color: '#22c55e' }}>🟢 {lowCount} low</span>
                <span className="cm-total">{(map.branches || []).length} branches</span>
              </div>
              <div className="cm-branches">
                {(map.branches || []).map((branch, i) => (
                  <BranchNode key={i} branch={branch} index={i} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
