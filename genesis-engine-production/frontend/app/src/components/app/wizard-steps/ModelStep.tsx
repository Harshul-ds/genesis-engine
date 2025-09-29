// src/components/app/wizard-steps/ModelStep.tsx
'use client';

import React from 'react';
import { useAgentStore } from '../../../lib/agent-store';
import styles from '../GenesisCommandCenter.module.css';

export const ModelStep = () => {
  // Select all the state and actions this component needs from the store.
  const {
    topic,
    goal,
    selectedPersonas,
    models,
    selectedModel,
    setSelectedModel,
    handleModelSubmit,
    isGenerating,
  } = useAgentStore(state => ({
    topic: state.topic,
    goal: state.goal,
    selectedPersonas: state.selectedPersonas,
    models: state.models,
    selectedModel: state.selectedModel,
    setSelectedModel: state.setSelectedModel,
    handleModelSubmit: state.handleModelSubmit,
    isGenerating: state.isGenerating,
  }));

  // A simple function to create a more user-friendly name from the model ID
  const formatModelName = (modelId: string) => {
    const parts = modelId.split('/');
    return parts.pop()?.replace(/-/g, ' ') || modelId;
  };

  return (
    <div className={styles.modelContainer}>
      <h2 className={styles.modelTitle}>Select Your Engine</h2>
      <label className={styles.modelSubtitle}>Choose the AI model to power the generation.</label>

      <div className={styles.contextSummary}>
        <p><strong>Topic:</strong> {topic}</p>
        <p><strong>Goal:</strong> {goal}</p>
        <p><strong>Personas:</strong> {selectedPersonas.join(', ')}</p>
      </div>

      {models.length > 0 ? (
        <div className={styles.modelSelector}>
          <select
            className={styles.modelSelectInput}
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={isGenerating}
          >
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {formatModelName(model.name)}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className={styles.loadingOverlay}>Loading available models...</div>
      )}

      <button
        className={styles.generateButton}
        onClick={handleModelSubmit}
        disabled={!selectedModel || isGenerating}
      >
        {isGenerating ? 'Genesis Engine is Running...' : '🚀 Generate Prompts'}
      </button>
    </div>
  );
};
