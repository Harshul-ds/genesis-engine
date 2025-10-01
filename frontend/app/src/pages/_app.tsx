// src/pages/_app.tsx
import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MainLayout } from '../components/layout/MainLayout'; // Import the new layout
import { googleSans, dmSerifDisplay } from '../lib/fonts'; // Import the fonts
import '../styles/globals.css';
import '../styles/CommandCenter.css'; // <-- IMPORT THE NEW WORLD-CLASS STYLES
import '../styles/Genesis.css'; // <-- IMPORT GENESIS STYLES

const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Apply the font variables to the entire application */}
      <div className={`${googleSans.variable} ${dmSerifDisplay.variable}`}>
        <MainLayout>
          <Component {...pageProps} />
        </MainLayout>
      </div>
    </QueryClientProvider>
  );
}
