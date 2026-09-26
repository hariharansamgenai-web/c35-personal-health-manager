import { useRef, useState } from 'react';
import {
  AlertCircle, Barcode, Camera, Check, ChevronDown, ChevronUp,
  Leaf, Loader2, Plus, ScanLine, Sparkles, Type, Beef,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  analyseFoodImage, analyseFoodText, lookupBarcode,
  type BarcodeResult, type GeminiFoodItem, type GeminiFoodResult,
} from '@/lib/geminiNutrition';
import { SALT_LEVELS, OIL_LEVELS, type SaltLevel, type OilLevel } from '@/lib/indianNutrition';

type Mode = 'text' | 'photo' | 'barcode';

interface Props {
  /** Called when user taps "Add to meal" on a result item */
  onUse: (result: GeminiFoodResult, portionG: number, saltLevel: SaltLevel, oilLevel: OilLevel, itemIndex?: number) => void;
}

const inputStyle: React.CSSProperties = {
  padding: '8px 12px', borderRadius: 8, fontSize: 14,
  border: '1px solid var(--border)', background: 'var(--bg-input)',
  color: 'var(--text-primary)', outline: 'none', width: '100%',
};

export function AIFoodAnalyser({ onUse }: Props) {
  const [mode, setMode]             = useState<Mode>('text');
  const [isVeg, setIsVeg]           = useState(true);
  const [textInput, setTextInput]   = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [saltLevel, setSaltLevel]   = useState<SaltLevel>('low');
  const [oilLevel, setOilLevel]     = useState<OilLevel>('low');
  const [imageFile, setImageFile]   = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [result, setResult]         = useState<GeminiFoodResult | null>(null);
  const [barcodeResult, setBarcodeResult] = useState<BarcodeResult | null>(null);
  const [barcodePortion, setBarcodePortion] = useState(100);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [expanded, setExpanded]     = useState(true);
  const [addedIdx, setAddedIdx]     = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const barcodeFileRef = useRef<HTMLInputElement>(null);
  const [barcodeImgPreview, setBarcodeImgPreview] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'found' | 'notfound'>('idle');

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(f);
    setResult(null);
  }

  async function handleAnalyse() {
    setLoading(true); setError(null); setResult(null); setBarcodeResult(null); setAddedIdx(null);
    try {
      if (mode === 'barcode') {
        const code = barcodeInput.trim();
        if (!code) { setError('Enter a barcode number.'); setLoading(false); return; }
        const br = await lookupBarcode(code);
        setBarcodeResult(br);
      } else if (mode === 'photo' && imageFile) {
        const b64 = await fileToBase64(imageFile);
        const mime = imageFile.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const res = await analyseFoodImage(b64, mime, isVeg, saltLevel, oilLevel);
        setResult(res);
      } else {
        if (!textInput.trim()) { setError('Enter a food name or description.'); setLoading(false); return; }
        const res = await analyseFoodText(textInput, isVeg, saltLevel, oilLevel);
        setResult(res);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleAddItem(itemIndex: number, portionG: number) {
    if (!result) return;
    onUse(result, portionG, saltLevel, oilLevel, itemIndex);
    setAddedIdx(itemIndex);
    setTimeout(() => setAddedIdx(null), 2000);
  }

  function handleAddBarcode() {
    if (!barcodeResult) return;
    // Convert barcode result to GeminiFoodResult shape
    const synthetic: GeminiFoodResult = {
      items: [{
        dish: barcodeResult.food_name,
        serving_unit: 'g',
        estimated_qty: barcodePortion,
        weight_g: barcodePortion,
        calories: Math.round(barcodeResult.calories_per_100g * barcodePortion / 100),
        protein_g: barcodeResult.protein_g * barcodePortion / 100,
        carbs_g: barcodeResult.carbs_g * barcodePortion / 100,
        fat_g: barcodeResult.fat_g * barcodePortion / 100,
        fiber_g: barcodeResult.fiber_g * barcodePortion / 100,
        sodium_mg: barcodeResult.sodium_mg_per_100g * barcodePortion / 100,
        is_veg: barcodeResult.is_veg ?? isVeg,
        indian_context: `Packaged food — ${barcodeResult.brand}`,
        confidence: 'high',
      }],
      food_name: barcodeResult.food_name,
      description: barcodeResult.brand,
      estimated_portion_g: barcodePortion,
      calories_per_100g: barcodeResult.calories_per_100g,
      protein_g: barcodeResult.protein_g,
      carbs_g: barcodeResult.carbs_g,
      fat_g: barcodeResult.fat_g,
      fiber_g: barcodeResult.fiber_g,
      sodium_mg_per_100g: barcodeResult.sodium_mg_per_100g,
      is_veg: barcodeResult.is_veg ?? isVeg,
      indian_context: 'Packaged product',
      confidence: 'high',
    };
    onUse(synthetic, barcodePortion, saltLevel, oilLevel, 0);
    setAddedIdx(0);
    setTimeout(() => setAddedIdx(null), 2000);
  }

  const salt = SALT_LEVELS.find(s => s.value === saltLevel)!;
  const oil  = OIL_LEVELS.find(o => o.value === oilLevel)!;

  return (
    <div className="rounded-xl" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>

      {/* ── Header ── */}
      <button onClick={() => setExpanded(e => !e)}
        className="flex w-full items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2.5">
          <Sparkles className="h-4.5 w-4.5" style={{ color: '#c084fc' }} />
          <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
            AI Food Analyser
          </span>
          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            style={{ background: 'rgba(192,132,252,.15)', color: '#c084fc' }}>
            Gemini 1.5 Flash
          </span>
          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            style={{ background: 'rgba(52,211,153,.12)', color: '#34d399' }}>
            ICMR-NIN
          </span>
        </div>
        {expanded
          ? <ChevronUp className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
          : <ChevronDown className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />}
      </button>

      {expanded && (
        <div className="border-t px-5 pb-5 space-y-4" style={{ borderColor: 'var(--border)' }}>

          {/* ── Veg / Non-veg ── */}
          <div className="flex gap-2 pt-4">
            <button onClick={() => setIsVeg(true)}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold flex-1 justify-center transition-all"
              style={{
                background: isVeg ? '#dcfce7' : 'var(--bg-card-2,var(--bg-card))',
                color: isVeg ? '#166534' : 'var(--text-muted)',
                border: `1px solid ${isVeg ? '#86efac' : 'var(--border)'}`,
              }}>
              <Leaf className="h-4 w-4" /> Vegetarian
            </button>
            <button onClick={() => setIsVeg(false)}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold flex-1 justify-center transition-all"
              style={{
                background: !isVeg ? '#fee2e2' : 'var(--bg-card-2,var(--bg-card))',
                color: !isVeg ? '#991b1b' : 'var(--text-muted)',
                border: `1px solid ${!isVeg ? '#fca5a5' : 'var(--border)'}`,
              }}>
              <Beef className="h-4 w-4" /> Non-Vegetarian
            </button>
          </div>

          {/* ── Mode tabs ── */}
          <div className="flex gap-2">
            {([
              { id: 'text',    icon: Type,    label: 'Describe food' },
              { id: 'photo',   icon: Camera,  label: 'Photo / Camera' },
              { id: 'barcode', icon: Barcode, label: 'Barcode' },
            ] as const).map(m => (
              <button key={m.id}
                onClick={() => { setMode(m.id); setResult(null); setBarcodeResult(null); setError(null); }}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all"
                style={{
                  background:  mode === m.id ? 'var(--accent-bg)' : 'transparent',
                  color:       mode === m.id ? 'var(--accent)' : 'var(--text-muted)',
                  border:      `1px solid ${mode === m.id ? 'var(--accent-border)' : 'var(--border)'}`,
                }}>
                <m.icon className="h-3.5 w-3.5" />
                {m.label}
              </button>
            ))}
          </div>

          {/* ── Input area ── */}
          {mode === 'text' && (
            <input type="text" style={inputStyle} value={textInput}
              onChange={e => setTextInput(e.target.value)}
              placeholder="e.g. 2 rotis with dal tadka and rice, or masala dosa"
              onKeyDown={e => e.key === 'Enter' && handleAnalyse()} />
          )}

          {mode === 'photo' && (
            <div>
              <input ref={fileRef} type="file" accept="image/*" capture="environment"
                className="hidden" onChange={handleFileChange} />
              <button onClick={() => fileRef.current?.click()}
                className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed py-8 text-sm font-medium transition-colors"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                <Camera className="h-6 w-6" />
                <span>{imageFile ? imageFile.name : 'Tap to take photo or choose from gallery'}</span>
              </button>
              {imagePreview && (
                <img src={imagePreview} alt="Food preview"
                  className="mt-2 w-full max-h-56 rounded-xl object-cover" />
              )}
              <p className="mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                Works for thali, single dishes, and multi-item plates. Gemini identifies each item separately.
              </p>
            </div>
          )}

          {mode === 'barcode' && (
            <div className="space-y-3">
              {/* Camera scan button */}
              <div>
                <input
                  ref={barcodeFileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setBarcodeImgPreview(URL.createObjectURL(f));
                    setScanStatus('scanning');
                    const code = await scanBarcodeFromImage(f);
                    if (code) {
                      setBarcodeInput(code.replace(/\D/g, ''));
                      setScanStatus('found');
                    } else {
                      setScanStatus('notfound');
                    }
                  }}
                />
                <button
                  onClick={() => {
                    setBarcodeImgPreview(null);
                    setScanStatus('idle');
                    barcodeFileRef.current?.click();
                  }}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed py-5 text-sm font-semibold transition-colors"
                  style={{ borderColor: 'var(--accent-border)', color: 'var(--accent)', background: 'var(--accent-bg)' }}>
                  <Camera className="h-5 w-5" />
                  {scanStatus === 'scanning' ? 'Scanning barcode…' : 'Scan barcode with camera'}
                </button>

                {/* Scan status feedback */}
                {scanStatus === 'found' && (
                  <div className="mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
                    style={{ background: 'var(--good-bg)', color: 'var(--good-text)' }}>
                    <Check className="h-4 w-4 shrink-0" />
                    Barcode detected: <strong>{barcodeInput}</strong> — tap "Look up barcode" to fetch nutrition info.
                  </div>
                )}
                {scanStatus === 'notfound' && (
                  <div className="mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
                    style={{ background: 'var(--warn-bg)', color: 'var(--warn-text)' }}>
                    <ScanLine className="h-4 w-4 shrink-0" />
                    Couldn't read barcode from photo. Please type the number manually below.
                  </div>
                )}
                {barcodeImgPreview && (
                  <img src={barcodeImgPreview} alt="Barcode scan preview"
                    className="mt-2 w-full max-h-32 rounded-lg object-cover" />
                )}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div style={{ flex:1, height:1, background:'var(--border)' }} />
                <span className="text-xs font-semibold" style={{ color:'var(--text-muted)' }}>or type manually</span>
                <div style={{ flex:1, height:1, background:'var(--border)' }} />
              </div>

              {/* Manual entry */}
              <input type="text" style={inputStyle} value={barcodeInput}
                onChange={e => { setBarcodeInput(e.target.value); setScanStatus('idle'); }}
                placeholder="Barcode number (e.g. 8901030925763)"
                onKeyDown={e => e.key === 'Enter' && handleAnalyse()} />

              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                📷 Point camera at barcode on packet · Covers Amul, Haldiram's, Britannia, Parle, Tata & 3M+ Indian products.
                Indian barcodes start with 890.
              </p>
            </div>
          )}

          {/* ── Salt & Oil (not shown for barcode) ── */}
          {mode !== 'barcode' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-2"
                  style={{ color: 'var(--text-muted)' }}>🧂 Salt level</p>
                <div className="space-y-1">
                  {SALT_LEVELS.map(sl => (
                    <button key={sl.value} onClick={() => setSaltLevel(sl.value as SaltLevel)}
                      className="flex w-full items-start gap-2 rounded-lg px-2.5 py-1.5 text-xs text-left transition-all"
                      style={{
                        background:  saltLevel === sl.value ? 'var(--accent-bg)' : 'transparent',
                        color:       saltLevel === sl.value ? 'var(--accent)' : 'var(--text-secondary)',
                        border:      `1px solid ${saltLevel === sl.value ? 'var(--accent-border)' : 'transparent'}`,
                      }}>
                      <span className="font-semibold whitespace-nowrap">{sl.label}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{sl.tip}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-2"
                  style={{ color: 'var(--text-muted)' }}>🫙 Oil level</p>
                <div className="space-y-1">
                  {OIL_LEVELS.map(ol => (
                    <button key={ol.value} onClick={() => setOilLevel(ol.value as OilLevel)}
                      className="flex w-full items-start gap-2 rounded-lg px-2.5 py-1.5 text-xs text-left transition-all"
                      style={{
                        background:  oilLevel === ol.value ? 'var(--accent-bg)' : 'transparent',
                        color:       oilLevel === ol.value ? 'var(--accent)' : 'var(--text-secondary)',
                        border:      `1px solid ${oilLevel === ol.value ? 'var(--accent-border)' : 'transparent'}`,
                      }}>
                      <span className="font-semibold whitespace-nowrap">{ol.label}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{ol.tip}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Analyse button ── */}
          <Button onClick={handleAnalyse} loading={loading} className="w-full">
            {loading
              ? <><Loader2 className="h-4 w-4 animate-spin" />Analysing with Gemini AI…</>
              : <><Sparkles className="h-4 w-4" />
                {mode === 'barcode' ? 'Look up barcode' : 'Analyse nutrition'}</>
            }
          </Button>

          {/* ── Error ── */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm"
              style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)' }}>
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ── Barcode result ── */}
          {barcodeResult && (
            <div className="rounded-xl p-4 space-y-3"
              style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' }}>
              <div className="flex gap-3">
                {barcodeResult.image_url && (
                  <img src={barcodeResult.image_url} alt={barcodeResult.food_name}
                    className="w-16 h-16 rounded-lg object-cover shrink-0"
                    onError={e => (e.currentTarget.style.display = 'none')} />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                    {barcodeResult.food_name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{barcodeResult.brand}</p>
                  <div className="flex gap-1.5 mt-1 flex-wrap">
                    {barcodeResult.is_veg !== null && (
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{ background: barcodeResult.is_veg ? '#dcfce7' : '#fee2e2', color: barcodeResult.is_veg ? '#166534' : '#991b1b' }}>
                        {barcodeResult.is_veg ? '🟢 Veg' : '🔴 Non-veg'}
                      </span>
                    )}
                    {barcodeResult.nutriscore && (
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{ background: 'var(--warn-bg)', color: 'var(--warn-text)' }}>
                        Nutri-Score {barcodeResult.nutriscore}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-2xl font-bold tabular-nums shrink-0" style={{ color: 'var(--accent)' }}>
                  {Math.round(barcodeResult.calories_per_100g * barcodePortion / 100)}
                  <span className="text-xs font-normal ml-0.5">kcal</span>
                </p>
              </div>

              <MacroGrid
                protein={barcodeResult.protein_g * barcodePortion / 100}
                carbs={barcodeResult.carbs_g * barcodePortion / 100}
                fat={barcodeResult.fat_g * barcodePortion / 100}
                fiber={barcodeResult.fiber_g * barcodePortion / 100}
              />

              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold shrink-0" style={{ color: 'var(--text-secondary)' }}>
                  Portion (g)
                </label>
                <input type="number" min={1} max={1000} value={barcodePortion}
                  onChange={e => setBarcodePortion(Number(e.target.value))}
                  style={{ ...inputStyle, width: 80 }} />
                <Button size="sm" onClick={handleAddBarcode}>
                  {addedIdx === 0 ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                  {addedIdx === 0 ? 'Added!' : 'Add to meal'}
                </Button>
              </div>
            </div>
          )}

          {/* ── Gemini multi-dish results ── */}
          {result && (
            <div className="space-y-3">
              {/* Summary header */}
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  {result.items.length > 1
                    ? `Identified ${result.items.length} items`
                    : result.food_name}
                </p>
                <div className="flex gap-1.5">
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ background: result.is_veg ? '#dcfce7' : '#fee2e2', color: result.is_veg ? '#166534' : '#991b1b' }}>
                    {result.is_veg ? '🟢 Veg' : '🔴 Non-veg'}
                  </span>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                    {result.confidence} confidence
                  </span>
                </div>
              </div>

              {/* Salt & oil note */}
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                🧂 {salt.label} · 🫙 {oil.label} · {result.indian_context}
              </p>

              {/* Individual dish cards */}
              {result.items.map((item, idx) => (
                <DishCard
                  key={idx}
                  item={item}
                  isAdded={addedIdx === idx}
                  onAdd={(portionG) => handleAddItem(idx, portionG)}
                />
              ))}

              {/* Total if multi-dish */}
              {result.items.length > 1 && (
                <div className="rounded-lg p-3"
                  style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' }}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2"
                    style={{ color: 'var(--accent)' }}>Total — all items</p>
                  <div className="grid grid-cols-5 gap-2 text-center">
                    {[
                      { label: 'Calories', val: result.items.reduce((s,i)=>s+i.calories,0).toFixed(0), unit: 'kcal', color: 'var(--accent)' },
                      { label: 'Protein',  val: result.items.reduce((s,i)=>s+i.protein_g,0).toFixed(1), unit: 'g', color: '#34d399' },
                      { label: 'Carbs',    val: result.items.reduce((s,i)=>s+i.carbs_g,0).toFixed(1), unit: 'g', color: '#fbbf24' },
                      { label: 'Fat',      val: result.items.reduce((s,i)=>s+i.fat_g,0).toFixed(1), unit: 'g', color: '#f87171' },
                      { label: 'Fiber',    val: result.items.reduce((s,i)=>s+i.fiber_g,0).toFixed(1), unit: 'g', color: '#a78bfa' },
                    ].map(m => (
                      <div key={m.label} className="rounded-lg py-2"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                        <p className="text-sm font-bold tabular-nums" style={{ color: m.color }}>{m.val}</p>
                        <p className="text-[9px] font-semibold" style={{ color: 'var(--text-muted)' }}>
                          {m.label}<br/>{m.unit}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function DishCard({ item, isAdded, onAdd }: {
  item: GeminiFoodItem; isAdded: boolean; onAdd: (portionG: number) => void;
}) {
  const [portion, setPortion] = useState(item.weight_g);
  const scale = portion / (item.weight_g || 1);

  return (
    <div className="rounded-xl p-3 space-y-2"
      style={{ background: 'var(--bg-card-2,var(--bg-card))', border: '1px solid var(--border)' }}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{item.dish}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {item.estimated_qty} {item.serving_unit} · {item.weight_g}g · {item.indian_context}
          </p>
        </div>
        <p className="text-xl font-bold tabular-nums shrink-0" style={{ color: 'var(--accent)' }}>
          {Math.round(item.calories * scale)}<span className="text-xs font-normal ml-0.5">kcal</span>
        </p>
      </div>

      <MacroGrid
        protein={item.protein_g * scale}
        carbs={item.carbs_g * scale}
        fat={item.fat_g * scale}
        fiber={item.fiber_g * scale}
      />

      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold shrink-0" style={{ color: 'var(--text-secondary)' }}>g</label>
        <input type="number" min={1} max={2000} value={portion}
          onChange={e => setPortion(Number(e.target.value))}
          style={{ padding: '4px 8px', borderRadius: 6, fontSize: 13, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none', width: 72 }} />
        <Button size="sm" onClick={() => onAdd(portion)}
          style={isAdded ? { background: 'var(--good-bg)', color: 'var(--good-text)' } : {}}>
          {isAdded ? <><Check className="h-3.5 w-3.5" />Added!</> : <><Plus className="h-3.5 w-3.5" />Add to meal</>}
        </Button>
      </div>
    </div>
  );
}

function MacroGrid({ protein, carbs, fat, fiber }: {
  protein: number; carbs: number; fat: number; fiber: number;
}) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {[
        { label: 'Protein', val: protein, color: '#34d399' },
        { label: 'Carbs',   val: carbs,   color: '#fbbf24' },
        { label: 'Fat',     val: fat,     color: '#f87171' },
        { label: 'Fiber',   val: fiber,   color: '#a78bfa' },
      ].map(m => (
        <div key={m.label} className="rounded-lg py-1.5 text-center"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-bold tabular-nums" style={{ color: m.color }}>
            {m.val.toFixed(1)}g
          </p>
          <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{m.label}</p>
        </div>
      ))}
    </div>
  );
}

/**
 * Scans a barcode from an image file using jsQR (loaded from CDN at runtime).
 * jsQR reads QR and 1D barcodes from raw pixel data.
 */
async function scanBarcodeFromImage(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      // Try jsQR for QR codes and some 1D barcodes
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const jsQR = (window as any).jsQR;
      if (jsQR) {
        const result = jsQR(imageData.data, imageData.width, imageData.height);
        if (result?.data) { resolve(result.data); return; }
      }

      // Fallback: try BarcodeDetector API (Chrome 83+, Android)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const BD = (window as any).BarcodeDetector;
      if (BD) {
        const detector = new BD({ formats: ['ean_13', 'ean_8', 'code_128', 'upc_a', 'qr_code'] });
        createImageBitmap(file).then(bitmap => {
          detector.detect(bitmap).then((codes: Array<{rawValue: string}>) => {
            resolve(codes.length > 0 ? codes[0].rawValue : null);
          }).catch(() => resolve(null));
        }).catch(() => resolve(null));
        return;
      }

      resolve(null);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res((r.result as string).split(',')[1]);
    r.onerror = () => rej(new Error('Could not read file'));
    r.readAsDataURL(file);
  });
}