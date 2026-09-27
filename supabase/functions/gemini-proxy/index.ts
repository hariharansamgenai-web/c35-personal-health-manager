/**
 * gemini-proxy — Supabase Edge Function
 * Proxies requests to Google Gemini so the API key never reaches the browser.
 *
 * POST /functions/v1/gemini-proxy
 * Body: { model: string; body: object }
 * Returns: Gemini API response JSON, or { error } with HTTP 200 so the app can show the real reason.
 *
 * The Gemini API key is stored as a Supabase secret: GEMINI_API_KEY
 *
 * Google retires Gemini models regularly (1.5 and 2.0 are already shut down).
 * Any requested model is tried first, then the fallback chain below, so a
 * retirement no longer breaks the app.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Newest first. Old names the app used to send are mapped onto this chain.
const FALLBACK_MODELS = ['gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
const ALLOWED_MODELS = new Set([
  ...FALLBACK_MODELS,
  'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash', // retired — redirected to the chain
]);

const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Please sign in again.' }, 401);

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      return json({ error: 'AI food analysis is not set up yet: the GEMINI_API_KEY secret is missing in Supabase.' });
    }

    const { model, body } = await req.json();
    if (!model || !body) return json({ error: 'model and body are required' }, 400);
    if (!ALLOWED_MODELS.has(model)) return json({ error: `Model not allowed: ${model}` }, 400);

    const chain = [model, ...FALLBACK_MODELS].filter((m, i, a) => a.indexOf(m) === i && !/^gemini-(1\.5|2\.0)-/.test(m));

    let lastError = 'Gemini API error';
    for (const m of chain) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
          body: JSON.stringify(body),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (res.ok) return json({ ...data, model_used: m });

      lastError = data?.error?.message ?? `Gemini API error (HTTP ${res.status})`;
      // Model retired / unknown / overloaded → try the next one. Anything else (bad key, bad request) → stop.
      const retryable = res.status === 404 || res.status === 429 || res.status >= 500 ||
        /not found|not supported|deprecated|overloaded/i.test(lastError);
      if (!retryable) break;
    }

    if (/api key/i.test(lastError)) lastError = 'The Gemini API key in Supabase is invalid or expired.';
    return json({ error: lastError });
  } catch (e) {
    return json({ error: `Unexpected error: ${e instanceof Error ? e.message : String(e)}` });
  }
});
