# Research Paper Assistant

An AI-powered tool to help you understand research papers quickly.  
Built with **React** + **Anthropic Claude API** (RAG-based PDF analysis).

## Features

- **Summarize** any research paper PDF
- **Answer questions** about the paper's content
- **Explain difficult concepts** in plain language
- Multi-turn conversation — ask follow-up questions
- Quick action buttons for common tasks

---

## Project Structure

```
research-assistant/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Sidebar.js       # Upload zone + quick actions
│   │   ├── Sidebar.css
│   │   ├── ChatWindow.js    # Message list + markdown rendering
│   │   ├── ChatWindow.css
│   │   ├── ChatInput.js     # Textarea + send button
│   │   └── ChatInput.css
│   ├── hooks/
│   │   ├── useChat.js       # Chat state & API calls
│   │   └── usePaper.js      # PDF file loading & base64 conversion
│   ├── utils/
│   │   └── anthropicApi.js  # Anthropic API wrapper
│   ├── App.js               # Root layout
│   ├── App.css
│   ├── index.js
│   └── index.css
├── .env.example
├── .gitignore
└── package.json
```

---

## Setup & Run

### 1. Install dependencies

```bash
npm install
```

### 2. Add your API key

```bash
cp .env.example .env
```

Then open `.env` and replace `your_api_key_here` with your actual key from  
[https://console.anthropic.com/](https://console.anthropic.com/)

```
REACT_APP_ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Start the app

```bash
npm start
```

Opens at **http://localhost:3000**

---

## How to Use

1. Click **Upload PDF** (or drag & drop) and select a research paper
2. Use the **Quick Action** buttons on the left for instant analysis, or
3. Type any question in the chat bar and press **Enter**

---

## How It Works (RAG Architecture)

```
User uploads PDF
      ↓
PDF converted to base64
      ↓
Sent to Claude API as a document block (full paper as context)
      ↓
Claude answers grounded in the paper's content
      ↓
Multi-turn conversation history maintained in React state
```

The "retrieval" here is the full PDF sent as context on every call —  
Claude handles the grounding automatically.

---

## Important: Production Warning

> **Do not deploy this app publicly as-is.**  
> The API key is exposed in the browser.  
> For production, move API calls to a backend server  
> (e.g., Express.js, Next.js API routes, or a serverless function).

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React 18 |
| Styling | Plain CSS with CSS variables |
| Markdown | react-markdown |
| AI | Anthropic Claude API (`claude-opus-4-5`) |
| PDF context | Base64 document blocks |
