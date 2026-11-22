'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, Lock, CheckCircle2, ArrowRight } from 'lucide-react';
import { getAllModules, isModuleEnabled } from '@/lib/modules';
import { Tenant } from '@/types';

interface AppLauncherProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant | null;
}

export function AppLauncher({ isOpen, onClose, tenant }: AppLauncherProps) {
  const pathname = usePathname();
  const modules = getAllModules();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center font-black text-lg">
              ⋮⋮⋮
            </div>
            <div>
              <h2 className="text-xl font-black text-white">منظومة التطبيقات (App Launcher)</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {tenant ? `المكتبة النشطة: ${tenant.name}` : 'اختر التطبيق المطلوب للانتقال إليه'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modules Grid (Odoo Style) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 py-6 max-h-[70vh] overflow-y-auto">
          {modules.map((mod) => {
            const Icon = mod.icon;
            const enabled = isModuleEnabled(tenant, mod.key);
            const isCurrent = pathname === mod.route;

            if (enabled) {
              return (
                <Link
                  key={mod.key}
                  href={mod.route}
                  onClick={onClose}
                  className={`group relative p-4 rounded-2xl border transition-all flex flex-col items-center text-center ${
                    isCurrent
                      ? 'bg-slate-800/90 border-brand-500 ring-2 ring-brand-500/30 shadow-lg'
                      : 'bg-slate-800/40 hover:bg-slate-800 border-slate-700/60 hover:border-slate-600 hover:scale-[1.02]'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${mod.gradient} flex items-center justify-center text-white shadow-lg mb-3 group-hover:shadow-brand-500/20 group-hover:scale-105 transition-all`}>
                    <Icon className="w-7 h-7" />
                  </div>

                  <span className="font-bold text-sm text-white block">
                    {mod.nameAr}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {mod.descriptionAr}
                  </span>

                  <span className="mt-3 text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    مفعّل في باقتك
                  </span>
                </Link>
              );
            }

            // Locked module
            return (
              <div
                key={mod.key}
                className="relative p-4 rounded-2xl border border-slate-800/80 bg-slate-900/60 opacity-60 flex flex-col items-center text-center select-none"
              >
                <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500 mb-3 relative">
                  <Icon className="w-7 h-7" />
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center">
                    <Lock className="w-3 h-3" />
                  </div>
                </div>

                <span className="font-bold text-sm text-slate-300 block">
                  {mod.nameAr}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                  {mod.descriptionAr}
                </span>

                <span className="mt-3 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  غير مفعّل
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <span>نظام الوحدات والتطبيقات الموحد • Odoo-like Architecture</span>
          <Link
            href="/super-admin"
            onClick={onClose}
            className="text-brand-400 hover:text-brand-300 font-bold flex items-center gap-1"
          >
            <span>لوحة المالك الرئيسي (Super Admin)</span>
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
          </Link>
        </div>
      </div>
    </div>
  );
}
