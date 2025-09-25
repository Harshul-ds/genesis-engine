// src/components/app/PersonaSelector.tsx
"use client";

import { useState } from 'react';

interface PersonaSelectorProps {
  appData: any;
  onConfirm: (personas: string[]) => void;
  disabled?: boolean;
}

export function PersonaSelector({ appData, onConfirm, disabled = false }: PersonaSelectorProps) {
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);

  const handlePersonaChange = (personaTerm: string) => {
    if (disabled) return;
    setSelectedPersonas(prev =>
      prev.includes(personaTerm) ? prev.filter(p => p !== personaTerm) : [...prev, personaTerm]
    );
  };

  const handleConfirm = () => {
    onConfirm(selectedPersonas);
  };

  return (
    <div className="persona-selector-section">
      <h3>Step 2: Select Personas (Optional)</h3>
      <p>
        Choose which AI personas you'd like to use for prompt generation. If none are selected, the agent will use all available personas for maximum diversity.
      </p>
      <div className="persona-grid">
        {appData.personas?.map(persona => (
          <label key={persona.id} className="persona-checkbox">
            <input
              type="checkbox"
              checked={selectedPersonas.includes(persona.term)}
              onChange={() => handlePersonaChange(persona.term)}
              disabled={disabled}
            />
            <span className="persona-label">{persona.term}</span>
          </label>
        ))}
      </div>
      <button
        onClick={handleConfirm}
        disabled={disabled}
      >
        Next: Describe Your Goal
      </button>
    </div>
  );
}
