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
    // ✨ KEY CHANGE: We construct the full, absolute URL for server-side execution.
    // This dynamically uses the Vercel URL in production or localhost in development.
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    // We now use this `baseUrl`  for all server-side fetch calls.
    const [optionsRes, modelsRes] = await Promise.all([
      fetch(`${baseUrl}/api/get-options` ),
      fetch(`${baseUrl}/api/list-models` )
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