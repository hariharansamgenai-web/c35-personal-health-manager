/**
 * Gemini 1.5 Flash — Indian food vision + text nutrition analyser
 * Architecture follows the PDF spec:
 *   - Gemini 1.5 Flash for multi-dish thali recognition (free tier: 15 RPM via Google AI Studio)
 *   - Open Food Facts REST for packaged Indian barcodes (100% free, GS1 India 890 prefix)
 *   - ICMR-NIN / IFCT 2017 values in the prompt
 *
 * API key is client-side (acceptable for hackathon prototype).
 * For production, proxy through a Supabase Edge Function.
 */

const GEMINI_API_KEY = 'AIzaSyAb8RN6LtSmCkfWcnyhgY0URnDfSpzjhAD4VrPGRIxdjQ-YMVgw';

// Use gemini-1.5-flash as recommended by the PDF for Indian meal vision
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** One dish item — returned for both single-food and multi-dish (thali) analysis */
export interface GeminiFoodItem {
  dish: string;
  serving_unit: 'katori' | 'roti' | 'tbsp' | 'piece' | 'glass' | 'plate' | 'g';
  estimated_qty: number;       // in serving_unit
  weight_g: number;            // estimated weight in grams
  calories: number;            // total for this portion
  protein_g: number;           // total for this portion
  carbs_g: number;             // total for this portion
  fat_g: number;               // total for this portion
  fiber_g: number;             // total for this portion
  sodium_mg: number;           // total for this portion
  is_veg: boolean;
  indian_context: string;      // e.g. "South Indian breakfast staple"
  confidence: 'high' | 'medium' | 'low';
}

/** Full result wrapping one or more dishes */
export interface GeminiFoodResult {
  items: GeminiFoodItem[];
  /** Convenience — single food name for backward compat */
  food_name: string;
  description: string;
  estimated_portion_g: number;
  /** Per-100g macros of the primary / only dish */
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

/** Result from Open Food Facts barcode lookup */
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
  is_veg: boolean | null;       // India veg mark — not always available
  nutriscore: string | null;
}

// ---------------------------------------------------------------------------
// Prompts — per PDF spec: identify all items, return JSON array
// ---------------------------------------------------------------------------

const THALI_SYSTEM_PROMPT = `You are an expert Indian nutritionist trained on ICMR-NIN 2020 and IFCT 2017 data.
Analyse the food photo or description provided. Identify ALL items (e.g. roti, dal, sabzi, curd, rice, pickle).
Return ONLY a valid JSON array — no markdown, no explanation — using Indian household units:

[
  {
    "dish": "string — specific Indian food name",
    "serving_unit": "katori|roti|tbsp|piece|glass|plate|g",
    "estimated_qty": number,
    "weight_g": number,
    "calories": number,
    "protein_g": number,
    "carbs_g": number,
    "fat_g": number,
    "fiber_g": number,
    "sodium_mg": number,
    "is_veg": boolean,
    "indian_context": "string — e.g. South Indian breakfast staple, North Indian staple",
    "confidence": "high|medium|low"
  }
]

Rules:
- All macro values are for the ESTIMATED PORTION (not per 100g).
- Use standard Indian serving sizes: 1 katori ≈ 150g, 1 medium roti ≈ 40g, 1 tbsp ≈ 15g.
- Base nutritional values on ICMR-NIN / IFCT 2017 where possible.
- Adjust for oil/ghee visible in cooking — include in fat_g.
- If only one food item, still return a single-element array.
- If food is not identifiable, set confidence to "low" and give best estimate.
- Diet context (veg/non-veg) is provided separately — use it to filter assumptions.`;

// ---------------------------------------------------------------------------
// Gemini vision — photo (thali / single dish)
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
        {
          text: `${THALI_SYSTEM_PROMPT}\n\nDiet preference: ${isVeg ? 'Vegetarian' : 'Non-vegetarian'}. Salt level: ${saltLevel}. Oil level: ${oilLevel}.`,
        },
        { inline_data: { mime_type: mimeType, data: base64Image } },
      ],
    }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 1024,
      response_mime_type: 'application/json',
    },
  };
  return callGeminiAndNormalize(body);
}

// ---------------------------------------------------------------------------
// Gemini text — description (single food or full meal description)
// ---------------------------------------------------------------------------
export async function analyseFoodText(
  description: string,
  isVeg: boolean,
  saltLevel: string,
  oilLevel: string,
): Promise<GeminiFoodResult> {
  const prompt = `${THALI_SYSTEM_PROMPT}\n\nFood to analyse: "${description}"\nDiet preference: ${isVeg ? 'Vegetarian' : 'Non-vegetarian'}. Salt level: ${saltLevel}. Oil level: ${oilLevel}.`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 1024,
      response_mime_type: 'application/json',
    },
  };
  return callGeminiAndNormalize(body);
}

// ---------------------------------------------------------------------------
// Open Food Facts — barcode lookup (GS1 India prefix 890)
// ---------------------------------------------------------------------------
export async function lookupBarcode(barcode: string): Promise<BarcodeResult> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'PHM-HealthApp/1.0 (contact@developer.com)' },
  });

  if (!res.ok) throw new Error(`Open Food Facts returned ${res.status} for barcode ${barcode}.`);

  const data = await res.json();
  if (data.status !== 1 || !data.product) {
    throw new Error(`Barcode ${barcode} not found in Open Food Facts database.`);
  }

  const p = data.product;
  const n = p.nutriments ?? {};

  return {
    food_name:          p.product_name || p.product_name_en || 'Unknown product',
    brand:              p.brands ?? '',
    calories_per_100g:  n['energy-kcal_100g'] ?? n['energy_100g'] ? Math.round((n['energy_100g'] ?? 0) / 4.184) : 0,
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

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------
async function callGeminiAndNormalize(body: object): Promise<GeminiFoodResult> {
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Gemini API error ${res.status}${text ? ': ' + text.slice(0, 160) : ''}`);
  }

  const data = await res.json();
  const raw: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const clean = raw.replace(/```json|```/g, '').trim();

  let items: GeminiFoodItem[];
  try {
    const parsed = JSON.parse(clean);
    items = Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    throw new Error('Could not parse Gemini response. Try a clearer photo or description.');
  }

  if (!items.length) throw new Error('Gemini returned no food items.');

  // Build backward-compat flat result from first (primary) item
  const primary = items[0];
  const totalWeight = items.reduce((s, i) => s + i.weight_g, 0) || primary.weight_g;

  return {
    items,
    food_name:           items.length > 1 ? `Thali (${items.length} items)` : primary.dish,
    description:         items.map(i => i.dish).join(', '),
    estimated_portion_g: totalWeight,
    calories_per_100g:   primary.weight_g ? Math.round((primary.calories / primary.weight_g) * 100) : 0,
    protein_g:           primary.weight_g ? (primary.protein_g / primary.weight_g) * 100 : 0,
    carbs_g:             primary.weight_g ? (primary.carbs_g   / primary.weight_g) * 100 : 0,
    fat_g:               primary.weight_g ? (primary.fat_g     / primary.weight_g) * 100 : 0,
    fiber_g:             primary.weight_g ? (primary.fiber_g   / primary.weight_g) * 100 : 0,
    sodium_mg_per_100g:  primary.weight_g ? (primary.sodium_mg / primary.weight_g) * 100 : 0,
    is_veg:              items.every(i => i.is_veg),
    indian_context:      primary.indian_context,
    confidence:          primary.confidence,
  };
}
