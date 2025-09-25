// src/pages/index.tsx
import { useQuery } from '@tanstack/react-query';
import { getInitialData } from '../lib/supabaseClient';
import { AgentProvider, useAgent } from '../context/AgentContext';
import { ControlPanel } from '../components/app/panels/ControlPanel';
import { AssemblyBay } from '../components/app/panels/AssemblyBay';
import { OutputLibrary } from '../components/app/panels/OutputLibrary';

// This is the main workspace component that uses the agent context
function GenesisWorkspace({ appData }: { appData: any }) {
  const { liveAssembly, finalPrompts } = useAgent();

  return (
    <div className="command-center">
      <div className="panel control-deck">
        <ControlPanel />
      </div>
      <div className="panel assembly-bay-panel">
        <AssemblyBay assemblyState={liveAssembly} />
      </div>
      <div className="panel output-library-panel">
        <OutputLibrary prompts={finalPrompts} />
      </div>
    </div>
  );
}

// The main page component that provides the context
export default function HomePage() {
  const { data: appData, isLoading, isError } = useQuery({
    queryKey: ['initialAppData'],
    queryFn: getInitialData,
    staleTime: Infinity,
  });

  if (isLoading) return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontSize: '1.2rem'
    }}>
      Loading Genesis Command Center...
    </div>
  );

  if (isError) return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontSize: '1.2rem'
    }}>
      Error loading Genesis Command Center.
    </div>
  );

  return (
    <AgentProvider appData={appData}>
      <GenesisWorkspace appData={appData} />
    </AgentProvider>
  );
}
