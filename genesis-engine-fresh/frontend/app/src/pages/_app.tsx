// src/pages/_app.tsx
import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../styles/globals.css';
import '../styles/CommandCenter.css'; // <-- IMPORT THE NEW WORLD-CLASS STYLES
import '../styles/Genesis.css'; // <-- IMPORT GENESIS STYLES

const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <Component {...pageProps} />
    </QueryClientProvider>
  );
}
