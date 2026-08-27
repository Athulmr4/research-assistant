/**
 * anthropicApi.js — DEPRECATED: kept for backwards compatibility.
 * New code should import { askAboutPaper } from './llmProvider' which
 * supports multiple free providers (Gemini, Groq, HF) + Anthropic.
 * This file re-exports the unified provider for existing imports.
 */
export { askAboutPaper } from './llmProvider';
export { resolveProvider, getProviderLabel } from './llmProvider';
