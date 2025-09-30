// src/components/app/panels/AssemblyBay.tsx
import React from 'react';
import { AssemblyState } from '../../../hooks/useReActAgent';

export const AssemblyBay: React.FC<{ assemblyState: AssemblyState }> = ({ assemblyState }) => {
  return (
    <div className="assembly-bay-panel">
      <h2>Live Assembly Bay</h2>
      <div className="status">{assemblyState.status}</div>

      <div className="thought-stream">
        <div>
          <h3>Agent&apos;s Thought Process:</h3>
          <div className="thought-content">
            {assemblyState.currentThought || "Awaiting instructions..."}
            {assemblyState.currentThought && (
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}
          </div>
        </div>

        <div className="assembled-materials">
          <h3>Assembled Materials</h3>
          <div className="materials-content">
            {assemblyState.persona && (
              <div className="material-item persona-material">
                <div className="material-header">
                  <span className="material-icon">👤</span>
                  <strong>Selected Persona</strong>
                </div>
                <div className="material-details">
                  <div className="persona-badge">{assemblyState.persona.term}</div>
                  <p>{assemblyState.persona.description}</p>
                </div>
              </div>
            )}

            {assemblyState.webContext && assemblyState.webContext.length > 0 && (
              <div className="material-item web-context-material">
                <div className="material-header">
                  <span className="material-icon">🌐</span>
                  <strong>Web Context</strong>
                  <span className="context-count">({assemblyState.webContext.length} results)</span>
                </div>
                <div className="material-details">
                  <div className="web-results">
                    {assemblyState.webContext.slice(0, 3).map((result, index) => (
                      <div key={index} className="web-result">
                        <a href={result.link} target="_blank" rel="noopener noreferrer" className="web-result-title">
                          {result.title}
                        </a>
                        <p className="web-result-snippet">{result.snippet}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
