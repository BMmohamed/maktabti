'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Printer, Smartphone, QrCode, BookOpen, Layers, 
  ShieldCheck, BarChart3, CheckCircle2, ArrowLeft, ArrowRight,
  Zap, CreditCard, Sparkles, Building2, ShoppingCart, 
  Package, FileCheck2, Cpu, Check, Users, Clock, Palette, 
  ExternalLink, ChevronRight, Lock, Eye, Compass
} from 'lucide-react';
import { DamasceneBackground } from '@/components/DamasceneBackground';
import { BackgroundTheme } from '@/types';

const THEME_OPTIONS: { key: BackgroundTheme; name: string; desc: string; samplePrimary: string; sampleSecondary: string }[] = [
  { 
    key: 'damascus_geometric', 
    name: 'الزخرفة الهندسية الشامية', 
    desc: 'نجوم ثمانية ومضلعات مدمجة مستوحاة من العمارة الدمشقية القديمة',
    samplePrimary: '#16a34a',
    sampleSecondary: '#052e16'
  },
  { 
    key: 'arabesque_floral', 
    name: 'الأرابيسك والنقوش النباتية', 
    desc: 'قواقع وأغصان لولبية دمشقية مقتبسة من الفسيفساء والموزاييك الخشبي',
    samplePrimary: '#4f46e5',
    sampleSecondary: '#1e1b4b'
  },
  { 
    key: 'islamic_calligraphy', 
    name: 'الخط العربي التجريدي', 
    desc: 'حروفيات ديوانية وانحناءات كوفية انسيابية تحاكي المخطوطات الأصيلة',
    samplePrimary: '#e11d48',
    sampleSecondary: '#4c0519'
  },
  { 
    key: 'mashrabiya_lattice', 
    name: 'المشربية والشبابيك الشامية', 
    desc: 'شبكات الأرابيسك الخشبية التراثية لقاعات القراءة والمكتبات العريقة',
    samplePrimary: '#0284c7',
    sampleSecondary: '#082f49'
  },
];

