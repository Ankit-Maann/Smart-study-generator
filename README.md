# 🎓 Smart Study Generator Agent

> **IBM Granite-powered agentic AI that personalizes and streamlines learning for students.**

---

## 📌 Problem Statement #13 — Smart Study Generator Agent

Students face an overwhelming flood of fragmented study material with no personalization. This agent solves that by providing an intelligent, adaptive study companion powered by **IBM Granite** (via **watsonx.ai**) on **IBM Cloud**.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     React Frontend (Port 3000)                       │
│  Dashboard │ Upload/Summarize │ Flashcards │ Quiz │ Study Plan      │
│  AI Tutor  │ Exam Predictions │ Concept Map │ Progress Charts       │
└────────────────────────────┬────────────────────────────────────────┘
                             │ REST API
┌────────────────────────────▼────────────────────────────────────────┐
│                   Express Backend (Port 5000)                        │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    Study Agent (Core AI)                      │   │
│  │  summarizeMaterial │ generateFlashcards │ generateConceptMap  │   │
│  │  generateQuiz      │ buildStudyPlan     │ predictExamTopics   │   │
│  │  tutorChat         │ profile management                       │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │            IBM Granite Client (watsonx.ai SDK)               │   │
│  │         Model: ibm/granite-13b-instruct-v2                   │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                             │
           ┌─────────────────▼──────────────────┐
           │         IBM Cloud / watsonx.ai       │
           │    IBM Granite 13B Instruct v2       │
           └────────────────────────────────────┘
```

---

## ✨ Features

| Feature | Description | Tech |
|---|---|---|
| 📋 **Smart Summarization** | Paste notes, upload files or images → structured summaries | IBM Granite |
| 🃏 **Flashcard Generator** | AI flashcards with 3D flip animation, known/review tracking | IBM Granite |
| 🗺️ **Concept Maps** | Visual knowledge graphs with importance levels | IBM Granite |
| 📝 **Adaptive Quizzes** | MCQs with difficulty levels, explanations, score tracking | IBM Granite |
| 🗓️ **Personalized Study Plans** | Day-by-day schedule based on weak areas + exam date | IBM Granite |
| 🔮 **Exam Predictions** | Topic importance ranking + predictive study alerts | IBM Granite |
| 🤖 **AI Tutor Chat** | Conversational tutoring with subject + level context | IBM Granite |
| 🎤 **Voice Input** | Browser Web Speech API → text for any input field | Web API |
| 📁 **Multimodal Upload** | .txt, .md, .pdf, .png, .jpg drag-and-drop support | Multer |
| 📊 **Progress Dashboard** | Real-time charts: quiz trends, topic mastery, skills radar | Chart.js |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- IBM Cloud account with watsonx.ai access
- IBM Granite project created on watsonx.ai

### 1. Configure IBM Cloud Credentials

```bash
cd smart-study-agent/backend
cp .env.example .env
```

Edit `.env` with your credentials:
```env
WATSONX_API_KEY=your_ibm_cloud_api_key_here
WATSONX_PROJECT_ID=your_watsonx_project_id_here
WATSONX_URL=https://us-south.ml.cloud.ibm.com
```

**How to get credentials:**
1. Go to [IBM Cloud](https://cloud.ibm.com) → API Keys → Create an API key
2. Open [watsonx.ai](https://dataplatform.cloud.ibm.com/wx/home) → Create a project → Copy the Project ID
3. The URL depends on your region (us-south, eu-de, jp-tok, au-syd)

### 2. Start Backend

```bash
cd smart-study-agent/backend
npm install
npm start
# → Running on http://localhost:5000
```

### 3. Start Frontend

```bash
cd smart-study-agent/frontend
npm install
npm start
# → Running on http://localhost:3000
```

---

## 🐳 Docker Deployment

```bash
cd smart-study-agent

# Create .env at root with your credentials
cp backend/.env.example .env

