import React, { useRef } from 'react';
import './Sidebar.css';

const QUICK_ACTIONS = [
  {
    id: 'summarize',
    label: 'Summarize paper',
    description: 'Get a concise overview',
    prompt: 'Please summarize this research paper. Cover the main problem it addresses, the approach taken, key findings, and the overall impact or takeaway.',
  },
  {
    id: 'concepts',
    label: 'Explain key concepts',
    description: 'Simple language breakdown',
    prompt: 'What are the key technical concepts and terminology used in this paper? Explain each one in simple, everyday language that a non-expert could understand.',
  },
  {
    id: 'contributions',
    label: 'Main contributions',
    description: "What does this paper add?",
    prompt: 'What are the main contributions and novel aspects of this paper? What does it add to its field that did not exist before?',
  },
  {
    id: 'methodology',
    label: 'Methodology',
    description: 'How was the research done?',
    prompt: 'Describe the methodology used in this paper. What data, models, experiments, or techniques were used? How was the research structured?',
  },
  {
    id: 'limitations',
    label: 'Limitations & future work',
    description: 'Gaps the authors acknowledge',
    prompt: 'What are the limitations, weaknesses, or open problems in this paper? What future work do the authors suggest?',
  },
];

export function Sidebar({ paper, isProcessing, onFileSelect, onQuickAction, onClearPaper }) {
  const fileInputRef = useRef(null);

  function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) onFileSelect(file);
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  return (
    <aside className="sidebar">
      {/* Upload zone */}
      <div
        className={`upload-zone ${paper ? 'has-paper' : ''}`}
        onClick={() => fileInputRef.current.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          style={{ display: 'none' }}
          onChange={(e) => onFileSelect(e.target.files[0])}
        />

        {isProcessing ? (
          <div className="upload-loading">
            <div className="spinner" />
            <span>Processing PDF...</span>
          </div>
        ) : paper ? (
          <div className="paper-info">
            <div className="paper-icon">📄</div>
            <div className="paper-details">
              <p className="paper-name">{paper.name}</p>
              <p className="paper-meta">{paper.size} · Ready</p>
            </div>
            <button
              className="clear-btn"
              onClick={(e) => { e.stopPropagation(); onClearPaper(); }}
              title="Remove paper"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="upload-prompt">
            <div className="upload-icon">⬆</div>
            <p className="upload-title">Upload PDF</p>
            <p className="upload-sub">Click or drag & drop a research paper</p>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="quick-actions">
        <p className="section-label">Quick actions</p>
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.id}
            className="action-btn"
            onClick={() => onQuickAction(action.prompt)}
            disabled={!paper}
          >
            <span className="action-label">{action.label}</span>
            <span className="action-desc">{action.description}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