export default function PlatformLandingPage() {
  const [activeTheme, setActiveTheme] = useState<BackgroundTheme>('damascus_geometric');
  const selectedThemeMeta = THEME_OPTIONS.find(t => t.key === activeTheme) || THEME_OPTIONS[0];

  return (
    <div className="min-h-screen text-slate-900 selection:bg-brand-600 selection:text-white relative isolate">
      {/* 1. Animated Damascus & Arabic Kinetic Background */}
      <DamasceneBackground
        theme={activeTheme}
        primaryColor={selectedThemeMeta.samplePrimary}
        secondaryColor={selectedThemeMeta.sampleSecondary}
      />

      {/* Top Notification Bar */}
      <div className="bg-slate-950/90 backdrop-blur-md text-white text-[11px] sm:text-xs py-2.5 px-4 text-center font-bold flex items-center justify-center gap-2 border-b border-white/10 z-50 sticky top-0">
        <span className="bg-brand-600 text-white px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider">
          إصدار 2.0
        </span>
        <span>المنظومة السحابية المتكاملة للطباعة الصامتة (SumatraPDF) مع خلفيات دمشقية متحركة وهوية مخصصة</span>
        <Link href="/super-admin" className="underline hover:text-brand-300 font-medium mr-2">
          لوحة المالك &larr;
        </Link>
      </div>

      {/* Main Navbar (Glassmorphic) */}
      <header className="bg-white/85 backdrop-blur-md border-b border-white/70 sticky top-8 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-white font-black text-xl shadow-md shadow-brand-600/25 group-hover:scale-105 transition-transform border border-white/30">
              م
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg text-slate-950 tracking-tight">مكتبتي</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">SaaS</span>
              </div>
              <span className="block text-[11px] text-slate-500 font-medium -mt-0.5">منصة الطباعة وإدارة المكتبات</span>
            </div>
          </Link>

          {/* Quick Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600">
            <a href="#features" className="hover:text-brand-600 transition-colors">الميزات الأساسية</a>
            <a href="#themes-showcase" className="hover:text-brand-600 transition-colors">الخلفيات الدمشقية</a>
            <a href="#apps" className="hover:text-brand-600 transition-colors">التطبيقات النمطية</a>
            <a href="#how-it-works" className="hover:text-brand-600 transition-colors">آلية العمل</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard"
              className="px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-950 bg-white/80 hover:bg-white border border-slate-200/80 transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <span>دخول الإدارة</span>
            </Link>

            <Link
              href="/al-noor/campus"
              className="px-4 py-2 rounded-xl text-xs font-black text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-600/20 transition-all flex items-center gap-1.5 group"
            >
              <span>معاينة حية</span>
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-16 sm:pb-24">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/85 backdrop-blur-md border border-white/80 text-brand-900 text-xs font-bold shadow-xs">
            <Sparkles className="w-4 h-4 text-brand-600" />
            <span>خلفيات دمشقية فنية وهوية بصرية مخصصة لكل مكتبة</span>
          </div>

          {/* Hero Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-tight sm:leading-[1.15]">
            حوّل مركز طباعتك إلى <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-emerald-600 to-teal-700">
              منظومة سحابية ذكية وفورية
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
            دع طلابك وزبائنك يرفعون ملفاتهم ويطلبون نوطهم مباشرة عبر مسح الـ QR من هواتفهم، مع حساب فوري لعدد الصفحات، والدفع السريع عبر شام كاش، والطباعة الصامتة عبر وكيل بايثون الذكي.
          </p>

          {/* Live Demo Cards Showcase (Emerald vs Indigo) */}
          <div className="pt-4 max-w-2xl mx-auto">
            <div className="bg-white/85 backdrop-blur-md rounded-3xl p-4 sm:p-5 border border-white/90 shadow-lg shadow-slate-200/50">
              <span className="text-xs font-black text-slate-700 block mb-3">
                جرّب الهوية البصرية والخلفيات المخصصة لكل مكتبة (Multi-Tenant Theming):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Demo 1: Al-Noor (Emerald + Damascus Geometric) */}
                <Link
                  href="/al-noor/campus"
                  className="p-3.5 rounded-2xl border-2 border-emerald-500/20 bg-white/80 hover:bg-emerald-50/70 hover:border-emerald-500/40 transition-all text-right group flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                      ن
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-900 block group-hover:text-emerald-700">
                        مكتبة النور الحديثة
                      </span>
                      <span className="text-[11px] text-emerald-700 font-medium">
                        زمردي + زخرفة دمشقية هندسية
                      </span>
                    </div>
                  </div>
                  <ArrowLeft className="w-4 h-4 text-emerald-600 group-hover:-translate-x-1 transition-transform" />
                </Link>

                {/* Demo 2: Dar Al-Marefa (Indigo + Floral Arabesque) */}
                <Link
                  href="/dar-al-marefa/main"
                  className="p-3.5 rounded-2xl border-2 border-indigo-500/20 bg-white/80 hover:bg-indigo-50/70 hover:border-indigo-500/40 transition-all text-right group flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                      م
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-900 block group-hover:text-indigo-700">
                        دار المعرفة للطباعة
                      </span>
                      <span className="text-[11px] text-indigo-700 font-medium">
                        أزرق نيلي + أرابيسك نباتي شامي
                      </span>
                    </div>
                  </div>
                  <ArrowLeft className="w-4 h-4 text-indigo-600 group-hover:-translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-200/60 flex flex-wrap items-center justify-between text-xs text-slate-500 font-medium">
                <Link href="/dashboard" className="text-brand-700 hover:underline flex items-center gap-1 font-bold">
                  <Layers className="w-3.5 h-3.5" />
                  <span>دخول لوحة تحكم الموظفين (App Launcher)</span>
                </Link>
                <Link href="/super-admin" className="text-slate-600 hover:text-slate-950 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>لوحة المالك الرئيسي (Super Admin)</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Stats Bar (Glassmorphic) */}
          <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-4 rounded-2xl bg-white/85 backdrop-blur-md border border-white/80 shadow-xs">
              <span className="block text-2xl font-black text-slate-900">0 ثوانٍ</span>
              <span className="text-xs text-slate-500 font-medium">وقت الانتظار على الكاشير</span>
            </div>
            <div className="p-4 rounded-2xl bg-white/85 backdrop-blur-md border border-white/80 shadow-xs">
              <span className="block text-2xl font-black text-emerald-600">100%</span>
              <span className="text-xs text-slate-500 font-medium">حساب تلقائي لصفحات PDF</span>
            </div>
            <div className="p-4 rounded-2xl bg-white/85 backdrop-blur-md border border-white/80 shadow-xs">
              <span className="block text-2xl font-black text-brand-600">SumatraPDF</span>
              <span className="text-xs text-slate-500 font-medium">طباعة صامتة فورية</span>
            </div>
            <div className="p-4 rounded-2xl bg-white/85 backdrop-blur-md border border-white/80 shadow-xs">
              <span className="block text-2xl font-black text-purple-600">شام كاش</span>
              <span className="text-xs text-slate-500 font-medium">دفع إلكتروني متكامل</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Damascus Themes Showcase Section */}
      <section id="themes-showcase" className="max-w-5xl mx-auto px-4 py-16">
        <div className="bg-white/85 backdrop-blur-md rounded-3xl p-6 sm:p-10 border border-white/90 shadow-md">
          <div className="text-center space-y-2 mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
              <Palette className="w-3.5 h-3.5" />
              <span>مختبر الأنماط والخلفيات الفنية</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950">
              أنماط وزخارف دمشقية أصيلة متحركة في الوقت الفعلي
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
              اضغط على أي نمط أدناه لمعاينة الحركة البطيئة المستمرة (Ken Burns Effect) وانعكاسها المباشر على خلفية الصفحة:
            </p>
          </div>

          {/* Theme Selector Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {THEME_OPTIONS.map((theme) => {
              const isActive = activeTheme === theme.key;
              return (
                <button
                  key={theme.key}
                  type="button"
                  onClick={() => setActiveTheme(theme.key)}
                  className={`p-4 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                    isActive
                      ? 'bg-white border-slate-900 shadow-md ring-2 ring-slate-900/10 scale-102'
                      : 'bg-white/60 border-slate-200/80 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div 
                        className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-xs"
                        style={{ backgroundColor: theme.samplePrimary }}
                      >
                        <Compass className="w-4 h-4" />
                      </div>
                      {isActive && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-white">
                          مفعل الآن
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-black text-slate-900 block">
                      {theme.name}
                    </span>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {theme.desc}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-600">
                    <span>درجات الألوان:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.samplePrimary }} />
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.sampleSecondary }} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works: 3 Steps */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center space-y-2 mb-12">
          <span className="text-xs font-black text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
            تدفق بسيط وسريع
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950">
            كيف تعمل منظومة مكتبتي الذكية؟
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xl mx-auto">
            تجربة مؤتمتة بالكامل من لحظة وصول الطالب إلى باب المكتبة وحتى استلام أوراقه مطبوعة وجاهزة
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Step 1 */}
          <div className="bg-white/88 backdrop-blur-md rounded-3xl p-6 border border-white/80 shadow-sm relative">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 font-black text-lg flex items-center justify-center mb-4 border border-brand-200">
              1
            </div>
            <h3 className="text-base font-black text-slate-900 mb-2">
              مسح الـ QR والطلب عبر الهاتف
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              يمسح الزبون الرمز الموجود على باب المكتبة أو الطاولة بهاتفه لفتح بوابة المكتبة مباشرة، دون الحاجة لتحميل تطبيق أو تسجيل حساب.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white/88 backdrop-blur-md rounded-3xl p-6 border border-white/80 shadow-sm relative">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 font-black text-lg flex items-center justify-center mb-4 border border-emerald-200">
              2
            </div>
            <h3 className="text-base font-black text-slate-900 mb-2">
              حساب الصفحات والدفع السريع
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              يحسب النظام تلقائياً عدد صفحات مستندات الـ PDF والتكلفة الإجمالية حسب خيارات الألوان والوجهين، مع إمكانية الدفع المسبق بشام كاش.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white/88 backdrop-blur-md rounded-3xl p-6 border border-white/80 shadow-sm relative">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 font-black text-lg flex items-center justify-center mb-4 border border-indigo-200">
              3
            </div>
            <h3 className="text-base font-black text-slate-900 mb-2">
              الطباعة الصامتة والاستلام الفوري
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              يتلقى وكيل بايثون المحلي (Print Agent) الطلب ويطبعه بصمت عبر SumatraPDF مباشرة، وتتحدث شاشة الزبون ليتوجه لاستلام أوراقه.
            </p>
          </div>
        </div>
      </section>

      {/* Modular Apps Ecosystem (Odoo Style) */}
      <section id="apps" className="max-w-5xl mx-auto px-4 py-16">
        <div className="bg-white/85 backdrop-blur-md rounded-3xl p-6 sm:p-10 border border-white/90 shadow-md">
          <div className="text-center space-y-2 mb-12">
            <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
              بنية الوحدات والتطبيقات (Modular Architecture)
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950">
              منصة واحدة.. لكل ما تحتاجه مكتبتك
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xl mx-auto">
              شغّل فقط التطبيقات التي تحتاجها مكتبتك وتوسّع في أي وقت مع نظام الـ Feature Flags الذكي
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* App 1 */}
            <div className="p-5 rounded-2xl bg-white/90 border border-slate-200/80 hover:bg-white hover:border-slate-300 transition-all shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-4 shadow-sm">
                <Printer className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black text-slate-900 mb-1">الطباعة الذكية والـ QR</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                طابور طباعة فوري، تحويل أوتوماتيكي للصور إلى PDF، حساب الصفحات، وطباعة صامتة فورية.
              </p>
            </div>

            {/* App 2 */}
            <div className="p-5 rounded-2xl bg-white/90 border border-slate-200/80 hover:bg-white hover:border-slate-300 transition-all shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center mb-4 shadow-sm">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black text-slate-900 mb-1">مكتبة النوط الجامعية</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                كتالوج كامل للملخصات الجامعية والمقررات مصنفة حسب الكليات والسنوات الدراسية.
              </p>
            </div>

            {/* App 3 */}
            <div className="p-5 rounded-2xl bg-white/90 border border-slate-200/80 hover:bg-white hover:border-slate-300 transition-all shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center mb-4 shadow-sm">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black text-slate-900 mb-1">بوابة الدفع شام كاش</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                تأكيد فوري لإيصالات التحويل، وتوليد باركود الدفع المباشر، وضمان تسوية الفواتير.
              </p>
            </div>

            {/* App 4 */}
            <div className="p-5 rounded-2xl bg-white/90 border border-slate-200/80 hover:bg-white hover:border-slate-300 transition-all shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mb-4 shadow-sm">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black text-slate-900 mb-1">نقطة البيع والكاشير (POS)</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                محاسبة سريعة تشمل طلبات الطباعة والقرطاسية في فاتورة واحدة مع طباعة الإيصال.
              </p>
            </div>

            {/* App 5 */}
            <div className="p-5 rounded-2xl bg-white/90 border border-slate-200/80 hover:bg-white hover:border-slate-300 transition-all shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center mb-4 shadow-sm">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black text-slate-900 mb-1">إدارة المستودع والمخزون</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                متابعة حركة ورق A4/A3، رزم التغليف، الأحبار، وتنبيهات انخفاض الكميات الحرجة.
              </p>
            </div>

            {/* App 6 */}
            <div className="p-5 rounded-2xl bg-white/90 border border-slate-200/80 hover:bg-white hover:border-slate-300 transition-all shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center mb-4 shadow-sm">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black text-slate-900 mb-1">تعدد الفروع والتحويلات</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                إدارة عدة فروع ومطابع من لوحة مركزية واحدة، مع تحويل المخزون ومقارنة المبيعات.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-Tenant White-Labeling Highlight */}
      <section id="features" className="max-w-5xl mx-auto px-4 py-16">
        <div className="bg-gradient-to-br from-slate-900/95 to-slate-950/95 backdrop-blur-md text-white rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden border border-white/10">
          <div className="max-w-2xl space-y-4 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-brand-300 text-xs font-bold border border-white/10">
              <Palette className="w-4 h-4 text-brand-400" />
              <span>هوية مخصصة 100% لكل مكتبة (White-Labeling)</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black leading-tight">
              لكل مكتبة رابطها الخاص، شعارها، وخلفيتها الدمشقية المميزة
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
              تتحول كامل واجهات الزبون (الأزرار، التدرجات، البطاقات، والزخارف الدمشقية المتحركة) تلقائياً لتطابق اللون والنمط المختار لمكتبتك بدقة وجمالية متناهية.
            </p>

            <div className="pt-4 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-black text-xs shadow-md transition-colors"
              >
                الدخول للوحة التحكم
              </Link>
              <Link
                href="/super-admin"
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors border border-white/10"
              >
                تخصيص ألوان وخلفيات المكتبات (Super Admin)
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-md border-t border-white/80 py-12 text-xs text-slate-500 font-medium">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-brand-600 text-white font-black text-base flex items-center justify-center">
              م
            </div>
            <div>
              <span className="font-black text-slate-900">مكتبتي SaaS</span>
              <span className="block text-[10px] text-slate-400">المنظومة السحابية للطباعة والمكتبات &bull; 2026</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/al-noor/campus" className="hover:text-slate-900">مكتبة النور (تجريبي)</Link>
            <Link href="/dar-al-marefa/main" className="hover:text-slate-900">دار المعرفة (تجريبي)</Link>
            <Link href="/dashboard" className="hover:text-slate-900">لوحة التحكم</Link>
            <Link href="/super-admin" className="hover:text-slate-900">إدارة المنصة</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
