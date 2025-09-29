// src/components/app/wizard-steps/GoalStep.tsx
'use client';

import React from 'react';
import { useAgentStore } from '../../../lib/agent-store';
import styles from '../GenesisCommandCenter.module.css';

export const GoalStep = () => {
  // Select all the state and actions this component needs from the central store.
  const {
    goal,
    setGoal,
    suggestedGoals,
    isLoadingGoals,
    handleGoalSubmit
  } = useAgentStore(state => ({
    goal: state.goal,
    setGoal: state.setGoal,
    suggestedGoals: state.suggestedGoals,
    isLoadingGoals: state.isLoadingGoals,
    handleGoalSubmit: state.handleGoalSubmit,
  }));

  return (
    <div className={styles.goalContainer}>
      <h3 className={styles.goalTitle}>What are your goals?</h3>
      <p className={styles.goalSubtitle}>Select or refine your objectives for this topic.</p>

      {/* --- Loading State --- */}
      {isLoadingGoals ? (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner}></div>
          <p style={{ marginTop: '1rem', color: 'rgba(255, 255, 255, 0.8)' }}>
            Generating goal suggestions...
          </p>
        </div>
      ) : (
        <>
          {/* --- AI-Generated Goal Suggestions --- */}
          {suggestedGoals.length > 0 && (
            <div className={styles.goalSuggestions}>
              <h4 className={styles.goalSuggestionsTitle}>💡 AI-Generated Goal Suggestions</h4>
              <div className={styles.goalSuggestionsGrid}>
                {suggestedGoals.map((suggestion, index) => (
                  <div
                    key={index}
                    className={styles.goalSuggestion}
                    onClick={() => setGoal(suggestion)}
                  >
                    ✨ {suggestion}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- Custom Goal Input --- */}
          <div className={styles.customGoalSection}>
            <label className={styles.customGoalLabel}>
              Or write your own goal:
            </label>
            <textarea
              className={styles.goalTextarea}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g., Create a comprehensive business plan, develop marketing content, design educational materials..."
              rows={4}
            />
          </div>

          {/* --- Submit Button --- */}
          <button
            className={styles.topicSubmitButton}
            onClick={handleGoalSubmit}
            disabled={!goal.trim()}
          >
            Next: Choose Personas
          </button>
        </>
      )}
    </div>
  );
};
