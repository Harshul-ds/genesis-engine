import React, { useState, useEffect } from 'react';
import { useAgentStore } from '../../../lib/agent-store';
import styles from './TopicStep.module.css';

// A simple shuffle function (Fisher-Yates algorithm)
const shuffleArray = (array: string[]) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const TopicStep: React.FC = () => {
  const {
    topic,
    setTopic,
    handleTopicSubmit,
    suggestedTopics,
    isAutonomous,
    runAutonomousWorkflow,
    isLoadingTopics,
  } = useAgentStore();

  // ✨ NEW: State to hold the shuffled list of topics
  const [shuffledTopics, setShuffledTopics] = useState<string[]>([]);

  // ✨ NEW: This effect runs once when the component loads.
  // It shuffles the topics and stores them in local state for a stable order during the visit.
  useEffect(() => {
    if (suggestedTopics.length > 0) {
      setShuffledTopics(shuffleArray(suggestedTopics));
    }
  }, [suggestedTopics]); // This effect re-runs only if the base suggestions change

  const handleLaunchAgent = () => {
    if (topic.trim() && !isAutonomous) {
      runAutonomousWorkflow(topic.trim());
    }
  };

  return (
    <div className={styles.container}>
      <h2>What&apos;s your topic?</h2>
      <p>Start with a core idea, and we&apos;ll help you build from there.</p>

      {/* Topic Input Field */}
      <input
        type="text"
        className={styles.topicInput}
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="e.g., sustainable fashion startup, AI ethics, renewable energy..."
        disabled={isAutonomous}
      />

      {/* ✨ NEW: Side-by-side Button Container */}
      <div className={styles.buttonContainer}>
        <button
          onClick={handleTopicSubmit}
          className={styles.manualButton}
          disabled={isAutonomous || !topic.trim()}
        >
          Manual
        </button>
        <button
          onClick={handleLaunchAgent}
          className={styles.launchButton}
          disabled={isAutonomous || !topic.trim()}
        >
          {isAutonomous ? 'Running...' : '✨ Auto'}
        </button>
      </div>

      {/* Topic Suggestions */}
      <div className={styles.suggestions}>
        <p>✦ START WITH AN IDEA</p>
        {isLoadingTopics ? (
          <div className={styles.loader}>Loading suggestions...</div>
        ) : (
          <div className={styles.topicGrid}>
            {/* Render the SHUFFLED list */}
            {shuffledTopics.map((suggestion, index) => (
              <button
                key={index}
                className={styles.topicChip}
                onClick={() => setTopic(suggestion)}
                disabled={isAutonomous}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
