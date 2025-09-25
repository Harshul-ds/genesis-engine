// src/components/app/TaskSelector.tsx
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';

const HARDCODED_TASKS = [
  { term: 'WriteEngagingArticle', description: 'Write an engaging article on a technical topic' },
  { term: 'DebugComplexIssue', description: 'Debug a complex technical issue systematically' },
  { term: 'CodeReviewFeedback', description: 'Provide constructive code review feedback' },
  { term: 'TechnicalArchitecture', description: 'Design a technical architecture for a complex system' }
];

export function TaskSelector() {
  const [selectedTask, setSelectedTask] = useState<string>('');

  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-300 mb-2">
        Choose a task to define what the AI should accomplish:
      </div>
      <div className="grid grid-cols-1 gap-2">
        {HARDCODED_TASKS.map((task) => (
          <Button
            key={task.term}
            variant={selectedTask === task.term ? "default" : "outline"}
            className="justify-start h-auto p-3 text-left"
            onClick={() => setSelectedTask(task.term)}
          >
            <div>
              <div className="font-medium">{task.term}</div>
              <div className="text-xs text-gray-400">{task.description}</div>
            </div>
          </Button>
        ))}
      </div>
      {selectedTask && (
        <div className="text-xs text-green-400 mt-2">
          ✓ Selected: {selectedTask}
        </div>
      )}
    </div>
  );
}
