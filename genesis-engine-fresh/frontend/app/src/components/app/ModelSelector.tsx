// src/components/app/ModelSelector.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import styles from './ModelSelector.module.css';

interface Model {
  id: string;
  name: string;
  category: string;
  // Add a property for credit usage to your model data
  credits: number;
}

interface ModelSelectorProps {
  onConfirm: (model: string) => void;
  disabled?: boolean;
}

// Mock credit data for demonstration. You should fetch this from your API.
const modelCredits: { [key: string]: number } = {
  'accounts/fireworks/models/llama-v3-70b-instruct': 2.5,
  'accounts/fireworks/models/llama-v3-8b-instruct': 0.8,
  'accounts/fireworks/models/mixtral-8x7b-instruct': 1.2,
};

export function ModelSelector({ onConfirm, disabled = false }: ModelSelectorProps) {
  const [selectedModel, setSelectedModel] = useState('');

  const { data: models, isLoading, isError } = useQuery<Model[]>({
    queryKey: ['availableFireworksModels'],
    queryFn: async () => {
      const response = await fetch('/api/list-models');
      if (!response.ok) throw new Error('Network response was not ok');
      const modelsData = await response.json();
      // Attach credit information to each model
      return modelsData.map((model: any) => ({
        ...model,
        credits: modelCredits[model.id] || 0, // Fallback to 0 if not found
      }));
    }
  });

  const handleModelChange = (modelId: string) => {
    if (disabled) return;
    setSelectedModel(modelId);
  };

  const handleConfirm = () => {
    if (selectedModel && !disabled) {
      onConfirm(selectedModel);
    }
  };

  if (isLoading) return (
    <div className={styles.container}>
      <div className="model-loading">
        <div className="spinner"></div>
        <p>Fetching model catalog from Fireworks AI...</p>
      </div>
    </div>
  );
  
  if (isError) return (
    <div className={styles.container}>
      <div className="model-error">
        <p>❌ Error: Could not fetch models. Please check your connection.</p>
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Step 4: Select an AI Model</h3>
      <p className={styles.subtitle}>
        Choose the AI model to power your prompt generation.
      </p>

      <div className={styles.modelOptionsContainer}>
        {models?.map((model) => (
          <div
            key={model.id}
            onClick={() => !disabled && handleModelChange(model.id)}
            className={`${styles.modelOption} ${
              selectedModel === model.id ? styles.modelOptionSelected : ''
            }`}
          >
            <div className={styles.modelHeader}>
              <span className={styles.modelName}>{model.name}</span>
              <span className={styles.modelCredits}>
                {model.credits} credits
              </span>
            </div>
            <p className={styles.modelDescription}>Category: {model.category}</p>
          </div>
        ))}
      </div>

      <button
        onClick={handleConfirm}
        disabled={!selectedModel || disabled}
        className={styles.generateButton}
      >
        <span role="img" aria-label="rocket">🚀</span>
        Generate Prompts
      </button>
    </div>
  );
}
