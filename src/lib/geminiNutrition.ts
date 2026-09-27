/**
 * Gemini Flash — Indian food vision + text nutrition analyser
 *
 * Calls are routed through the Supabase Edge Function `gemini-proxy`
 * to avoid CORS issues in the browser. The Gemini API key lives in
 * Supabase secrets (GEMINI_API_KEY), never in the frontend bundle.
 *
 * Architecture (PDF spec):
 *   - Gemini Flash (current model, auto-fallback) for multi-dish thali recognition
 *   - Open Food Facts REST for packaged Indian barcodes (free)
 *   - ICMR-NIN / IFCT 2017 nutritional values in the prompt
 */

import { supabase } from '@/lib/supabase';

/** Current Gemini model; the Edge Function falls back to newer/other models if this one is retired. */
export const GEMINI_MODEL = 'gemini-3.5-flash';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GeminiFoodItem {
  dish: string;
  serving_unit: 'katori' | 'roti' | 'tbsp' | 'piece' | 'glass' | 'plate' | 'g';
  estimated_qty: number;
  weight_g: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sodium_mg: number;
  is_veg: boolean;
  indian_context: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface GeminiFoodResult {
  items: GeminiFoodItem[];
  food_name: string;
  description: string;
  estimated_portion_g: number;
  calories_per_100g: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sodium_mg_per_100g: number;
  is_veg: boolean;
  indian_context: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface BarcodeResult {
  food_name: string;
  brand: string;
  calories_per_100g: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sodium_mg_per_100g: number;
  serving_size_g: number;
  image_url: string | null;
  is_veg: boolean | null;
  nutriscore: string | null;
}

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

const THALI_PROMPT = `You are an expert Indian clinical nutritionist using ICMR-NIN 2020 and IFCT 2017 food composition data.

Task: identify EVERY distinct food item visible in the photo (or described in the text) and estimate the portion actually shown.
- Name dishes specifically (e.g. "Butter chicken", "Tandoori roti", "Paneer butter masala", "Jeera rice"), not generically ("curry", "bread").
- Judge meat vs paneer vs vegetables from the image itself. The user's diet setting is only context: never relabel a dish to match it.
- Count countable items (rotis, idlis, pieces) and estimate bowls in katori (1 katori ≈ 150 g cooked).
- Standard weights: medium roti/chapati ≈ 40 g, naan ≈ 90 g, tandoori roti ≈ 60 g, 1 tbsp ≈ 15 g, 1 cup cooked rice ≈ 150 g.
- Nutrient values must be for the ESTIMATED PORTION (not per 100 g) and internally consistent: calories ≈ 4×protein + 4×carbs + 9×fat (±10%).
- Adjust fat for visible oil, ghee, butter or cream, and sodium for the stated salt level.
- confidence = "low" if the item is unclear or partly hidden.

Return ONLY a JSON array (no markdown, no commentary), one object per item:
[{"dish":"","serving_unit":"katori|roti|tbsp|piece|glass|plate|g","estimated_qty":0,"weight_g":0,"calories":0,"protein_g":0,"carbs_g":0,"fat_g":0,"fiber_g":0,"sodium_mg":0,"is_veg":true,"indian_context":"","confidence":"high|medium|low"}]
If there is no food in the image, return [].`;

// ---------------------------------------------------------------------------
// Core proxy caller
// ---------------------------------------------------------------------------

async function callGeminiProxy(model: string, body: object): Promise<object> {
  const { data, error } = await supabase.functions.invoke('gemini-proxy', {
    body: { model, body },
  });
  if (error) {
    // supabase-js hides the body behind "non-2xx"; read the real reason.
    let detail = '';
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx && typeof ctx.json === 'function') detail = (await ctx.json())?.error ?? '';
    } catch { /* ignore */ }
    throw new Error(detail || (error.message?.includes('non-2xx')
      ? 'The AI food service is unavailable right now. Please try again in a minute.'
      : error.message) || 'Gemini proxy error');
  }
  if ((data as Record<string,unknown>)?.error) throw new Error(String((data as Record<string,unknown>).error));
  return data as object;
}

