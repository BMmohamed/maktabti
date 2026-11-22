'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Upload, FileText, BookOpen, Layers, Check, Plus, Trash2, 
  CreditCard, Smartphone, MapPin, Phone, ShieldCheck, ArrowRight,
  Info, Sparkles, Loader2, AlertCircle, ArrowLeft, Coins
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { 
  Tenant, Branch, PrintPricing, PrintService, NoteItem, 
  PrintOrderItem, OrderType, PaperSize, ColorMode, DuplexMode 
} from '@/types';
import { formatCurrency, calculateItemPrice, convertCurrency, formatDualCurrency } from '@/lib/utils';
import { getPdfPageCount } from '@/lib/pdf-counter';
import { ShamCashModal } from '@/components/ShamCashModal';

export default function PrintOrderWizardPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tenantSlug = params.tenant as string;
  const branchSlug = params.branch as string;
  const initialTab = searchParams.get('tab') === 'catalog' ? 'catalog' : 'upload';
  const currencyParam = searchParams.get('currency');

  // State
  const [selectedCurrency, setSelectedCurrency] = useState<'SYP' | 'TRY'>(
    (currencyParam === 'TRY' || currencyParam === 'SYP') ? currencyParam : 'SYP'
  );
  const [loading, setLoading] = useState(true);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [pricingList, setPricingList] = useState<PrintPricing[]>([]);
  const [servicesList, setServicesList] = useState<PrintService[]>([]);
  const [notesCatalog, setNotesCatalog] = useState<NoteItem[]>([]);

  // Order Details
  const [orderType, setOrderType] = useState<OrderType>('in_store');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');

  // Items in current order
  const [orderItems, setOrderItems] = useState<PrintOrderItem[]>([]);
  const [activeTab, setActiveTab] = useState<'upload' | 'catalog'>(initialTab);

  // Notes filtering
  const [catalogSearch, setCatalogSearch] = useState<string>('');

  // Sham Cash payment modal & state
  const [isShamCashModalOpen, setIsShamCashModalOpen] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function loadShopData() {
      try {
        setLoading(true);

        // Fetch tenant from local API or Supabase
        const res = await fetch(`/api/tenants?slug=${tenantSlug}`);
        let tenantData: Tenant | null = null;
        if (res.ok) {
          tenantData = await res.json();
        }

        if (tenantData) {
          setTenant(tenantData);
          // Pick matching branch or default
          const matchingBranch = tenantData.branches?.find(b => b.slug === branchSlug) || tenantData.branches?.[0] || {
            id: 'b1000000-0000-0000-0000-000000000001',
            tenant_id: tenantData.id,
            name: 'فرع مجمع الكليات الجامعي',
            slug: branchSlug,
            address: 'بوابة كلية العلوم - مقابل مجمع الكليات',
            phone: tenantData.contact_phone || '+963 988 776 655',
            default_currency: 'SYP',
            exchange_rate: 1.0,
            sham_cash_enabled: true,
            sham_cash_account_info: 'حساب شام كاش: 0988776655 - ' + tenantData.name,
            sham_cash_min_amount: 10000,
            auto_print_enabled: false,
            allowed_auto_print_max_pages: 50,
            is_active: true,
          };
          setBranch(matchingBranch);
          if (!currencyParam) {
            setSelectedCurrency((matchingBranch.default_currency as 'SYP' | 'TRY') || 'SYP');
          }
        }

        setPricingList([
          { id: '1', tenant_id: '1', paper_size: 'A4', color_mode: 'bw', duplex: 'simplex', price_per_page: 300 },
          { id: '2', tenant_id: '1', paper_size: 'A4', color_mode: 'bw', duplex: 'duplex', price_per_page: 500 },
          { id: '3', tenant_id: '1', paper_size: 'A4', color_mode: 'color', duplex: 'simplex', price_per_page: 1200 },
          { id: '4', tenant_id: '1', paper_size: 'A4', color_mode: 'color', duplex: 'duplex', price_per_page: 2000 },
          { id: '5', tenant_id: '1', paper_size: 'A3', color_mode: 'bw', duplex: 'simplex', price_per_page: 800 },
          { id: '6', tenant_id: '1', paper_size: 'A3', color_mode: 'color', duplex: 'simplex', price_per_page: 2500 },
        ]);

        setServicesList([
          { id: '1', tenant_id: '1', service_key: 'staple', name_ar: 'تكبيس زاوية / منتصف', price: 500, is_available: true },
          { id: '2', tenant_id: '1', service_key: 'spiral_binding', name_ar: 'تسليك سلك حلزوني بلاستيكي', price: 4000, is_available: true },
          { id: '3', tenant_id: '1', service_key: 'thermal_lamination', name_ar: 'تغليف حراري (Lamination)', price: 3000, is_available: true },
        ]);

        setNotesCatalog([
          {
            id: 'c1000000-0000-0000-0000-000000000001',
            tenant_id: '1',
            title: 'ملخص الرياضيات الهندسية 1 - شامل ومحلول',
            category: 'جامعي',
            faculty_or_school: 'كلية الهندسة الميكانيكية والكهربائية',
            subject: 'رياضيات هندسية',
            professor_or_author: 'د. أحمد كنعان',
            description: 'نوطة شاملة لكافة تمارين ومسائل الدورات السابقة مع الحلول.',
            file_path: 'notes-catalog-files/math1_summary.pdf',
            page_count: 48,
            fixed_printing_price: 15000,
            is_active: true,
          },
          {
            id: 'c2000000-0000-0000-0000-000000000002',
            tenant_id: '1',
            title: 'مكثفة الكيمياء العضوية - لطلاب التحضيرية الطبية',
            category: 'سنة تحضيرية',
            faculty_or_school: 'الكليات الطبية',
            subject: 'كيمياء عضوية',
            professor_or_author: 'فريق التميز الأكاديمي',
            description: 'جداول مقارنة وملخص التفاعلات والأفكار الامتحانية الأكثر تكراراً.',
            file_path: 'notes-catalog-files/organic_chem.pdf',
            page_count: 32,
            fixed_printing_price: 12000,
            is_active: true,
          },
        ]);
      } catch (err) {
        console.error('Error loading shop data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadShopData();
  }, [tenantSlug, branchSlug]);

  // Handle uploading files (multiple files supported)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);
    const newItems: PrintOrderItem[] = [];

    for (const file of files) {
      const pageCount = await getPdfPageCount(file);
      const baseItem: PrintOrderItem = {
        item_type: 'file_upload',
        item_title: file.name,
        file_original_name: file.name,
        file_size_bytes: file.size,
        file_mime_type: file.type || 'application/pdf',
        original_page_count: pageCount,
        page_selection_type: 'all',
        custom_page_from: 1,
        custom_page_to: pageCount,
        custom_page_range: null,
        page_count: pageCount,
        copies_count: 1,
        paper_size: 'A4',
        color_mode: 'bw',
        duplex: pageCount > 1 ? 'duplex' : 'simplex',
        selected_services: [],
        item_price: 0,
        _localFile: file,
      };

      baseItem.item_price = calculateItemPrice(baseItem, pricingList);
      newItems.push(baseItem);
    }

    setOrderItems(prev => [...prev, ...newItems]);
    e.target.value = '';
  };

  // Add item from Notes Catalog
  const handleAddNoteToOrder = (note: NoteItem) => {
    const existing = orderItems.find(i => i.note_id === note.id);
    if (existing) {
      updateItemOption(orderItems.indexOf(existing), 'copies_count', existing.copies_count + 1);
      return;
    }

    const newItem: PrintOrderItem = {
      item_type: 'catalog_note',
      note_id: note.id,
      item_title: note.title,
      original_page_count: note.page_count,
      page_selection_type: 'all',
      custom_page_from: 1,
      custom_page_to: note.page_count,
      custom_page_range: null,
      page_count: note.page_count,
      copies_count: 1,
      paper_size: 'A4',
      color_mode: 'bw',
      duplex: 'duplex',
      selected_services: [],
      item_price: 0,
    };

    newItem.item_price = calculateItemPrice(newItem, pricingList, note.fixed_printing_price);
    setOrderItems(prev => [...prev, newItem]);
  };

  const handlePageRangeChange = (
    index: number,
    selectionType: 'all' | 'custom',
    fromVal?: number,
    toVal?: number
  ) => {
    setOrderItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index] };
      const maxPages = item.original_page_count || item.page_count || 1;

      if (selectionType === 'all') {
        item.page_selection_type = 'all';
        item.custom_page_from = 1;
        item.custom_page_to = maxPages;
        item.custom_page_range = null;
        item.page_count = maxPages;
      } else {
        item.page_selection_type = 'custom';
        const from = Math.max(1, Math.min(fromVal ?? (item.custom_page_from || 1), maxPages));
        const to = Math.max(from, Math.min(toVal ?? (item.custom_page_to || maxPages), maxPages));
        item.custom_page_from = from;
        item.custom_page_to = to;
        item.custom_page_range = `${from}-${to}`;
        item.page_count = (to - from) + 1;
      }

      const matchingNote = item.note_id ? notesCatalog.find(n => n.id === item.note_id) : undefined;
      item.item_price = calculateItemPrice(item, pricingList, matchingNote?.fixed_printing_price);
      updated[index] = item;
      return updated;
    });
  };

  const updateItemOption = (index: number, key: keyof PrintOrderItem, value: unknown) => {
    setOrderItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index], [key]: value };

      const matchingNote = item.note_id ? notesCatalog.find(n => n.id === item.note_id) : undefined;
      item.item_price = calculateItemPrice(item, pricingList, matchingNote?.fixed_printing_price);
      updated[index] = item;
      return updated;
    });
  };

  const toggleItemService = (itemIndex: number, service: PrintService) => {
    setOrderItems(prev => {
      const updated = [...prev];
      const item = { ...updated[itemIndex] };
      const currentServices = item.selected_services || [];

      const exists = currentServices.some(s => s.key === service.service_key);
      if (exists) {
        item.selected_services = currentServices.filter(s => s.key !== service.service_key);
      } else {
        item.selected_services = [
          ...currentServices,
          { key: service.service_key, name_ar: service.name_ar, price: Number(service.price) }
        ];
      }

      const matchingNote = item.note_id ? notesCatalog.find(n => n.id === item.note_id) : undefined;
      item.item_price = calculateItemPrice(item, pricingList, matchingNote?.fixed_printing_price);
      updated[itemIndex] = item;
      return updated;
    });
  };

  const removeItem = (index: number) => {
    setOrderItems(prev => prev.filter((_, i) => i !== index));
  };

  const baseCurrency = (branch?.default_currency as 'SYP' | 'TRY') || 'SYP';
  const exchangeRate = branch?.exchange_rate || 450;
  const otherCurrency = selectedCurrency === 'SYP' ? 'TRY' : 'SYP';

  const getItemPrice = (item: PrintOrderItem) => {
    const matchingNote = item.note_id ? notesCatalog.find(n => n.id === item.note_id) : undefined;
    const basePrice = calculateItemPrice(item, pricingList, matchingNote?.fixed_printing_price);
    return convertCurrency(basePrice, baseCurrency, selectedCurrency, exchangeRate);
  };

  const grandTotalPrice = orderItems.reduce((sum, item) => sum + getItemPrice(item), 0);
  const totalPages = orderItems.reduce((sum, item) => sum + (item.page_count * item.copies_count), 0);
  const equivalentTotal = convertCurrency(grandTotalPrice, selectedCurrency, otherCurrency, exchangeRate);

  const minShamCashConverted = convertCurrency(branch?.sham_cash_min_amount || 0, baseCurrency, selectedCurrency, exchangeRate);
  const isShamCashMandatory = branch?.sham_cash_enabled && (
    orderType === 'remote' || 
    (minShamCashConverted > 0 && grandTotalPrice >= minShamCashConverted)
  );

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFinalSubmit = async () => {
    if (orderItems.length === 0) {
      setSubmitError('يرجى إضافة ملف واحد على الأقل أو نوطة للطلب.');
      return;
    }
    if (orderType === 'remote' && !customerPhone.trim()) {
      setSubmitError('يرجى إدخال رقم الهاتف للتواصل وإشعارك عند جهوزية الطلب المسبق.');
      return;
    }
    if (isShamCashMandatory && !receiptFile) {
      setIsShamCashModalOpen(true);
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      let receiptPreviewUrl: string | null = null;
      if (receiptFile) {
        try {
          receiptPreviewUrl = await fileToBase64(receiptFile);
        } catch {}
      }

      const cleanedItems = orderItems.map(item => ({
        item_type: item.item_type,
        note_id: item.note_id || null,
        item_title: item.item_title,
        page_count: item.page_count,
        original_page_count: item.original_page_count || item.page_count,
        page_selection_type: item.page_selection_type || 'all',
        custom_page_from: item.custom_page_from || null,
        custom_page_to: item.custom_page_to || null,
        custom_page_range: item.custom_page_range || null,
        copies_count: item.copies_count,
        paper_size: item.paper_size,
        color_mode: item.color_mode,
        duplex: item.duplex,
        selected_services: item.selected_services,
        item_price: getItemPrice(item),
      }));

      const payload = {
        tenant_id: tenant?.id || 'a1000000-0000-0000-0000-000000000001',
        branch_id: branch?.id || 'b1000000-0000-0000-0000-000000000001',
        order_type: orderType,
        customer_name: customerName.trim() || (orderType === 'remote' ? 'زبون سريع' : 'زبون الفرع (QR)'),
        customer_phone: customerPhone.trim() || (orderType === 'remote' ? '' : 'استلام مباشر داخل الفرع'),
        customer_notes: customerNotes.trim() || null,
        total_items_count: orderItems.length,
        total_pages_count: totalPages,
        total_price: grandTotalPrice,
        currency: selectedCurrency,
        exchange_rate_snapshot: exchangeRate,
        payment_status: receiptPreviewUrl ? 'receipt_uploaded' : 'unpaid',
        payment_receipt_path: receiptPreviewUrl,
        status: branch?.auto_print_enabled ? 'printing' : 'pending',
        items: cleanedItems,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const newOrder = await res.json();
      const createdOrderId = newOrder.id || `demo-${Date.now()}`;
      const dailyCode = newOrder.daily_order_code || 105;

      try {
        const bc = new BroadcastChannel('mktabati_orders');
        bc.postMessage({ type: 'NEW_ORDER', order: newOrder });
        bc.close();
      } catch {}

      router.push(`/${tenantSlug}/${branchSlug}/order/${createdOrderId}?code=${dailyCode}`);
    } catch (err: unknown) {
      console.error('Order submission error:', err);
      setSubmitError('حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مجدداً.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
        <Loader2 className="w-10 h-10 text-tenant-primary animate-spin" />
        <p className="mt-4 text-slate-600 font-semibold">جاري تحميل بيانات الفرع والطباعة...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      {/* Header Banner */}
      <header className="bg-white/85 backdrop-blur-md border-b border-white/70 sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/${tenantSlug}/${branchSlug}`}
              className="p-1.5 rounded-xl hover:bg-slate-100/80 text-slate-500 hover:text-slate-800 transition-colors"
              title="العودة لبوابة المكتبة"
            >
              <ArrowLeft className="w-5 h-5 rotate-180" />
            </Link>
            <div className="w-9 h-9 rounded-xl bg-tenant-primary flex items-center justify-center text-white font-black text-sm shadow-md">
              {tenant?.name?.charAt(0) || 'م'}
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                طلب طباعة جديد • {tenant?.name}
              </h1>
              <p className="text-[11px] text-tenant-primary font-semibold flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {branch?.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
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

            <Link
              href={`/${tenantSlug}/${branchSlug}`}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 hidden sm:inline"
            >
              بوابة الخدمات
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Step 1: Order Type Selector */}
        <section className="bg-white/88 backdrop-blur-md rounded-3xl p-5 shadow-sm border border-white/80">
          <label className="text-sm font-bold text-slate-800 block mb-3">
            1. نوع استلام الطلب
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setOrderType('in_store')}
              className={`p-4 rounded-2xl border-2 text-right transition-all flex flex-col justify-between ${
                orderType === 'in_store'
                  ? 'border-tenant-primary bg-slate-50 ring-2 ring-tenant-primary/20 text-slate-950'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-600'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-bold text-sm">أنا داخل المكتبة (QR)</span>
                {orderType === 'in_store' && <Check className="w-4 h-4 text-tenant-primary" />}
              </div>
              <p className="text-xs text-slate-500 mt-1">طباعة فورية واستلام مباشر أمام الطابعة</p>
            </button>

            <button
              type="button"
              onClick={() => setOrderType('remote')}
              className={`p-4 rounded-2xl border-2 text-right transition-all flex flex-col justify-between ${
                orderType === 'remote'
                  ? 'border-tenant-primary bg-slate-50 ring-2 ring-tenant-primary/20 text-slate-950'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-600'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-bold text-sm">طلب مسبق عن بُعد</span>
                {orderType === 'remote' && <Check className="w-4 h-4 text-tenant-primary" />}
              </div>
              <p className="text-xs text-slate-500 mt-1">جهّز طلبك وادفع شام كاش واستلم جاهزاً</p>
            </button>
          </div>
        </section>

        {/* Step 2: Source Tabs */}
        <section className="bg-white/88 backdrop-blur-md rounded-3xl shadow-sm border border-white/80 overflow-hidden">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-4 px-4 font-bold text-sm flex items-center justify-center gap-2 border-b-2 transition-colors ${
                activeTab === 'upload'
                  ? 'border-tenant-primary text-tenant-primary bg-slate-50'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Upload className="w-4 h-4" />
              رفع ملفاتك الخاصة (PDF / صور)
            </button>
            <button
              onClick={() => setActiveTab('catalog')}
              className={`flex-1 py-4 px-4 font-bold text-sm flex items-center justify-center gap-2 border-b-2 transition-colors ${
                activeTab === 'catalog'
                  ? 'border-tenant-primary text-tenant-primary bg-slate-50'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              مكتبة النوط والملخصات الجاهزة
            </button>
          </div>

          <div className="p-5 sm:p-6">
            {activeTab === 'upload' ? (
              <div>
                <label className="relative flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-tenant-primary transition-colors rounded-2xl p-6 sm:p-8 cursor-pointer bg-slate-50/70 group">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,image/png,image/jpeg,image/webp"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 text-tenant-primary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-xs">
                    <Upload className="w-7 h-7" />
                  </div>
                  <p className="font-bold text-base text-slate-800 text-center">
                    اضغط هنا لرفع ملفاتك أو اسحبها إلى هنا
                  </p>
                  <p className="text-xs text-slate-500 mt-1 text-center">
                    ندعم ملفات PDF وصور JPG/PNG مع حساب عدد الصفحات تلقائياً من جهازك
                  </p>
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="ابحث باسم المادة، النوطة، أو الأستاذ..."
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-tenant-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto p-1">
                  {notesCatalog
                    .filter(note => 
                      note.title.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                      note.subject.toLowerCase().includes(catalogSearch.toLowerCase())
                    )
                    .map(note => {
                      const isAdded = orderItems.some(i => i.note_id === note.id);
                      return (
                        <div
                          key={note.id}
                          className="p-4 rounded-2xl border border-slate-200 hover:border-tenant-primary bg-white transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                                {note.category}
                              </span>
                              <span className="text-xs font-semibold text-slate-500">
                                {note.page_count} صفحة
                              </span>
                            </div>
                            <h4 className="font-bold text-sm text-slate-900 mt-1.5 line-clamp-1">
                              {note.title}
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                              {note.subject} {note.professor_or_author ? `• ${note.professor_or_author}` : ''}
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                            {note.fixed_printing_price ? (
                              <div className="flex flex-col items-start leading-tight">
                                <span className="text-sm font-black text-tenant-primary">
                                  {formatCurrency(
                                    convertCurrency(note.fixed_printing_price, baseCurrency, selectedCurrency, exchangeRate),
                                    selectedCurrency
                                  )}
                                </span>
                                {branch?.show_dual_currency && (
                                  <span className="text-[10px] text-slate-400 font-semibold">
                                    ({formatCurrency(
                                      convertCurrency(note.fixed_printing_price, baseCurrency, otherCurrency, exchangeRate),
                                      otherCurrency
                                    )})
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm font-black text-tenant-primary">حسب الخيارات</span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleAddNoteToOrder(note)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                                isAdded
                                  ? 'bg-tenant-primary text-white'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                              }`}
                            >
                              {isAdded ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                              {isAdded ? 'مُضاف' : 'إضافة للطلب'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Step 3: Configured Order Items List */}
        {orderItems.length > 0 && (
          <section className="bg-white/88 backdrop-blur-md rounded-3xl p-5 shadow-sm border border-white/80 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-tenant-primary" />
                خيارات ومحتويات الطباعة ({orderItems.length})
              </h3>
              <span className="text-xs text-slate-500 font-semibold">
                إجمالي {totalPages} صفحة
              </span>
            </div>

            <div className="space-y-4">
              {orderItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-tenant-primary font-bold text-xs shadow-xs">
                        {item.item_type === 'catalog_note' ? 'نوطة' : 'ملف'}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 line-clamp-1">
                          {item.item_title}
                        </h4>
                        <span className="text-xs text-slate-500">
                          {item.page_count} صفحة لكل نسخة
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="حذف الملف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Options Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">الألوان</label>
                      <select
                        value={item.color_mode}
                        onChange={(e) => updateItemOption(idx, 'color_mode', e.target.value as ColorMode)}
                        className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl p-2"
                      >
                        <option value="bw">أبيض وأسود (ليزر)</option>
                        <option value="color">ألوان كاملة</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">الوجه</label>
                      <select
                        value={item.duplex}
                        onChange={(e) => updateItemOption(idx, 'duplex', e.target.value as DuplexMode)}
                        className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl p-2"
                      >
                        <option value="duplex">وجهين (توفير ورق)</option>
                        <option value="simplex">وجه واحد فقط</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">مقاس الورق</label>
                      <select
                        value={item.paper_size}
                        onChange={(e) => updateItemOption(idx, 'paper_size', e.target.value as PaperSize)}
                        className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl p-2"
                      >
                        <option value="A4">A4 قياسي</option>
                        <option value="A3">A3 كبير</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">عدد النسخ</label>
                      <div className="flex items-center border border-slate-300 rounded-xl bg-white overflow-hidden">
                        <button
                          type="button"
                          onClick={() => updateItemOption(idx, 'copies_count', Math.max(1, item.copies_count - 1))}
                          className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 text-sm font-bold"
                        >
                          -
                        </button>
                        <span className="flex-1 text-center text-xs font-bold">{item.copies_count}</span>
                        <button
                          type="button"
                          onClick={() => updateItemOption(idx, 'copies_count', item.copies_count + 1)}
                          className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 text-sm font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Page Range Selection Section */}
                  <div className="pt-2.5 border-t border-slate-200/60 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-tenant-primary" />
                        <span>نطاق الصفحات المطلوب طباعتها:</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          (إجمالي صفحات الملف: {item.original_page_count || item.page_count} صفحة)
                        </span>
                      </label>

                      {/* Range mode switcher: All vs Custom */}
                      <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-[11px] font-bold w-fit">
                        <button
                          type="button"
                          onClick={() => handlePageRangeChange(idx, 'all')}
                          className={`px-2.5 py-1 rounded-md transition-all ${
                            (item.page_selection_type || 'all') === 'all'
                              ? 'bg-white text-slate-900 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          كامل الملف ({item.original_page_count || item.page_count} ص)
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePageRangeChange(idx, 'custom', item.custom_page_from || 1, Math.min(item.original_page_count || item.page_count, 5))}
                          className={`px-2.5 py-1 rounded-md transition-all ${
                            item.page_selection_type === 'custom'
                              ? 'bg-white text-tenant-primary shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          تحديد نطاق (من - إلى)
                        </button>
                      </div>
                    </div>

                    {/* Custom Range Inputs if custom selected */}
                    {item.page_selection_type === 'custom' && (
                      <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2 animate-in fade-in duration-200">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-600">من صفحة:</span>
                            <input
                              type="number"
                              min={1}
                              max={item.custom_page_to || (item.original_page_count || item.page_count)}
                              value={item.custom_page_from || 1}
                              onChange={(e) => handlePageRangeChange(idx, 'custom', parseInt(e.target.value, 10) || 1, item.custom_page_to)}
                              className="w-20 text-center text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg py-1.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-tenant-primary"
                            />
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-600">إلى صفحة:</span>
                            <input
                              type="number"
                              min={item.custom_page_from || 1}
                              max={item.original_page_count || item.page_count}
                              value={item.custom_page_to || (item.original_page_count || item.page_count)}
                              onChange={(e) => handlePageRangeChange(idx, 'custom', item.custom_page_from, parseInt(e.target.value, 10) || 1)}
                              className="w-20 text-center text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg py-1.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-tenant-primary"
                            />
                          </div>

                          <div className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200/60">
                            سيتم طباعة {item.page_count} صفحة فقط
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-500 font-medium">
                          💡 يتم احتساب السعر لـ <strong className="text-slate-800 font-bold">{item.page_count} صفحة</strong> محددة فقط بدلاً من كامل الملف ({item.original_page_count || item.page_count} ص).
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Finishing Services */}
                  {servicesList.length > 0 && (
                    <div className="pt-2 border-t border-slate-200/60 flex flex-wrap gap-1.5 items-center">
                      <span className="text-[11px] font-semibold text-slate-500 ml-1">خدمات إضافية:</span>
                      {servicesList.map(service => {
                        const isSelected = (item.selected_services || []).some(s => s.key === service.service_key);
                        return (
                          <button
                            key={service.id}
                            type="button"
                            onClick={() => toggleItemService(idx, service)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                              isSelected
                                ? 'bg-tenant-primary text-white'
                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                            {service.name_ar} (+{formatCurrency(convertCurrency(service.price, baseCurrency, selectedCurrency, exchangeRate), selectedCurrency)})
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Item Subtotal */}
                  <div className="flex justify-end pt-1">
                    <span className="text-xs text-slate-500 ml-2">تكلفة هذا العنصر:</span>
                    <span className="text-sm font-bold text-slate-900">
                      {formatCurrency(getItemPrice(item), selectedCurrency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Step 3: Contact info / Optional Notes */}
        {orderType === 'remote' ? (
          <section className="bg-white/88 backdrop-blur-md rounded-3xl p-5 shadow-sm border border-white/80 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-800 block">
                3. بيانات الاتصال للتنبيه والاستلام المسبق
              </label>
              <span className="text-[11px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                مطلوبة للطلبات عن بُعد
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  رقم الهاتف (واتساب) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="مثال: 0912345678"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  dir="ltr"
                  className="w-full text-right px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-tenant-primary font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  اسم الزبون (اختياري)
                </label>
                <input
                  type="text"
                  placeholder="اسمك أو كنيتك"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-tenant-primary"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                ملاحظات إضافية للموظف (اختياري)
              </label>
              <textarea
                rows={2}
                placeholder="مثال: يرجى تكبيس كل فصل لوحده..."
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-tenant-primary resize-none"
              />
            </div>
          </section>
        ) : (
          <section className="bg-white/88 backdrop-blur-md rounded-3xl p-5 shadow-sm border border-white/80 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-800 block">
                3. ملاحظات إضافية للطباعة (اختياري)
              </label>
              <span className="text-xs text-emerald-800 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                ⚡ استلام فوري مباشر بدون إدخال بيانات اتصال
              </span>
            </div>
            <textarea
              rows={2}
              placeholder="مثال: يرجى تكبيس الأوراق بدبوس في الزاوية (اختياري)..."
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-tenant-primary resize-none"
            />
          </section>
        )}

        {/* Sham Cash Alert Prompt */}
        {branch?.sham_cash_enabled && (
          <section className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-5 border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-blue-950">
                  {isShamCashMandatory ? 'الدفع المسبق مطلوب عبر شام كاش' : 'الدفع السريع متاح عبر شام كاش'}
                </h4>
                <p className="text-xs text-blue-700 mt-0.5">
                  {receiptFile
                    ? `تم إرفاق صورة الإيصال: ${receiptFile.name}`
                    : 'يمكنك تحويل المبلغ وإرفاق لقطة الشاشة ليتم بدء الطباعة فوراً'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsShamCashModalOpen(true)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 shadow-xs ${
                receiptFile
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {receiptFile ? <Check className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
              {receiptFile ? 'تعديل الإيصال المرفق' : 'فتح شباك شام كاش'}
            </button>
          </section>
        )}

        {submitError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {submitError}
          </div>
        )}
      </main>

      {/* Floating Sticky Bottom Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-md border-t border-white/80 p-4 z-40 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-500 block">المبلغ الإجمالي ({orderItems.length} عنصر):</span>
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
              <span className="text-xl sm:text-2xl font-black text-tenant-primary">
                {formatCurrency(grandTotalPrice, selectedCurrency)}
              </span>
              <span className="text-xs font-bold text-slate-400">
                (يعادل تقريباً {formatCurrency(equivalentTotal, otherCurrency)})
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={isSubmitting || orderItems.length === 0}
            onClick={handleFinalSubmit}
            className="flex-1 max-w-xs py-3.5 px-6 rounded-2xl font-bold text-sm text-white tenant-btn-primary disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                جاري إرسال الطلب...
              </>
            ) : (
              <>
                <span>تأكيد وإرسال الطلب</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </>
            )}
          </button>
        </div>
      </div>

      {branch && (
        <ShamCashModal
          isOpen={isShamCashModalOpen}
          onClose={() => setIsShamCashModalOpen(false)}
          branch={branch}
          amount={grandTotalPrice}
          currency={selectedCurrency}
          secondaryAmountText={`يعادل تقريباً ${formatCurrency(equivalentTotal, otherCurrency)}`}
          onReceiptSelected={(file) => setReceiptFile(file)}
          receiptFile={receiptFile}
        />
      )}
    </div>
  );
}
