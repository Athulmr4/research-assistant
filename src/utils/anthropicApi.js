/**
 * anthropicApi.js
 * Handles all communication with the Anthropic Claude API.
 *
 * NOTE: In production, never expose your API key in the frontend.
 * Move this to a backend server (e.g. Express / Next.js API route).
 * For local development, the key is read from .env
 */

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-opus-4-5';
const MAX_TOKENS = 1500;

const SYSTEM_PROMPT = `You are an expert AI research assistant that helps users understand academic papers deeply and quickly.

You have been given the full research paper as a PDF. Your responsibilities:

1. SUMMARIZE: Give clear, structured summaries covering problem, approach, results, and impact.
2. ANSWER QUESTIONS: Answer any question about the paper accurately and specifically.
3. EXPLAIN CONCEPTS: Break down complex technical terms and concepts into plain, everyday language.

Guidelines:
- Always ground your answers in the paper's actual content.
- Use bullet points and structure when it improves clarity.
- If asked to explain something, use analogies and simple language.
- Be concise but complete — don't pad unnecessarily.
- If something isn't covered in the paper, say so honestly.`;

/**
 * Sends a message to the Claude API with the paper PDF as context.
 *
 * @param {string} userMessage - The user's current question or prompt.
 * @param {string} pdfBase64 - The research paper as a base64-encoded string.
 * @param {Array} history - Previous conversation turns [{role, content}].
 * @returns {Promise<string>} - The assistant's reply text.
 */
export async function askAboutPaper(userMessage, pdfBase64, history = []) {
  const apiKey = process.env.REACT_APP_ANTHROPIC_API_KEY;

  if (!apiKey || apiKey === 'your_api_key_here') {
    throw new Error(
      'Missing API key. Copy .env.example to .env and add your Anthropic API key.'
    );
  }

  // The first message always includes the PDF document as context.
  // Subsequent turns reference it via conversation history.
  const firstUserContent = [
    {
      type: 'document',
      source: {
        type: 'base64',
        media_type: 'application/pdf',
        data: pdfBase64,
      },
    },
    { type: 'text', text: history.length === 0 ? userMessage : history[0].content },
  ];

  // Build messages array: first turn has the PDF, rest are plain text
  const messages = [
    { role: 'user', content: firstUserContent },
    ...history.slice(1).map((turn) => ({
      role: turn.role,
      content: turn.content,
    })),
    // If there is history, we need to add the current user message at the end
    ...(history.length > 0
      ? [{ role: 'user', content: userMessage }]
      : []),
  ];

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  const textBlock = data.content?.find((b) => b.type === 'text');
  return textBlock?.text || 'No response received.';
}
