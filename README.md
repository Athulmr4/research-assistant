# Research Paper Assistant

An AI-powered tool to help you understand research papers quickly.  
Built with **React 18** + **Responsive Flexbox** + **Free LLM providers (Gemini/Groq/HF)** — no server, no cost.

## Demo

## Features (Free & Operable)

- **Summarize** any research paper PDF — one-click quick action
- **Answer questions** about the paper's content (grounded in extracted text)
- **Explain difficult concepts** in plain language
- **Multi-turn conversation** — ask follow-up questions, history-aware
- **Quick action buttons** — Summarize, Concepts, Contributions, Methodology, Limitations
- **Responsive web design** — Flexbox layout, mobile drawer, Fluid typography (`clamp()`), CSS variables, a11y

---

## Project Structure

```
research-assistant/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Sidebar.js       # Upload zone + quick actions (Flexbox column, a11y)
│   │   ├── Sidebar.css      # Responsive drawer, 260px→220px→overlay
│   │   ├── ChatWindow.js    # Message list + markdown, React.memo
│   │   ├── ChatWindow.css   # Flexbox messages, clamp bubbles
│   │   ├── ChatInput.js     # Textarea + send button
│   │   └── ChatInput.css    # Flexbox bar
│   ├── hooks/
│   │   ├── useChat.js       # Chat state, useRef fix, apiClient
│   │   └── usePaper.js      # pdf.js text extraction + base64
│   ├── utils/
│   │   ├── pdfUtils.js      # pdfjs-dist client-side extraction (free)
│   │   ├── apiClient.js     # Factory: retry, timeout, AbortController
│   │   ├── llmProvider.js   # Strategy: gemini|groq|hf|anthropic (free-first)
│   │   └── anthropicApi.js  # Re-export for backwards compat
│   ├── App.js               # Root layout — Flexbox row, hamburger, provider badge
│   ├── App.css              # Responsive breakpoints 1024/768/400
│   ├── index.js
│   └── index.css            # CSS variables, focus-visible, clamp
├── docs/
│   ├── demo-desktop.png
│   └── demo-mobile.png
├── .env.example
├── .gitignore
└── package.json
```

---

## Setup & Run (Free)

### 1. Install dependencies

```bash
npm install
```

### 2. Add a FREE API key (pick one)

```bash
cp .env.example .env
```

| Provider | Env var | Get key (free) | Model default |
|---|---|---|---|
| **Gemini Flash** | `REACT_APP_GEMINI_API_KEY` | https://aistudio.google.com/app/apikey | `gemini-3.6-flash` (fallback: `gemini-flash-latest`) — 60 req/min free |
| **Groq** *(recommended, stable)* | `REACT_APP_GROQ_API_KEY` | https://console.groq.com/keys | `llama-3.3-70b-versatile` — verified: `openai/gpt-oss-120b`, `openai/gpt-oss-20b` |
| **Hugging Face** | `REACT_APP_HUGGINGFACE_API_KEY` | https://huggingface.co/settings/tokens | `mistralai/Mistral-7B-Instruct-v0.3` |
| Anthropic (paid) | `REACT_APP_ANTHROPIC_API_KEY` | https://console.anthropic.com/ | `claude-3-haiku-20240307` |

Set `REACT_APP_LLM_PROVIDER=auto` (default) — picks first key found. Or force e.g. `gemini`.

### 3. Start the app

```bash
npm start
```

Opens at **http://localhost:3000**

---

## How to Use

1. Click **Upload PDF** (or drag & drop) — text is extracted in-browser via `pdf.js` (free, no upload to server)
2. Use the **Quick Action** buttons on the left for instant analysis, or
3. Type any question in the chat bar and press **Enter** (Shift+Enter for newline)
4. On mobile: tap ☰ hamburger to open sidebar drawer

---

## How It Works (RAG Architecture — Free)

```
User uploads PDF
      ↓
pdf.js extracts text client-side (≤15k chars, truncated note)
      ↓
Text sent as context + user question → LLM (Gemini/Groq/HF free tier)
      ↓
LLM answers grounded in paper content
      ↓
Multi-turn history (fixed: no duplication bug) in React state
```

The "retrieval" is the extracted text sent as context on every call — no server, no cost.

### Design Patterns Used (Resume Mentionable)

- **Factory** — `utils/apiClient.js:createApiClient()` creates retry/timeout clients
- **Strategy** — `utils/llmProvider.js` switches gemini/groq/hf/anthropic via `REACT_APP_LLM_PROVIDER`
- **Observer-ish** — `useChat` messages + `useRef` to avoid stale closures

---

## Responsive Web Design (Resume Bullet)

- **Flexbox** throughout: `App.css:.app-body` (`flex row → column`), `ChatWindow.css:.message`, `ChatInput.css:.chat-input-bar`, `Sidebar.css:.quick-actions` column
- **Breakpoints:** 1024px (sidebar 220px), 768px (hamburger + drawer overlay), 400px (compact)
- **HTML5 semantics:** `header`/`main`/`aside`/`nav`/`section`, `role=log` + `aria-live`, keyboard `Enter/Space` on upload zone, `focus-visible` rings
- **CSS:** variables, `clamp()` typography/bubbles, `scrollbar-gutter:stable`, `100dvh`, `prefers-color-scheme` dark mode

---

## Important: Production Warning

> **API keys are exposed in the browser.**  
> For public deploy, move calls to a backend (Express/Next API route). This repo is a frontend demo — ideal for resume/portfolio with free keys.

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React 18 |
| Styling | Plain CSS — Flexbox, Grid, CSS variables, Media Queries |
| Markdown | react-markdown |
| PDF | pdfjs-dist 4.4 (client-side extraction, free) |
| AI | Gemini 3.6 Flash (`gemini-flash-latest` fallback) / Groq (`openai/gpt-oss-120b` verified, `llama-3.3-70b`) / Hugging Face (free) + Anthropic (optional) |
| Patterns | Factory, Strategy, React.memo, useRef, lazy/Suspense ready |
