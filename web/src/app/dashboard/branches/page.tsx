'use client';

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Store, QrCode, Download, Printer, Copy, Check, ExternalLink, Key } from 'lucide-react';
import { ModuleRouteGuard } from '@/components/ModuleRouteGuard';

export default function BranchesAdminPage() {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const branches = [
    {
      id: 'b1',
      name: 'فرع مجمع الكليات الجامعي',
      slug: 'campus',
      address: 'بوابة كلية العلوم - مقابل مجمع الكليات',
      phone: '+963 988 776 655',
      agent_token: 'agent-token-campus-secret-key-1234',
      qrUrl: 'https://maktabati.app/al-noor/campus',
      printers: 'HP LaserJet P2035 (أسود) + Epson L805 (ملون)',
    },
    {
      id: 'b2',
      name: 'فرع ساحة الشهباء - وسط المدينة',
      slug: 'downtown',
      address: 'شارع المكتبات - جانب البريد المركزي',
      phone: '+963 988 776 656',
      agent_token: 'agent-token-downtown-secret-key-5678',
      qrUrl: 'https://maktabati.app/al-noor/downtown',
      printers: 'Canon i-SENSYS LBP6030 (أسود)',
    }
  ];

  const handleCopy = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <ModuleRouteGuard moduleKey="multi_branch">
      <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
        <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <Store className="w-6 h-6 text-brand-600" />
          إدارة الفروع ورموز الـ QR للطباعة الذكية
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          لكل فرع رابط و QR Code فريد يمكن طباعته ولصقه على طاولات وكاونترات المكتبة لطلب الزبائن فورياً
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {branches.map(branch => (
          <div key={branch.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{branch.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{branch.address}</p>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                  /{branch.slug}
                </span>
              </div>

              {/* QR Code Card for Table Stand Print */}
              <div className="mt-5 p-5 bg-gradient-to-b from-slate-50 to-slate-100 rounded-2xl border border-slate-200 flex flex-col items-center text-center">
                <span className="text-xs font-bold text-slate-600 mb-2">
                  امسح الرمز لرفع الملفات والطباعة مباشرة
                </span>
                
                <div className="p-3 bg-white rounded-xl shadow-md border border-slate-200">
                  <QRCodeSVG value={branch.qrUrl} size={150} />
                </div>

                <p className="font-mono text-xs text-brand-700 font-bold mt-3">
                  {branch.qrUrl}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  الطابعات المعرفة: {branch.printers}
                </p>
              </div>

              {/* Agent Authentication Key */}
              <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-semibold text-slate-700">مفتاح وكيل الطباعة (Agent Token):</span>
                </div>
                <button
                  onClick={() => handleCopy(branch.agent_token)}
                  className="flex items-center gap-1 font-mono font-bold text-slate-700 hover:text-slate-950 bg-white px-2 py-1 rounded border shadow-xs"
                >
                  {copiedToken === branch.agent_token ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedToken === branch.agent_token ? 'تم النسخ' : 'نسخ المفتاح'}</span>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 border-t flex items-center justify-between">
              <a
                href={branch.qrUrl}
                target="_blank"
                className="text-xs font-bold text-slate-600 hover:text-brand-600 flex items-center gap-1"
              >
                تجربة واجهة الزبون
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Printer className="w-4 h-4" />
                طباعة بوستر الـ QR للفرع
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
    </ModuleRouteGuard>
  );
}
