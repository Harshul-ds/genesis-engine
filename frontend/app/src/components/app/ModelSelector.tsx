// src/components/app/ModelSelector.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

interface ModelSelectorProps {
  onConfirm: (model: string) => void;
  disabled?: boolean;
}

export function ModelSelector({ onConfirm, disabled = false }: ModelSelectorProps) {
  const [selectedModel, setSelectedModel] = useState('');

  const { data: models, isLoading, isError } = useQuery({
    queryKey: ['availableFireworksModels'],
    queryFn: async () => {
      const response = await fetch('/api/list-models');
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
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
    <div className="model-loading">
      <div className="spinner"></div>
      <p>Fetching model catalog from Fireworks AI...</p>
    </div>
  );
  if (isError) return (
    <div className="model-error">
      <p>❌ Error: Could not fetch models. Please check your connection.</p>
    </div>
  );

  // Group models by the category we created in our API
  const groupedModels = models?.reduce((acc, model) => {
    (acc[model.category] = acc[model.category] || []).push(model);
    return acc;
  }, {}) || {};

  return (
    <div className="model-selector-section">
      <h3>Step 4: Select an AI Model</h3>
      <p>
        Choose the AI model that will power your prompt generation. Different models have different strengths and capabilities.
      </p>
      <select
        value={selectedModel}
        onChange={(e) => handleModelChange(e.target.value)}
        disabled={disabled}
      >
        <option value="" disabled>-- Please choose a model --</option>
        {Object.entries(groupedModels).map(([category, modelsInCategory]) => (
          <optgroup key={category} label={`--- ${category} ---`}>
            {(modelsInCategory as any[]).map(model => (
              <option key={model.id} value={model.id}>{model.name}</option>
            ))}
          </optgroup>
        ))}
      </select>
      <button
        onClick={handleConfirm}
        disabled={!selectedModel || disabled}
      >
        🚀 Generate Prompts
      </button>
    </div>
  );
}
