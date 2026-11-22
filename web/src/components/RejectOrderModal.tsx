'use client';

import React, { useState } from 'react';
import { X, AlertTriangle, Ban, Check } from 'lucide-react';
import { PrintOrder } from '@/types';

interface RejectOrderModalProps {
  order: PrintOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmReject: (orderId: string, reason: string) => Promise<void>;
}

const PRESET_REASONS = [
  'الملف غير صالح، تالف، أو محمي بكلمة سر',
  'إيصال شام كاش غير واضح أو لم يتم إيداع المبلغ في الحساب',
  'الورق أو نوع التجليد والتسليك المطلوب غير متوفر حالياً بالفرع',
  'عدد الصفحات أو تفاصيل الملف لا تطابق الخيارات المختارة',
  'طلب مكرر أو تم إلغاؤه من قبل الزبون',
];

export function RejectOrderModal({
  order,
  isOpen,
  onClose,
  onConfirmReject,
}: RejectOrderModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>(PRESET_REASONS[0]);
  const [customNote, setCustomNote] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = customNote.trim()
      ? `${selectedPreset} - ملاحظة: ${customNote.trim()}`
      : selectedPreset;

    try {
      setSubmitting(true);
      await onConfirmReject(order.id, finalReason);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-rose-100 flex flex-col max-h-[90vh]"
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-rose-50 px-6 py-4 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-600/20">
              <Ban className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-rose-950">
                الاعتذار عن تنفيذ الطلب #{order.daily_order_code}
              </h2>
              <p className="text-xs text-rose-700 font-medium">
                الزبون: {order.customer_name || 'زبون سريع'} ({order.customer_phone})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-rose-200/50 text-rose-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-800 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              سيتم نقل هذا الطلب مباشرة إلى <strong>"أرشيف الطلبات المرفوضة"</strong>، وتحديث حالة المتابعة لدى الزبون مع توضيح سبب الاعتذار.
            </span>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 block mb-2">
              اختر سبب الرفض السريع:
            </label>
            <div className="space-y-2">
              {PRESET_REASONS.map((reason) => {
                const isSelected = selectedPreset === reason;
                return (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setSelectedPreset(reason)}
                    className={`w-full text-right p-3 rounded-2xl text-xs font-semibold border transition-all flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'border-rose-500 bg-rose-50/70 text-rose-950 font-bold shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700'
                    }`}
                  >
                    <span>{reason}</span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1.5">
              ملاحظة أو توضيح إضافي للزبون (اختياري):
            </label>
            <textarea
              rows={2}
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="اكتب أي تفاصيل أخرى أو نصيحة للزبون هنا..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 transition-colors"
            >
              إلغاء وتراجع
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-black shadow-md shadow-rose-600/25 transition-all flex items-center gap-1.5"
            >
              <Ban className="w-4 h-4" />
              <span>{submitting ? 'جاري الرفض...' : 'تأكيد الرفض'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
