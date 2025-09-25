// src/lib/store.ts
import { create } from 'zustand';

// Define the shape of our data with a TypeScript interface
interface ComponentOption {
    term: string;
    description: string;
    content: string;
}

interface AppState {
    availablePersonas: ComponentOption[];
    availableTasks: ComponentOption[];
    selectedPersonaTerm: string | null;
    selectedTaskTerm: string | null;

    // --- NEW: Add state to hold the assembled prompt ---
    assembledMetaPrompt: string;

    // --- NEW STATE FOR MODEL SELECTION ---
    availableModels: string[];
    selectedModel: string | null;

    // Actions
    fetchOptions: () => Promise<void>;
    selectPersona: (term: string) => void;
    selectTask: (term: string) => void;

    // --- NEW: Add the assembly function ---
    assemblePrompt: () => void;

    // --- NEW ACTIONS ---
    fetchModels: () => Promise<void>;
    selectModel: (model: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
    // Initial State
    availablePersonas: [],
    availableTasks: [],
    selectedPersonaTerm: null,
    selectedTaskTerm: null,
    assembledMetaPrompt: "Select a persona and task to begin assembling your prompt...",

    // --- NEW INITIAL STATE ---
    availableModels: [],
    selectedModel: null,

    // The function to fetch our data from the new API route
    fetchOptions: async () => {
        try {
            const response = await fetch('/api/get-options');
            const { personas, tasks } = await response.json();
            set({ availablePersonas: personas || [], availableTasks: tasks || [] });
        } catch (error) {
            console.error("Failed to fetch options:", error);
        }
    },

    // --- NEW: We will modify the selection actions to trigger re-assembly ---
    selectPersona: (term) => {
        set({ selectedPersonaTerm: term });
        get().assemblePrompt(); // Call the new assembly function
    },

    selectTask: (term) => {
        set({ selectedTaskTerm: term });
        get().assemblePrompt(); // Call the new assembly function
    },

    // --- NEW: The core logic for client-side assembly ---
    assemblePrompt: () => {
        const { availablePersonas, availableTasks, selectedPersonaTerm, selectedTaskTerm } = get();

        if (!selectedPersonaTerm || !selectedTaskTerm) {
            set({ assembledMetaPrompt: "Select a persona and task to begin assembling your prompt..." });
            return; // Not ready to assemble yet
        }

        // Find the full content for the selected components
        const personaComponent = availablePersonas.find(p => p.term === selectedPersonaTerm);
        const taskComponent = availableTasks.find(t => t.term === selectedTaskTerm);

        // Use the content field if available, otherwise fall back to description
        const personaContent = personaComponent?.content || personaComponent?.description || '';
        const taskContent = taskComponent?.content || taskComponent?.description || '';

        // Stitch the parts together
        const metaPrompt = `${personaContent}\n\n${taskContent}`;

        set({ assembledMetaPrompt: metaPrompt });
    },

    // --- NEW ACTION IMPLEMENTATIONS ---
    fetchModels: async () => {
        try {
            const response = await fetch('/api/list-models');
            const { models } = await response.json();
            // Automatically set the default selected model to the first one in the list
            set({ availableModels: models || [], selectedModel: models?.[0] || null });
        } catch (error) {
            console.error("Failed to fetch models:", error);
        }
    },

    selectModel: (model) => set({ selectedModel: model }),
}));
