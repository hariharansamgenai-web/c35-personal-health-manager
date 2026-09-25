import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface SummaryResult {
  summary: string;
  period_days: number;
  period_start: string;
  period_end: string;
  disclaimer: string;
}

export function useAISummary() {
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate(profileId: string, days: number) {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('health-summary', {
        body: { profile_id: profileId, days },
      });
      if (fnErr) throw new Error(fnErr.message ?? 'The AI summary service returned an error.');
      if (data?.error) throw new Error(data.error);
      setResult(data as SummaryResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not generate summary.');
    } finally {
      setLoading(false);
    }
  }

  return { result, loading, error, generate, reset: () => { setResult(null); setError(null); } };
}
