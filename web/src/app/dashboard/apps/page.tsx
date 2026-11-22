'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  LayoutGrid, 
  Sliders, 
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { getAllModules, isModuleEnabled } from '@/lib/modules';
import { Tenant } from '@/types';

export default function AppsLauncherPage() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  const modules = getAllModules();

  useEffect(() => {
    async function loadTenant() {
      try {
        const res = await fetch('/api/tenants?slug=al-noor');
        if (res.ok) {
          const data = await res.json();
          setTenant(data);
        }
      } catch (e) {
        console.error('Error loading tenant:', e);
      } finally {
        setLoading(false);
      }
    }
    loadTenant();
  }, []);

  const enabledModules = modules.filter(m => isModuleEnabled(tenant, m.key));
  const disabledModules = modules.filter(m => !isModuleEnabled(tenant, m.key));

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              هندسة التطبيقات المعيارية (Odoo-like Architecture)
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              تطبيقات {tenant?.name || 'المكتبة'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              جميع أدوات الطباعة، المبيعات، المستودعات، والمالية في منصة موحدة. تظهر لك فقط التطبيقات المفعلة وفق باقة مكتبتك.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/super-admin"
              className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/30 transition-all flex items-center gap-2"
            >
              <Sliders className="w-4 h-4" />
              <span>إدارة الباقات (Super Admin)</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 1. Active Apps Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-brand-600" />
            <h2 className="text-lg font-black text-slate-900">
              التطبيقات المفعّلة ({enabledModules.length})
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-semibold">
            اضغط على أي تطبيق لفتحه مباشرة
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {enabledModules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.key}
                href={mod.route}
                className="group bg-white rounded-3xl p-6 border border-slate-200/80 hover:border-brand-500 shadow-sm hover:shadow-xl hover:shadow-brand-500/10 transition-all duration-200 flex flex-col justify-between space-y-4 hover:scale-[1.01]"
              >
                <div className="flex items-start justify-between">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${mod.gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    مفعّل
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-base text-slate-900 group-hover:text-brand-600 transition-colors">
                    {mod.nameAr}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-2">
                    {mod.descriptionAr}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-brand-700">
                  <span>فتح التطبيق</span>
                  <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 2. Inactive / Upgradeable Apps */}
      {disabledModules.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-black text-slate-900">
                تطبيقات إضافية متوفرة للترقية ({disabledModules.length})
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-semibold">
              يمكن تفعيلها فوراً من لوحة Super Admin
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {disabledModules.map((mod) => {
              const Icon = mod.icon;
              return (
                <div
                  key={mod.key}
                  className="bg-slate-50/80 rounded-3xl p-6 border border-slate-200 flex flex-col justify-between space-y-4 opacity-80"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-slate-200 flex items-center justify-center text-slate-500">
                      <Icon className="w-7 h-7" />
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      غير مفعّل
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-slate-800">
                      {mod.nameAr}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      {mod.descriptionAr}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium">غير مشمول في الباقة</span>
                    <Link
                      href="/super-admin"
                      className="text-xs font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1"
                    >
                      تفعيل الآن
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
