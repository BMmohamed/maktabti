'use client';

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Store, QrCode, Download, Printer, Copy, Check, ExternalLink, Key, RefreshCw, MonitorDown, ShieldCheck, Sparkles } from 'lucide-react';
import { ModuleRouteGuard } from '@/components/ModuleRouteGuard';

export default function BranchesAdminPage() {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [regeneratingBranchId, setRegeneratingBranchId] = useState<string | null>(null);

  // Default branches state (pre-populated with Supabase campus token)
  const [branches, setBranches] = useState([
    {
      id: 'b1000000-0000-0000-0000-000000000001',
      name: 'فرع مجمع الكليات الجامعي',
      slug: 'campus',
      address: 'بوابة كلية العلوم - مقابل مجمع الكليات',
      phone: '+963 988 776 655',
      agent_token: 'agent-token-campus-secret-key-1234',
      qrUrl: typeof window !== 'undefined' ? `${window.location.origin}/al-noor/campus` : 'https://maktabati.app/al-noor/campus',
      printers: 'طابعة الأسود + طابعة الألوان التلقائية',
    },
    {
      id: 'b2000000-0000-0000-0000-000000000002',
      name: 'فرع ساحة الشهباء - وسط المدينة',
      slug: 'downtown',
      address: 'شارع المكتبات - جانب البريد المركزي',
      phone: '+963 988 776 656',
      agent_token: 'agent-token-downtown-secret-key-5678',
      qrUrl: typeof window !== 'undefined' ? `${window.location.origin}/al-noor/downtown` : 'https://maktabati.app/al-noor/downtown',
      printers: 'طابعة الإيصالات والأسود',
    }
  ]);

  const handleCopy = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleRegenerateToken = async (branchId: string) => {
    if (!confirm('هل أنت متأكد من رغبتك في توليد رمز جديد؟ سيتطلب ذلك تحديث الرمز في برنامج الوكيل المثبت على جهاز الحاسوب.')) {
      return;
    }
    setRegeneratingBranchId(branchId);
    try {
      const res = await fetch('/api/agent/regenerate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch_id: branchId }),
      });
      const data = await res.json();
      if (res.ok && data.agent_auth_token) {
        setBranches(prev => prev.map(b => b.id === branchId ? { ...b, agent_token: data.agent_auth_token } : b));
        alert('تم توليد الرمز الجديد بنجاح!');
      } else {
        alert(data.error || 'فشل توليد رمز جديد');
      }
    } catch (err: any) {
      alert(`خطأ: ${err.message}`);
    } finally {
      setRegeneratingBranchId(null);
    }
  };

  return (
    <ModuleRouteGuard moduleKey="multi_branch">
      <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
        <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <Store className="w-6 h-6 text-brand-600" />
          إدارة الفروع ووكيل الطباعة المباشرة (MaktabatiPrint)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          لكل فرع رمز أمني لربط برنامج الطباعة الآلي مع طابعات ويندوز، ورابط QR مخصص للعملاء.
        </p>
      </div>

      {/* MaktabatiPrint Desktop App Card */}
      <div className="bg-gradient-to-br from-indigo-900 via-brand-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-brand-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-bold border border-brand-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            برنامج سطح المكتب للطباعة الصامتة والآلية
          </div>
          <h2 className="text-xl font-black">برنامج MaktabatiPrint لنظام Windows</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            برنامج خفيف واحترافي يعمل في شريط المهام بجانب الساعة، يستقبل طلبات الزبائن المعتمدة فوراً، ويحولها إلى طابعاتك المعرفة تلقائياً (أبيض وأسود أو ألوان، وجه أو وجهين) بدون أي تدخل يدوي أو الحاجة لفتح المتصفح.
          </p>
          <div className="flex flex-wrap gap-4 pt-2 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> لا يحتاج أي مفاتيح سرية
            </span>
            <span className="flex items-center gap-1">
              <Check className="w-4 h-4 text-emerald-400" /> يدعم جميع طابعات ويندوز
            </span>
            <span className="flex items-center gap-1">
              <RefreshCw className="w-4 h-4 text-emerald-400" /> تشغيل تلقائي مع بدء ويندوز
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 shrink-0">
          <a
            href="https://github.com/BMmohamed/maktabti/releases/download/1.0.0/MaktabatiPrint.exe"
            target="_blank"
            rel="noopener noreferrer"
            download
            className="px-5 py-3 rounded-xl bg-brand-500 hover:bg-brand-400 text-white font-bold text-sm flex items-center gap-2 transition-all shadow-lg hover:shadow-brand-500/25 active:scale-95"
          >
            <MonitorDown className="w-5 h-5" />
            تحميل MaktabatiPrint.exe
          </a>
          <span className="text-[10px] text-slate-400">حجم الملف ~60MB • نسخة محمولة مستقلة</span>
        </div>
      </div>

      {/* Branches List */}
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
              <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="font-semibold text-slate-700">رمز ربط الوكيل (Agent Auth Token):</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopy(branch.agent_token)}
                      className="flex items-center gap-1 font-mono font-bold text-slate-700 hover:text-slate-950 bg-white px-2 py-1 rounded border shadow-xs"
                      title="نسخ رمز الربط"
                    >
                      {copiedToken === branch.agent_token ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedToken === branch.agent_token ? 'تم النسخ' : 'نسخ الرمز'}</span>
                    </button>
                    <button
                      onClick={() => handleRegenerateToken(branch.id)}
                      disabled={regeneratingBranchId === branch.id}
                      className="flex items-center gap-1 font-bold text-slate-500 hover:text-red-600 bg-white px-2 py-1 rounded border shadow-xs text-[11px] disabled:opacity-50"
                      title="توليد رمز جديد لهذا الفرع"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${regeneratingBranchId === branch.id ? 'animate-spin' : ''}`} />
                      <span>تجديد</span>
                    </button>
                  </div>
                </div>
                <div className="font-mono text-[11px] bg-white p-2 rounded border border-slate-200 text-slate-600 break-all select-all">
                  {branch.agent_token}
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  ضع هذا الرمز داخل برنامج MaktabatiPrint لربط الطابعة بهذا الفرع مباشرة.
                </p>
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