# Build and run both services
docker-compose up --build
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/study/profile/:studentId` | Get student profile & stats |
| `POST` | `/api/study/summarize` | Summarize text content |
| `POST` | `/api/study/summarize-upload` | Summarize uploaded file |
| `POST` | `/api/study/flashcards` | Generate flashcards from content |
| `POST` | `/api/study/concept-map` | Generate concept map JSON |
| `POST` | `/api/study/quiz` | Generate practice quiz |
| `POST` | `/api/study/quiz-result` | Submit quiz score |
| `POST` | `/api/study/study-plan` | Build personalized study plan |
| `POST` | `/api/study/exam-predictions` | Predict exam topics |
| `POST` | `/api/study/tutor-chat` | AI tutor conversation |
| `POST` | `/api/study/voice-query` | Process voice query transcript |
| `POST` | `/api/study/session` | Record study session |

---

## 🔷 IBM Technology Stack

| Component | IBM Product | Usage |
|---|---|---|
| AI Model | **IBM Granite 13B Instruct v2** | All generation tasks |
| AI Platform | **watsonx.ai** | Model hosting & inference |
| Cloud | **IBM Cloud** | Infrastructure & API keys |
| SDK | **@ibm-cloud/watsonx-ai** | Node.js SDK for model calls |

---

## 📁 Project Structure

```
smart-study-agent/
├── backend/
│   ├── agents/
│   │   └── studyAgent.js       ← Core AI agent (all Granite calls)
│   ├── routes/
│   │   └── study.js            ← REST API routes
│   ├── utils/
│   │   └── graniteClient.js    ← IBM Granite/watsonx.ai wrapper
│   ├── server.js               ← Express entry point
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── context/
│   │   │   └── StudyContext.js ← Global state & student profile
│   │   ├── components/
│   │   │   ├── Sidebar.js      ← Navigation sidebar
│   │   │   └── Notifications.js
│   │   ├── pages/
│   │   │   ├── Dashboard.js    ← Progress dashboard with charts
│   │   │   ├── UploadSummarize.js ← File/text/voice input + summaries
│   │   │   ├── Flashcards.js   ← 3D flashcard study mode
│   │   │   ├── PracticeQuiz.js ← Adaptive MCQ quizzes
│   │   │   ├── StudyPlan.js    ← Personalized day-by-day plans
│   │   │   ├── ExamPredictions.js ← AI exam topic predictions
│   │   │   ├── AITutor.js      ← Conversational AI tutor
│   │   │   └── ConceptMap.js   ← Visual concept mapping
│   │   ├── services/
│   │   │   └── api.js          ← API client (Axios)
│   │   ├── App.js
│   │   └── App.css             ← Complete UI styles
│   ├── public/
│   │   └── index.html
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## 🧠 Agentic Capabilities

The **Study Agent** (`backend/agents/studyAgent.js`) implements full agentic behavior:

1. **Memory** — Maintains a per-student profile (topics, scores, quiz history, sessions)
2. **Planning** — Builds a day-by-day study plan adapting to the student's weak areas
3. **Prediction** — Ranks exam topics by probability based on syllabus and past patterns
4. **Adaptation** — Detects weak areas (score < 65%) and prioritizes them in all recommendations
5. **Multimodal** — Handles text, file uploads, and voice transcripts
6. **Tool Use** — Each agent function is a specialized tool (summarize, quiz, flashcard, plan, predict, tutor)

---

## 🎓 How IBM Granite is Used

Every AI capability calls IBM Granite via the `watsonx.ai` SDK:

```javascript
// Example: generating a study plan
const prompt = `You are a personalized academic coach. Create a ${days}-day study plan...`;
const result = await watsonx.generateText({
  input: prompt,
  modelId: 'ibm/granite-13b-instruct-v2',
  projectId: process.env.WATSONX_PROJECT_ID,
  parameters: { max_new_tokens: 2000, temperature: 0.7 }
});
```

Granite's instruction-following and structured output capabilities are leveraged to return JSON-formatted study plans, concept maps, and quiz questions that are then parsed and rendered in the React UI.
