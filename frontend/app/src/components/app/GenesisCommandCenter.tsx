// src/components/app/GenesisCommandCenter.tsx
'use client';

import React, { useState } from 'react';
import { useReActAgent } from '../../hooks/useReActAgent';
import { AppData } from '../../lib/clientTools';

interface GenesisCommandCenterProps {
  appData: AppData;
}

type Step = 'topic' | 'personas' | 'goals' | 'model' | 'generating' | 'results';

export const GenesisCommandCenter: React.FC<GenesisCommandCenterProps> = ({ appData }) => {
  const [currentStep, setCurrentStep] = useState<Step>('topic');
  const [topic, setTopic] = useState('');
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);
  const [goal, setGoal] = useState('');
  const [selectedModel, setSelectedModel] = useState('accounts/fireworks/models/llama-v3-70b-instruct');
  const [suggestedGoals, setSuggestedGoals] = useState<string[]>([]);
  const [isLoadingGoals, setIsLoadingGoals] = useState(false);

  const { run, refine, history, isThinking, finalPrompts, agentError, liveAssembly } = useReActAgent(appData);

  const handleTopicSubmit = async () => {
    if (!topic.trim()) return;

    setIsLoadingGoals(true);
    try {
      // Get goal suggestions based on topic
      const suggestions = await getGoalSuggestions(topic);
      setSuggestedGoals(suggestions);
    } catch (error) {
      console.error('Failed to get goal suggestions:', error);
    } finally {
      setIsLoadingGoals(false);
    }

    setCurrentStep('personas');
  };

  const handlePersonasSubmit = () => {
    if (selectedPersonas.length === 0) {
      // Auto-select all personas if none selected
      setSelectedPersonas(appData.personas.map(p => p.term));
    }
    setCurrentStep('goals');
  };

  const handleGoalSubmit = () => {
    if (!goal.trim()) return;
    setCurrentStep('model');
  };

  const handleModelSubmit = () => {
    if (!selectedModel) return;
    setCurrentStep('generating');
    run(topic, goal, selectedPersonas, selectedModel);
  };

  const handleGoalSuggestion = (suggestion: string) => {
    setGoal(suggestion);
  };

  const getGoalSuggestions = async (topic: string): Promise<string[]> => {
    // Import the toolbelt dynamically to avoid circular imports
    const { toolbelt } = await import('../../lib/clientTools');

    try {
      const result = await toolbelt.suggestGoals(appData, topic, []);
      if (Array.isArray(result)) {
        return result;
      } else {
        console.error('Goal suggestion failed:', result);
        return getDefaultGoalSuggestions(topic);
      }
    } catch (error) {
      console.error('Error calling suggestGoals tool:', error);
      return getDefaultGoalSuggestions(topic);
    }
  };

  const getDefaultGoalSuggestions = (topic: string): string[] => {
    return [
      `Create a comprehensive business plan for ${topic}`,
      `Write a detailed technical guide about ${topic}`,
      `Develop marketing content and strategy for ${topic}`,
      `Design an educational course on ${topic}`,
      `Build a product roadmap for ${topic} solutions`
    ];
  };

  const getStepIndex = (step: Step): number => {
    const steps: Step[] = ['topic', 'personas', 'goals', 'model', 'generating', 'results'];
    return steps.indexOf(step);
  };

  const renderStepIndicator = () => {
    const steps = ['Topic', 'Personas', 'Goals', 'Model', 'Generate', 'Results'];
    const currentIndex = getStepIndex(currentStep);

    return (
      <div className="stepper">
        {steps.map((stepName, index) => (
          <div
            key={stepName}
            className={`step-dot ${index <= currentIndex ? 'completed' : ''} ${index === currentIndex ? 'active' : ''}`}
          />
        ))}
      </div>
    );
  };

  const renderTopicStep = () => (
    <div className="step-content">
      <h2>What's your topic?</h2>
      <label className="input-label">Enter a topic you'd like to create prompts about</label>
      <input
        type="text"
        className="topic-input"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="e.g., sustainable fashion startup, AI ethics, renewable energy..."
        onKeyPress={(e) => e.key === 'Enter' && handleTopicSubmit()}
      />
      <button
        className="next-button"
        onClick={handleTopicSubmit}
        disabled={!topic.trim()}
      >
        Next: Choose Personas
      </button>
    </div>
  );

  const renderPersonasStep = () => (
    <div className="step-content">
      <h2>Choose your personas</h2>
      <label className="input-label">Select the perspectives you want to generate prompts for</label>
      <div className="persona-grid">
        {appData.personas.map((persona) => (
          <div
            key={persona.term}
            className="persona-item"
            onClick={() => {
              setSelectedPersonas(prev =>
                prev.includes(persona.term)
                  ? prev.filter(p => p !== persona.term)
                  : [...prev, persona.term]
              );
            }}
          >
            <label>
              <input
                type="checkbox"
                checked={selectedPersonas.includes(persona.term)}
                onChange={() => {}}
              />
              <div>
                <strong>{persona.term}</strong>
                <p>{persona.description}</p>
              </div>
            </label>
          </div>
        ))}
      </div>
      <button
        className="next-button"
        onClick={handlePersonasSubmit}
      >
        Next: Set Your Goals
      </button>
    </div>
  );

  const renderGoalsStep = () => (
    <div className="step-content">
      <h2>What are your goals?</h2>
      <label className="input-label">Describe what you want to achieve with these prompts</label>

      {isLoadingGoals ? (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      ) : (
        <>
          {suggestedGoals.length > 0 && (
            <div className="goal-suggestions">
              <h4>Suggested Goals</h4>
              {suggestedGoals.map((suggestion, index) => (
                <div
                  key={index}
                  className="goal-suggestion"
                  onClick={() => handleGoalSuggestion(suggestion)}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}

          <textarea
            className="goal-textarea"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g., Create a comprehensive business plan, develop marketing content, design educational materials..."
            rows={4}
          />
          <button
            className="next-button"
            onClick={handleGoalSubmit}
            disabled={!goal.trim()}
          >
            Next: Choose Model
          </button>
        </>
      )}
    </div>
  );

  const renderModelStep = () => (
    <div className="step-content">
      <h2>Choose your AI model</h2>
      <label className="input-label">Select the model for prompt generation</label>
      <div className="model-selector">
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
        >
          <option value="accounts/fireworks/models/llama-v3-70b-instruct">Llama 3 70B (Recommended)</option>
          <option value="accounts/fireworks/models/llama-v3-8b-instruct">Llama 3 8B (Faster)</option>
          <option value="accounts/fireworks/models/mixtral-8x7b-instruct">Mixtral 8x7B</option>
        </select>
      </div>
      <button
        className="next-button"
        onClick={handleModelSubmit}
      >
        Generate Prompts
      </button>
    </div>
  );

  const renderGeneratingStep = () => (
    <div className="step-content">
      <h2>Generating your prompts...</h2>
      <div className="loading-overlay">
        <div className="loading-spinner"></div>
        <p style={{ marginTop: '1rem', color: 'rgba(255, 255, 255, 0.8)' }}>
          This may take a moment while we research and craft your prompts
        </p>
      </div>
    </div>
  );

  const renderResultsStep = () => (
    <div className="step-content">
      <h2>Your prompts are ready!</h2>
      <p style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '2rem' }}>
        Generated {finalPrompts.length} high-quality prompts for your topic
      </p>
      <button
        className="next-button"
        onClick={() => {
          setCurrentStep('topic');
          setTopic('');
          setSelectedPersonas([]);
          setGoal('');
          setSuggestedGoals([]);
        }}
      >
        Start New Session
      </button>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'topic': return renderTopicStep();
      case 'personas': return renderPersonasStep();
      case 'goals': return renderGoalsStep();
      case 'model': return renderModelStep();
      case 'generating': return renderGeneratingStep();
      case 'results': return renderResultsStep();
      default: return renderTopicStep();
    }
  };

  return (
    <div className="command-center-container">
      <div className="genesis-card">
        <h1>Genesis Command Center</h1>
        {renderStepIndicator()}
        {renderCurrentStep()}
      </div>
    </div>
  );
};
