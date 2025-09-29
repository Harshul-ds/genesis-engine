import { NextApiRequest, NextApiResponse } from 'next';

interface ServiceStatus {
  configured: boolean;
  status?: string;
  records?: number;
  error?: string;
  url?: string;
  key?: string;
}

interface HealthCheckResponse {
  status: string;
  timestamp: string;
  environment: string;
  vercel: boolean;
  region: string;
  services: {
    supabase: ServiceStatus;
    fireworks: ServiceStatus;
    tavily: ServiceStatus;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const checks: HealthCheckResponse = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      vercel: !!process.env.VERCEL,
      region: process.env.VERCEL_REGION || 'unknown',
      services: {
        supabase: {
          configured: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
          url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing'
        },
        fireworks: {
          configured: !!process.env.FIREWORKS_API_KEY,
          key: process.env.FIREWORKS_API_KEY ? 'configured' : 'missing'
        },
        tavily: {
          configured: !!process.env.TAVILY_API_KEY,
          key: process.env.TAVILY_API_KEY ? 'configured' : 'missing'
        }
      }
    };

    // Test Supabase connection if configured
    if (checks.services.supabase.configured) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { count } = await supabase.from('prompt_components').select('*', { count: 'exact', head: true });
        checks.services.supabase.status = 'connected';
        checks.services.supabase.records = count;
      } catch (error) {
        checks.services.supabase.status = 'error';
        checks.services.supabase.error = error.message;
      }
    }

    res.status(200).json(checks);

  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
