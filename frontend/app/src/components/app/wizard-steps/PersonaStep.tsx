import React from 'react';
import { useAgentStore } from '../../../lib/agent-store';
import styles from './PersonaStep.module.css'; // We will create new styles for this

export const PersonaStep: React.FC = () => {
  const { 
    topic,
    goal,
    suggestedPersonas,
    selectedPersonas,
    togglePersonaSelection,
    handlePersonasSubmit,
    isLoadingPersonas
  } = useAgentStore();

  return (
    <div className={styles.container}>
      <h2>Assemble Your Team</h2>
      <p>Select the personas to help you achieve your goal.</p>
      
      {/* Context Display: Show the user's journey so far */}
      <div className={styles.contextDisplay}>
        <p><strong>Topic:</strong> {topic}</p>
        <p><strong>Goal:</strong> {goal}</p>
      </div>

      {isLoadingPersonas ? (
        <div className={styles.loader}>Assembling your dream team...</div>
      ) : (
        // A grid of interactive, selectable persona cards
        <div className={styles.personaGrid}>
          {suggestedPersonas.map((persona) => {
            const isSelected = selectedPersonas.includes(persona.term);
            
            return (
              <div
                key={persona.term}
                className={`${styles.personaCard} ${isSelected ? styles.selected : ''}` }
                onClick={() => togglePersonaSelection(persona.term)}
              >
                <h3>{persona.term}</h3>
                <p>{persona.description}</p>
              </div>
            );
          })}
        </div>
      )}

      <button 
        className={styles.nextButton}
        onClick={handlePersonasSubmit} 
        disabled={selectedPersonas.length === 0}
      >
        Next: Select Model
      </button>
    </div>
  );
};
