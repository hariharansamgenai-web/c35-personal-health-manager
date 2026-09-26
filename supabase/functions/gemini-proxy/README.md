# gemini-proxy — Edge Function

Proxies Gemini API calls from the browser to avoid CORS issues.

## Deploy

```bash
# Set the Gemini API key as a Supabase secret
supabase secrets set GEMINI_API_KEY=your-gemini-api-key

# Deploy the function
supabase functions deploy gemini-proxy --no-verify-jwt=false
```

## Usage
Called automatically by `src/lib/geminiNutrition.ts` and `src/hooks/useAISummary.ts`
via `supabase.functions.invoke('gemini-proxy', { body: { model, body } })`.

The function requires a valid Supabase JWT (user must be signed in).
