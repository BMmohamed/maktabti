'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Building2, 
  Plus, 
  Sliders, 
  ExternalLink, 
  CheckCircle2, 
  Check, 
  X, 
  RefreshCw, 
  Search,
  Sparkles,
  Layers,
  Store,
  Smartphone,
  Lock,
  ArrowRight,
  Palette,
  Edit2
} from 'lucide-react';
import { Tenant, AppModuleKey, TenantPlan, BackgroundTheme } from '@/types';
import { getAllModules } from '@/lib/modules';

const COLOR_PRESETS = [
  { name: 'أخضر زمردي', primary: '#16a34a', secondary: '#052e16' },
  { name: 'أزرق نيلي', primary: '#4f46e5', secondary: '#1e1b4b' },
  { name: 'أحمر قرمزي', primary: '#dc2626', secondary: '#450a0a' },
  { name: 'عنّابي فاخر', primary: '#9f1239', secondary: '#4c0519' },
  { name: 'أزرق بحري', primary: '#0284c7', secondary: '#082f49' },
  { name: 'بنفسجي ملكي', primary: '#7c3aed', secondary: '#2e1065' },
];

const THEME_OPTIONS: { key: BackgroundTheme; name: string; desc: string }[] = [
  { key: 'damascus_geometric', name: 'الزخرفة الهندسية الشامية', desc: 'نجوم ثمانية ومضلعات مدمجة' },
  { key: 'arabesque_floral', name: 'الأرابيسك والنقوش النباتية', desc: 'قواقع وأغصان لولبية دمشقية' },
  { key: 'islamic_calligraphy', name: 'الخط العربي التجريدي', desc: 'حروفيات ديوانية وانحناءات كوفية' },
  { key: 'mashrabiya_lattice', name: 'المشربية والشبابيك الشامية', desc: 'شبكات الأرابيسك الخشبية' },
  { key: 'custom', name: 'صورة مخصصة', desc: 'رفع رابط صورة خلفية خاصة' },
];

