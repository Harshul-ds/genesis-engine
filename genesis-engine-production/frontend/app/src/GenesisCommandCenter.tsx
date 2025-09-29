// src/components/app/GenesisCommandCenter.tsx
'use client';

import React, { useEffect } from 'react';
import { useAgentStore } from './lib/agent-store';
import { AppData, Step } from './lib/types';
import styles from './GenesisCommandCenter.module.css';

// Import the first step component. We'll add the others in later phases.
import { TopicStep } from './wizard-steps/TopicStep';
// --- NEW IMPORT FOR PHASE 2 ---
import { GoalStep } from './wizard-steps/GoalStep';
// --- NEW IMPORT FOR PHASE 3 ---
import { PersonaStep } from './wizard-steps/PersonaStep';
// --- NEW IMPORT FOR PHASE 4 ---
import { ModelStep } from './wizard-steps/ModelStep';
// --- NEW IMPORTS FOR PHASE 5 ---
import { GeneratingStep } from './wizard-steps/GeneratingStep';
import { ResultsStep } from './wizard-steps/ResultsStep';

interface GenesisCommandCenterProps {
  appData: AppData;
}

// A simple component for the loading state
const LoadingView = () => (
  <div className={styles.loadingContainer}>Loading Genesis Engine...</div>
);

// A simple component for the error state
const ErrorView = ({ error }: { error: string }) => (
  <div className={styles.errorContainer}>
    <h4>An Error Occurred</h4>
    <p>{error}</p>
  </div>
);

export const GenesisCommandCenter: React.FC<GenesisCommandCenterProps> = ({ appData }) => {
  // Get the state and actions needed for the main container
  const { currentStep, initializeApp, isAppLoading, agentError } = useAgentStore(state => ({
    currentStep: state.currentStep,
    initializeApp: state.initializeApp,
    isAppLoading: state.isAppLoading,
    agentError: state.agentError,
  }));

  // Initialize the app on component mount. This runs only once.
  useEffect(() => {
    initializeApp(appData);
  }, [initializeApp, appData]);

  const renderStepIndicator = () => {
    const steps: Step[] = ['topic', 'goals', 'personas', 'model'];
    const currentIndex = steps.indexOf(currentStep);

    return (
      <div className={styles.stepper}>
        {steps.map((stepName, index) => (
          <div
            key={stepName}
            className={`${styles.stepDot} ${index <= currentIndex ? styles.completed : ''} ${index === currentIndex ? styles.active : ''}` }
          />
        ))}
      </div>
    );
  };

  const renderCurrentStep = () => {
    // This switch statement is our "view controller".
    // It determines which UI component to show based on the currentStep from the store.
    switch (currentStep) {
      case 'topic':
        return <TopicStep />;
      case 'goals':
        return <GoalStep />;
      // --- UPDATED CASE FOR PHASE 3 ---
      case 'personas':
        return <PersonaStep />;
      // --- UPDATED CASE FOR PHASE 4 ---
      case 'model':
        return <ModelStep />;
      // --- FINAL IMPLEMENTATION FOR PHASE 5 ---
      case 'generating':
        return <GeneratingStep />;
      case 'results':
        return <ResultsStep />;
      default:
        return <TopicStep />;
    }
  };

  return (
    <div className={styles.commandCenterContainer}>
      <div className={styles.genesisCard}>
        <h1 className={styles.header}>Genesis Command Center</h1>

        {!isAppLoading && !agentError && renderStepIndicator()}

        <div className={styles.stepContent}>
          {isAppLoading ? <LoadingView /> : agentError ? <ErrorView error={agentError} /> : renderCurrentStep()}
        </div>
      </div>
    </div>
  );
};
