// src/components/app/PersonaSelector.tsx
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';

const HARDCODED_PERSONAS = [
  { term: 'PragmaticEngineer', description: 'A pragmatic software engineer focused on practical solutions' },
  { term: 'ResearchScientist', description: 'A research scientist focused on innovation and discovery' },
  { term: 'TechnicalWriter', description: 'A technical writer who excels at clear communication' },
  { term: 'ProductManager', description: 'A product manager focused on user needs and business value' }
];

export function PersonaSelector() {
  const [selectedPersona, setSelectedPersona] = useState<string>('');

  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-300 mb-2">
        Select a persona to define the AI's perspective and expertise:
      </div>
      <div className="grid grid-cols-1 gap-2">
        {HARDCODED_PERSONAS.map((persona) => (
          <Button
            key={persona.term}
            variant={selectedPersona === persona.term ? "default" : "outline"}
            className="justify-start h-auto p-3 text-left"
            onClick={() => setSelectedPersona(persona.term)}
          >
            <div>
              <div className="font-medium">{persona.term}</div>
              <div className="text-xs text-gray-400">{persona.description}</div>
            </div>
          </Button>
        ))}
      </div>
      {selectedPersona && (
        <div className="text-xs text-green-400 mt-2">
          ✓ Selected: {selectedPersona}
        </div>
      )}
    </div>
  );
}
