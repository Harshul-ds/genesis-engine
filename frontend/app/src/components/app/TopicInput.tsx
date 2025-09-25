// src/components/app/TopicInput.tsx
"use client";

import { useState } from 'react';

interface TopicInputProps {
  onSubmit: (topic: string) => void;
  disabled?: boolean;
}

export function TopicInput({ onSubmit, disabled = false }: TopicInputProps) {
  const [topic, setTopic] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || disabled) return;
    onSubmit(topic.trim());
  };

  return (
    <div className="topic-input-section">
      <h3>Step 1: Choose Your Topic</h3>
      <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        What would you like to create prompts about?
      </p>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter a topic (e.g., sustainable fashion startup)"
          disabled={disabled}
        />
        <button
          type="submit"
          disabled={disabled || !topic.trim()}
        >
          Next: Select Personas
        </button>
      </form>
    </div>
  );
}
