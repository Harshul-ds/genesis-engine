// src/context/AgentContext.tsx
import { createContext, useContext, ReactNode } from 'react';
import { useReActAgent, AssemblyState, PromptData } from '../hooks/useReActAgent';
import { AppData } from '../lib/clientTools';

// Define the shape of our global state
interface AgentState {
  liveAssembly: AssemblyState;
  finalPrompts: PromptData[];
  isThinking: boolean;
  agentError: string | null;
  run: (topic: string, goal: string, selectedPersonas: string[], model: string) => void;
  refine: (prompt: PromptData, model: string) => void;
  history: any[];
  setAgentError: (error: string | null) => void;
  appData: AppData | null;
}

// Create the context with a default value
const AgentContext = createContext<AgentState | undefined>(undefined);

// Create a provider component that will wrap our app
export const AgentProvider = ({ children, appData }: { children: ReactNode, appData: AppData }) => {
  const agent = useReActAgent(appData);
  
  const state: AgentState = {
    liveAssembly: agent.liveAssembly,
    finalPrompts: agent.finalPrompts,
    isThinking: agent.isThinking,
    agentError: agent.agentError,
    run: agent.run,
    refine: agent.refine,
    history: agent.history,
    setAgentError: agent.setAgentError,
    appData: appData,
  };
  
  return <AgentContext.Provider value={state}>{children}</AgentContext.Provider>;
};

// Create a custom hook to easily access the context
export const useAgent = () => {
  const context = useContext(AgentContext);
  if (context === undefined) {
    throw new Error('useAgent must be used within an AgentProvider');
  }
  return context;
};
