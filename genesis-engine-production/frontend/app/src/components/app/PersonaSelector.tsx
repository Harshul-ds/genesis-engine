// src/components/app/PersonaSelector.tsx
"use client";

import { useState } from 'react';
import styles from './PersonaSelector.module.css';

interface PersonaSelectorProps {
  appData: any;
  onConfirm: (personas: string[]) => void;
  disabled?: boolean;
}

export function PersonaSelector({ appData, onConfirm, disabled = false }: PersonaSelectorProps) {
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);
  const [isAutonomous, setIsAutonomous] = useState(true);
  const [manualPersonaInput, setManualPersonaInput] = useState('');

  const handlePersonaChange = (personaTerm: string) => {
    if (disabled) return;
    setSelectedPersonas(prev =>
      prev.includes(personaTerm) ? prev.filter(p => p !== personaTerm) : [...prev, personaTerm]
    );
  };

  const handleConfirm = () => {
    if (isAutonomous) {
      onConfirm([]); // Send an empty array to signify autonomous selection
    } else if (manualPersonaInput.trim()) {
      // Split by comma and trim whitespace for manually entered personas
      const manualPersonas = manualPersonaInput.split(',').map(p => p.trim()).filter(Boolean);
      onConfirm(manualPersonas);
    } else {
      onConfirm(selectedPersonas);
    }
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Step 2: Select Personas (Optional)</h3>
      <p className={styles.subtitle}>
        Choose which AI personas you'd like to use for prompt generation.
      </p>

      <div className={styles.toggleLabel}>
        <input
          type="checkbox"
          className={styles.checkbox}
          checked={isAutonomous}
          onChange={() => setIsAutonomous(!isAutonomous)}
        />
        <span className={styles.toggleText}>🤖 Autonomous Persona Selection</span>
      </div>

      {!isAutonomous && (
        <div className={styles.manualInputContainer}>
          <p className={styles.subtitle}>Enter your own personas, separated by commas.</p>
          <input
            type="text"
            className={styles.manualInput}
            value={manualPersonaInput}
            onChange={(e) => setManualPersonaInput(e.target.value)}
            placeholder="e.g., Marketing Expert, CEO, Software Engineer"
            disabled={disabled}
          />
        </div>
      )}

      {!isAutonomous && (
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
      )}

      <button
        onClick={handleConfirm}
        disabled={disabled}
        className={styles.nextButton}
      >
        Next: Describe Your Goal
      </button>
    </div>
  );
}
