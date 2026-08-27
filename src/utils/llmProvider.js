/**
 * llmProvider.js — Strategy pattern for LLM backends.
 * Supports free tiers first: Gemini Flash (free), Groq (free), HuggingFace (free), then Anthropic (paid).
 * Selection via env: REACT_APP_LLM_PROVIDER = 'auto' | 'gemini' | 'groq' | 'huggingface' | 'anthropic'
 * Auto-discovery: picks first provider with a key present.
 */

import { apiClient } from './apiClient';

const SYSTEM_PROMPT = `You are an expert AI research assistant that helps users understand academic papers deeply and quickly.

You have been given the research paper as extracted text. Your responsibilities:
1. SUMMARIZE: Give clear, structured summaries covering problem, approach, results, and impact.
2. ANSWER QUESTIONS: Answer any question about the paper accurately and specifically.
3. EXPLAIN CONCEPTS: Break down complex technical terms into plain, everyday language.

Guidelines:
- Always ground your answers in the paper's actual content.
- Use bullet points and structure when it improves clarity.
- If asked to explain something, use analogies and simple language.
- Be concise but complete — don't pad unnecessarily.
- If something isn't covered in the paper, say so honestly.`;

const MAX_TOKENS = 1500;

// Resolve provider in priority order (free first)
export function resolveProvider() {
  const explicit = (process.env.REACT_APP_LLM_PROVIDER || 'auto').toLowerCase();
  if (explicit !== 'auto') return explicit;

  if (process.env.REACT_APP_GEMINI_API_KEY) return 'gemini';
  if (process.env.REACT_APP_GROQ_API_KEY) return 'groq';
  if (process.env.REACT_APP_HUGGINGFACE_API_KEY) return 'huggingface';
  if (process.env.REACT_APP_ANTHROPIC_API_KEY) return 'anthropic';
  return 'none';
}

export function getProviderLabel(provider) {
  const labels = {
    gemini: 'Gemini 1.5 Flash (Free)',
    groq: 'Groq Llama 3.1 (Free)',
    huggingface: 'Hugging Face (Free)',
    anthropic: 'Claude Opus 4.5',
    none: 'No key configured',
  };
  return labels[provider] || provider;
}

/**
 * Main entry: askAboutPaper with free-first strategy.
 * @param {string} userMessage
 * @param {{ pdfText: string|null, pdfBase64: string|null }} paperContext
 * @param {Array} history - [{role, content}]
 */