export default function SuperAdminPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingBrandingTenant, setEditingBrandingTenant] = useState<Tenant | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Tenant Form State
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newTagline, setNewTagline] = useState('');
  const [newPrimaryColor, setNewPrimaryColor] = useState('#16a34a');
  const [newSecondaryColor, setNewSecondaryColor] = useState('#052e16');
  const [newBackgroundTheme, setNewBackgroundTheme] = useState<BackgroundTheme>('damascus_geometric');
  const [newCustomBackgroundUrl, setNewCustomBackgroundUrl] = useState('');
  const [newPlan, setNewPlan] = useState<TenantPlan>('smart_print');
  const [newPhone, setNewPhone] = useState('');
  const [newFlags, setNewFlags] = useState<Record<AppModuleKey, boolean>>({
    smart_print: true,
    notes_catalog: true,
    shamcash_pay: true,
    pos: false,
    inventory: false,
    multi_branch: false,
    audit_reports: true,
  });

  const allModules = getAllModules();

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/tenants');
      if (res.ok) {
        const data = await res.json();
        setTenants(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Toggle Module instantly for a tenant
  const handleToggleModule = async (tenantId: string, moduleKey: AppModuleKey, currentValue: boolean) => {
    const nextValue = !currentValue;

    // Optimistic UI update
    setTenants(prev =>
      prev.map(t => {
        if (t.id === tenantId) {
          return {
            ...t,
            feature_flags: {
              ...t.feature_flags,
              [moduleKey]: nextValue,
            },
          };
        }
        return t;
      })
    );

    try {
      const res = await fetch('/api/tenants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: tenantId,
          feature_flags: {
            [moduleKey]: nextValue,
          },
        }),
      });

      if (res.ok) {
        showToast(`تم ${nextValue ? 'تفعيل' : 'إلغاء'} تطبيق (${moduleKey}) بنجاح`);
      }
    } catch (err) {
      console.error('Error toggling module:', err);
    }
  };

  // Quick Color Change
  const handleQuickColorChange = async (tenant: Tenant, primary: string, secondary: string) => {
    // Optimistic update
    setTenants(prev =>
      prev.map(t => (t.id === tenant.id ? { ...t, primary_color: primary, secondary_color: secondary } : t))
    );

    try {
      const res = await fetch('/api/tenants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: tenant.id,
          primary_color: primary,
          secondary_color: secondary,
        }),
      });
      if (res.ok) {
        showToast(`تم تحديث لون هوية "${tenant.name}"`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save full branding modal
  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrandingTenant) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/tenants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingBrandingTenant.id,
          name: editingBrandingTenant.name,
          tagline: editingBrandingTenant.tagline,
          primary_color: editingBrandingTenant.primary_color,
          secondary_color: editingBrandingTenant.secondary_color,
          background_theme: editingBrandingTenant.background_theme,
          custom_background_url: editingBrandingTenant.custom_background_url || null,
          logo_url: editingBrandingTenant.logo_url || null,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setTenants(prev => prev.map(t => (t.id === updated.id ? updated : t)));
        setEditingBrandingTenant(null);
        showToast(`تم تحديث بيانات وهواية "${updated.name}" بنجاح!`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Create New Tenant
  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          slug: newSlug || newName.toLowerCase().replace(/\s+/g, '-'),
          tagline: newTagline || 'مركز الطباعة الذكية والخدمات الجامعية الحديثة',
          primary_color: newPrimaryColor,
          secondary_color: newSecondaryColor,
          background_theme: newBackgroundTheme,
          custom_background_url: newCustomBackgroundUrl || null,
          plan: newPlan,
          contact_phone: newPhone,
          feature_flags: newFlags,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setTenants([created, ...tenants]);
        setIsCreating(false);
        setNewName('');
        setNewSlug('');
        setNewTagline('');
        setNewPhone('');
        showToast(`تم إنشاء مكتبة "${created.name}" بنجاح!`);
      } else {
        const err = await res.json();
        alert(err.error || 'حدث خطأ أثناء الإنشاء');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-16">
      {/* Top Bar */}
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-500 to-indigo-500 flex items-center justify-center text-white font-black shadow-lg shadow-brand-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-white">لوحة المالك المركزي (Super Admin)</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  منصة مكتبتي SaaS
                </span>
              </div>
              <p className="text-xs text-slate-400">
                إدارة المكتبات المشتركة، مصفوفة التطبيقات المعيارية (Modular Flags)، والهوية البصرية لكل مكتبة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/apps"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <span>مشاهدة واجهة المكتبة</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={() => setIsCreating(true)}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/30 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة مكتبة جديدة</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl shadow-sm">
            <span className="text-xs text-slate-400 font-semibold block">إجمالي المكتبات المشتركة</span>
            <p className="text-3xl font-black text-white mt-1">{tenants.length}</p>
            <span className="text-[11px] text-emerald-400 font-semibold mt-1 block">مستأجرين فعالين (Tenants)</span>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl shadow-sm">
            <span className="text-xs text-slate-400 font-semibold block">التطبيقات المعيارية في النظام</span>
            <p className="text-3xl font-black text-brand-400 mt-1">{allModules.length}</p>
            <span className="text-[11px] text-slate-400 mt-1 block">وحدات مستقلة (Odoo-like Modules)</span>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl shadow-sm">
            <span className="text-xs text-slate-400 font-semibold block">الباقات المعتمدة</span>
            <p className="text-3xl font-black text-indigo-400 mt-1">3</p>
            <span className="text-[11px] text-slate-400 mt-1 block">طباعة ذكية • مكتبة متكاملة • سلاسل ومؤسسات</span>
          </div>
        </div>

        {/* Libraries & Modules Matrix Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-brand-400" />
            <h2 className="text-lg font-black text-white">
              المكتبات المشتركة ومصفوفة تفعيل التطبيقات والهوية
            </h2>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
              <input
                type="text"
                placeholder="ابحث باسم المكتبة أو الرابط..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pr-9 pl-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500 text-white placeholder-slate-500"
              />
            </div>

            <button
              onClick={fetchTenants}
              title="تحديث البيانات"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tenant Cards List */}
        <div className="space-y-6">
          {filteredTenants.map((tenant) => (
            <div
              key={tenant.id}
              className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 shadow-md space-y-5 transition-all"
            >
              {/* Tenant Header */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-700/60">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-md shrink-0 border border-white/10"
                    style={{ backgroundColor: tenant.primary_color || '#16a34a' }}
                  >
                    {tenant.name.slice(0, 1)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-base font-black text-white">{tenant.name}</h3>
                      <span className="text-xs font-mono font-bold text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded-md border border-slate-700">
                        /{tenant.slug}
                      </span>
                      {tenant.is_active ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          نشط
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          معطل
                        </span>
                      )}

                      {/* Brand Color Indicator */}
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700 text-[11px] text-slate-300">
                        <span 
                          className="w-3 h-3 rounded-full inline-block shadow-xs" 
                          style={{ backgroundColor: tenant.primary_color || '#16a34a' }} 
                        />
                        <span className="font-mono">{tenant.primary_color || '#16a34a'}</span>
                      </div>

                      {/* Background Theme Badge */}
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700 text-brand-300">
                        {THEME_OPTIONS.find(o => o.key === (tenant.background_theme || 'damascus_geometric'))?.name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {tenant.tagline || 'مركز الطباعة الذكية والخدمات الطلابية'} &bull; {tenant.branches_count || tenant.branches?.length || 1} فروع &bull; {tenant.contact_phone || 'لا يوجد هاتف'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setEditingBrandingTenant(tenant)}
                    className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-bold text-slate-200 transition-colors flex items-center gap-1.5 border border-slate-600"
                  >
                    <Palette className="w-3.5 h-3.5 text-brand-400" />
                    <span>تعديل الهوية والألوان</span>
                  </button>

                  <Link
                    href={`/${tenant.slug}/${tenant.branches?.[0]?.slug || 'campus'}`}
                    target="_blank"
                    className="px-3 py-1.5 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1"
                  >
                    <span>بوابة الزبون</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>

                  <Link
                    href="/dashboard"
                    className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-xs font-bold text-white transition-colors flex items-center gap-1 shadow-sm"
                  >
                    <span>لوحة التحكم</span>
                    <ArrowRight className="w-3 h-3 rotate-180" />
                  </Link>
                </div>
              </div>

              {/* Quick Brand Colors Bar */}
              <div className="flex items-center gap-2 flex-wrap text-xs text-slate-400">
                <span className="font-bold text-slate-300">تبديل لون الهوية سريعاً:</span>
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.primary}
                    onClick={() => handleQuickColorChange(tenant, preset.primary, preset.secondary)}
                    title={preset.name}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 border transition-all ${
                      (tenant.primary_color || '').toLowerCase() === preset.primary.toLowerCase()
                        ? 'border-white bg-slate-700 text-white shadow-xs'
                        : 'border-slate-700 bg-slate-900/50 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: preset.primary }} />
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>

              {/* Modules Toggles Grid */}
              <div>
                <span className="text-xs font-bold text-slate-300 block mb-3">
                  التطبيقات المفعّلة لهذه المكتبة (اضغط للتبديل الفوري):
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {allModules.map((mod) => {
                    const isEnabled = Boolean(tenant.feature_flags?.[mod.key]);
                    const Icon = mod.icon;

                    return (
                      <button
                        key={mod.key}
                        onClick={() => handleToggleModule(tenant.id, mod.key, isEnabled)}
                        className={`p-3 rounded-2xl border text-right transition-all flex items-center justify-between gap-3 ${
                          isEnabled
                            ? 'bg-slate-900 border-brand-500/60 ring-1 ring-brand-500/20 text-white'
                            : 'bg-slate-900/40 border-slate-700/60 text-slate-400 opacity-60 hover:opacity-90'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isEnabled ? 'bg-brand-500 text-white' : 'bg-slate-800 text-slate-500'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <span className="text-xs font-bold block truncate">{mod.shortNameAr}</span>
                            <span className="text-[10px] text-slate-500 block truncate">{mod.key}</span>
                          </div>
                        </div>

                        {/* Toggle Switch */}
                        <div className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors shrink-0 ${
                          isEnabled ? 'bg-brand-600 justify-end' : 'bg-slate-700 justify-start'
                        }`}>
                          <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Edit Branding Modal */}
      {editingBrandingTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: editingBrandingTenant.primary_color || '#16a34a' }}
                >
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">تعديل هوية وألوان المكتبة</h3>
                  <p className="text-xs text-slate-400">{editingBrandingTenant.name}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingBrandingTenant(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBranding} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">اسم المكتبة</label>
                <input
                  type="text"
                  value={editingBrandingTenant.name}
                  onChange={e => setEditingBrandingTenant({ ...editingBrandingTenant, name: e.target.value })}
                  className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">الشعار اللفظي (Tagline)</label>
                <input
                  type="text"
                  value={editingBrandingTenant.tagline || ''}
                  onChange={e => setEditingBrandingTenant({ ...editingBrandingTenant, tagline: e.target.value })}
                  placeholder="مركز الطباعة الذكية والخدمات الطلابية"
                  className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">اللون الأساسي (Primary)</label>
                  <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl p-2">
                    <input
                      type="color"
                      value={editingBrandingTenant.primary_color || '#16a34a'}
                      onChange={e => setEditingBrandingTenant({ ...editingBrandingTenant, primary_color: e.target.value })}
                      className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={editingBrandingTenant.primary_color || '#16a34a'}
                      onChange={e => setEditingBrandingTenant({ ...editingBrandingTenant, primary_color: e.target.value })}
                      className="w-full text-xs font-mono font-bold bg-transparent text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">اللون الثانوي (Secondary)</label>
                  <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl p-2">
                    <input
                      type="color"
                      value={editingBrandingTenant.secondary_color || '#052e16'}
                      onChange={e => setEditingBrandingTenant({ ...editingBrandingTenant, secondary_color: e.target.value })}
                      className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={editingBrandingTenant.secondary_color || '#052e16'}
                      onChange={e => setEditingBrandingTenant({ ...editingBrandingTenant, secondary_color: e.target.value })}
                      className="w-full text-xs font-mono font-bold bg-transparent text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Presets */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">اختر من القوالب الجاهزة:</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((p) => (
                    <button
                      key={p.primary}
                      type="button"
                      onClick={() => setEditingBrandingTenant({
                        ...editingBrandingTenant,
                        primary_color: p.primary,
                        secondary_color: p.secondary
                      })}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1.5 hover:bg-slate-700"
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.primary }} />
                      <span>{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Theme Option in Edit Modal */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  نمط الخلفية الدمشقية المتحركة:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {THEME_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setEditingBrandingTenant({
                        ...editingBrandingTenant,
                        background_theme: opt.key,
                      })}
                      className={`p-2.5 rounded-xl border text-right text-xs transition-all flex flex-col justify-between ${
                        (editingBrandingTenant.background_theme || 'damascus_geometric') === opt.key
                          ? 'border-brand-500 bg-brand-500/20 text-white font-bold'
                          : 'border-slate-700 bg-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{opt.name}</span>
                        {(editingBrandingTenant.background_theme || 'damascus_geometric') === opt.key && (
                          <Check className="w-3.5 h-3.5 text-brand-400" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal mt-0.5">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingBrandingTenant(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-all"
                >
                  {submitting ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create New Tenant Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">إضافة مكتبة / مستأجر جديد للنظام</h3>
              </div>
              <button
                onClick={() => setIsCreating(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    اسم المكتبة <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: مكتبة الصفوة الجامعية"
                    value={newName}
                    onChange={e => {
                      setNewName(e.target.value);
                      if (!newSlug) {
                        setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''));
                      }
                    }}
                    className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    معرف الرابط (Slug) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    dir="ltr"
                    placeholder="al-safwa"
                    value={newSlug}
                    onChange={e => setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:ring-1 focus:ring-brand-500 text-left"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">الباقة الابتدائية</label>
                  <select
                    value={newPlan}
                    onChange={e => setNewPlan(e.target.value as TenantPlan)}
                    className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none"
                  >
                    <option value="smart_print">نسخة الطباعة الذكية (Smart Print)</option>
                    <option value="integrated_library">المكتبة المتكاملة (Integrated Library)</option>
                    <option value="enterprise_branches">السلاسل والمؤسسات (Enterprise)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">رقم الهاتف للتواصل</label>
                  <input
                    type="text"
                    placeholder="+963 9..."
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Color Presets */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">لون الهوية البصرية:</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((p) => (
                    <button
                      key={p.primary}
                      type="button"
                      onClick={() => {
                        setNewPrimaryColor(p.primary);
                        setNewSecondaryColor(p.secondary);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1.5 ${
                        newPrimaryColor === p.primary 
                          ? 'border-brand-500 bg-brand-500/20 text-white' 
                          : 'border-slate-700 bg-slate-800 text-slate-400'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.primary }} />
                      <span>{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Modules selection */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  اختر التطبيقات المفعّلة لهذه المكتبة:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {allModules.map(mod => {
                    const isChecked = newFlags[mod.key];
                    return (
                      <label
                        key={mod.key}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-colors text-xs ${
                          isChecked
                            ? 'bg-brand-500/10 border-brand-500/50 text-white'
                            : 'bg-slate-800/40 border-slate-700/50 text-slate-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => setNewFlags({ ...newFlags, [mod.key]: e.target.checked })}
                          className="w-4 h-4 text-brand-600 rounded"
                        />
                        <span className="font-bold">{mod.shortNameAr}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Background Theme Option in Create Modal */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  نمط الخلفية الدمشقية المتحركة:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {THEME_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setNewBackgroundTheme(opt.key)}
                      className={`p-2.5 rounded-xl border text-right text-xs transition-all flex flex-col justify-between ${
                        newBackgroundTheme === opt.key
                          ? 'border-brand-500 bg-brand-500/20 text-white font-bold'
                          : 'border-slate-700 bg-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{opt.name}</span>
                        {newBackgroundTheme === opt.key && (
                          <Check className="w-3.5 h-3.5 text-brand-400" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal mt-0.5">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  {submitting ? 'جاري الإنشاء...' : 'إنشاء وتفعيل المكتبة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
