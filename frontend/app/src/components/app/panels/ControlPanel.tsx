// src/components/app/panels/ControlPanel.tsx
import React, { useState, useEffect } from 'react';
import { useAgent } from '../../../context/AgentContext';
import { TopicInput } from '../TopicInput';
import { GoalInput } from '../GoalInput';
import { PersonaSelector } from '../PersonaSelector';
import { ModelSelector } from '../ModelSelector';

type ConversationStage = 'awaiting_topic' | 'awaiting_persona' | 'awaiting_goal_description' | 'awaiting_model' | 'generating' | 'results';

export const ControlPanel = () => {
  const { run, isThinking, finalPrompts, appData } = useAgent();
  
  // This component now manages its own conversational flow state
  const [stage, setStage] = useState<ConversationStage>('awaiting_topic');
  const [topic, setTopic] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');

  useEffect(() => {
    if (!isThinking && finalPrompts.length > 0) {
      setStage('results');
    }
  }, [isThinking, finalPrompts]);

  const handleStart = (submittedTopic: string) => {
    setTopic(submittedTopic);
    setStage('awaiting_persona');
  };

  const handlePersonas = (submittedPersonas: string[]) => {
    setSelectedPersonas(submittedPersonas);
    setStage('awaiting_goal_description');
  };

  const handleGoal = (submittedGoalDescription: string) => {
    setGoalDescription(submittedGoalDescription);
    setStage('awaiting_model');
  };

  const handleModel = (submittedModel: string) => {
    setSelectedModel(submittedModel);
    setStage('generating');
    run(topic, goalDescription, selectedPersonas, submittedModel);
  };

  const resetToNewSession = () => {
    setStage('awaiting_topic');
    setTopic('');
    setGoalDescription('');
    setSelectedPersonas([]);
    setSelectedModel('');
  };

  return (
    <div className="control-deck">
      <h1>Genesis Command Center</h1>

      {/* Step Indicator */}
      <div className="step-indicator">
        <div className={`step-dot ${stage === 'awaiting_topic' ? 'active' : 'completed'}`}></div>
        <div className={`step-dot ${stage === 'awaiting_persona' ? 'active' : (['awaiting_goal_description', 'awaiting_model', 'generating', 'results'].includes(stage) ? 'completed' : '')}`}></div>
        <div className={`step-dot ${stage === 'awaiting_goal_description' ? 'active' : (['awaiting_model', 'generating', 'results'].includes(stage) ? 'completed' : '')}`}></div>
        <div className={`step-dot ${stage === 'awaiting_model' ? 'active' : (['generating', 'results'].includes(stage) ? 'completed' : '')}`}></div>
      </div>

      {/* Show inputs when the agent is idle */}
      {(stage === 'awaiting_topic' || stage === 'awaiting_persona' || stage === 'awaiting_goal_description' || stage === 'awaiting_model') && (
        <>
          {stage === 'awaiting_topic' && <TopicInput onSubmit={handleStart} disabled={isThinking} />}
          {stage === 'awaiting_persona' && (
            <PersonaSelector
              appData={appData}
              onConfirm={handlePersonas}
              disabled={isThinking}
            />
          )}
          {stage === 'awaiting_goal_description' && <GoalInput onSubmit={handleGoal} disabled={isThinking} topic={topic} />}
          {stage === 'awaiting_model' && (
            <ModelSelector
              onConfirm={handleModel}
              disabled={isThinking}
            />
          )}
        </>
      )}

      {/* Show a summary after the agent has run */}
      {(stage === 'generating' || stage === 'results') && (
        <div>
          <h3>Run Configuration</h3>
          <p><strong>Topic:</strong> {topic}</p>
          <p><strong>Personas:</strong> {selectedPersonas.length > 0 ? selectedPersonas.join(', ') : 'All (Autonomous)'}</p>
          <p><strong>Goal Description:</strong> {goalDescription}</p>
          <p><strong>Model:</strong> {selectedModel}</p>
          <button
            onClick={resetToNewSession}
            disabled={isThinking}
          >
            Start New Session
          </button>
        </div>
      )}
    </div>
  );
};