export async function askAboutPaper(userMessage, paperContext, history = []) {
  const provider = resolveProvider();
  if (provider === 'none') {
    throw new Error(
      'Missing API key. Add one free key to .env — see .env.example:\n' +
        '- REACT_APP_GEMINI_API_KEY (recommended, free at aistudio.google.com)\n' +
        '- REACT_APP_GROQ_API_KEY (free at console.groq.com)\n' +
        '- REACT_APP_HUGGINGFACE_API_KEY (free at huggingface.co)\n' +
        'Or use Anthropic: REACT_APP_ANTHROPIC_API_KEY'
    );
  }

  // Build a single narrative context — fixes old history duplication bug
  // Old code spliced history[0].content into document block and re-appended.
  // Now we build clean alternating turns.
  const paperBlock = paperContext.pdfText
    ? `RESEARCH PAPER CONTENT:\n${paperContext.pdfText}\n\n---\n`
    : '';

  const messages = buildMessages(paperBlock, userMessage, history);

  switch (provider) {
    case 'gemini':
      return callGemini(messages);
    case 'groq':
      return callGroq(messages);
    case 'huggingface':
      return callHuggingFace(messages);
    case 'anthropic':
      return callAnthropic(messages, paperContext.pdfBase64, history, userMessage);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

function buildMessages(paperBlock, userMessage, history) {
  // history is already alternating user/assistant from useChat.
  // We prepend paper context to the first user turn.
  if (history.length === 0) {
    return [{ role: 'user', content: paperBlock + userMessage }];
  }
  // Keep history as-is but inject paper context into first user message if not already present
  const first = history[0];
  const withPaperFirst =
    first.role === 'user' && !first.content.includes('RESEARCH PAPER CONTENT:')
      ? { role: 'user', content: paperBlock + first.content }
      : first;
  return [...[withPaperFirst], ...history.slice(1), { role: 'user', content: userMessage }];
}

// --- Providers ---

async function callGemini(messages) {
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  // Updated default: gemini-1.5-flash was sunset in 2025; use 2.0 flash with fallback
  const model = process.env.REACT_APP_GEMINI_MODEL || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // Gemini uses systemInstruction + contents
  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  let data;
  try {
    data = await apiClient.request(url, {
      method: 'POST',
      body: {
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { maxOutputTokens: MAX_TOKENS, temperature: 0.7 },
      },
    });
  } catch (err) {
    // Fallback: try legacy 1.5 model if 2.0 not available (404), preserves free tier
    if (err.status === 404 && model === 'gemini-2.0-flash') {
      const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
      console.warn('[llmProvider] gemini-2.0-flash not found, retrying with gemini-1.5-flash-latest');
      data = await apiClient.request(fallbackUrl, {
        method: 'POST',
        body: {
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: { maxOutputTokens: MAX_TOKENS, temperature: 0.7 },
        },
      });
    } else {
      // Add actionable hint for common Gemini errors
      if (err.status === 403) err.message += ' — Enable Generative Language API at console.cloud.google.com/apis/library/generativelanguage.googleapis.com';
      if (err.status === 400) err.message += ' — Check REACT_APP_GEMINI_API_KEY is valid (no quotes/spaces) and restart npm start.';
      throw err;
    }
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    console.error('[llmProvider] Gemini raw response:', JSON.stringify(data).slice(0, 2000));
    throw new Error('Gemini returned no content. Check console for raw response; try REACT_APP_GEMINI_MODEL=gemini-1.5-flash-latest');
  }
  return text;
}

async function callGroq(messages) {
  const apiKey = process.env.REACT_APP_GROQ_API_KEY;
  const model = process.env.REACT_APP_GROQ_MODEL || 'llama-3.1-8b-instant';
  const url = 'https://api.groq.com/openai/v1/chat/completions';

  const data = await apiClient.request(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: {
      model,
      max_tokens: MAX_TOKENS,
      temperature: 0.7,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
    },
  });

  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Groq returned no content.');
  return text;
}

async function callHuggingFace(messages) {
  const apiKey = process.env.REACT_APP_HUGGINGFACE_API_KEY;
  const model = process.env.REACT_APP_HF_MODEL || 'mistralai/Mistral-7B-Instruct-v0.3';
  const url = `https://api-inference.huggingface.co/models/${model}`;

  // Collapse to single prompt for HF text-generation
  const prompt = `${SYSTEM_PROMPT}\n\n` + messages.map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n') + '\nAssistant:';

  const data = await apiClient.request(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: { inputs: prompt, parameters: { max_new_tokens: MAX_TOKENS, temperature: 0.7, return_full_text: false } },
  });

  // HF returns [{generated_text}] or {error}
  const text = Array.isArray(data) ? data[0]?.generated_text : data?.generated_text;
  if (!text) throw new Error(data?.error || 'Hugging Face returned no content.');
  return text;
}

async function callAnthropic(messages, pdfBase64, rawHistory, userMessage) {
  // Prefer extracted text for cost, but fall back to base64 document block if available
  const apiKey = process.env.REACT_APP_ANTHROPIC_API_KEY;
  const url = 'https://api.anthropic.com/v1/messages';
  const model = process.env.REACT_APP_ANTHROPIC_MODEL || 'claude-3-haiku-20240307'; // cheaper default; opus available via env

  // If we have pdfText, use text-based context (cheaper, works on free-tier logic)
  // Text path uses unified messages built above.
  // Legacy base64 path kept for full fidelity when user has Anthropic key and wants doc blocks.
  const useTextPath = messages[0]?.content?.includes('RESEARCH PAPER CONTENT:');

  let anthropicMessages;
  if (useTextPath) {
    anthropicMessages = messages.map((m) => ({ role: m.role, content: m.content }));
  } else if (pdfBase64) {
    // Legacy document block path
    const firstUserContent = [
      { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 } },
      { type: 'text', text: rawHistory.length === 0 ? userMessage : rawHistory[0].content },
    ];
    anthropicMessages = [
      { role: 'user', content: firstUserContent },
      ...rawHistory.slice(1).map((t) => ({ role: t.role, content: t.content })),
      ...(rawHistory.length > 0 ? [{ role: 'user', content: userMessage }] : []),
    ];
  } else {
    anthropicMessages = messages.map((m) => ({ role: m.role, content: m.content }));
  }

  const data = await apiClient.request(url, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: {
      model,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: anthropicMessages,
    },
  });

  const textBlock = data.content?.find((b) => b.type === 'text');
  return textBlock?.text || 'No response received.';
}
