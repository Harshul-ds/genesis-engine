import React from 'react';
import { useAgentStore } from '../../../lib/agent-store';
import styles from './GoalStep.module.css'; // We will create new styles for this

export const GoalStep: React.FC = () => {
  const { 
    goal, 
    setGoal, 
    suggestedGoals, 
    handleGoalSubmit,
    isLoadingGoals 
  } = useAgentStore();

  return (
    <div className={styles.container}>
      <h2>What are your goals?</h2>
      <p>Select or refine your objectives for this topic.</p>

      {/* Textarea for custom user input, now at the top */}
      <textarea
        className={styles.goalTextarea}
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        placeholder="Or write your own goal here..."
      />
      
      {/* AI Suggestions Section */}
      <div className={styles.suggestions}>
        <p>✦ AI-Generated Goal Suggestions</p>
        {isLoadingGoals ? (
          <div className={styles.loader}>Generating suggestions...</div>
        ) : (
          <div className={styles.goalGrid}>
            {suggestedGoals.map((suggestion, index) => (
              <button
                key={index}
                // Apply a 'selected' class if this is the current goal
                className={`${styles.goalChip} ${goal === suggestion ? styles.selected : ''}` }
                onClick={() => setGoal(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* The main action button is now at the bottom */}
      <button 
        className={styles.nextButton}
        onClick={handleGoalSubmit} 
        disabled={!goal.trim()}
      >
        Next: Choose Personas
      </button>
    </div>
  );
};
