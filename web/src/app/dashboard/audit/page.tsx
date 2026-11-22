'use client';

import React, { useState } from 'react';
import { BarChart3, FileSpreadsheet, ShieldAlert, TrendingUp, Layers, CheckCircle2, Download, Coins } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { ModuleRouteGuard } from '@/components/ModuleRouteGuard';

export default function AuditPage() {
  const [selectedBranch, setSelectedBranch] = useState('all');

  const auditStats = {
    totalSheets: 1420, // Physical paper sheets
    bwPages: 1840,
    colorPages: 450,
    revenueSYP: 546000,
    revenueTRY: 1250.50,
  };

  const auditLogs = [
    {
      id: 'log-1',
      daily_code: 105,
      time: '14:40',
      branch: 'فرع الجامعة',
      operator: 'أحمد الحمصي',
      printer: 'Canon LBP6030',
      bwPages: 30,
      colorPages: 10,
      physicalSheets: 20,
      revenue: 45.0,
      currency: 'TRY',
      status: 'verified',
    },
    {
      id: 'log-2',
      daily_code: 104,
      time: '14:22',
      branch: 'فرع الجامعة',
      operator: 'أحمد الحمصي',
      printer: 'HP LaserJet P2035',
      bwPages: 16,
      colorPages: 36,
      physicalSheets: 34,
      revenue: 18500,
      currency: 'SYP',
      status: 'verified',
    },
    {
      id: 'log-3',
      daily_code: 103,
      time: '13:50',
      branch: 'فرع الجامعة',
      operator: 'أحمد الحمصي',
      printer: 'HP LaserJet P2035',
      bwPages: 12,
      colorPages: 0,
      physicalSheets: 6,
      revenue: 3600,
      currency: 'SYP',
      status: 'verified',
    },
    {
      id: 'log-4',
      daily_code: 102,
      time: '12:15',
      branch: 'فرع وسط المدينة',
      operator: 'محمود الحلبي',
      printer: 'Canon LBP6030',
      bwPages: 84,
      colorPages: 0,
      physicalSheets: 42,
      revenue: 25200,
      currency: 'SYP',
      status: 'verified',
    },
    {
      id: 'log-5',
      daily_code: 101,
      time: '10:30',
      branch: 'فرع الجامعة',
      operator: 'أحمد الحمصي',
      printer: 'Epson L805 (ملون)',
      bwPages: 0,
      colorPages: 25,
      physicalSheets: 25,
      revenue: 30000,
      currency: 'SYP',
      status: 'verified',
    }
  ];

  return (
    <ModuleRouteGuard moduleKey="audit_reports">
      <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-brand-600" />
            سجل وتدقيق عدّاد الأوراق لمنع الهدر (Anti-Leakage Audit)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            مقارنة دقيقة ومباشرة بين عدد الصفحات المطبوعة فعلياً، الأوراق الفيزيائية المستهلكة، والإيراد المحقق
          </p>
        </div>

        <button
          onClick={() => alert('تم تصدير سجل التدقيق بصيغة Excel')}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
        >
          <Download className="w-4 h-4" />
          تصدير التقرير (Excel)
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">إجمالي الورق الفيزيائي الفعلي</span>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {auditStats.totalSheets.toLocaleString('ar-SY')} ورقة
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
            يحسب الوجهين كورقة واحدة
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">صفحات الأبيض والأسود</span>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {auditStats.bwPages.toLocaleString('ar-SY')} صفحة
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">ليزر طابعة الأسود</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">صفحات الطباعة الملونة</span>
          <p className="text-2xl font-black text-purple-700 mt-1">
            {auditStats.colorPages.toLocaleString('ar-SY')} صفحة
          </p>
          <span className="text-[11px] text-purple-600 font-semibold mt-1 block">طابعات الحبر والألوان</span>
        </div>

        {/* Financial SYP Card */}
        <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 block">إيراد الليرة السورية</span>
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900">SYP</span>
          </div>
          <p className="text-2xl font-black text-emerald-900 mt-1">
            {formatCurrency(auditStats.revenueSYP, 'SYP')}
          </p>
          <span className="text-[11px] text-emerald-700 font-medium mt-1 block">مقبوضات كاش وشام كاش</span>
        </div>

        {/* Financial TRY Card */}
        <div className="bg-sky-50/60 p-5 rounded-2xl border border-sky-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-800 block">إيراد الليرة التركية</span>
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-sky-200 text-sky-900">TRY</span>
          </div>
          <p className="text-2xl font-black text-sky-900 mt-1">
            {formatCurrency(auditStats.revenueTRY, 'TRY')}
          </p>
          <span className="text-[11px] text-sky-700 font-medium mt-1 block">صندوق الليرة التركية المستقل</span>
        </div>
      </div>

      {/* Detailed Audit Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">سجل عمليات الطباعة المفصلة اليوم</h3>
          <span className="text-xs text-slate-400">محدث لحظياً ومفصول بدقة حسب العملة</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">رقم الطلب</th>
                <th className="p-3">الوقت والفرع</th>
                <th className="p-3">الموظف / المشغل</th>
                <th className="p-3">الطابعة المستخدمة</th>
                <th className="p-3 text-center">أبيض وأسود</th>
                <th className="p-3 text-center">ملون</th>
                <th className="p-3 text-center">الأوراق الفعلية</th>
                <th className="p-3">الإيراد والعملة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3 font-mono font-bold text-slate-900">#{log.daily_code}</td>
                  <td className="p-3">
                    <span className="font-semibold text-slate-800">{log.branch}</span>
                    <span className="block text-[11px] text-slate-400">{log.time}</span>
                  </td>
                  <td className="p-3 text-slate-800">{log.operator}</td>
                  <td className="p-3 font-mono text-[11px] text-slate-500">{log.printer}</td>
                  <td className="p-3 text-center font-bold text-slate-900">{log.bwPages}</td>
                  <td className="p-3 text-center font-bold text-purple-700">{log.colorPages}</td>
                  <td className="p-3 text-center font-black text-slate-900">{log.physicalSheets}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className={log.currency === 'TRY' ? 'text-sky-800 font-black' : 'text-emerald-800 font-black'}>
                        {formatCurrency(log.revenue, log.currency)}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${
                        log.currency === 'TRY' ? 'bg-sky-100 text-sky-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {log.currency === 'TRY' ? '₺' : 'ل.س'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </ModuleRouteGuard>
  );
}
