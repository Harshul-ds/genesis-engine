// src/components/app/TopicInput.tsx
"use client";

import { useState } from 'react';
import styles from './TopicInput.module.css';

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
    <div className={styles.container}>
      <h3 className={styles.title}>Step 1: Choose Your Topic</h3>
      <p className={styles.subtitle}>
        What would you like to create prompts about?
      </p>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter a topic (e.g., sustainable fashion startup)"
          disabled={disabled}
          className={styles.input}
        />
        <button
          type="submit"
          disabled={disabled || !topic.trim()}
          className={styles.submitButton}
        >
          Next: Select Personas
        </button>
      </form>
    </div>
  );
}
