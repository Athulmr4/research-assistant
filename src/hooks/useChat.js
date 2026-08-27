import { useState, useCallback, useRef } from 'react';
import { askAboutPaper } from '../utils/llmProvider';

/**
 * useChat — manages all chat state and API interaction.
 * Fixed: history duplication bug; uses useRef to avoid stale messages closure.
 * Supports both pdfText (free providers) and pdfBase64 (Anthropic).
 *
 * @param {{ pdfText: string|null, pdfBase64: string|null }} paperContext
 * @returns {{ messages, isLoading, error, sendMessage, clearChat }}
 */
export function useChat(paperContext) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  // Ref keeps latest messages without triggering sendMessage identity churn
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const sendMessage = useCallback(
    async (userText) => {
      if (!userText.trim() || isLoading) return;
      if (!paperContext.pdfText && !paperContext.pdfBase64) {
        setError('Please upload a research paper PDF first.');
        return;
      }

      setError(null);

      const userMsg = { role: 'user', content: userText };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        // Use ref to get history before the optimistic userMsg
        const history = messagesRef.current.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const reply = await askAboutPaper(userText, paperContext, history);

        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: reply },
        ]);
      } catch (err) {
        // Keep user message visible so error is actionable — fixes 0.1s disappearance
        console.error('[useChat] askAboutPaper failed:', err);
        setError(err.message || 'Unknown error occurred.');
      } finally {
        setIsLoading(false);
      }
    },
    [paperContext, isLoading]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, clearChat };
}
