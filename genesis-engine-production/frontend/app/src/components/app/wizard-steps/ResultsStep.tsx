// src/components/app/wizard-steps/ResultsStep.tsx
'use client';

import React from 'react';
import { useAgentStore } from '../../../lib/agent-store';
import styles from '../GenesisCommandCenter.module.css';

export const ResultsStep = () => {
  const { finalPrompts, reset } = useAgentStore(state => ({
    finalPrompts: state.finalPrompts,
    reset: state.reset,
  }));

  const handleCopyPrompt = (promptContent: string) => {
    navigator.clipboard.writeText(promptContent);
    // You could add a toast notification here
  };

  return (
    <div className={styles.resultsContainer}>
      <h2 className={styles.resultsTitle}>Prompts Generated Successfully</h2>
      <p className={styles.resultsSubtitle}>
        The agent has completed its work. Here are your high-quality prompts.
      </p>

      <div className={styles.promptsList}>
        {finalPrompts.map(prompt => (
          <div key={prompt.id} className={styles.promptCard}>
            <div className={styles.promptHeader}>
              <span className={styles.promptPersona}>{prompt.persona}</span>
              <h4 className={styles.promptTitle}>{prompt.title}</h4>
            </div>
            <pre className={styles.promptContent}>{prompt.content}</pre>
            <button
              className={styles.copyButton}
              onClick={() => handleCopyPrompt(prompt.content)}
            >
              Copy
            </button>
          </div>
        ))}
      </div>

      <button
        className={styles.resetButton}
        onClick={reset}
      >
        Start New Session
      </button>
    </div>
  );
};
