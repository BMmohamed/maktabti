import React from 'react';
import { OrderStatus, PaymentStatus } from '@/types';
import { Clock, Printer, XCircle, AlertCircle, CheckCircle2 } from 'lucide-react';

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  switch (status) {
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3.5 h-3.5 animate-spin" />
          بانتظار المراجعة
        </span>
      );
    case 'approved':
    case 'printing':
    case 'completed':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Printer className="w-3.5 h-3.5" />
          تم التحويل للطابعة
        </span>
      );
    case 'cancelled':
    case 'rejected':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3.5 h-3.5" />
          ملغي / مرفوض
        </span>
      );
    default:
      return null;
  }
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  switch (status) {
    case 'verified':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-100 text-emerald-800">
          <CheckCircle2 className="w-3 h-3" />
          مدفوع ومؤكد
        </span>
      );
    case 'receipt_uploaded':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-indigo-100 text-indigo-800">
          <AlertCircle className="w-3 h-3" />
          إيصال شام كاش مرفق
        </span>
      );
    case 'waived':
    case 'cash_on_delivery':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
          دفع عند الاستلام
        </span>
      );
    case 'unpaid':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-100 text-amber-800">
          غير مدفوع
        </span>
      );
  }
}
