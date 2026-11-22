'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Settings, DollarSign, Smartphone, Save, CheckCircle2, 
  ShieldCheck, Palette, ExternalLink, Sparkles, Building2,
  Check, RefreshCw, Coins
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { ModuleRouteGuard } from '@/components/ModuleRouteGuard';
import { Tenant, BackgroundTheme } from '@/types';

const COLOR_PRESETS = [
  { name: 'أخضر زمردي', primary: '#16a34a', secondary: '#052e16' },
  { name: 'أزرق نيلي', primary: '#4f46e5', secondary: '#1e1b4b' },
  { name: 'أحمر قرمزي', primary: '#dc2626', secondary: '#450a0a' },
  { name: 'عنّابي فاخر', primary: '#9f1239', secondary: '#4c0519' },
  { name: 'أزرق بحري', primary: '#0284c7', secondary: '#082f49' },
  { name: 'بنفسجي ملكي', primary: '#7c3aed', secondary: '#2e1065' },
];

const THEME_OPTIONS: { key: BackgroundTheme; name: string; desc: string }[] = [
  { key: 'damascus_geometric', name: 'الزخرفة الهندسية الشامية', desc: 'نجوم ثمانية ومضلعات مدمجة مستوحاة من العمارة الدمشقية' },
  { key: 'arabesque_floral', name: 'الأرابيسك والنقوش النباتية', desc: 'قواقع وأغصان لولبية دمشقية مقتبسة من الفسيفساء والموزاييك' },
  { key: 'islamic_calligraphy', name: 'الخط العربي التجريدي', desc: 'حروفيات ديوانية وانحناءات كوفية انسيابية تحاكي المخطوطات' },
  { key: 'mashrabiya_lattice', name: 'المشربية والشبابيك الشامية', desc: 'شبكات الأرابيسك الخشبية التراثية لقاعات القراءة' },
  { key: 'custom', name: 'صورة مخصصة', desc: 'رفع رابط صورة خلفية خاصة بالمكتبة' },
];

