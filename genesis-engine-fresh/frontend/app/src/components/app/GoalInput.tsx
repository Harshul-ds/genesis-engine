// src/components/app/GoalInput.tsx
"use client";

import { useState, useEffect } from 'react';
import styles from './GoalInput.module.css';

interface GoalInputProps {
  onSubmit: (goalDescription: string) => void;
  suggestions?: string[];
  disabled?: boolean;
  topic: string; // Pass the topic to generate default suggestions
}

export function GoalInput({ onSubmit, suggestions = [], disabled = false, topic }: GoalInputProps) {
  const [goalDescription, setGoalDescription] = useState('');

  // Use a default list of suggestions if none are provided
  const defaultSuggestions = [
    `Create a comprehensive business plan for a ${topic}`,
    `Develop a marketing strategy for a ${topic}`,
    `Write a technical whitepaper on ${topic}`,
  ];

  const finalSuggestions = suggestions.length > 0 ? suggestions : defaultSuggestions;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalDescription.trim() || disabled) return;
    onSubmit(goalDescription.trim());
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Step 3: Describe Your Goal in Detail</h3>
      <p className={styles.subtitle}>
        Provide a detailed description of what you want to achieve. The more specific you are, the better.
      </p>

      {/* Goal Suggestions */}
      <div className={styles.suggestionsContainer}>
        <p className={styles.suggestionsTitle}>Suggestions for you:</p>
        <div className={styles.suggestionsGrid}>
          {finalSuggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => setGoalDescription(suggestion)}
              className={styles.suggestionChip}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <textarea
          value={goalDescription}
          onChange={(e) => setGoalDescription(e.target.value)}
          placeholder="e.g., Create a comprehensive business plan for a sustainable fashion startup..."
          disabled={disabled}
          className={styles.textarea}
        />
        <button
          type="submit"
          disabled={disabled || !goalDescription.trim()}
          className={styles.submitButton}
        >
          Next: Select Model
        </button>
      </form>
    </div>
  );
}
