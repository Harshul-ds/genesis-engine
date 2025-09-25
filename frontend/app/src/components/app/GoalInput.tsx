// src/components/app/GoalInput.tsx
"use client";

import { useState } from 'react';

interface GoalDescriptionInputProps {
  onSubmit: (goalDescription: string) => void;
  disabled?: boolean;
}

export function GoalInput({ onSubmit, disabled = false }: GoalDescriptionInputProps) {
  const [goalDescription, setGoalDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalDescription.trim() || disabled) return;
    onSubmit(goalDescription.trim());
  };

  return (
    <div className="goal-description-section">
      <h3>Step 3: Describe Your Goal in Detail</h3>
      <p>
        Provide a detailed description of what you want to achieve with this topic. The more specific you are, the better the prompts will be.
      </p>
      <form onSubmit={handleSubmit}>
        <textarea
          value={goalDescription}
          onChange={(e) => setGoalDescription(e.target.value)}
          placeholder="e.g., Create a comprehensive business plan for a sustainable fashion startup including market analysis, financial projections, and marketing strategy"
          disabled={disabled}
        />
        <button
          type="submit"
          disabled={disabled || !goalDescription.trim()}
        >
          Next: Select Model
        </button>
      </form>
    </div>
  );
}
