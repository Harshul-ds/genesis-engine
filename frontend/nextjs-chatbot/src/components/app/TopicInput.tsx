// src/components/app/TopicInput.tsx
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export function TopicInput() {
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsLoading(true);
    try {
      // TODO: Connect to the backend API
      console.log('Generating with topic:', topic);
      // For now, just simulate a response
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert(`Generated response for: ${topic}`);
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="text-sm text-gray-300">
        Enter your specific topic or question:
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 flex-grow">
        <Textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g., 'Compare React Server Components vs traditional SSR'"
          className="flex-grow bg-gray-700 text-white border-gray-600 resize-none"
          rows={4}
        />
        <Button
          type="submit"
          disabled={isLoading || !topic.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Generating...' : '🚀 Generate Response'}
        </Button>
      </form>
    </div>
  );
}
