// src/components/app/wizard-steps/PersonaStep.tsx
'use client';

import React from 'react';
import { useAgentStore } from '../../../lib/agent-store';
import styles from '../GenesisCommandCenter.module.css';

export const PersonaStep = () => {
  // Select all the state and actions this component needs from the store.
  const {
    topic,
    goal,
    suggestedPersonas,
    selectedPersonas,
    isLoadingPersonas,
    togglePersonaSelection,
    handlePersonasSubmit
  } = useAgentStore(state => ({
    topic: state.topic,
    goal: state.goal,
    suggestedPersonas: state.suggestedPersonas,
    selectedPersonas: state.selectedPersonas,
    isLoadingPersonas: state.isLoadingPersonas,
    togglePersonaSelection: state.togglePersonaSelection,
    handlePersonasSubmit: state.handlePersonasSubmit,
  }));

  const renderContent = () => {
    if (isLoadingPersonas) {
      return (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner}></div>
          <p style={{ marginTop: '1rem', color: 'rgba(255, 255, 255, 0.8)' }}>
            Suggesting personas for your goal...
          </p>
        </div>
      );
    }

    return (
      <>
        <div className={styles.personaGrid}>
          {suggestedPersonas.map((persona) => (
            <div
              key={persona.term}
              className={`${styles.personaItem} ${selectedPersonas.includes(persona.term) ? styles.active : ''}`}
              onClick={() => togglePersonaSelection(persona.term)}
            >
              <strong>{persona.term}</strong>
              <p>{persona.description}</p>
            </div>
          ))}
        </div>

        <button
          className={styles.topicSubmitButton}
          onClick={handlePersonasSubmit}
          disabled={selectedPersonas.length === 0}
        >
          Next: Select Model
        </button>
      </>
    );
  };

  return (
    <div className={styles.personaContainer}>
      <h2 className={styles.personaTitle}>Assemble Your Team</h2>
      <label className={styles.personaSubtitle}>Select the personas to help you achieve your goal.</label>

      <div className={styles.contextSummary}>
        <p><strong>Topic:</strong> {topic}</p>
        <p><strong>Goal:</strong> {goal}</p>
      </div>

      {renderContent()}
    </div>
  );
};
