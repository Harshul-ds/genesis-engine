// src/components/app/wizard-steps/ModelStep.tsx
'use client';

import React from 'react';
import { useAgentStore } from '../lib/agent-store';
import styles from '../GenesisCommandCenter.module.css';

export const ModelStep = () => {
  const {
    models,
    selectedModel,
    setSelectedModel,
    handleModelSubmit
  } = useAgentStore(state => ({
    models: state.models,
    selectedModel: state.selectedModel,
    setSelectedModel: state.setSelectedModel,
    handleModelSubmit: state.handleModelSubmit,
  }));

  return (
    <div className={styles.modelContainer}>
      <h2 className={styles.modelTitle}>Select Your AI Engine</h2>
      <p className={styles.personaSubtitle}>Choose the most powerful AI model for your generation task.</p>

      <select
        className={styles.modelSelector}
        value={selectedModel}
        onChange={(e) => setSelectedModel(e.target.value)}
      >
        <option value="">Select a model...</option>
        {models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.id}
          </option>
        ))}
      </select>

      <button
        className={styles.generateButton}
        onClick={handleModelSubmit}
        disabled={!selectedModel}
      >
        Begin AI Generation
      </button>
    </div>
  );
};
