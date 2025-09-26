// src/components/app/GenesisCommandCenter.tsx
'use client';

import React, { useState } from 'react';
import { useReActAgent } from '../../hooks/useReActAgent';
import { AppData } from '../../lib/clientTools';
import styles from './GenesisCommandCenter.module.css';

interface GenesisCommandCenterProps {
  appData: AppData;
}

type Step = 'topic' | 'personas' | 'goals' | 'model' | 'generating' | 'results';

export const GenesisCommandCenter: React.FC<GenesisCommandCenterProps> = ({ appData }) => {
  const [currentStep, setCurrentStep] = useState<Step>('topic');
  const [topic, setTopic] = useState('');
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);
  const [isAutonomousPersonas, setIsAutonomousPersonas] = useState(true);
  const [manualPersonaInput, setManualPersonaInput] = useState('');
  const [goal, setGoal] = useState('');
  const [selectedModel, setSelectedModel] = useState('accounts/fireworks/models/llama-v3-70b-instruct');
  const [suggestedGoals, setSuggestedGoals] = useState<string[]>([]);
  const [isLoadingGoals, setIsLoadingGoals] = useState(false);

  const { run, refine, history, isThinking, finalPrompts, agentError, liveAssembly } = useReActAgent(appData);

  const handleTopicSubmit = async () => {
    if (!topic.trim()) return;

    console.log('Topic submitted:', topic); // Debug log
    setIsLoadingGoals(true);
    try {
      // Get goal suggestions based on topic
      const suggestions = await getGoalSuggestions(topic);
      console.log('Goal suggestions received:', suggestions); // Debug log
      setSuggestedGoals(suggestions);
    } catch (error) {
      console.error('Failed to get goal suggestions:', error);
    } finally {
      setIsLoadingGoals(false);
    }

    setCurrentStep('personas');
  };

  const handlePersonasSubmit = () => {
    if (isAutonomousPersonas) {
      // Use autonomous selection (empty array means let AI choose)
      setSelectedPersonas([]);
    } else if (manualPersonaInput.trim()) {
      // Use manually entered personas
      const manualPersonas = manualPersonaInput.split(',').map(p => p.trim()).filter(Boolean);
      setSelectedPersonas(manualPersonas);
    } else if (selectedPersonas.length === 0) {
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
    // Ensure topic is not undefined or empty
    const safeTopic = topic || 'your topic';
    return [
      `Create a comprehensive business plan for ${safeTopic}`,
      `Write a detailed technical guide about ${safeTopic}`,
      `Develop marketing content and strategy for ${safeTopic}`,
      `Design an educational course on ${safeTopic}`,
      `Build a product roadmap for ${safeTopic} solutions`
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
      <div className={styles.topicContainer}>
        <h3 className={styles.topicTitle}>What's your topic?</h3>
        <p className={styles.topicSubtitle}>Enter a topic you'd like to create prompts about</p>
        <form onSubmit={(e) => { e.preventDefault(); handleTopicSubmit(); }} className={styles.topicForm}>
          <input
            type="text"
            className={styles.topicInput}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., sustainable fashion startup, AI ethics, renewable energy..."
            onKeyPress={(e) => e.key === 'Enter' && handleTopicSubmit()}
          />
          <button
            type="submit"
            className={styles.topicSubmitButton}
            disabled={!topic.trim()}
          >
            Next: Choose Personas
          </button>
        </form>
      </div>
    </div>
  );

  const renderPersonasStep = () => (
    <div className="step-content">
      <div className={styles.personaContainer}>
        <h2 className={styles.personaTitle}>Choose your personas</h2>
        <label className={styles.personaSubtitle}>Select the perspectives you want to generate prompts for</label>
        
        {/* Autonomous vs Manual Toggle */}
        <label className={styles.personaToggleLabel}>
          <input
            type="checkbox"
            className={styles.personaCheckbox}
            checked={isAutonomousPersonas}
            onChange={() => setIsAutonomousPersonas(!isAutonomousPersonas)}
          />
          <span className={styles.personaToggleText}>🤖 Autonomous Persona Selection</span>
        </label>

        {!isAutonomousPersonas && (
          <div className={styles.manualInputContainer}>
            <label className={styles.manualInputLabel}>
              Enter your own personas, separated by commas:
            </label>
            <input
              type="text"
              className={styles.manualInput}
              value={manualPersonaInput}
              onChange={(e) => setManualPersonaInput(e.target.value)}
              placeholder="e.g., Marketing Expert, CEO, Software Engineer"
            />
          </div>
        )}

        {!isAutonomousPersonas && (
          <div className={styles.personaGrid}>
            {appData.personas.map((persona) => (
              <div
                key={persona.term}
                className={styles.personaItem}
                onClick={() => {
                  setSelectedPersonas(prev =>
                    prev.includes(persona.term)
                      ? prev.filter(p => p !== persona.term)
                      : [...prev, persona.term]
                  );
                }}
              >
                <label className={styles.personaItemLabel}>
                  <input
                    type="checkbox"
                    className={styles.personaItemCheckbox}
                    checked={selectedPersonas.includes(persona.term)}
                    onChange={() => {}}
                  />
                  <div className={styles.personaItemContent}>
                    <strong>{persona.term}</strong>
                    <p>{persona.description}</p>
                  </div>
                </label>
              </div>
            ))}
          </div>
        )}
        
        <button
          className={styles.topicSubmitButton}
          onClick={handlePersonasSubmit}
        >
          Next: Set Your Goals
        </button>
      </div>
    </div>
  );

  const renderGoalsStep = () => (
    <div className="step-content">
      <div className={styles.goalContainer}>
        <h2 className={styles.goalTitle}>What are your goals?</h2>
        <label className={styles.goalSubtitle}>Describe what you want to achieve with these prompts</label>

        {isLoadingGoals ? (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
          </div>
        ) : (
          <>
            {suggestedGoals.length > 0 && (
              <div className={styles.goalSuggestions}>
                <h4 className={styles.goalSuggestionsTitle}>💡 AI-Generated Goal Suggestions</h4>
                {suggestedGoals.map((suggestion, index) => (
                  <div
                    key={index}
                    className={styles.goalSuggestion}
                    onClick={() => handleGoalSuggestion(suggestion)}
                  >
                    ✨ {suggestion}
                  </div>
                ))}
              </div>
            )}

            <textarea
              className={styles.goalTextarea}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g., Create a comprehensive business plan, develop marketing content, design educational materials..."
              rows={4}
            />
            <button
              className={styles.topicSubmitButton}
              onClick={handleGoalSubmit}
              disabled={!goal.trim()}
            >
              Next: Choose Model
            </button>
          </>
        )}
      </div>
    </div>
  );

  const renderModelStep = () => {
    // Model credit information
    const modelCredits: { [key: string]: { credits: number; description: string; badge: string } } = {
      'accounts/fireworks/models/llama-v3-70b-instruct': { 
        credits: 2.5, 
        description: 'Best for complex reasoning and detailed analysis',
        badge: 'Recommended'
      },
      'accounts/fireworks/models/llama-v3-8b-instruct': { 
        credits: 0.8, 
        description: 'Quick responses for simple tasks and iterations',
        badge: 'Fast'
      },
      'accounts/fireworks/models/mixtral-8x7b-instruct': { 
        credits: 1.2, 
        description: 'Good balance of quality and speed',
        badge: 'Balanced'
      }
    };

    return (
      <div className="step-content">
        <div className={styles.modelContainer}>
          <h2 className={styles.modelTitle}>Choose your AI model</h2>
          <label className={styles.modelSubtitle}>Select the model for prompt generation</label>
          
          <div className={styles.modelSelector}>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: 'white', 
                fontSize: '1.1rem',
                width: '100%',
                outline: 'none'
              }}
            >
              {Object.entries(modelCredits).map(([modelId, info]) => (
                <option key={modelId} value={modelId} style={{ background: '#2c3e50', color: 'white' }}>
                  {modelId.includes('llama-v3-70b') ? 'Llama 3 70B' : 
                   modelId.includes('llama-v3-8b') ? 'Llama 3 8B' : 
                   'Mixtral 8x7B'} ({info.badge}) - {info.credits} credits
                </option>
              ))}
            </select>
          </div>
          
          {/* Model Info Display */}
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.1)', 
            padding: '1rem', 
            borderRadius: '12px', 
            marginBottom: '1.5rem',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <strong style={{ color: 'white' }}>
                {selectedModel.includes('llama-v3-70b') ? 'Llama 3 70B' : 
                 selectedModel.includes('llama-v3-8b') ? 'Llama 3 8B' : 
                 'Mixtral 8x7B'}
              </strong>
              <span style={{ 
                padding: '4px 8px', 
                background: 'rgba(26, 182, 119, 0.2)', 
                color: '#1ab677', 
                borderRadius: '12px', 
                fontSize: '0.8rem',
                fontWeight: '600'
              }}>
                {modelCredits[selectedModel]?.credits} credits
              </span>
            </div>
            <p style={{ color: 'rgba(255, 255, 255, 0.8)', margin: 0, fontSize: '0.9rem' }}>
              {modelCredits[selectedModel]?.description}
            </p>
          </div>
          
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
      <div className={styles.genesisCard}>
        <h1 className={styles.header}>Genesis Command Center</h1>
        
        {/* We keep your original stepper logic */}
        <div className={styles.stepper}>
          {renderStepIndicator()}
        </div>

        {/* This div will now handle the scrolling */}
        <div className={styles.stepContent}>
          {renderCurrentStep()}
        </div>
      </div>
    </div>
  );
};
