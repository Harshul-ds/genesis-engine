import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import { useAgentStore, FinalPromptCard } from '../../../lib/agent-store';
import styles from './ResultsStep.module.css';

// ✨ NEW: A self-contained component for each Persona's card
const PromptCard: React.FC<{ card: FinalPromptCard }> = ({ card }) => {
  const { generateSinglePrompt, executePrompt } = useAgentStore();
  const [copyStatus, setCopyStatus] = useState('');

  // When this card first appears, it automatically triggers its own prompt generation
  useEffect(() => {
    if (card.isGeneratingPrompt) {
      generateSinglePrompt(card.personaTerm);
    }
  }, [generateSinglePrompt, card.personaTerm, card.isGeneratingPrompt]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(card.prompt);
    setCopyStatus('Copied!');
    setTimeout(() => setCopyStatus(''), 2000);
  };

  return (
    <div className={styles.promptCard}>
      <div className={styles.cardHeader}>
        <h4>{card.personaTerm}</h4>
        <div className={styles.cardActions}>
          <button 
            onClick={handleCopy} 
            disabled={card.isGeneratingPrompt}
          >
            {copyStatus || 'Copy'}
          </button>
          <button 
            onClick={() => executePrompt(card.prompt, card.personaTerm)}
            disabled={card.isGeneratingPrompt || card.isGeneratingOutput}
          >
            Execute
          </button>
        </div>
      </div>

      <div className={styles.promptContent}>
        {card.isGeneratingPrompt && <span className={styles.loader}>Generating prompt...</span>}
        <ReactMarkdown>{card.prompt || ' '}</ReactMarkdown>
      </div>

      {(card.isGeneratingOutput || card.output) && (
        <div className={styles.outputSection}>
          <h5>Output</h5>
          <div className={styles.outputContent}>
            {card.isGeneratingOutput && <span className={styles.loader}>Executing...</span>}
            <ReactMarkdown>{card.output || ' '}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

// The main results step is now just a container for the cards
export const ResultsStep: React.FC = () => {
  const { finalPrompts, reset } = useAgentStore();

  const resultsContent = (
    <div className={styles.fullScreenOverlay}>
      <div className={styles.resultsPanel}>
        <div className={styles.mainHeader}>
          <h2>Agent Output</h2>
          <button onClick={reset} className={styles.startButton}>
            Start New Session
          </button>
        </div>
        <div className={styles.cardGrid}>
          {finalPrompts.map(card => (
            <PromptCard key={card.personaTerm} card={card} />
          ))}
        </div>
      </div>
    </div>
  );

  return createPortal(resultsContent, document.body);
};
