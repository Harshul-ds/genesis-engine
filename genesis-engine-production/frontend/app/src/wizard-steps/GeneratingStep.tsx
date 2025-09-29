// src/components/app/wizard-steps/GeneratingStep.tsx
'use client';

import React, { useEffect } from 'react';
import { useAgentStore } from '../lib/agent-store';
import styles from '../GenesisCommandCenter.module.css';

export const GeneratingStep = () => {
  const { liveHistory, isGenerating } = useAgentStore(state => ({
    liveHistory: state.liveHistory,
    isGenerating: state.isGenerating,
  }));

  if (!isGenerating && liveHistory.length === 0) {
    return (
      <div className={styles.generatingContainer}>
        <div className={styles.loadingSpinner}></div>
        <h2>Initializing AI Generation...</h2>
        <p>The AI is preparing to create your prompts...</p>
      </div>
    );
  }

  return (
    <div className={styles.generatingContainer}>
      <div className={styles.liveFeed}>
        <h2>AI Generation in Progress</h2>
        <div className={styles.historyList}>
          {liveHistory.map((event, index) => (
            <div key={event.id || index} className={styles.historyItem}>
              <div className={styles.eventType}>{event.type}</div>
              <div className={styles.eventContent}>{event.payload.text}</div>
            </div>
          ))}
        </div>
        {isGenerating && (
          <div className={styles.generatingIndicator}>
            <div className={styles.loadingSpinner}></div>
            <span>AI is thinking...</span>
          </div>
        )}
      </div>
    </div>
  );
};
