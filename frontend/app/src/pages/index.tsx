import { GenesisCommandCenter } from '../components/app/GenesisCommandCenter';
import { AppData } from '../lib/types';
import type { GetServerSideProps } from 'next';

export default function HomePage({ appData }: { appData: AppData | null }) {
  // This component does not change.
  return <GenesisCommandCenter appData={appData} />;
}

// This is the only function that needs to be fixed.
export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const [optionsRes, modelsRes] = await Promise.all([
      fetch('/api/get-options'),
      fetch('/api/list-models')
    ]);

    if (!optionsRes.ok) throw new Error("Failed to fetch app options.");
    if (!modelsRes.ok) throw new Error("Failed to fetch models.");

    const optionsData = await optionsRes.json();
    const modelsData = await modelsRes.json();

    // ✨ KEY CHANGE: This block correctly finds the models array,
    // regardless of the exact JSON structure returned by the API.
    let modelsList = [];
    if (Array.isArray(modelsData)) {
      modelsList = modelsData; // Case 1: The response is the array itself `[...]` 
    } else if (Array.isArray(modelsData.models)) {
      modelsList = modelsData.models; // Case 2: The response is `{"models": [...]}` 
    } else if (Array.isArray(modelsData.data)) {
      modelsList = modelsData.data; // Case 3: The response is `{"data": [...]}` 
    }

    // Now, we check if we successfully found a non-empty list.
    if (modelsList.length === 0) {
      throw new Error("No available models were found in the API response.");
    }

    // Combine the data as before.
    const appData: AppData = {
      ...optionsData,
      models: modelsList,
    };

    return { props: { appData } };

  } catch (error: any) {
    console.error("getServerSideProps failed:", error.message);
    // Passing null ensures your component's error view is shown.
    return { props: { appData: null } };
  }
};