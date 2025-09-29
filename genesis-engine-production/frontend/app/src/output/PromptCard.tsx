// src/components/app/output/PromptCard.tsx
import React from 'react';
import styles from './PromptCard.module.css';

// Single source of truth for PromptData type
export interface PromptData {
  title: string;
  personaUsed: string;
  prompt: string;
}

interface PromptCardProps {
  promptData: PromptData;
  onRefine: (prompt: PromptData) => void;
  onSave: (prompt: PromptData) => void;
}

export const PromptCard: React.FC<PromptCardProps> = ({ promptData, onRefine, onSave }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(promptData.prompt);
    alert("Prompt copied to clipboard!");
  };

  return (
    <div className={styles.promptCard}>
      <div>
        <h3>{promptData.title}</h3>
        <p className={styles.personaTag}>Persona: {promptData.personaUsed}</p>
        <p className={styles.promptText}>{promptData.prompt}</p>
      </div>
      <div className={styles.cardActions}>
        <button onClick={handleCopy}>Copy</button>
        <button className="refine-btn" onClick={() => onRefine(promptData)}>Refine</button>
        <button onClick={() => onSave(promptData)}>Save</button>
      </div>
    </div>
  );
};
