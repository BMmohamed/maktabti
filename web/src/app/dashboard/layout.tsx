'use client';

import React, { useState, useEffect } from 'react';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Printer, BookOpen, Smartphone, ShoppingCart, 
  Boxes, Building2, BarChart3, Settings, ExternalLink, 
  Menu, X, LayoutGrid, ShieldCheck, Sparkles, Store, Coins
} from 'lucide-react';
import { Tenant, AppModuleKey } from '@/types';
import { AppLauncher } from '@/components/AppLauncher';
import { isModuleEnabled } from '@/lib/modules';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [tenant, setTenant] = useState<Tenant | null>(null);

  // Load active tenant
  const loadTenant = async () => {
    try {
      const res = await fetch('/api/tenants?slug=al-noor');
      if (res.ok) {
        const data = await res.json();
        setTenant(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadTenant();
    // Poll tenant flags every 4s so super-admin changes reflect dynamically
    const interval = setInterval(loadTenant, 4000);
    return () => clearInterval(interval);
  }, []);

  // All possible navigation items mapped to module keys
  const allNavItems: Array<{
    key?: AppModuleKey;
    name: string;
    href: string;
    icon: React.ElementType;
    badge?: string;
  }> = [
    { name: 'منظومة التطبيقات (Apps)', href: '/dashboard/apps', icon: LayoutGrid },
    { key: 'smart_print', name: 'طابور الطباعة الفوري', href: '/dashboard', icon: Printer },
    { key: 'notes_catalog', name: 'مكتبة النوط والملخصات', href: '/dashboard/notes', icon: BookOpen },
    { key: 'pos', name: 'نقطة البيع والكاشير (POS)', href: '/dashboard/pos', icon: ShoppingCart, badge: 'قريباً' },
    { key: 'inventory', name: 'المخزون والقرطاسية', href: '/dashboard/inventory', icon: Boxes, badge: 'قريباً' },
    { key: 'multi_branch', name: 'إدارة الفروع ورموز QR', href: '/dashboard/branches', icon: Building2 },
    { key: 'audit_reports', name: 'مراقبة عداد الأوراق (Audit)', href: '/dashboard/audit', icon: BarChart3 },
    { key: 'smart_print', name: 'أسعار الطباعة والصرف (₺/ل.س)', href: '/dashboard/pricing', icon: Coins },
    { key: 'shamcash_pay', name: 'الأسعار وشام كاش', href: '/dashboard/settings', icon: Settings },
  ];

  // Dynamically filter nav items based on enabled feature flags!
  const visibleNavItems = allNavItems.filter(item => {
    if (!item.key) return true; // General items like Apps Launcher are always visible
    return isModuleEnabled(tenant, item.key);
  });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <header className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setLauncherOpen(true)}
            className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white text-xs font-black shadow-sm"
            title="فتح شبكة التطبيقات (Odoo App Launcher)"
          >
            ⋮⋮⋮
          </button>
          <span className="font-bold text-base">{tenant?.name || 'مكتبتي'}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLauncherOpen(true)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            title="التطبيقات"
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Sidebar for Desktop */}
      <aside
        className={`fixed md:sticky top-0 inset-y-0 right-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col justify-between transition-transform duration-200 ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Logo & Odoo App Switcher Icon */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setLauncherOpen(true)}
                className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-brand-500/20 hover:scale-105 transition-transform"
                title="اضغط هنا لفتح شبكة التطبيقات (Odoo App Launcher)"
              >
                ⋮⋮⋮
              </button>
              <div>
                <h2 className="font-bold text-white text-sm truncate max-w-[140px]">
                  {tenant?.name || 'مكتبة النور الحديثة'}
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-emerald-400 font-medium">سحابي موحد (Modular)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Nav links (Filtered dynamically based on enabled modules) */}
          <nav className="p-3 space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              التطبيقات المفعّلة
            </div>

            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <NextLink
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-bold border border-slate-700">
                      {item.badge}
                    </span>
                  )}
                </NextLink>
              );
            })}
          </nav>
        </div>

        {/* Footer info & Super Admin shortcut */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          <NextLink
            href="/super-admin"
            className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-xs font-bold text-amber-400 border border-amber-500/20 transition-colors"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>لوحة المالك (Super Admin)</span>
            </div>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">تحكم</span>
          </NextLink>

          <NextLink
            href="/al-noor/campus"
            target="_blank"
            className="flex items-center justify-between px-3 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs transition-colors"
          >
            <span>صفحة الزبون (QR)</span>
            <ExternalLink className="w-3 h-3" />
          </NextLink>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Desktop Top Header with Odoo 9-dots button */}
        <header className="hidden md:flex bg-white border-b border-slate-200 px-8 py-3.5 items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLauncherOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all shadow-xs"
              title="فتح مشغل التطبيقات الشبيه بـ Odoo"
            >
              <LayoutGrid className="w-4 h-4 text-brand-600" />
              <span>شبكة التطبيقات (Apps)</span>
            </button>

            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border">
              الفرع: فرع مجمع الكليات
            </span>
          </div>

          <div className="flex items-center gap-3">
            <NextLink
              href="/dashboard/apps"
              className="text-xs font-bold text-slate-600 hover:text-brand-600 flex items-center gap-1"
            >
              <span>مركز التطبيقات</span>
            </NextLink>
            <span className="text-slate-300">•</span>
            <NextLink
              href="/super-admin"
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>لوحة المالك المركزي</span>
            </NextLink>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 md:p-8">
          {children}
        </main>
      </div>

      {/* Odoo-style App Launcher Modal */}
      <AppLauncher
        isOpen={launcherOpen}
        onClose={() => setLauncherOpen(false)}
        tenant={tenant}
      />
    </div>
  );
}
