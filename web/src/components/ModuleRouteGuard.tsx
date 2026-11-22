'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Lock, ArrowRight, Sparkles, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { AppModuleKey, Tenant } from '@/types';
import { getModule, isModuleEnabled } from '@/lib/modules';

interface ModuleRouteGuardProps {
  moduleKey: AppModuleKey;
  children: React.ReactNode;
}

export function ModuleRouteGuard({ moduleKey, children }: ModuleRouteGuardProps) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  const moduleDef = getModule(moduleKey);

  useEffect(() => {
    async function loadTenant() {
      try {
        // Fetch current active tenant (default al-noor for demo)
        const res = await fetch('/api/tenants?slug=al-noor');
        if (res.ok) {
          const data = await res.json();
          setTenant(data);
        }
      } catch (err) {
        console.error('Error fetching tenant in guard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTenant();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  // Check if enabled
  const enabled = isModuleEnabled(tenant, moduleKey);

  if (!enabled && moduleDef) {
    const Icon = moduleDef.icon;

    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white border border-slate-200 rounded-3xl shadow-sm text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="relative w-20 h-20 mx-auto">
          <div className={`w-20 h-20 rounded-3xl bg-gradient-to-tr ${moduleDef.gradient} flex items-center justify-center text-white shadow-xl opacity-90`}>
            <Icon className="w-10 h-10" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-md">
            <Lock className="w-4 h-4" />
          </div>
        </div>

        <div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            تطبيق غير مفعّل في باقتك الحالية
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-3">
            تطبيق {moduleDef.nameAr}
          </h2>
          <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
            {moduleDef.descriptionAr}
          </p>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-600 leading-relaxed max-w-lg mx-auto">
          💡 <strong>معلومة للمالك:</strong> نظام "مكتبتي" مبني بهندسة معيارية (Modular Architecture). يتم تفعيل وإلغاء التطبيقات حسب باقة كل مكتبة من خلال لوحة المالك الرئيسي دون الحاجة لتعديل الكود.
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/dashboard/apps"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span>عرض تطبيقاتي المفعّلة</span>
            <ArrowRight className="w-4 h-4 rotate-180" />
          </Link>

          <Link
            href="/super-admin"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition-all flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>تفعيل التطبيق من لوحة Super Admin</span>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