export default function SettingsPage() {
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loadingTenant, setLoadingTenant] = useState(true);
  const [tenant, setTenant] = useState<Tenant | null>(null);

  // Identity & Branding State
  const [libraryName, setLibraryName] = useState('مكتبة النور الحديثة');
  const [tagline, setTagline] = useState('مركز الطباعة الذكية والخدمات الجامعية الحديثة');
  const [primaryColor, setPrimaryColor] = useState('#16a34a');
  const [secondaryColor, setSecondaryColor] = useState('#052e16');
  const [backgroundTheme, setBackgroundTheme] = useState<BackgroundTheme>('damascus_geometric');
  const [customBackgroundUrl, setCustomBackgroundUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');

  // Pricing state
  const [a4BwSimplex, setA4BwSimplex] = useState(300);
  const [a4BwDuplex, setA4BwDuplex] = useState(500);
  const [a4ColorSimplex, setA4ColorSimplex] = useState(1200);
  const [a4ColorDuplex, setA4ColorDuplex] = useState(2000);
  const [a3BwSimplex, setA3BwSimplex] = useState(800);
  const [a3ColorSimplex, setA3ColorSimplex] = useState(2500);

  // Finishing services
  const [staplePrice, setStaplePrice] = useState(500);
  const [spiralPrice, setSpiralPrice] = useState(4000);
  const [laminationPrice, setLaminationPrice] = useState(3000);

  // Sham Cash & Currency
  const [currency, setCurrency] = useState('SYP');
  const [exchangeRate, setExchangeRate] = useState(1.0);
  const [shamCashInfo, setShamCashInfo] = useState('حساب شام كاش: 0988776655 - مكتبة النور');
  const [shamCashMinAmount, setShamCashMinAmount] = useState(10000);
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(false);

  useEffect(() => {
    async function loadCurrentTenant() {
      try {
        setLoadingTenant(true);
        const res = await fetch('/api/tenants?slug=al-noor');
        if (res.ok) {
          const data = await res.json();
          const t: Tenant = Array.isArray(data) ? data[0] : data;
          if (t) {
            setTenant(t);
            setLibraryName(t.name || 'مكتبة النور الحديثة');
            setTagline(t.tagline || 'مركز الطباعة الذكية والخدمات الجامعية الحديثة');
            setPrimaryColor(t.primary_color || '#16a34a');
            setSecondaryColor(t.secondary_color || '#052e16');
            setBackgroundTheme(t.background_theme || 'damascus_geometric');
            setCustomBackgroundUrl(t.custom_background_url || '');
            setLogoUrl(t.logo_url || '');
            setCoverImageUrl(t.cover_image_url || '');
          }
        }
      } catch (err) {
        console.error('Failed to load tenant branding:', err);
      } finally {
        setLoadingTenant(false);
      }
    }

    loadCurrentTenant();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Persist branding to /api/tenants
    if (tenant?.id) {
      try {
        await fetch('/api/tenants', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: tenant.id,
            name: libraryName,
            tagline: tagline,
            primary_color: primaryColor,
            secondary_color: secondaryColor,
            background_theme: backgroundTheme,
            custom_background_url: customBackgroundUrl || null,
            logo_url: logoUrl || null,
            cover_image_url: coverImageUrl || null,
          }),
        });
      } catch (err) {
        console.error('Error saving branding:', err);
      }
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <ModuleRouteGuard moduleKey="shamcash_pay">
      <form onSubmit={handleSave} className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Settings className="w-6 h-6 text-brand-600" />
              إعدادات المكتبة، الهوية البصرية، والأسعار
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              تخصيص الهوية والألوان لبوابة الزبون، أسعار الطباعة، وإعدادات الدفع بشام كاش
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`/${tenant?.slug || 'al-noor'}/${tenant?.branches?.[0]?.slug || 'campus'}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5"
            >
              <span>معاينة بوابة الزبون</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition-all flex items-center gap-1.5"
            >
              {savedSuccess ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Save className="w-4 h-4" />}
              {savedSuccess ? 'تم حفظ التعديلات بنجاح' : 'حفظ التغييرات'}
            </button>
          </div>
        </div>

        {/* Section 1: Library Identity & Theming (White-Labeling) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: primaryColor }}
              >
                <Palette className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900">
                  الهوية البصرية وألوان واجهة الزبائن (Theming)
                </h3>
                <p className="text-[11px] text-slate-500">
                  تنعكس هذه الألوان والشعار تلقائياً على واجهات الزبائن ورموز الـ QR عبر متغيرات CSS
                </p>
              </div>
            </div>

            {/* Live Color Pill */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200">
              <span className="w-3.5 h-3.5 rounded-full inline-block shadow-xs" style={{ backgroundColor: primaryColor }} />
              <span className="text-xs font-mono font-bold text-slate-700">{primaryColor}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">اسم المكتبة التجاري</label>
              <input
                type="text"
                value={libraryName}
                onChange={e => setLibraryName(e.target.value)}
                className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">الشعار اللفظي (Tagline)</label>
              <input
                type="text"
                value={tagline}
                onChange={e => setTagline(e.target.value)}
                placeholder="مثال: مركز الطباعة الذكية والخدمات الجامعية الحديثة"
                className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Color Palettes Selection */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold text-slate-700 block">
              اختر لون الهوية الأساسي (أو أدخل كود Hex مخصص):
            </label>
            <div className="flex flex-wrap items-center gap-2.5">
              {COLOR_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset.primary}
                  onClick={() => {
                    setPrimaryColor(preset.primary);
                    setSecondaryColor(preset.secondary);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                    primaryColor.toLowerCase() === preset.primary.toLowerCase()
                      ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: preset.primary }} />
                  <span>{preset.name}</span>
                  {primaryColor.toLowerCase() === preset.primary.toLowerCase() && (
                    <Check className="w-3.5 h-3.5 text-white" />
                  )}
                </button>
              ))}

              {/* Custom Color Input */}
              <div className="flex items-center gap-2 border border-slate-200 rounded-xl p-1 bg-slate-50">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={e => setPrimaryColor(e.target.value)}
                  className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={e => setPrimaryColor(e.target.value)}
                  className="w-20 text-xs font-mono font-bold bg-transparent border-0 focus:outline-none text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Background Damascus Theme Selector */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-800 block">
                  نمط الخلفية الدمشقية المتحركة (Kinetic Animated Wallpaper):
                </label>
                <span className="text-[11px] text-slate-500">
                  تتحرك الخلفية بنعومة وسلاسة في واجهات الزبائن بنظام Ken Burns Effect
                </span>
              </div>
              <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-lg border border-brand-200">
                {THEME_OPTIONS.find(t => t.key === backgroundTheme)?.name}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {THEME_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.key}
                  onClick={() => setBackgroundTheme(opt.key)}
                  className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                    backgroundTheme === opt.key
                      ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-500/20 text-slate-950 shadow-xs'
                      : 'border-slate-200 bg-slate-50/70 hover:bg-white text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <span className="font-bold text-xs text-slate-900">{opt.name}</span>
                    {backgroundTheme === opt.key && <Check className="w-4 h-4 text-brand-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{opt.desc}</p>
                </button>
              ))}
            </div>

            {backgroundTheme === 'custom' && (
              <div className="pt-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  رابط صورة الخلفية المخصصة (URL):
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/custom-wallpaper.jpg"
                  value={customBackgroundUrl}
                  onChange={e => setCustomBackgroundUrl(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* Pricing & Operations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pricing Matrix */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-brand-600" />
              مصفوفة أسعار الطباعة للورقة (ل.س)
            </h3>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">A4 أبيض وأسود (وجه واحد)</label>
                <input
                  type="number"
                  value={a4BwSimplex}
                  onChange={e => setA4BwSimplex(Number(e.target.value))}
                  className="w-full text-xs font-bold bg-slate-50 border rounded-lg p-2.5"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">A4 أبيض وأسود (وجهين)</label>
                <input
                  type="number"
                  value={a4BwDuplex}
                  onChange={e => setA4BwDuplex(Number(e.target.value))}
                  className="w-full text-xs font-bold bg-slate-50 border rounded-lg p-2.5"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">A4 ملون كامل (وجه واحد)</label>
                <input
                  type="number"
                  value={a4ColorSimplex}
                  onChange={e => setA4ColorSimplex(Number(e.target.value))}
                  className="w-full text-xs font-bold bg-slate-50 border rounded-lg p-2.5"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">A4 ملون كامل (وجهين)</label>
                <input
                  type="number"
                  value={a4ColorDuplex}
                  onChange={e => setA4ColorDuplex(Number(e.target.value))}
                  className="w-full text-xs font-bold bg-slate-50 border rounded-lg p-2.5"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">A3 كبير أبيض وأسود</label>
                <input
                  type="number"
                  value={a3BwSimplex}
                  onChange={e => setA3BwSimplex(Number(e.target.value))}
                  className="w-full text-xs font-bold bg-slate-50 border rounded-lg p-2.5"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">A3 كبير ملون</label>
                <input
                  type="number"
                  value={a3ColorSimplex}
                  onChange={e => setA3ColorSimplex(Number(e.target.value))}
                  className="w-full text-xs font-bold bg-slate-50 border rounded-lg p-2.5"
                />
              </div>
            </div>

            <h4 className="font-bold text-sm text-slate-800 pt-3 border-t">أسعار التشطيب والخدمات الإضافية</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">تكبيس ودبابيس</label>
                <input
                  type="number"
                  value={staplePrice}
                  onChange={e => setStaplePrice(Number(e.target.value))}
                  className="w-full text-xs font-bold bg-slate-50 border rounded-lg p-2.5"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">تسليك حلزوني</label>
                <input
                  type="number"
                  value={spiralPrice}
                  onChange={e => setSpiralPrice(Number(e.target.value))}
                  className="w-full text-xs font-bold bg-slate-50 border rounded-lg p-2.5"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">تغليف حراري</label>
                <input
                  type="number"
                  value={laminationPrice}
                  onChange={e => setLaminationPrice(Number(e.target.value))}
                  className="w-full text-xs font-bold bg-slate-50 border rounded-lg p-2.5"
                />
              </div>
            </div>
          </div>

          {/* Sham Cash & Operating Settings */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-blue-600" />
              إعدادات شام كاش والدفع المسبق
            </h3>

            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">بيانات الحساب / المعرف (شام كاش)</label>
                <input
                  type="text"
                  value={shamCashInfo}
                  onChange={e => setShamCashInfo(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  الحد الأدنى لفرض الدفع المسبق (ل.س)
                </label>
                <input
                  type="number"
                  value={shamCashMinAmount}
                  onChange={e => setShamCashMinAmount(Number(e.target.value))}
                  className="w-full text-xs font-bold bg-slate-50 border rounded-lg p-2.5"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  إذا تجاوز الطلب هذا المبلغ (أو كان طلباً عن بُعد)، يُلزم الزبون بتحويل المبلغ وإرفاق الإيصال
                </span>
              </div>

              <div className="pt-3 border-t">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-600 block">العملة الأساسية وسعر الصرف</label>
                  <Link href="/dashboard/pricing" className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1">
                    <span>إدارة أسعار وصرف العملتين (₺/ل.س)</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="w-full text-xs font-semibold bg-slate-50 border rounded-lg p-2.5"
                  >
                    <option value="SYP">ليرة سورية (SYP - ل.س)</option>
                    <option value="TRY">ليرة تركية (TRY - ₺)</option>
                  </select>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={exchangeRate}
                      onChange={e => setExchangeRate(Number(e.target.value))}
                      placeholder="1 ₺ = كم ل.س"
                      className="w-full text-xs font-semibold bg-slate-50 border rounded-lg p-2.5 pr-2 pl-12"
                    />
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                      ل.س/₺
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoPrintEnabled}
                    onChange={e => setAutoPrintEnabled(e.target.checked)}
                    className="w-4 h-4 text-brand-600 rounded"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">تفعيل الطباعة التلقائية الفورية</span>
                    <span className="text-[11px] text-slate-400">
                      إرسال الطلبات إلى الطابعة فور وصولها دون انتظار ضغط الموظف على زر الاعتماد
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </form>
    </ModuleRouteGuard>
  );
}
