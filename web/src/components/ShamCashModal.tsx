'use client';

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Upload, CheckCircle2, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { Branch } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface ShamCashModalProps {
  isOpen: boolean;
  onClose: () => void;
  branch: Branch;
  amount: number;
  currency?: string;
  secondaryAmountText?: string;
  orderRef?: string;
  onReceiptSelected: (file: File) => void;
  receiptFile: File | null;
}

export function ShamCashModal({
  isOpen,
  onClose,
  branch,
  amount,
  currency,
  secondaryAmountText,
  orderRef,
  onReceiptSelected,
  receiptFile,
}: ShamCashModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onReceiptSelected(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-100 border border-blue-400/30">
              الدفع السريع
            </span>
            <h3 className="text-xl font-bold mt-1">الدفع عبر شام كاش (Sham Cash)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Amount Due Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600 font-medium">المبلغ المطلوب تحويله</p>
              <p className="text-2xl font-black text-blue-900 mt-0.5">
                {formatCurrency(amount, currency || branch.default_currency)}
              </p>
              {secondaryAmountText && (
                <p className="text-xs font-bold text-blue-700/80 mt-1">
                  ({secondaryAmountText})
                </p>
              )}
            </div>
            {orderRef && (
              <div className="text-left">
                <span className="text-xs text-slate-500">ملاحظة التحويل</span>
                <span className="block font-mono text-sm font-bold text-slate-800 bg-white px-2 py-1 rounded border">
                  {orderRef}
                </span>
              </div>
            )}
          </div>

          {/* QR Code & Account details */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200">
            {branch.sham_cash_qr_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={branch.sham_cash_qr_url}
                alt="شام كاش QR"
                className="w-44 h-44 object-contain rounded-lg border shadow-sm bg-white p-2"
              />
            ) : branch.sham_cash_account_info ? (
              <div className="p-3 bg-white rounded-lg shadow-sm border">
                <QRCodeSVG value={branch.sham_cash_account_info} size={160} />
              </div>
            ) : null}

            <p className="mt-3 text-sm font-semibold text-slate-800 text-center">
              {branch.sham_cash_account_info || 'حساب شام كاش المعتمد للفرع'}
            </p>
            <p className="text-xs text-slate-500 text-center mt-1">
              امسح الرمز عبر تطبيق شام كاش أو حوّل للمعرف أعلاه واكتب رقمك في الملاحظة
            </p>
          </div>

          {/* Receipt Upload Section */}
          <div className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 transition-colors rounded-xl p-4 bg-indigo-50/50">
            <label className="block text-center cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {receiptFile && previewUrl ? (
                <div className="flex flex-col items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="معاينة الإيصال"
                    className="max-h-36 rounded-lg border border-slate-300 shadow-sm"
                  />
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold mt-1">
                    <CheckCircle2 className="w-4 h-4" />
                    تم إرفاق صورة الإيصال: {receiptFile.name}
                  </div>
                  <span className="text-[11px] text-blue-600 underline">تغيير الصورة</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-2">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold text-slate-700">
                    اضغط هنا لإرفاق لقطة شاشة (إيصال التحويل)
                  </span>
                  <span className="text-xs text-slate-500">
                    إلزامية لتأكيد الطلب الفوري وبدء الطباعة
                  </span>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={onClose}
            disabled={!receiptFile}
            className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-500/20 transition-all"
          >
            تأكيد إرفاق الإيصال
          </button>
        </div>
      </div>
    </div>
  );
}
