// src/components/app/wizard-steps/TopicStep.tsx
'use client';

import React from 'react';
import { useAgentStore } from '../lib/agent-store';
import styles from '../GenesisCommandCenter.module.css';

export const TopicStep = () => {
  // Select all the state and actions this component needs from the central store.
  const {
    topic,
    setTopic,
    suggestedTopics,
    isLoadingTopics,
    handleTopicSubmit
  } = useAgentStore(state => ({
    topic: state.topic,
    setTopic: state.setTopic,
    suggestedTopics: state.suggestedTopics,
    isLoadingTopics: state.isLoadingTopics,
    handleTopicSubmit: state.handleTopicSubmit,
  }));

  return (
    <div className={styles.topicContainer}>
      <h3 className={styles.topicTitle}>What's your topic?</h3>
      <p className={styles.topicSubtitle}>Start with a core idea, and we'll help you build from there.</p>

      {/* --- Topic Suggestions (Bubbles) --- */}
      {isLoadingTopics ? (
        <div className={styles.loadingOverlay}>Loading topic suggestions...</div>
      ) : (
        suggestedTopics.length > 0 && (
          <div className={styles.topicSuggestions}>
            <h4 className={styles.topicSuggestionsTitle}>💡 Start with an idea</h4>
            <div className={styles.topicSuggestionsGrid}>
              {suggestedTopics.map((suggestion, index) => (
                <div
                  key={index}
                  className={styles.topicSuggestion}
                  onClick={() => setTopic(suggestion)}
                >
                  ✨ {suggestion}
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {/* --- Main Topic Input Form --- */}
      <form onSubmit={(e) => { e.preventDefault(); handleTopicSubmit(); }} className={styles.topicForm}>
        <input
          type="text"
          className={styles.topicInput}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g., sustainable fashion startup, AI ethics, renewable energy..."
        />
        <button
          type="submit"
          className={styles.topicSubmitButton}
          disabled={!topic.trim()}
        >
          Next: Generate Goals
        </button>
      </form>
    </div>
  );
};
