// src/components/app/PromptDisplay.tsx
"use client";

import { Textarea } from '@/components/ui/textarea';

export function PromptDisplay() {
  // Hardcoded placeholder prompt for now
  const PLACEHOLDER_PROMPT = `You are a pragmatic software engineer with years of experience in building robust, scalable systems. You focus on practical solutions that work in the real world, prioritize code quality and maintainability, and always consider the business context. You write clean, well-documented code and are skilled at debugging complex issues.

Write an engaging, well-researched article that explains the topic clearly and keeps the reader interested throughout. Use analogies and examples to make complex concepts accessible. Structure the article with a compelling introduction, clear body sections, and a strong conclusion. Include practical takeaways for the reader.

Topic: [User will enter topic here]`;

  return (
    <Textarea
      readOnly
      className="bg-gray-900 h-full resize-none text-lime-400 font-mono text-sm"
      value={PLACEHOLDER_PROMPT}
      placeholder="Live meta-prompt will appear here as you make selections..."
    />
  );
}
