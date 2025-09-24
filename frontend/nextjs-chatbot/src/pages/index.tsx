import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PersonaSelector } from "@/components/app/PersonaSelector";
import { TaskSelector } from "@/components/app/TaskSelector";
import { PromptDisplay } from "@/components/app/PromptDisplay";
import { OutputDisplay } from "@/components/app/OutputDisplay";

export default function Home() {
  // Get the fetch function from our store
  const fetchOptions = useAppStore((state) => state.fetchOptions);

  // Use a useEffect hook to call fetchOptions only once when the component mounts
  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  // --- NEW: Add state for the form inputs and outputs ---
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [finalAnswer, setFinalAnswer] = useState('');

  // Get the assembled prompt from our global store
  const assembledMetaPrompt = useAppStore((state) => state.assembledMetaPrompt);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setFinalAnswer('');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // This is a simplified request for now.
          // We will use the 'DynamicAgent' goal.
          goal: 'DynamicAgent',
          variables: {
            // We get these terms from the Zustand store
            persona_term: useAppStore.getState().selectedPersonaTerm,
            task_term: useAppStore.getState().selectedTaskTerm,
            topic: topic, // The user's input
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}` );
      }

      const result = await response.json();
      setFinalAnswer(result.final_answer);

    } catch (error: any) {
      setFinalAnswer(`Error: ${error.message}` );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      <header className="p-4 border-b border-gray-700">
        <h1 className="text-2xl font-bold">Genesis Prompt Engine</h1>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 h-[calc(100vh-65px)]">
        <div className="lg:col-span-1 flex flex-col gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>1. Choose Persona</CardTitle>
            </CardHeader>
            <CardContent>
              <PersonaSelector />
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>2. Define Task</CardTitle>
            </CardHeader>
            <CardContent>
              <TaskSelector />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-4">
          <Card className="bg-gray-800 border-gray-700 flex-grow flex flex-col">
            <CardHeader>
              <CardTitle>Live Meta-Prompt</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <PromptDisplay />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 flex flex-col gap-4">
          <Card className="bg-gray-800 border-gray-700 h-1/2 flex flex-col">
            <CardHeader>
              <CardTitle>Final AI Output</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <OutputDisplay finalAnswer={finalAnswer} isLoading={isLoading} />
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 h-1/2 flex flex-col">
            <CardHeader>
              <CardTitle>3. Enter Topic & Generate</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Enter your topic (e.g., 'Sora vs Kling AI capabilities')"
                  className="bg-gray-700 text-white p-2 rounded resize-none h-20"
                  required
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded disabled:opacity-50"
                >
                  {isLoading ? 'Generating...' : 'Generate'}
                </button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
