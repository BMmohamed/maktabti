'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  DollarSign, Calculator, ArrowRightLeft, Check, Save, 
  CheckCircle2, Sparkles, RefreshCw, Smartphone, Layers,
  ExternalLink, Info, Coins
} from 'lucide-react';
import { formatCurrency, convertCurrency } from '@/lib/utils';
import { ModuleRouteGuard } from '@/components/ModuleRouteGuard';
import { Tenant, Branch } from '@/types';

export default function PricingAndCurrencyPage() {
  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');

  // Currency Settings
  const [baseCurrency, setBaseCurrency] = useState<'SYP' | 'TRY'>('SYP');
  const [exchangeRate, setExchangeRate] = useState<number>(450); // 1 TRY = 450 SYP
  const [showDualCurrency, setShowDualCurrency] = useState<boolean>(true);
  const [allowCurrencyToggle, setAllowCurrencyToggle] = useState<boolean>(true);

  // Pricing matrix (stored in base currency)
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

  // Fetch tenant & branch settings
  useEffect(() => {
    async function loadTenantData() {
      try {
        setLoading(true);
        const res = await fetch('/api/tenants?slug=al-noor');
        if (res.ok) {
          const data = await res.json();
          const t: Tenant = Array.isArray(data) ? data[0] : data;
          if (t) {
            setTenant(t);
            const br = t.branches?.[0];
            if (br) {
              setSelectedBranchId(br.id);
              setBaseCurrency((br.default_currency as 'SYP' | 'TRY') || 'SYP');
              setExchangeRate(br.exchange_rate > 10 ? br.exchange_rate : 450);
              setShowDualCurrency(br.show_dual_currency ?? true);
              setAllowCurrencyToggle(br.allow_currency_toggle ?? true);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load pricing data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadTenantData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    try {
      await fetch('/api/tenants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: tenant.id,
          branch_id: selectedBranchId,
          default_currency: baseCurrency,
          exchange_rate: exchangeRate,
          show_dual_currency: showDualCurrency,
          allow_currency_toggle: allowCurrencyToggle,
        }),
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving pricing:', err);
    }
  };

  const getSecondaryPrice = (amountInBase: number) => {
    const target = baseCurrency === 'SYP' ? 'TRY' : 'SYP';
    const converted = convertCurrency(amountInBase, baseCurrency, target, exchangeRate);
    return formatCurrency(converted, target);
  };

  return (
    <ModuleRouteGuard moduleKey="smart_print">
      <form onSubmit={handleSave} className="space-y-6 max-w-6xl mx-auto pb-16">
        {/* Header */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold border border-brand-200 mb-2">
              <Coins className="w-3.5 h-3.5 text-brand-600" />
              <span>نظام العملة المزدوجة (الليرة السورية SYP & الليرة التركية TRY)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-brand-600" />
              إعدادات أسعار الطباعة وسعر الصرف المزدوج
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              تحديد العملة الأساسية للتسعير، ربط سعر الصرف التلقائي، والتحكم في طريقة عرض العملات للزبون
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href={`/${tenant?.slug || 'al-noor'}/${tenant?.branches?.[0]?.slug || 'campus'}`}
              target="_blank"
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5"
            >
              <span>معاينة واجهة الزبون</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition-all flex items-center gap-1.5"
            >
              {savedSuccess ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Save className="w-4 h-4" />}
              <span>{savedSuccess ? 'تم حفظ الأسعار والصرف' : 'حفظ التعديلات'}</span>
            </button>
          </div>
        </div>

        {/* Currency & Exchange Rate Hub Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                1. العملة الأساسية وسعر الصرف اللحظي
              </h2>
              <p className="text-xs text-slate-500">
                حدد العملة المعتمدة في مصفوفة الأسعار، وقيمة تحويل الليرة التركية إلى السورية
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Base Currency Selection */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-800 block">
                العملة الأساسية لتسعير المنتجات والطباعة:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setBaseCurrency('SYP')}
                  className={`p-4 rounded-2xl border-2 text-right transition-all flex flex-col justify-between ${
                    baseCurrency === 'SYP'
                      ? 'border-brand-600 bg-brand-50/40 ring-2 ring-brand-500/20 text-slate-900 shadow-xs'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className="font-black text-sm">الليرة السورية</span>
                    <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      SYP
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    رمز (ل.س) - العملة المعتمدة محلياً
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setBaseCurrency('TRY')}
                  className={`p-4 rounded-2xl border-2 text-right transition-all flex flex-col justify-between ${
                    baseCurrency === 'TRY'
                      ? 'border-brand-600 bg-brand-50/40 ring-2 ring-brand-500/20 text-slate-900 shadow-xs'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className="font-black text-sm">الليرة التركية</span>
                    <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      TRY
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    رمز (₺) - تسعير بالليرة التركية
                  </p>
                </button>
              </div>
            </div>

            {/* Exchange Rate Input & Converter */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-800 block">
                سعر صرف الليرة التركية مقابل السورية (1 ₺ = ؟ ل.س):
              </label>

              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(Number(e.target.value))}
                    className="w-full text-base font-black bg-slate-50 border border-slate-200 rounded-2xl p-3 pr-10 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    ل.س
                  </span>
                </div>
                <div className="p-3 bg-slate-100 rounded-2xl border border-slate-200 text-center shrink-0">
                  <span className="text-xs font-bold text-slate-700 block">المعادلة:</span>
                  <span className="text-xs font-mono font-black text-brand-700">
                    1 ₺ = {exchangeRate} ل.س
                  </span>
                </div>
              </div>

              {/* Quick Converter Preview Tool */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
                <span className="font-medium">مثال تطبيقي للتحويل اللحظي:</span>
                <span className="font-bold text-slate-900 font-mono">
                  10 ₺ = {formatCurrency(10 * exchangeRate, 'SYP')} | 50,000 ل.س = {formatCurrency(50000 / exchangeRate, 'TRY')}
                </span>
              </div>
            </div>
          </div>

          {/* Customer Display Preferences */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <span className="text-xs font-bold text-slate-800 block">
              2. خيارات عرض الأسعار في واجهة الزبون:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer bg-white">
                <input
                  type="checkbox"
                  checked={allowCurrencyToggle}
                  onChange={(e) => setAllowCurrencyToggle(e.target.checked)}
                  className="w-4 h-4 text-brand-600 rounded mt-0.5"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    إظهار زر التبديل السريع (ل.س / ₺) أعلى صفحة الزبون
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block leading-relaxed">
                    يتيح للزبون الضغط على زر في الهيدر لتبديل كافة أسعار الموقع فورياً حسب الصرف
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer bg-white">
                <input
                  type="checkbox"
                  checked={showDualCurrency}
                  onChange={(e) => setShowDualCurrency(e.target.checked)}
                  className="w-4 h-4 text-brand-600 rounded mt-0.5"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    عرض العملتين معاً (Dual Pricing) في البطاقات وتتبع الطلب
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block leading-relaxed">
                    يعرض السعر الأساسي بالخط العريض، وأسفله مباشرة السعر المقابل بالعملة الأخرى
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Pricing Matrix with Live Dual Currency Preview */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-brand-600" />
                3. مصفوفة أسعار الطباعة لكل ورقة
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                الأسعار مدخلة بالـ ({baseCurrency === 'SYP' ? 'ليرة سورية' : 'ليرة تركية'})، وتظهر القيمة المقابلة بالعملة الأخرى تلقائياً
              </p>
            </div>

            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">
              العملة الفعالة: {baseCurrency === 'SYP' ? 'ل.س' : '₺'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* A4 B&W Simplex */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
              <label className="text-xs font-bold text-slate-700 block">A4 أبيض وأسود (وجه واحد)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={a4BwSimplex}
                  onChange={(e) => setA4BwSimplex(Number(e.target.value))}
                  className="w-full text-xs font-black bg-white border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <span className="text-xs font-bold text-slate-500 shrink-0">{baseCurrency === 'SYP' ? 'ل.س' : '₺'}</span>
              </div>
              <span className="text-[11px] font-bold text-slate-500 block">
                المقابل: <strong className="text-brand-700">{getSecondaryPrice(a4BwSimplex)}</strong>
              </span>
            </div>

            {/* A4 B&W Duplex */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
              <label className="text-xs font-bold text-slate-700 block">A4 أبيض وأسود (وجهين)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={a4BwDuplex}
                  onChange={(e) => setA4BwDuplex(Number(e.target.value))}
                  className="w-full text-xs font-black bg-white border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <span className="text-xs font-bold text-slate-500 shrink-0">{baseCurrency === 'SYP' ? 'ل.س' : '₺'}</span>
              </div>
              <span className="text-[11px] font-bold text-slate-500 block">
                المقابل: <strong className="text-brand-700">{getSecondaryPrice(a4BwDuplex)}</strong>
              </span>
            </div>

            {/* A4 Color Simplex */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
              <label className="text-xs font-bold text-slate-700 block">A4 ملون كامل (وجه واحد)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={a4ColorSimplex}
                  onChange={(e) => setA4ColorSimplex(Number(e.target.value))}
                  className="w-full text-xs font-black bg-white border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <span className="text-xs font-bold text-slate-500 shrink-0">{baseCurrency === 'SYP' ? 'ل.س' : '₺'}</span>
              </div>
              <span className="text-[11px] font-bold text-slate-500 block">
                المقابل: <strong className="text-brand-700">{getSecondaryPrice(a4ColorSimplex)}</strong>
              </span>
            </div>

            {/* A4 Color Duplex */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
              <label className="text-xs font-bold text-slate-700 block">A4 ملون كامل (وجهين)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={a4ColorDuplex}
                  onChange={(e) => setA4ColorDuplex(Number(e.target.value))}
                  className="w-full text-xs font-black bg-white border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <span className="text-xs font-bold text-slate-500 shrink-0">{baseCurrency === 'SYP' ? 'ل.س' : '₺'}</span>
              </div>
              <span className="text-[11px] font-bold text-slate-500 block">
                المقابل: <strong className="text-brand-700">{getSecondaryPrice(a4ColorDuplex)}</strong>
              </span>
            </div>

            {/* A3 B&W */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
              <label className="text-xs font-bold text-slate-700 block">A3 كبير أبيض وأسود</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={a3BwSimplex}
                  onChange={(e) => setA3BwSimplex(Number(e.target.value))}
                  className="w-full text-xs font-black bg-white border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <span className="text-xs font-bold text-slate-500 shrink-0">{baseCurrency === 'SYP' ? 'ل.س' : '₺'}</span>
              </div>
              <span className="text-[11px] font-bold text-slate-500 block">
                المقابل: <strong className="text-brand-700">{getSecondaryPrice(a3BwSimplex)}</strong>
              </span>
            </div>

            {/* A3 Color */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
              <label className="text-xs font-bold text-slate-700 block">A3 كبير ملون كامل</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={a3ColorSimplex}
                  onChange={(e) => setA3ColorSimplex(Number(e.target.value))}
                  className="w-full text-xs font-black bg-white border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <span className="text-xs font-bold text-slate-500 shrink-0">{baseCurrency === 'SYP' ? 'ل.س' : '₺'}</span>
              </div>
              <span className="text-[11px] font-bold text-slate-500 block">
                المقابل: <strong className="text-brand-700">{getSecondaryPrice(a3ColorSimplex)}</strong>
              </span>
            </div>
          </div>

          <h3 className="font-bold text-sm text-slate-800 pt-3 border-t">أسعار التشطيب والتغليف:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <label className="text-xs font-semibold text-slate-600 block mb-1">تكبيس ودبابيس</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={staplePrice}
                  onChange={(e) => setStaplePrice(Number(e.target.value))}
                  className="w-full text-xs font-bold bg-white border border-slate-200 rounded-lg p-2"
                />
                <span className="text-xs text-slate-500">{baseCurrency === 'SYP' ? 'ل.س' : '₺'}</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                المقابل: {getSecondaryPrice(staplePrice)}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <label className="text-xs font-semibold text-slate-600 block mb-1">تسليك حلزوني سلك</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={spiralPrice}
                  onChange={(e) => setSpiralPrice(Number(e.target.value))}
                  className="w-full text-xs font-bold bg-white border border-slate-200 rounded-lg p-2"
                />
                <span className="text-xs text-slate-500">{baseCurrency === 'SYP' ? 'ل.س' : '₺'}</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                المقابل: {getSecondaryPrice(spiralPrice)}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <label className="text-xs font-semibold text-slate-600 block mb-1">تغليف حراري لاميناسيون</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={laminationPrice}
                  onChange={(e) => setLaminationPrice(Number(e.target.value))}
                  className="w-full text-xs font-bold bg-white border border-slate-200 rounded-lg p-2"
                />
                <span className="text-xs text-slate-500">{baseCurrency === 'SYP' ? 'ل.س' : '₺'}</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                المقابل: {getSecondaryPrice(laminationPrice)}
              </span>
            </div>
          </div>
        </div>
      </form>
    </ModuleRouteGuard>
  );
}
