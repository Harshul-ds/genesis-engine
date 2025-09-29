// src/components/app/wizard-steps/ResultsStep.tsx
'use client';

import React from 'react';
import { useAgentStore } from '../lib/agent-store';
import styles from '../GenesisCommandCenter.module.css';

export const ResultsStep = () => {
  const { finalPrompts, reset } = useAgentStore(state => ({
    finalPrompts: state.finalPrompts,
    reset: state.reset,
  }));

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className={styles.resultsContainer}>
      <h2 className={styles.resultsTitle}>Generation Complete!</h2>
      <p className={styles.resultsSubtitle}>Your AI-generated prompts are ready to use.</p>

      <div className={styles.promptsList}>
        {finalPrompts.map((prompt) => (
          <div key={prompt.id} className={styles.promptCard}>
            <div className={styles.promptHeader}>
              <h3>{prompt.title}</h3>
              <span className={styles.personaTag}>{prompt.persona}</span>
            </div>
            <div className={styles.promptContent}>
              <pre>{prompt.content}</pre>
            </div>
            <button
              className={styles.copyButton}
              onClick={() => copyToClipboard(prompt.content)}
            >
              Copy Prompt
            </button>
          </div>
        ))}
      </div>

      <button
        className={styles.resetButton}
        onClick={reset}
      >
        Start New Project
      </button>
    </div>
  );
};
