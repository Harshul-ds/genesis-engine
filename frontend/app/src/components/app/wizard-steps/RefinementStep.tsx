// src/components/app/wizard-steps/RefinementStep.tsx
import React from 'react';
import ReactMarkdown from 'react-markdown'; // Make sure you've run `npm install react-markdown`
import { useAgentStore } from '../../../lib/agent-store';
import styles from './RefinementStep.module.css';

export const RefinementStep: React.FC = () => {
  const {
    agentThoughts,
    setAgentThoughts, // Use the renamed action
    generateFinalPrompt,
  } = useAgentStore();

  // State to toggle between viewing and editing
  const [isEditing, setIsEditing] = React.useState(false);

  return (
    <div className={styles.container}>
      <h2>Refine the Agent&apos;s Thoughts</h2>
      <p>The AI is outlining its plan. Review and edit its thinking before the final prompt is generated.</p>

      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h4>Agent&apos;s Plan</h4>
          <button onClick={() => setIsEditing(!isEditing)} className={styles.editButton}>
            {isEditing ? '✓ Done Editing' : 'Edit Plan'}
          </button>
        </div>

        {isEditing ? (
          // EDIT MODE: Show a textarea
          <textarea
            className={styles.editableThoughts}
            value={agentThoughts}
            onChange={(e) => setAgentThoughts(e.target.value)}
          />
        ) : (
          // VIEW MODE: Render the live-streaming markdown
          <div className={styles.thoughtStream}>
            <ReactMarkdown>{agentThoughts}</ReactMarkdown>
          </div>
        )}
      </div>

      <button onClick={generateFinalPrompt} className={styles.generateButton}>
        Next: Generate Final Prompt
      </button>
    </div>
  );
};
