'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Printer, BookOpen, Layers, CreditCard, Smartphone, MapPin, Phone, 
  Clock, Sparkles, ArrowLeft, Search, CheckCircle2, ChevronDown, 
  ExternalLink, ShoppingBag, BookMarked, PenTool, Hash, AlertCircle,
  HelpCircle, Share2, Check, Coins
} from 'lucide-react';
import { Tenant, Branch, NoteItem } from '@/types';
import { formatCurrency, convertCurrency, formatDualCurrency } from '@/lib/utils';

interface CatalogBook {
  id: string;
  title: string;
  category: string;
  author: string;
  price: number;
  available: boolean;
  cover?: string;
}

const SAMPLE_BOOKS: CatalogBook[] = [
  { id: 'b1', title: 'أساسيات البرمجة بلغة بايثون', category: 'حاسوب وتكنولوجيا', author: 'د. أحمد السعيد', price: 25000, available: true },
  { id: 'b2', title: 'مبادئ إدارة الأعمال والتسويق', category: 'اقتصاد وإدارة', author: 'د. ليلى خوري', price: 18000, available: true },
  { id: 'b3', title: 'فيزياء الأمواج والضوء الجامعية', category: 'علوم وهندسة', author: 'د. محمد كمال', price: 22000, available: true },
  { id: 'b4', title: 'قواعد اللغة الإنجليزية الأكاديمية (IELTS)', category: 'لغات', author: 'أ. سامر العلي', price: 15000, available: true },
];

const SAMPLE_STATIONERY = [
  { id: 's1', name: 'دفتر سلك جامعي 200 صفحة مقسم', price: 12000, inStock: true },
  { id: 's2', name: 'طقم أقلام حبر جاف فاخر (3 ألوان)', price: 6500, inStock: true },
  { id: 's3', name: 'آلة حاسبة علمية Casio fx-991', price: 85000, inStock: true },
  { id: 's4', name: 'ملف بلاستيك شفاف بأزرار كبس (درزن)', price: 8000, inStock: true },
];

