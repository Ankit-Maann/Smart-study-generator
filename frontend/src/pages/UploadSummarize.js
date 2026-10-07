import React, { useState, useRef, useCallback } from 'react';
import { useStudy } from '../context/StudyContext';
import { summarizeText, summarizeFile, generateFlashcards, generateConceptMap } from '../services/api';
import ReactMarkdown from 'react-markdown';

const MODES = ['Summarize', 'Flashcards', 'Concept Map'];
const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'History', 'Literature', 'Economics', 'General'];
const LEVELS = ['High School', 'Undergraduate', 'Graduate', 'Professional'];

function VoiceButton({ onTranscript }) {
  const [listening, setListening] = useState(false);

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser. Please use Chrome.');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      onTranscript(transcript);
    };
    recognition.start();
  };

  return (
    <button
      className={`voice-btn ${listening ? 'listening' : ''}`}
      onClick={startListening}
      title="Dictate your notes"
    >
      {listening ? '🔴 Listening...' : '🎤 Voice Input'}
    </button>
  );
}

function DropZone({ onFile, file }) {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  }, [onFile]);

  return (
    <div
      className={`dropzone ${dragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".txt,.md,.pdf,.png,.jpg,.jpeg"
        style={{ display: 'none' }}
        onChange={(e) => e.target.files[0] && onFile(e.target.files[0])}
      />
      {file ? (
        <div className="dropzone-file">📄 <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)</div>
      ) : (
        <>
          <div className="dropzone-icon">📁</div>
          <div className="dropzone-text">Drop files here or click to browse</div>
          <div className="dropzone-sub">Supports .txt, .md, .pdf, .png, .jpg</div>
        </>
      )}
    </div>
  );
}

function ConceptMapView({ map }) {
  if (!map) return null;
  return (
    <div className="concept-map">
      <div className="concept-central">{map.centralConcept}</div>
      <div className="concept-branches">
        {(map.branches || []).map((branch, i) => (
          <div
            key={i}
            className={`concept-branch importance-${branch.importance || 'medium'}`}
          >
            <div className="branch-title">{branch.concept}</div>
            <div className="branch-desc">{branch.description}</div>
            {branch.subConcepts?.length > 0 && (
              <div className="branch-subs">
                {branch.subConcepts.map((s, j) => <span key={j} className="sub-chip">{s}</span>)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function UploadSummarize() {
  const { studentId, setLoading, addNotification, refreshProfile } = useStudy();

  const [mode, setMode] = useState('Summarize');
  const [subject, setSubject] = useState('General');
  const [level, setLevel] = useState('Undergraduate');
  const [textInput, setTextInput] = useState('');
  const [file, setFile] = useState(null);
  const [inputMode, setInputMode] = useState('text'); // 'text' | 'file'
  const [flashcardCount, setFlashcardCount] = useState(10);

  const [result, setResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleVoice = (transcript) => {
    setTextInput((prev) => prev + (prev ? ' ' : '') + transcript);
    addNotification('Voice captured: ' + transcript.slice(0, 50) + '...', 'success');
  };

  const handleSubmit = async () => {
    if (inputMode === 'text' && !textInput.trim()) {
      addNotification('Please enter some text or upload a file', 'warning');
      return;
    }
    if (inputMode === 'file' && !file) {
      addNotification('Please select a file to upload', 'warning');
      return;
    }

    setIsProcessing(true);
    setLoading(true);
    setResult(null);

    try {
      if (mode === 'Summarize') {
        let data;
        if (inputMode === 'file' && file) {
          const fd = new FormData();
          fd.append('file', file);
          fd.append('subject', subject);
          fd.append('level', level.toLowerCase());
          fd.append('studentId', studentId);
          data = await summarizeFile(fd);
        } else {
          data = await summarizeText(textInput, subject, level.toLowerCase(), studentId);
        }
        setResult({ type: 'summary', content: data.summary });
        addNotification('Summary generated successfully!', 'success');

      } else if (mode === 'Flashcards') {
        const content = inputMode === 'text' ? textInput : `Study material for ${subject}`;
        const data = await generateFlashcards(content, subject, flashcardCount, studentId);
        setResult({ type: 'flashcards', content: data.flashcards });
        addNotification(`Generated ${data.flashcards.length} flashcards!`, 'success');

      } else if (mode === 'Concept Map') {
        const content = inputMode === 'text' ? textInput : `Create a concept map for ${subject}`;
        const data = await generateConceptMap(content, subject);
        setResult({ type: 'conceptMap', content: data.conceptMap });
        addNotification('Concept map created!', 'success');
      }

      refreshProfile();
    } catch (err) {
      addNotification(`Error: ${err.response?.data?.error || err.message}`, 'error');
    } finally {
      setIsProcessing(false);
      setLoading(false);
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">📤 Upload & Summarize</h1>
          <p className="page-sub">Turn your notes, textbooks, or images into smart study material</p>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="mode-tabs">
        {MODES.map((m) => (
          <button key={m} className={`mode-tab ${mode === m ? 'active' : ''}`} onClick={() => { setMode(m); setResult(null); }}>
            {m === 'Summarize' ? '📋' : m === 'Flashcards' ? '🃏' : '🗺️'} {m}
          </button>
        ))}
      </div>

      <div className="upload-grid">
        {/* Left: Input Panel */}
        <div className="section-card">
          <h3 className="section-title">Input Settings</h3>

          <div className="form-row">
            <label>Subject</label>
            <select value={subject} onChange={(e) => setSubject(e.target.value)} className="form-select">
              {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div className="form-row">
            <label>Academic Level</label>
            <select value={level} onChange={(e) => setLevel(e.target.value)} className="form-select">
              {LEVELS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>

          {mode === 'Flashcards' && (
            <div className="form-row">
              <label>Number of Flashcards: {flashcardCount}</label>
              <input type="range" min={5} max={20} value={flashcardCount} onChange={(e) => setFlashcardCount(+e.target.value)} className="form-range" />
            </div>
          )}

          {/* Input Mode Toggle */}
          <div className="input-toggle">
            <button className={inputMode === 'text' ? 'active' : ''} onClick={() => setInputMode('text')}>✏️ Text</button>
            <button className={inputMode === 'file' ? 'active' : ''} onClick={() => setInputMode('file')}>📁 File</button>
          </div>

          {inputMode === 'text' ? (
            <div>
              <div className="textarea-header">
                <label>Paste your notes or content</label>
                <VoiceButton onTranscript={handleVoice} />
              </div>
              <textarea
                className="form-textarea"
                placeholder="Paste lecture notes, textbook content, or any study material here..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                rows={10}
              />
              <div className="char-count">{textInput.length} chars</div>
            </div>
          ) : (
            <DropZone file={file} onFile={setFile} />
          )}

          <button
            className="btn-primary btn-full"
            onClick={handleSubmit}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <><span className="spinner" /> Processing with IBM Granite...</>
            ) : (
              <>✨ Generate {mode}</>
            )}
          </button>
        </div>

        {/* Right: Result Panel */}
        <div className="section-card result-panel">
          <h3 className="section-title">Result</h3>
          {!result && !isProcessing && (
            <div className="empty-result">
              <div className="empty-icon">{mode === 'Summarize' ? '📋' : mode === 'Flashcards' ? '🃏' : '🗺️'}</div>
              <p>Your {mode.toLowerCase()} will appear here</p>
            </div>
          )}
          {isProcessing && (
            <div className="processing-state">
              <div className="granite-loader">🔷</div>
              <p>IBM Granite is analyzing your material...</p>
            </div>
          )}
          {result?.type === 'summary' && (
            <div className="summary-result">
              <ReactMarkdown>{result.content}</ReactMarkdown>
            </div>
          )}
          {result?.type === 'flashcards' && (
            <div className="flashcard-preview">
              {result.content.map((fc, i) => (
                <FlashcardPreview key={i} index={i + 1} question={fc.question} answer={fc.answer} />
              ))}
            </div>
          )}
          {result?.type === 'conceptMap' && (
            <ConceptMapView map={result.content} />
          )}
        </div>
      </div>
    </div>
  );
}

function FlashcardPreview({ index, question, answer }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div className={`fc-preview ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(!flipped)}>
      <div className="fc-num">#{index}</div>
      {flipped
        ? <div className="fc-answer"><span className="fc-label">A</span>{answer}</div>
        : <div className="fc-question"><span className="fc-label">Q</span>{question}</div>
      }
      <div className="fc-hint">Click to flip</div>
    </div>
  );
}
