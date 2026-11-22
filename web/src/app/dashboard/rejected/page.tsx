'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Ban, ArrowLeft, Search, RefreshCw, RotateCcw, 
  MessageCircle, FileText, AlertTriangle, CheckCircle2, 
  Clock, ExternalLink, Calendar, User, Phone, Eye
} from 'lucide-react';
import { PrintOrder, OrderStatus } from '@/types';
import { formatCurrency, buildWhatsAppRejectionLink } from '@/lib/utils';
import { ModuleRouteGuard } from '@/components/ModuleRouteGuard';

export default function RejectedOrdersPage() {
  const [orders, setOrders] = useState<PrintOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/orders', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store' },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          // Filter rejected and cancelled orders only
          const rejected = data.filter(
            (o: PrintOrder) => o.status === 'rejected' || o.status === 'cancelled'
          );
          setOrders(rejected);
        }
      }
    } catch (e) {
      console.error('Error fetching rejected orders:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const showNotification = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  // Restore order to pending state
  const handleRestoreOrder = async (order: PrintOrder) => {
    if (!confirm(`هل أنت متأكد من إعادة الطلب #${order.daily_order_code} إلى طابور المراجعة النشط؟`)) {
      return;
    }

    try {
      setRestoringId(order.id);
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: order.id,
          status: 'pending',
          customer_notes: order.customer_notes
            ? order.customer_notes.replace(/\[سبب الرفض:.*?\]\s*-?\s*/g, '')
            : null,
        }),
      });

      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== order.id));
        showNotification(`تمت إعادة الطلب #${order.daily_order_code} إلى طابور المراجعة بنجاح!`);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`خطأ: ${err.error || 'فشل استرجاع الطلب'}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`خطأ في الاتصال: ${err.message}`);
    } finally {
      setRestoringId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const term = search.toLowerCase();
    const matchesCode = String(o.daily_order_code).includes(term);
    const matchesName = (o.customer_name || '').toLowerCase().includes(term);
    const matchesPhone = (o.customer_phone || '').includes(term);
    const matchesNotes = (o.customer_notes || '').toLowerCase().includes(term);
    return matchesCode || matchesName || matchesPhone || matchesNotes;
  });

  return (
    <ModuleRouteGuard moduleKey="smart_print">
      <div className="space-y-6" dir="rtl">
        {/* Toast alert */}
        {actionSuccessMsg && (
          <div className="fixed bottom-6 left-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-black animate-in fade-in slide-in-from-bottom-3 duration-300">
            <CheckCircle2 className="w-4 h-4" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* Top Header Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shadow-xs shrink-0">
              <Ban className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900">
                  أرشيف الطلبات المعتذر عنها والمرفوضة
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                  {orders.length} طلب
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                سجل الطلبات الملغاة مع أسباب الرفض المسجلة، إمكانية مراسلة الزبون للاعتذار، أو إعادة الطلب للمراجعة.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Link
              href="/dashboard"
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4 rotate-180" />
              <span>العودة لطابور الطباعة</span>
            </Link>

            <button
              onClick={fetchOrders}
              disabled={loading}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
              title="تحديث الأرشيف"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            <input
              type="text"
              placeholder="ابحث برقم الطلب، اسم الزبون، أو سبب الرفض..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-10 pl-3 py-2 text-xs bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-900 placeholder-slate-400"
            />
          </div>

          <span className="text-xs text-slate-500 font-semibold self-start sm:self-auto">
            عرض {filteredOrders.length} من أصل {orders.length} طلب مرفوض
          </span>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
            <RefreshCw className="w-8 h-8 text-rose-500 animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-600">جاري تحميل سجل الطلبات المرفوضة...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-black text-slate-900">لا توجد طلبات مرفوضة</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {search
                ? 'لا توجد نتائج تطابق بحثك الحالي.'
                : 'رائع! لا يوجد أي طلب معتذر عنه حالياً في هذا الفرع.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredOrders.map((order) => {
              // Extract rejection reason from customer_notes if prefixed with [سبب الرفض: ...]
              const notes = order.customer_notes || '';
              const match = notes.match(/\[سبب الرفض:\s*([^\]]+)\]/);
              const reasonText = match ? match[1] : (notes || 'لم يُحدد سبب مفصل');
              const extraNotes = match ? notes.replace(match[0], '').replace(/^-\s*/, '').trim() : '';

              const whatsappLink = order.customer_phone
                ? buildWhatsAppRejectionLink(
                    order.customer_phone,
                    order.daily_order_code,
                    'المكتبة',
                    reasonText,
                    order.customer_name
                  )
                : null;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl p-5 sm:p-6 border border-rose-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                >
                  {/* Left Column: Order Info */}
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-2xl font-black font-mono text-slate-900 bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-xl">
                        #{order.daily_order_code}
                      </span>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                        {order.order_type === 'in_store' ? 'داخل المكتبة (QR)' : 'طلب مسبق عن بُعد'}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(order.created_at).toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Customer details */}
                    <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
                      <span className="font-bold text-slate-900 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {order.customer_name || 'زبون سريع'}
                      </span>
                      <span className="font-mono text-slate-600 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {order.customer_phone}
                      </span>
                      <span className="font-bold text-slate-700">
                        {order.total_pages_count} صفحة • {formatCurrency(order.total_price, order.currency)}
                      </span>
                    </div>

                    {/* Rejection Reason Banner */}
                    <div className="bg-rose-50/80 border border-rose-200/90 rounded-2xl p-3 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-rose-800 font-black">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>سبب الرفض:</span>
                        <span className="font-bold text-rose-950">{reasonText}</span>
                      </div>
                      {extraNotes && (
                        <p className="text-[11px] text-rose-700 pr-5">
                          ملاحظة إضافية: {extraNotes}
                        </p>
                      )}
                    </div>

                    {/* Items titles list */}
                    {order.items && order.items.length > 0 && (
                      <div className="text-xs text-slate-500 space-y-1">
                        <span className="font-semibold text-slate-700">الملفات المطلوبة:</span>
                        <div className="flex flex-wrap gap-2 pt-0.5">
                          {order.items.map((item, idx) => (
                            <span
                              key={item.id || idx}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-medium"
                            >
                              <FileText className="w-3 h-3 text-slate-400" />
                              <span className="max-w-[200px] truncate">{item.item_title}</span>
                              <span className="text-slate-400">({item.page_count} ص)</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex flex-wrap lg:flex-col items-center lg:items-end gap-2.5 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0">
                    {/* Restore Button */}
                    <button
                      onClick={() => handleRestoreOrder(order)}
                      disabled={restoringId === order.id}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                      title="إعادة هذا الطلب إلى طابور المراجعة النشط"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${restoringId === order.id ? 'animate-spin' : ''}`} />
                      <span>{restoringId === order.id ? 'جاري الاسترجاع...' : 'استرجاع للمراجعة'}</span>
                    </button>

                    {/* WhatsApp apology link */}
                    {whatsappLink && order.order_type === 'remote' && (
                      <a
                        href={whatsappLink}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-colors flex items-center gap-1.5"
                        title="إرسال رسالة اعتذار رسمية للزبون عبر واتساب"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>مراسلة واتساب للاعتذار</span>
                      </a>
                    )}

                    {/* Customer tracking link preview */}
                    <Link
                      href={`/al-noor/campus/order/${order.id}?code=${order.daily_order_code}`}
                      target="_blank"
                      className="px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 text-[11px] font-semibold flex items-center gap-1"
                    >
                      <span>شاشة الزبون</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ModuleRouteGuard>
  );
}
