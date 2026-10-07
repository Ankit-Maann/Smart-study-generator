import React, { useState, useRef, useEffect } from 'react';
import { useStudy } from '../context/StudyContext';
import { sendTutorMessage, sendVoiceQuery } from '../services/api';
import ReactMarkdown from 'react-markdown';

const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'History', 'Literature', 'Economics', 'General'];
const LEVELS = ['High School', 'Undergraduate', 'Graduate'];

const STARTERS = [
  'Explain this concept simply...',
  'What are the key differences between...?',
  'Give me a real-world example of...',
  'How do I solve this type of problem...?',
  'What should I focus on for my exam?',
];

function Message({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`chat-msg ${isUser ? 'user-msg' : 'ai-msg'}`}>
      <div className="chat-avatar">{isUser ? '👤' : '🤖'}</div>
      <div className="chat-bubble">
        {isUser ? (
          <span>{msg.content}</span>
        ) : (
          <ReactMarkdown>{msg.content}</ReactMarkdown>
        )}
      </div>
    </div>
  );
}

export default function AITutor() {
  const { addNotification, setLoading } = useStudy();

  const [subject, setSubject] = useState('General');
  const [level, setLevel] = useState('Undergraduate');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I'm your AI tutor powered by IBM Granite. What would you like to learn about today? 📚" },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text = input) => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    const userMsg = { role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsSending(true);
    setLoading(true);

    try {
      const history = [...messages, userMsg];
      const data = await sendTutorMessage(
        history.filter((m) => m.role !== 'assistant' || history.indexOf(m) !== 0),
        subject,
        level.toLowerCase()
      );
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      addNotification(`Tutor error: ${err.response?.data?.error || err.message}`, 'error');
      setMessages((prev) => [...prev, { role: 'assistant', content: '⚠️ Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsSending(false);
      setLoading(false);
    }
  };

  const handleVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      addNotification('Speech recognition not supported. Use Chrome.', 'warning');
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'en-US';
    rec.onstart = () => setIsListening(true);
    rec.onend = () => setIsListening(false);
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      send(transcript);
    };
    rec.start();
  };

  const clearChat = () => {
    setMessages([
      { role: 'assistant', content: "Hello! I'm your AI tutor powered by IBM Granite. What would you like to learn about today? 📚" },
    ]);
  };

  return (
    <div className="page-content tutor-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">🤖 AI Tutor</h1>
          <p className="page-sub">Ask anything — get expert explanations powered by IBM Granite</p>
        </div>
        <button className="btn-outline" onClick={clearChat}>🗑 Clear Chat</button>
      </div>

      {/* Settings Bar */}
      <div className="tutor-settings">
        <select value={subject} onChange={(e) => setSubject(e.target.value)} className="form-select tutor-select">
          {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={level} onChange={(e) => setLevel(e.target.value)} className="form-select tutor-select">
          {LEVELS.map((l) => <option key={l}>{l}</option>)}
        </select>
      </div>

      {/* Quick Starters */}
      <div className="chat-starters">
        {STARTERS.map((s) => (
          <button key={s} className="starter-chip" onClick={() => send(s)}>{s}</button>
        ))}
      </div>

      {/* Chat Window */}
      <div className="chat-window">
        {messages.map((msg, i) => <Message key={i} msg={msg} />)}
        {isSending && (
          <div className="chat-msg ai-msg">
            <div className="chat-avatar">🤖</div>
            <div className="chat-bubble typing">
              <span className="dot" /><span className="dot" /><span className="dot" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Bar */}
      <div className="chat-input-bar">
        <button
          className={`voice-btn-sm ${isListening ? 'listening' : ''}`}
          onClick={handleVoice}
          title="Voice input"
        >
          {isListening ? '🔴' : '🎤'}
        </button>
        <input
          ref={inputRef}
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ask your tutor anything... (Enter to send)"
          disabled={isSending}
        />
        <button className="btn-primary chat-send" onClick={() => send()} disabled={isSending || !input.trim()}>
          {isSending ? '...' : '➤'}
        </button>
      </div>
    </div>
  );
}