async function callGeminiAndNormalize(model: string, body: object): Promise<GeminiFoodResult> {
  const data = await callGeminiProxy(model, body) as Record<string, unknown>;
  const parts = (data?.candidates as Array<{content?:{parts?:Array<{text?:string; thought?:boolean}>}}>)?.[0]?.content?.parts ?? [];
  const raw = parts.filter(p => !p.thought && p.text).map(p => p.text).join('');
  const cleaned = raw.replace(/```json|```/g, '').trim();
  const start = cleaned.search(/[[{]/);
  const clean = start >= 0 ? cleaned.slice(start) : cleaned;

  let items: GeminiFoodItem[];
  try {
    const parsed = JSON.parse(clean);
    items = Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    throw new Error('Could not parse Gemini response. Try a clearer photo or description.');
  }

  items = items
    .filter((i) => i && i.dish)
    .map((i) => ({
      ...i,
      weight_g: Math.max(0, Number(i.weight_g) || 0),
      calories: Math.max(0, Math.round(Number(i.calories) || 0)),
      protein_g: Math.max(0, Number(i.protein_g) || 0),
      carbs_g: Math.max(0, Number(i.carbs_g) || 0),
      fat_g: Math.max(0, Number(i.fat_g) || 0),
      fiber_g: Math.max(0, Number(i.fiber_g) || 0),
      sodium_mg: Math.max(0, Number(i.sodium_mg) || 0),
    }));
  if (!items.length) throw new Error('No food recognised. Try a closer, well-lit photo of the plate.');

  const primary = items[0];
  // Whole-plate totals (all items), expressed per 100 g of the plate
  const sum = (k: 'calories' | 'protein_g' | 'carbs_g' | 'fat_g' | 'fiber_g' | 'sodium_mg') =>
    items.reduce((s, i) => s + (i[k] || 0), 0);
  const totalWeight = items.reduce((s, i) => s + (i.weight_g || 0), 0);
  const per100 = (v: number) => (totalWeight ? (v / totalWeight) * 100 : 0);

  return {
    items,
    food_name:           items.length > 1 ? `Thali (${items.length} items)` : primary.dish,
    description:         items.map(i => i.dish).join(', '),
    estimated_portion_g: totalWeight,
    calories_per_100g:   Math.round(per100(sum('calories'))),
    protein_g:           per100(sum('protein_g')),
    carbs_g:             per100(sum('carbs_g')),
    fat_g:               per100(sum('fat_g')),
    fiber_g:             per100(sum('fiber_g')),
    sodium_mg_per_100g:  per100(sum('sodium_mg')),
    is_veg:              items.every(i => i.is_veg),
    indian_context:      primary.indian_context,
    confidence:          primary.confidence,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function analyseFoodImage(
  base64Image: string,
  mimeType: 'image/jpeg' | 'image/png',
  isVeg: boolean,
  saltLevel: string,
  oilLevel: string,
): Promise<GeminiFoodResult> {
  const body = {
    contents: [{
      parts: [
        { text: `${THALI_PROMPT}\n\nDiet: ${isVeg ? 'Vegetarian' : 'Non-vegetarian'}. Salt: ${saltLevel}. Oil: ${oilLevel}.` },
        { inline_data: { mime_type: mimeType, data: base64Image } },
      ],
    }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 4096, responseMimeType: 'application/json' },
  };
  return callGeminiAndNormalize(GEMINI_MODEL, body);
}

export async function analyseFoodText(
  description: string,
  isVeg: boolean,
  saltLevel: string,
  oilLevel: string,
): Promise<GeminiFoodResult> {
  const prompt = `${THALI_PROMPT}\n\nFood: "${description}"\nDiet: ${isVeg ? 'Vegetarian' : 'Non-vegetarian'}. Salt: ${saltLevel}. Oil: ${oilLevel}.`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 4096, responseMimeType: 'application/json' },
  };
  return callGeminiAndNormalize(GEMINI_MODEL, body);
}

// ---------------------------------------------------------------------------
// Open Food Facts — barcode (runs client-side fine, different domain)
// ---------------------------------------------------------------------------

export async function lookupBarcode(barcode: string): Promise<BarcodeResult> {
  const clean = barcode.replace(/\D/g, '');

  // ── Primary: Supabase Edge Function (production — avoids CORS) ─────
  try {
    const { data, error } = await supabase.functions.invoke('barcode-lookup', {
      body: { barcode: clean },
    });
    // Edge Function available and returned data → use it
    if (!error && data && (data as BarcodeResult).food_name) {
      return data as BarcodeResult;
    }
    // Edge Function returned a real "not found" (HTTP 404) — don't fall through
    if (!error && data && (data as Record<string,unknown>).error) {
      throw new Error(String((data as Record<string,unknown>).error));
    }
  } catch (e) {
    // Only fall through if the Edge Function is simply not deployed/reachable
    const msg = e instanceof Error ? e.message : '';
    const isDeployError = msg.includes('not available') || msg.includes('Failed to fetch') ||
      msg.includes('FunctionsFetchError') || msg.includes('not found in demo');
    if (!isDeployError) throw e; // real error (e.g. barcode not in DB) — propagate
  }

  // ── Fallback: direct Open Food Facts (preview / before Edge deploy) ─
  const url = `https://world.openfoodfacts.org/api/v2/product/${clean}.json`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'PulsePath/1.0 (contact@pulsepath.app)' },
  });
  if (!res.ok) throw new Error(`Barcode ${clean} — product not found (HTTP ${res.status}).`);
  const json = await res.json();
  if (json.status !== 1 || !json.product) throw new Error(`Barcode ${clean} not found in Open Food Facts.`);

  const p = json.product;
  const n = p.nutriments ?? {};
  return {
    food_name:          p.product_name || p.product_name_en || 'Unknown product',
    brand:              p.brands ?? '',
    calories_per_100g:  n['energy-kcal_100g'] ?? Math.round((n['energy_100g'] ?? 0) / 4.184),
    protein_g:          n.proteins_100g ?? 0,
    carbs_g:            n.carbohydrates_100g ?? 0,
    fat_g:              n.fat_100g ?? 0,
    fiber_g:            n.fiber_100g ?? 0,
    sodium_mg_per_100g: (n.sodium_100g ?? 0) * 1000,
    serving_size_g:     p.serving_quantity ? Number(p.serving_quantity) : 100,
    image_url:          p.image_front_small_url ?? p.image_url ?? null,
    is_veg:             p.labels?.toLowerCase().includes('veg') ?? null,
    nutriscore:         p.nutriscore_grade?.toUpperCase() ?? null,
  };
}
