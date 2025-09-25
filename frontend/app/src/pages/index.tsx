// src/pages/index.tsx
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getInitialData } from '../lib/supabaseClient';
import { useReActAgent } from '../hooks/useReActAgent'; // <-- Import the agent

type ConversationStage =
  | 'awaiting_topic'
  | 'awaiting_persona'
  | 'awaiting_model'
  | 'generating'
  | 'displaying_results'
  | 'refining';

// Topic Input Component
const TopicInput = ({ onSubmit, disabled }) => {
  const [topic, setTopic] = useState('');
  return (
    <div>
      <h3>Step 1: Enter Your Topic</h3>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(topic); }}>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter a topic (e.g., neuromorphic computing)"
          disabled={disabled}
          style={{ width: '100%', padding: '10px' }}
        />
        <button type="submit" disabled={disabled} style={{ marginTop: '10px' }}>
          Next: Select Personas
        </button>
      </form>
    </div>
  );
};

// Persona Selector Component
const PersonaSelector = ({ appData, onConfirm, disabled }) => {
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);

  const handlePersonaChange = (personaTerm: string) => {
    setSelectedPersonas(prev =>
      prev.includes(personaTerm) ? prev.filter(p => p !== personaTerm) : [...prev, personaTerm]
    );
  };

  return (
    <div>
      <h3>Step 2: Select Personas (Optional)</h3>
      <p>If none selected, the agent will use all available personas.</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
        {appData.personas.map(persona => (
          <label key={persona.id}>
            <input type="checkbox" checked={selectedPersonas.includes(persona.term)} onChange={() => handlePersonaChange(persona.term)} />
            {persona.term}
          </label>
        ))}
      </div>
      <button
        onClick={() => onConfirm(selectedPersonas)}
        disabled={disabled}
        style={{ marginTop: '10px' }}
      >
        Next: Select Model
      </button>
    </div>
  );
};

// Model Selector Component
const ModelSelector = ({ onConfirm, disabled }) => {
  const [selectedModel, setSelectedModel] = useState('');
  const { data: models, isLoading, isError } = useQuery({
    queryKey: ['availableModels'],
    queryFn: async () => {
      const response = await fetch('/api/list-models');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    }
  });

  if (isLoading) return <p>Fetching available models from Groq...</p>;
  if (isError) return <p>Error: Could not fetch models. Please try again.</p>;

  return (
    <div>
      <h3>Step 3: Select an AI Model</h3>
      <select
        value={selectedModel}
        onChange={(e) => setSelectedModel(e.target.value)}
        style={{ width: '100%', padding: '10px' }}
      >
        <option value="" disabled>-- Please choose a model --</option>
        {models.map(model => (
          <option key={model.id} value={model.id}>{model.name}</option>
        ))}
      </select>
      <button
        onClick={() => onConfirm(selectedModel)}
        disabled={!selectedModel || disabled}
        style={{ marginTop: '10px' }}
      >
        Generate Prompts
      </button>
    </div>
  );
};

// Results Display Component
const ResultsDisplay = ({ prompts, onRefine, disabled }) => {
  return (
    <div>
      <h2>Generated Prompts:</h2>
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        {prompts.map((prompt, index) => (
          <li key={index} style={{ background: '#e9f5ff', borderLeft: '3px solid #007bff', padding: '15px', borderRadius: '5px', marginBottom: '10px' }}>
            {prompt}
          </li>
        ))}
      </ul>
      <button
        onClick={() => onRefine(prompts[0])}
        disabled={disabled}
        style={{ marginTop: '10px' }}
      >
        Refine Prompts
      </button>
    </div>
  );
};

// Main application component
function GenesisEngine({ appData }) {
  const [stage, setStage] = useState<ConversationStage>('awaiting_topic');
  const [topic, setTopic] = useState('');
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const { run, history, isThinking, finalPrompts, agentError, setAgentError } = useReActAgent(appData);

  // NEW: Intelligent error handling that resets conversation flow
  useEffect(() => {
    if (agentError) {
      // If the error is a model failure, reset the conversation to the model selection step
      if (agentError.includes("The selected model")) {
        setStage('awaiting_model');
      } else {
        // For other errors, maybe reset all the way to the beginning
        setStage('awaiting_topic');
      }
    }
  }, [agentError]); // Dependency array: this code runs only when agentError changes

  const handleSubmit = (topic: string) => {
    if (!topic.trim()) return;
    setTopic(topic);
    setStage('awaiting_persona');
  };

  const handlePersonaConfirm = (personas: string[]) => {
    setSelectedPersonas(personas);
    setStage('awaiting_model');
  };

  const handleModelConfirm = (model: string) => {
    setSelectedModel(model);
    setStage('generating');
    run(topic, selectedPersonas, model);
  };

  const handleRefine = (promptToRefine: string) => {
    setStage('refining');
    // TODO: Implement refinement logic
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Genesis Engine: Prompt Co-Pilot</h1>

      {/* NEW: Error Display - shows when model fails */}
      {agentError && stage === 'awaiting_model' && (
        <div style={{ color: 'red', border: '1px solid red', padding: '10px', marginBottom: '15px' }}>
          <p><strong>An error occurred:</strong> {agentError}</p>
          <button onClick={() => setAgentError(null)}>Dismiss</button>
        </div>
      )}

      {/* STEP 1: Awaiting Topic */}
      {stage === 'awaiting_topic' && (
        <TopicInput onSubmit={handleSubmit} disabled={isThinking} />
      )}

      {/* STEP 2: Awaiting Persona */}
      {stage === 'awaiting_persona' && (
        <PersonaSelector
          appData={appData}
          onConfirm={handlePersonaConfirm}
          disabled={isThinking}
        />
      )}

      {/* STEP 3: Awaiting Model */}
      {stage === 'awaiting_model' && (
        <ModelSelector
          onConfirm={handleModelConfirm}
          disabled={isThinking}
        />
      )}

      {/* STEP 4: Generating & Refining (NOW WITH LIVE STREAMING) */}
      {(stage === 'generating' || stage === 'refining') && (
        <div>
          <h2>{stage === 'refining' ? 'Refining prompts...' : 'Generating initial prompts...'}</h2>

          {/* Live-updating history of the agent's process */}
          <div style={{
            background: '#f7f7f7',
            border: '1px solid #eee',
            padding: '15px',
            borderRadius: '8px',
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {history.map((message, index) => (
              <div key={index} style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #ddd' }}>
                {/* Style "Thoughts" differently from "Observations" */}
                {message.role === 'assistant' && (
                  <div>
                    <strong>🤖 Thought:</strong>
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{message.content}</p>
                  </div>
                )}
                {message.role === 'system' && (
                  <div>
                    <strong>🔭 Observation:</strong>
                    <pre style={{ margin: 0, background: '#e9e9e9', padding: '10px', borderRadius: '4px', whiteSpace: 'pre-wrap' }}>
                      {message.content}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 5: Displaying Results */}
      {stage === 'displaying_results' && (
        <ResultsDisplay
          prompts={finalPrompts}
          onRefine={handleRefine}
          disabled={isThinking}
        />
      )}
    </div>
  );
}

// Wrapper component to handle data loading
export default function HomePage() {
  const { data: appData, isLoading, isError } = useQuery({
    queryKey: ['initialAppData'],
    queryFn: getInitialData,
    staleTime: Infinity,
  });

  if (isLoading) return <div>Loading Engine...</div>;
  if (isError) return <div>Error loading data.</div>;

  return <GenesisEngine appData={appData} />;
}
