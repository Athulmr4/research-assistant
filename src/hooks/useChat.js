import { useState, useCallback } from 'react';
import { askAboutPaper } from '../utils/anthropicApi';

/**
 * useChat — manages all chat state and API interaction.
 *
 * @param {string|null} pdfBase64 - The loaded paper as base64.
 * @returns {{ messages, isLoading, error, sendMessage, clearChat }}
 */
export function useChat(pdfBase64) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(
    async (userText) => {
      if (!userText.trim() || isLoading) return;
      if (!pdfBase64) {
        setError('Please upload a research paper PDF first.');
        return;
      }

      setError(null);

      // Add user message to UI immediately
      const userMsg = { role: 'user', content: userText };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        // Build history from current messages (exclude the new one we just added)
        const history = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const reply = await askAboutPaper(userText, pdfBase64, history);

        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: reply },
        ]);
      } catch (err) {
        setError(err.message);
        // Remove the user message if the request failed
        setMessages((prev) => prev.slice(0, -1));
      } finally {
        setIsLoading(false);
      }
    },
    [pdfBase64, isLoading, messages]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, clearChat };
}
