// src/components/app/wizard-steps/GeneratingStep.tsx
'use client';

import React from 'react';
import { useAgentStore } from '../../../lib/agent-store';
import { AgentStreamEvent } from '../../../lib/types';
import styles from '../GenesisCommandCenter.module.css';

export const GeneratingStep = () => {
  const { liveHistory, agentError } = useAgentStore(state => ({
    liveHistory: state.liveHistory,
    agentError: state.agentError,
  }));

  const renderEvent = (event: AgentStreamEvent, index: number) => {
    const eventType = event.type;
    const eventText = event.payload.text;

    return (
      <div key={event.id || index} className={`${styles.historyEvent} ${styles[eventType]}`}>
        <div className={styles.eventType}>{eventType.toUpperCase()}</div>
        <div className={styles.eventText}>{eventText}</div>
        <div className={styles.eventTimestamp}>
          {new Date(event.timestamp).toLocaleTimeString()}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.generatingContainer}>
      <h2 className={styles.generatingTitle}>Genesis Engine Running</h2>
      <p className={styles.generatingSubtitle}>
        The agent is executing the plan. You can see its real-time thoughts and actions below.
      </p>

      <div className={styles.liveHistory}>
        {liveHistory.length === 0 ? (
          <div className={styles.loadingEvent}>
            <div className={styles.loadingSpinner}></div>
            <p>Waiting for agent to start...</p>
          </div>
        ) : (
          liveHistory.map((event, index) => renderEvent(event, index))
        )}
      </div>

      {agentError && (
        <div className={styles.errorContainer}>
          <h4>An Error Occurred</h4>
          <p>{agentError}</p>
        </div>
      )}
    </div>
  );
};
