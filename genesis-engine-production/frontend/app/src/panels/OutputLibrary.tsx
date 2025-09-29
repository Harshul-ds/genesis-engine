// src/components/app/panels/OutputLibrary.tsx
import React from 'react';
import { useAgent } from '../../../context/AgentContext';
import { PromptCard, PromptData } from '../output/PromptCard';

interface OutputLibraryProps {
  prompts: PromptData[];
}

export const OutputLibrary = ({ prompts }: OutputLibraryProps) => {
  const { refine, isThinking } = useAgent();

  if (prompts.length === 0 && !isThinking) {
    return (
      <div className="output-library-panel">
        <h2>Generated Prompt Library</h2>
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <h3>No prompts generated yet</h3>
          <p>Complete the workflow above to see your results!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="output-library-panel">
      <h2>Generated Prompt Library</h2>
      <div className="prompts-grid">
        {prompts.map((promptObj, index) => (
          <PromptCard
            key={index}
            promptData={promptObj}
            onRefine={(promptToRefine) => refine(promptToRefine, "accounts/fireworks/models/llama-v3-70b-instruct")}
            onSave={(prompt) => console.log('Save prompt:', prompt)}
          />
        ))}
      </div>
    </div>
  );
};