export default function TenantBranchHubPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenant as string;
  const branchSlug = params.branch as string;

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<'SYP' | 'TRY'>('SYP');

  // Quick order search
  const [searchOrderCode, setSearchOrderCode] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);

  // Active book category filter
  const [selectedBookCategory, setSelectedBookCategory] = useState<string>('الكل');

  useEffect(() => {
    async function loadTenantAndBranch() {
      try {
        setLoading(true);
        const res = await fetch(`/api/tenants?slug=${tenantSlug}`);
        if (!res.ok) {
          throw new Error('تعذر تحميل بيانات المكتبة');
        }
        const tenantsData: Tenant[] = await res.json();
        const currentTenant = Array.isArray(tenantsData) ? tenantsData[0] : tenantsData;

        if (!currentTenant) {
          throw new Error('المكتبة المطلوبة غير متوفرة');
        }

        setTenant(currentTenant);

        // Find active branch or fallback to first
        const matchedBranch = currentTenant.branches?.find(b => b.slug === branchSlug) 
          || currentTenant.branches?.[0]
          || {
            id: 'demo-branch',
            tenant_id: currentTenant.id,
            name: 'الفرع الرئيسي',
            slug: branchSlug || 'main',
            address: 'شارع الجامعة الرئيسي',
            phone: currentTenant.contact_phone || '+963 988 776 655',
            default_currency: 'SYP',
            exchange_rate: 1.0,
            sham_cash_enabled: true,
            sham_cash_account_info: `حساب شام كاش: ${currentTenant.contact_phone || '0988776655'} - ${currentTenant.name}`,
            sham_cash_min_amount: 5000,
            auto_print_enabled: false,
            allowed_auto_print_max_pages: 50,
            is_active: true,
          };

        setBranch(matchedBranch);
        setSelectedCurrency((matchedBranch.default_currency as 'SYP' | 'TRY') || 'SYP');
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'حدث خطأ في تحميل الصفحة');
      } finally {
        setLoading(false);
      }
    }

    loadTenantAndBranch();
  }, [tenantSlug, branchSlug]);

  const handleBranchChange = (newBranchSlug: string) => {
    router.push(`/${tenantSlug}/${newBranchSlug}`);
  };

  const handleTrackOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchOrderCode.trim()) return;
    const cleanCode = searchOrderCode.trim().replace('#', '');
    router.push(`/${tenantSlug}/${branchSlug}/order/${cleanCode}`);
  };

  const handleCopyShareLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCopyShamCashAccount = (accountText: string) => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(accountText);
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2500);
    }
  };

  const renderItemPrice = (amountInBase: number) => {
    const baseCur = (branch?.default_currency as 'SYP' | 'TRY') || 'SYP';
    const rate = branch?.exchange_rate || 450;
    const showDual = branch?.show_dual_currency ?? true;

    if (showDual) {
      const { primary, secondary } = formatDualCurrency(amountInBase, selectedCurrency, baseCur, rate);
      return (
        <div className="flex flex-col items-start leading-tight">
          <span className="text-xs font-black text-slate-900">{primary}</span>
          <span className="text-[10px] text-slate-500 font-semibold">{secondary}</span>
        </div>
      );
    }

    const converted = convertCurrency(amountInBase, baseCur, selectedCurrency, rate);
    return <span className="text-xs font-black text-slate-900">{formatCurrency(converted, selectedCurrency)}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-white/60 shadow-lg">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-tenant-primary rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-700">جاري تحميل بوابة المكتبة...</p>
        </div>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/90 backdrop-blur-md rounded-3xl p-8 border border-white/80 text-center shadow-xl">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-black text-slate-900 mb-2">عذراً، المكتبة غير موجودة</h2>
          <p className="text-xs text-slate-500 mb-6">{error || 'يرجى التأكد من صحة الرابط أو رمز الـ QR'}</p>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
          >
            العودة للرئيسية
          </Link>
        </div>
      </div>
    );
  }

  const flags = tenant.feature_flags || {
    smart_print: true,
    notes_catalog: true,
    shamcash_pay: true,
    pos: false,
    inventory: false,
    multi_branch: true,
    audit_reports: true,
  };

  const otherBranches = tenant.branches?.filter(b => b.slug !== branch?.slug) || [];
  const primaryColor = tenant.primary_color || '#16a34a';

  return (
    <div className="min-h-screen pb-20">
      {/* Top Header Bar (Glassmorphic) */}
      <header className="bg-white/85 backdrop-blur-md border-b border-white/70 sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Logo & Name */}
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-md shrink-0 transition-transform hover:scale-105 border border-white/20"
              style={{ backgroundColor: primaryColor }}
            >
              {tenant.logo_url ? (
                <img src={tenant.logo_url} alt={tenant.name} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <span>{tenant.name.slice(0, 1)}</span>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-black text-slate-950 truncate flex items-center gap-1.5">
                {tenant.name}
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: primaryColor }} />
              </h1>
              <p className="text-[11px] text-slate-500 font-medium truncate">
                {branch?.name || 'الفرع الرئيسي'}
              </p>
            </div>
          </div>

          {/* Action Tools: Currency switcher, Branch switcher & Share */}
          <div className="flex items-center gap-2">
            {branch?.allow_currency_toggle !== false && (
              <div className="flex items-center bg-slate-100/90 border border-slate-200/80 rounded-xl p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setSelectedCurrency('SYP')}
                  className={`px-2.5 py-1 text-xs font-black rounded-lg transition-all ${
                    selectedCurrency === 'SYP'
                      ? 'bg-white text-slate-950 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="التحويل لليرة السورية"
                >
                  ل.س
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCurrency('TRY')}
                  className={`px-2.5 py-1 text-xs font-black rounded-lg transition-all ${
                    selectedCurrency === 'TRY'
                      ? 'bg-white text-slate-950 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="التحويل لليرة التركية"
                >
                  ₺
                </button>
              </div>
            )}

            {tenant.branches && tenant.branches.length > 1 && (
              <div className="relative group">
                <select
                  value={branch?.slug || ''}
                  onChange={(e) => handleBranchChange(e.target.value)}
                  className="text-xs font-bold bg-white/80 hover:bg-white border border-slate-200 text-slate-800 rounded-xl px-2.5 py-1.5 cursor-pointer appearance-none pr-7 pl-2 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 shadow-xs"
                >
                  {tenant.branches.map((b) => (
                    <option key={b.id} value={b.slug}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}

            <button
              onClick={handleCopyShareLink}
              title="مشاركة رابط المكتبة"
              className="p-2 rounded-xl border border-white/80 bg-white/80 hover:bg-white text-slate-600 transition-colors flex items-center justify-center shadow-xs"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Welcome Banner (Frosted Glass Panel) */}
      <section className="max-w-4xl mx-auto px-4 mt-6">
        <div className="bg-white/85 backdrop-blur-md border border-white/90 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div 
            className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-15 pointer-events-none"
            style={{ backgroundColor: primaryColor }}
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div 
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black border"
                style={{ 
                  backgroundColor: `${primaryColor}15`,
                  color: primaryColor,
                  borderColor: `${primaryColor}30`
                }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>البوابة الطلابية والخدمات الفورية</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                أهلاً بك في <span style={{ color: primaryColor }}>{tenant.name}</span>
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-xl leading-relaxed">
                {tenant.tagline || 'مركز الطباعة الذكية والخدمات الجامعية الحديثة. ارفع ملفاتك، تصفح النوط الأكاديمية، وادفع فورياً.'}
              </p>

              {/* Branch quick info bar */}
              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                {branch?.address && (
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{branch.address}</span>
                  </span>
                )}
                {branch?.phone && (
                  <a 
                    href={`tel:${branch.phone}`} 
                    className="inline-flex items-center gap-1.5 font-bold text-slate-700 hover:text-slate-900 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span dir="ltr">{branch.phone}</span>
                  </a>
                )}
                <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700 bg-emerald-50/90 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>مفتوح الآن لاستقبال الطلبات</span>
                </span>
              </div>
            </div>

            {/* Quick Track Order Widget */}
            <div className="sm:w-72 bg-white/90 border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-slate-500" />
                  تتبع طلبك السابق
                </span>
                <span className="text-[10px] text-slate-500 font-medium">برقم الكود</span>
              </div>
              <form onSubmit={handleTrackOrder} className="flex gap-2">
                <input
                  type="text"
                  placeholder="مثال: #105"
                  value={searchOrderCode}
                  onChange={(e) => setSearchOrderCode(e.target.value)}
                  className="flex-1 min-w-0 bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-xl text-white font-bold text-xs shadow-xs transition-opacity hover:opacity-95"
                  style={{ backgroundColor: primaryColor }}
                >
                  تتبع
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Main Apps & Services Grid */}
      <main className="max-w-4xl mx-auto px-4 mt-8 space-y-8">
        <div>
          <h3 className="text-base sm:text-lg font-black text-slate-950 mb-1 flex items-center gap-2">
            <span>الخدمات المتاحة للطلب الفوري</span>
            <span className="text-xs font-medium text-slate-500">({branch?.name})</span>
          </h3>
          <p className="text-xs text-slate-600 font-medium">
            اختر الخدمة المطلوبة من القائمة أدناه للبدء بالطلب مباشرة
          </p>
        </div>

        {/* Big Action Cards (Glassmorphism) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Card 1: Smart Print */}
          {flags.smart_print && (
            <div className="bg-white/88 backdrop-blur-md rounded-3xl p-6 border border-white/80 shadow-sm hover:shadow-md hover:bg-white/95 transition-all relative overflow-hidden group flex flex-col justify-between">
              <div 
                className="absolute top-0 right-0 w-28 h-28 rounded-full blur-2xl opacity-15 pointer-events-none transition-all group-hover:scale-125"
                style={{ backgroundColor: primaryColor }}
              />

              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md border border-white/20"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Printer className="w-7 h-7" />
                  </div>
                  <span 
                    className="px-3 py-1 rounded-full text-[11px] font-black border"
                    style={{ 
                      backgroundColor: `${primaryColor}15`, 
                      color: primaryColor,
                      borderColor: `${primaryColor}30` 
                    }}
                  >
                    طباعة فورية
                  </span>
                </div>

                <div>
                  <h4 className="text-lg font-black text-slate-900 group-hover:text-slate-950 transition-colors">
                    خدمة الطباعة الذكية والرفع السريع
                  </h4>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-medium">
                    ارفع ملفاتك (PDF، Word، صور)، وحدد المقاس (A4/A3) ووجه/وجهين وخيارات التغليف، مع حساب تلقائي لعدد الصفحات والتكلفة بدقة.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="px-2.5 py-1 bg-white/90 border border-slate-200/80 text-slate-700 rounded-lg text-[11px] font-bold shadow-2xs">
                    حساب الصفحات التلقائي
                  </span>
                  <span className="px-2.5 py-1 bg-white/90 border border-slate-200/80 text-slate-700 rounded-lg text-[11px] font-bold shadow-2xs">
                    أبيض وأسود / ملون
                  </span>
                  <span className="px-2.5 py-1 bg-white/90 border border-slate-200/80 text-slate-700 rounded-lg text-[11px] font-bold shadow-2xs">
                    سلك / حراري / كباس
                  </span>
                </div>
              </div>

              <div className="pt-6 relative z-10">
                <Link
                  href={`/${tenantSlug}/${branchSlug}/print?currency=${selectedCurrency}`}
                  className="w-full py-3.5 px-5 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 shadow-md hover:opacity-95 transition-all group-hover:translate-x-1"
                  style={{ backgroundColor: primaryColor }}
                >
                  <span>بدء رفع الملفات والطباعة</span>
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {/* Card 2: Notes & Study Guides Catalog */}
          {flags.notes_catalog && (
            <div className="bg-white/88 backdrop-blur-md rounded-3xl p-6 border border-white/80 shadow-sm hover:shadow-md hover:bg-white/95 transition-all relative overflow-hidden group flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-28 h-28 rounded-full blur-2xl opacity-15 pointer-events-none transition-all group-hover:scale-125 bg-amber-500" />

              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-md border border-white/20">
                    <BookOpen className="w-7 h-7" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-[11px] font-black bg-amber-50 text-amber-800 border border-amber-200/80">
                    مكتبة النوط الجامعية
                  </span>
                </div>

                <div>
                  <h4 className="text-lg font-black text-slate-900 group-hover:text-slate-950 transition-colors">
                    كتالوج النوط والملخصات الأكاديمية
                  </h4>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-medium">
                    استعرض نوط الكليات، الملخصات المعتمدة، أسئلة الدورات المحلولة، واطلب طباعتها فورياً لتكون جاهزة عند وصولك للمكتبة.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="px-2.5 py-1 bg-amber-50/90 border border-amber-200/60 text-amber-800 rounded-lg text-[11px] font-bold shadow-2xs">
                    كلية الطب والصيدلة
                  </span>
                  <span className="px-2.5 py-1 bg-amber-50/90 border border-amber-200/60 text-amber-800 rounded-lg text-[11px] font-bold shadow-2xs">
                    الهندسة المعلوماتية
                  </span>
                  <span className="px-2.5 py-1 bg-amber-50/90 border border-amber-200/60 text-amber-800 rounded-lg text-[11px] font-bold shadow-2xs">
                    الاقتصاد والعلوم
                  </span>
                </div>
              </div>

              <div className="pt-6 relative z-10">
                <Link
                  href={`/${tenantSlug}/${branchSlug}/print?tab=catalog&currency=${selectedCurrency}`}
                  className="w-full py-3.5 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all group-hover:translate-x-1"
                >
                  <span>تصفح النوط واطلب نسختك</span>
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Section: Books & Novels Catalog Preview */}
        <section className="bg-white/88 backdrop-blur-md rounded-3xl p-6 sm:p-7 border border-white/80 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <BookMarked className="w-5 h-5 text-indigo-600" />
                <h4 className="text-base font-black text-slate-900">
                  كتالوج الكتب والروايات المتوفرة في الفرع
                </h4>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                كتب ومراجع متاحة للاستلام المباشر من كاونتر {branch?.name}
              </p>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {['الكل', 'حاسوب وتكنولوجيا', 'اقتصاد وإدارة', 'علوم وهندسة', 'لغات'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedBookCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-colors whitespace-nowrap ${
                    selectedBookCategory === cat 
                      ? 'bg-indigo-600 text-white shadow-xs' 
                      : 'bg-white/80 hover:bg-white text-slate-700 border border-slate-200/60'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {SAMPLE_BOOKS
              .filter(b => selectedBookCategory === 'الكل' || b.category === selectedBookCategory)
              .map((book) => (
                <div 
                  key={book.id}
                  className="bg-white/90 border border-slate-200/70 rounded-2xl p-4 flex flex-col justify-between hover:bg-white hover:border-slate-300 transition-all shadow-xs"
                >
                  <div>
                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                      {book.category}
                    </span>
                    <h5 className="text-xs font-black text-slate-900 mt-2 line-clamp-2">
                      {book.title}
                    </h5>
                    <p className="text-[11px] text-slate-500 font-medium mt-1">
                      {book.author}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      {renderItemPrice(book.price)}
                    </div>
                    <Link
                      href={`/${tenantSlug}/${branchSlug}/print?book=${book.id}&currency=${selectedCurrency}`}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <span>طلب حجز</span>
                      <ArrowLeft className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
          </div>
        </section>

        {/* Section: Stationery & Supplies */}
        <section className="bg-white/88 backdrop-blur-md rounded-3xl p-6 sm:p-7 border border-white/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PenTool className="w-5 h-5 text-rose-500" />
              <div>
                <h4 className="text-base font-black text-slate-900">
                  القرطاسية والمستلزمات الجامعية السريعة
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  أدوات دراسية وأدوات هندسة متوفرة على الرفوف
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-400">متوفر في الكاونتر</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {SAMPLE_STATIONERY.map((item) => (
              <div 
                key={item.id}
                className="bg-white/90 border border-slate-200/70 rounded-2xl p-4 flex flex-col justify-between shadow-xs"
              >
                <div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                    متوفر بالمخزون
                  </span>
                  <h5 className="text-xs font-bold text-slate-900 mt-2">
                    {item.name}
                  </h5>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    {renderItemPrice(item.price)}
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">استلام فوري</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section: Sham Cash Info Card */}
        {flags.shamcash_pay && branch?.sham_cash_enabled && (
          <section className="bg-gradient-to-br from-emerald-800 to-teal-900 text-white rounded-3xl p-6 sm:p-7 shadow-lg relative overflow-hidden border border-white/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative z-10">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-bold text-emerald-200 border border-white/10">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>طريقة الدفع الرقمية المعتمدة</span>
                </div>
                <h4 className="text-lg sm:text-xl font-black">
                  الدفع السريع عبر شام كاش (Sham Cash)
                </h4>
                <p className="text-xs text-emerald-100 max-w-lg leading-relaxed">
                  يمكنك الدفع المسبق لطلباتك عبر تطبيق شام كاش لضمان بدء الطباعة تلقائياً واستلام أوراقك جاهزة دون انتظار في الطابور.
                </p>
                <div className="pt-1">
                  <span className="text-xs font-mono bg-black/25 px-3 py-1.5 rounded-xl border border-white/15 inline-block font-bold">
                    {branch.sham_cash_account_info || `حساب: ${branch.phone}`}
                  </span>
                </div>
              </div>

              <div className="flex sm:flex-col items-center gap-2 shrink-0 w-full sm:w-auto">
                <button
                  onClick={() => handleCopyShamCashAccount(branch.sham_cash_account_info || branch.phone || '')}
                  className="flex-1 sm:flex-none w-full px-4 py-2.5 rounded-xl bg-white text-emerald-950 font-black text-xs hover:bg-emerald-50 transition-colors shadow-sm flex items-center justify-center gap-1.5"
                >
                  {copiedAccount ? <Check className="w-4 h-4 text-emerald-700" /> : <Smartphone className="w-4 h-4 text-emerald-800" />}
                  <span>{copiedAccount ? 'تم نسخ الحساب' : 'نسخ رقم الحساب'}</span>
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Other Branches Switcher if available */}
        {otherBranches.length > 0 && (
          <section className="bg-white/88 backdrop-blur-md rounded-3xl p-6 border border-white/80 shadow-sm">
            <h4 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-500" />
              <span>فروع أخرى تابعة لـ {tenant.name}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {otherBranches.map((other) => (
                <button
                  key={other.id}
                  onClick={() => handleBranchChange(other.slug)}
                  className="p-4 rounded-2xl bg-white/90 hover:bg-white border border-slate-200/80 text-right transition-colors flex items-center justify-between group shadow-xs"
                >
                  <div>
                    <span className="text-xs font-black text-slate-900 block group-hover:text-slate-950">
                      {other.name}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">
                      {other.address}
                    </span>
                  </div>
                  <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-slate-800 transition-transform group-hover:-translate-x-1" />
                </button>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-4 mt-12 text-center text-xs text-slate-500 font-medium space-y-2">
        <p>
          {tenant.name} &bull; جميع الحقوق محفوظة &bull; {branch?.address}
        </p>
        <p className="text-[11px] text-slate-400">
          مشغّل بواسطة <Link href="/" className="font-bold underline hover:text-slate-700">منصة مكتبتي SaaS</Link> للطباعة الذكية
        </p>
      </footer>
    </div>
  );
}
