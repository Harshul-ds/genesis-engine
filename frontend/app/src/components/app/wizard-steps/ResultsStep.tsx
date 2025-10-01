import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import { useAgentStore, FinalPromptCard } from '../../../lib/agent-store';
import styles from './ResultsStep.module.css';

// ✨ NEW: AgentLog component for transparency
const AgentLog = () => {
  const { agentLog } = useAgentStore();
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agentLog]);

  return (
    <div className={styles.agentLog}>
      <h4>Agent Log</h4>
      <div className={styles.logContent}>
        {agentLog.map((entry, index) => (
          <p key={index}><span>&gt;</span> {entry}</p>
        ))}
        <div ref={logEndRef} />
      </div>
    </div>
  );
};

// ✨ NEW: Accordion-style Card Component
const PromptCard: React.FC<{ card: FinalPromptCard }> = ({ card }) => {
  const {
    generateSinglePrompt,
    executePrompt,
    models,
    setCardExecutionModel
  } = useAgentStore();

  const [isExpanded, setIsExpanded] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  // When the card is expanded for the first time, generate the prompt.
  // ✨ REMOVED: The store now controls generation through the queue system ✨

  const handleCopy = (text: string | undefined) => {
    if (text) navigator.clipboard.writeText(text);
  };

  return (
    <div className={styles.promptCard}>
      <button className={styles.accordionHeader} onClick={() => setIsExpanded(!isExpanded)}>
        <span>{card.personaTerm}</span>
        <span>{isExpanded ? '▲' : '▼'}</span>
      </button>

      {isExpanded && (
        <div className={styles.cardContent}>
          <div className={styles.promptSection}>
            <div className={styles.sectionHeader}>
              <h5>Generated Prompt</h5>
              <button onClick={() => handleCopy(card.prompt)}>Copy</button>
            </div>
            <div className={styles.promptContent}>
              {card.status === 'generating-prompt' && <span className={styles.loader}>Generating...</span>}
              <ReactMarkdown>{card.prompt}</ReactMarkdown>
            </div>
          </div>

          <div className={styles.executionControls}>
            <select
              value={card.executionModel}
              onChange={(e) => setCardExecutionModel(card.personaTerm, e.target.value)}
              disabled={card.status === 'generating-output'}
            >
              {models.map(model => (
                <option key={model.id} value={model.id}>{model.id.split('/').pop()}</option>
              ))}
            </select>
            <button
              onClick={() => executePrompt(card.prompt, card.personaTerm)}
              disabled={!card.prompt || card.status === 'generating-output'}
            >
              {card.status === 'generating-output' ? 'Executing...' : 'Execute'}
            </button>
          </div>

          {(card.status === 'generating-output' || card.output) && (
            <div className={styles.outputSection}>
              <div className={styles.sectionHeader}>
                <h5>Output</h5>
                <button onClick={() => handleCopy(outputRef.current?.innerText)}>Copy</button>
              </div>
              <div className={styles.outputContent} ref={outputRef}>
                <ReactMarkdown>{card.output}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Main Results Step Component
export const ResultsStep: React.FC = () => {
  const { finalPrompts, reset, theme } = useAgentStore();

  const resultsContent = (
    // ✨ APPLY the current theme directly to the overlay
    <div className={styles.fullScreenOverlay} data-theme={theme}>
      <div className={styles.resultsPanel}>
        <div className={styles.mainHeader}>
          <h2>Agent Output</h2>
          <button onClick={reset} className={styles.startButton}>
            Start New Session
          </button>
        </div>

        {/* ✨ NEW TWO-COLUMN LAYOUT ✨ */}
        <div className={styles.contentGrid}>
          <AgentLog />
          <div className={styles.cardGrid}>
            {finalPrompts.map(card => (
              <PromptCard key={card.personaTerm} card={card} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(resultsContent, document.body);
};
