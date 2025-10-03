import 'dotenv/config';
import type { AxiosInstance } from 'axios';
import axios from 'axios';

type LlmClient = AxiosInstance & { provider: string; endpoints: { chat: string; completions: string } };

const createClient = (baseURL: string, headers: Record<string, string>, provider: string, endpoints: { chat: string; completions: string }): LlmClient => {
  const client = axios.create({ baseURL, headers }) as LlmClient;
  client.provider = provider;
  client.endpoints = endpoints;
  return client;
};

export const getLlmClient = (provider?: string): LlmClient | null => {
  const effectiveProvider = provider || process.env.LLM_PROVIDER || 'openai';

  switch (effectiveProvider.toLowerCase()) {
    case 'openai':
      if (!process.env.OPENAI_API_KEY) return null;
      return createClient(
        'https://api.openai.com/v1',
        { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        'openai',
        { chat: '/chat/completions', completions: '/completions' }
      );
    case 'anthropic':
      if (!process.env.ANTHROPIC_API_KEY) return null;
      return createClient(
        'https://api.anthropic.com/v1',
        {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        'anthropic',
        { chat: '/messages', completions: '/complete' }
      );
    case 'google':
    case 'gemini':
       if (!process.env.GEMINI_API_KEY) return null;
       // Note: Gemini uses different endpoint paths for chat vs completions.
       // This simplified example assumes a 'v1' or similar structure.
       // You'll need to adjust based on the actual Gemini API structure.
       return createClient(
        `https://generativelanguage.googleapis.com/v1beta/models`,
         { 'x-goog-api-key': process.env.GEMINI_API_KEY },
         'gemini',
         { chat: ':generateContent', completions: ':generateContent' } // Example, adjust as needed
       );
    default:
      return null;
  }
};
