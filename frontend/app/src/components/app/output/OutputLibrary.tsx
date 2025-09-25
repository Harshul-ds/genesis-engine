// src/components/app/output/OutputLibrary.tsx
import React from 'react';
import { PromptCard, PromptData } from './PromptCard';

interface OutputLibraryProps {
  prompts: PromptData[];
  onRefine: (prompt: PromptData) => void;
  onSave: (prompt: PromptData) => void;
}

export const OutputLibrary: React.FC<OutputLibraryProps> = ({ prompts, onRefine, onSave }) => {
  if (prompts.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        color: '#6c757d',
        padding: '2rem',
        background: 'rgba(248, 249, 250, 0.8)',
        borderRadius: '8px',
        border: '1px solid #e9ecef'
      }}>
        <h3>Generated Prompt Library</h3>
        <p>No prompts generated yet. Complete the workflow above to see your results!</p>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginTop: 0, color: '#495057' }}>Generated Prompt Library</h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '20px',
        maxHeight: 'calc(100vh - 200px)',
        overflow: 'auto',
        padding: '1rem 0'
      }}>
        {prompts.map((promptObj, index) => (
          <PromptCard
            key={index}
            promptData={promptObj}
            onRefine={onRefine}
            onSave={onSave}
          />
        ))}
      </div>
    </div>
  );
};
