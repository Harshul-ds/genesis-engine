import React from 'react';
import { useAgentStore } from '../../../lib/agent-store';
import styles from './ModelStep.module.css'; // We will create new styles for this

export const ModelStep: React.FC = () => {
  const { 
    topic,
    goal,
    selectedPersonas,
    models,
    selectedModel,
    setSelectedModel,
    handleModelSubmit
  } = useAgentStore();

  return (
    <div className={styles.container}>
      <h2>Select Your Engine</h2>
      <p>Choose the AI model to power the generation.</p>

      {/* A summary of the user's journey so far */}
      <div className={styles.summaryCard}>
        <div className={styles.summaryItem}>
          <span>Topic</span>
          <p>{topic}</p>
        </div>
        <div className={styles.summaryItem}>
          <span>Goal</span>
          <p>{goal}</p>
        </div>
        <div className={styles.summaryItem}>
          <span>Personas</span>
          <p>{selectedPersonas.join(', ')}</p>
        </div>
      </div>

      {/* Model selection and the final action button */}
      <div className={styles.modelSelection}>
        <label htmlFor="model-select">Model</label>
        <select
          id="model-select"
          className={styles.modelSelect}
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
        >
          {models.map(model => (
            <option key={model.id} value={model.id}>
              {model.id.split('/').pop()}
            </option>
          ))}
        </select>

        <button 
          className={styles.generateButton}
          onClick={handleModelSubmit} 
        >
          🚀 Generate Prompts
        </button>
      </div>
    </div>
  );
};
