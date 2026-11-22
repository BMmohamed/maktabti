'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Printer, CheckCircle2, Clock, CheckCheck, XCircle, 
  Eye, MessageCircle, AlertCircle, RefreshCw, Volume2, 
  Smartphone, FileText, Check, RotateCw, AlertTriangle, Ban, RotateCcw
} from 'lucide-react';
import { PrintOrder, OrderStatus, PaymentStatus } from '@/types';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/OrderStatusBadge';
import { formatCurrency, buildWhatsAppPickupLink } from '@/lib/utils';
import { playNotificationSound } from '@/lib/sound';
import { ModuleRouteGuard } from '@/components/ModuleRouteGuard';
import { createClient } from '@/lib/supabase/client';
import { RejectOrderModal } from '@/components/RejectOrderModal';

export default function DashboardOrdersPage() {
  const [orders, setOrders] = useState<PrintOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoPrintMode, setAutoPrintMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'pending' | 'completed' | 'rejected' | 'all'>('pending');
  const [apiError, setApiError] = useState<string | null>(null);
  const [rejectingOrder, setRejectingOrder] = useState<PrintOrder | null>(null);

  // Sham Cash Receipt Modal state
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null);
  const [receiptModalOrderId, setReceiptModalOrderId] = useState<string | null>(null);

  // Fetch orders directly from Supabase (Strict No-Cache)
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache',
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setOrders(data);
          setApiError(null);
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        const msg = errJson.error || `خطأ استجابة السيرفر (${res.status})`;
        console.error('Error fetching orders:', msg, errJson);
        setApiError(msg);
      }
    } catch (e: any) {
      console.error('Network error fetching orders:', e);
      setApiError(e?.message || 'تعذر الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();

    // 1. Supabase Realtime Subscription across all devices
    let channel: any = null;
    try {
      const supabase = createClient();
      channel = supabase
        .channel('realtime_dashboard_orders')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'print_orders' },
          (payload) => {
            console.log('Realtime change from Supabase:', payload);
            if (payload.eventType === 'INSERT' && soundEnabled) {
              playNotificationSound();
            }
            fetchOrders();
          }
        )
        .subscribe();
    } catch (e) {
      console.warn('Realtime subscription error:', e);
    }

    // 2. High-frequency non-cached polling as guaranteed fallback
    const interval = setInterval(() => {
      fetchOrders();
    }, 3000);

    return () => {
      if (channel) {
        try {
          const supabase = createClient();
          supabase.removeChannel(channel);
        } catch {}
      }
      clearInterval(interval);
    };
  }, [fetchOrders, soundEnabled]);

  // Primary Action: "تأكيد وطباعة" (Normal Agent Dispatch)
  const handleConfirmAndPrint = async (order: PrintOrder) => {
    const updatedStatus: OrderStatus = 'completed';
    const updatedPayment: PaymentStatus = order.payment_status === 'receipt_uploaded' ? 'verified' : order.payment_status;

    // Optimistic UI update
    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, status: updatedStatus, payment_status: updatedPayment } : o))
    );

    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: order.id, 
          status: updatedStatus,
          payment_status: updatedPayment,
          trigger_agent: true
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `فشل تحديث الطلب في Supabase (${res.status})`);
      }
    } catch (err: any) {
      console.error('Error updating order:', err);
      alert(`خطأ Supabase: ${err.message}`);
      fetchOrders();
    }
  };

  // Emergency Action: "تأكيد يدوي"
  const handleManualEmergencyConfirm = async (order: PrintOrder) => {
    if (!confirm(`هل قمت بطباعة الطلب #${order.daily_order_code} يدوياً وتريد اعتماده وتسجيله في عداد الأوراق؟`)) {
      return;
    }

    const updatedStatus: OrderStatus = 'completed';
    const updatedPayment: PaymentStatus = order.payment_status === 'receipt_uploaded' ? 'verified' : order.payment_status;

    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, status: updatedStatus, payment_status: updatedPayment } : o))
    );

    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: order.id, 
          status: updatedStatus,
          payment_status: updatedPayment,
          record_audit: true,
          audit_operator: 'موظف الفرع (تأكيد يدوي طوارئ)'
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `فشل تحديث الطلب في Supabase (${res.status})`);
      }
    } catch (err: any) {
      console.error('Error in emergency confirm:', err);
      alert(`خطأ Supabase: ${err.message}`);
      fetchOrders();
    }
  };

  // Re-print Action
  const handleRePrint = async (orderId: string) => {
    try {
      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: 'completed', trigger_agent: true }),
      });
      alert('تمت إعادة إرسال أمر الطباعة إلى الطابعة بنجاح!');
    } catch (err) {
      console.error(err);
    }
  };

  // Reject Order Action
  const handleRejectOrder = async (orderId: string, reason: string) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: orderId,
          status: 'rejected',
          rejection_reason: reason,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `فشل رفض الطلب (${res.status})`);
      }

      fetchOrders();
    } catch (err: any) {
      console.error('Error rejecting order:', err);
      alert(`خطأ: ${err.message}`);
    }
  };

  // Restore Rejected Order to Pending Action
  const handleRestoreOrder = async (order: PrintOrder) => {
    if (!confirm(`هل تريد إعادة الطلب #${order.daily_order_code} إلى طابور المراجعة النشط؟`)) return;
    try {
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
        fetchOrders();
      }
    } catch (err: any) {
      console.error('Error restoring order:', err);
      alert(`خطأ: ${err.message}`);
    }
  };

  // Filtered list
  const filteredOrders = orders.filter((o) => {
    if (activeFilter === 'pending') return o.status === 'pending';
    if (activeFilter === 'completed') return o.status === 'completed' || o.status === 'printing' || o.status === 'approved';
    if (activeFilter === 'rejected') return o.status === 'rejected' || o.status === 'cancelled';
    return true;
  });

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const completedCount = orders.filter(o => o.status === 'completed' || o.status === 'printing' || o.status === 'approved').length;
  const rejectedCount = orders.filter(o => o.status === 'rejected' || o.status === 'cancelled').length;
  const sypOrdersCount = orders.filter(o => o.currency === 'SYP' || !o.currency).length;
  const tryOrdersCount = orders.filter(o => o.currency === 'TRY').length;

  return (
    <ModuleRouteGuard moduleKey="smart_print">
      <div className="space-y-6">
        {/* Supabase Error Alert Banner */}
        {apiError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold shadow-xs">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <span className="block font-black">خطأ في مزامنة قاعدة بيانات Supabase:</span>
                <span className="font-mono text-[11px] text-rose-700">{apiError}</span>
              </div>
            </div>
            <button
              onClick={fetchOrders}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors shrink-0"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* Top Controls Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <Printer className="w-6 h-6 text-brand-600" />
            طابور الطلبات الفوري (التحويل التلقائي للطابعة)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            اضغط <strong>"تأكيد وطباعة"</strong> لتحويل الطلب للطابعة فوراً دون أي خطوات تأكيد إضافية، مع وجود زر طوارئ للتأكيد اليدوي.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Mode Switch: Manual vs Full Auto Print */}
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs font-semibold">
            <span className={`px-2 py-1 rounded-lg transition-colors ${!autoPrintMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
              موافقة يدوية
            </span>
            <button
              onClick={() => setAutoPrintMode(!autoPrintMode)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                autoPrintMode ? 'bg-brand-600 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
            </button>
            <span className={`px-2 py-1 rounded-lg transition-colors ${autoPrintMode ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'}`}>
              طباعة تلقائية
            </span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playNotificationSound();
            }}
            className={`p-2.5 rounded-xl border transition-colors flex items-center gap-1.5 text-xs font-bold ${
              soundEnabled
                ? 'bg-brand-50 border-brand-200 text-brand-700'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
            title="تبديل صوت التنبيه"
          >
            <Volume2 className="w-4 h-4" />
            <span className="hidden sm:inline">{soundEnabled ? 'التنبيه مفعّل' : 'صامت'}</span>
          </button>

          {/* Refresh */}
          <button
            onClick={fetchOrders}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="تحديث القائمة"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Streamlined 2-Stage Filter Tabs */}
      <div className="flex gap-2 pb-1">
        <button
          onClick={() => setActiveFilter('pending')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeFilter === 'pending'
              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span>المرحلة 1: بانتظار المراجعة (طلبات جديدة)</span>
          <span className={`px-2 py-0.5 rounded-md text-[11px] font-black ${
            activeFilter === 'pending' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-800'
          }`}>
            {pendingCount}
          </span>
        </button>

        <button
          onClick={() => setActiveFilter('completed')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeFilter === 'completed'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span>المرحلة 2: المحولة للطابعة / المنتهية</span>
          <span className={`px-2 py-0.5 rounded-md text-[11px] font-black ${
            activeFilter === 'completed' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'
          }`}>
            {completedCount}
          </span>
        </button>

        <button
          onClick={() => setActiveFilter('rejected')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeFilter === 'rejected'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Ban className="w-3.5 h-3.5" />
          <span>الطلبات المرفوضة</span>
          <span className={`px-2 py-0.5 rounded-md text-[11px] font-black ${
            activeFilter === 'rejected' ? 'bg-rose-700 text-white' : 'bg-rose-100 text-rose-800'
          }`}>
            {rejectedCount}
          </span>
        </button>

        <button
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeFilter === 'all'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span>كافة الطلبات</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-slate-100 text-slate-700">
            {orders.length}
          </span>
        </button>

        {/* Currency summary pills */}
        <div className="mr-auto hidden sm:flex items-center gap-2 text-xs font-bold bg-white p-1 rounded-xl border border-slate-200">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/60 flex items-center gap-1">
            <span>ل.س:</span>
            <span>{sypOrdersCount}</span>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 border border-sky-200/60 flex items-center gap-1">
            <span>₺:</span>
            <span>{tryOrdersCount}</span>
          </span>
        </div>
      </div>

      {/* Orders List Grid */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <Printer className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base">لا توجد طلبات في هذا القسم حالياً</h3>
          <p className="text-xs text-slate-500 mt-1">
            {activeFilter === 'pending' 
              ? 'تم تحويل كافة الطلبات للطابعة ولا توجد طلبات معلقة.'
              : 'تظهر هنا الطلبات التي تم تحويلها للطابعة مع أزرار واتساب وإعادة الطباعة.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredOrders.map((order) => {
            const hasShamCashReceipt = order.payment_status === 'receipt_uploaded' || !!order.payment_receipt_path;
            const isPending = order.status === 'pending';
            const isRejected = order.status === 'rejected' || order.status === 'cancelled';

            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl p-5 border shadow-sm transition-all space-y-4 ${
                  isRejected
                    ? 'border-rose-300 ring-2 ring-rose-400/20 bg-rose-50/20'
                    : isPending
                    ? 'border-amber-300 ring-2 ring-amber-400/20'
                    : 'border-slate-200'
                }`}
              >
                {/* Header: Order Code, Type & Status */}
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-black font-mono bg-slate-900 text-white px-3.5 py-1 rounded-xl shadow-sm">
                      #{order.daily_order_code}
                    </span>
                    <div>
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold ${
                        order.order_type === 'remote'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {order.order_type === 'remote' ? 'طلب مسبق عن بُعد' : 'داخل الفرع (QR)'}
                      </span>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(order.created_at).toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <OrderStatusBadge status={order.status} />
                    <PaymentStatusBadge status={order.payment_status} />
                  </div>
                </div>

                {/* Customer Details */}
                <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{order.customer_name || 'زبون سريع'}</span>
                    {order.customer_phone && order.customer_phone !== 'استلام مباشر داخل الفرع' && (
                      <>
                        <span className="text-slate-400">•</span>
                        <span className="font-mono text-slate-600 dir-ltr">{order.customer_phone}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-brand-700 text-sm">
                      {formatCurrency(order.total_price, order.currency)}
                    </span>
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                      order.currency === 'TRY' ? 'bg-sky-100 text-sky-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {order.currency === 'TRY' ? '₺' : 'ل.س'}
                    </span>
                  </div>
                </div>

                {/* Customer Notes if any */}
                {order.customer_notes && (
                  <div className="text-xs bg-amber-50/70 border border-amber-200 text-amber-900 p-2.5 rounded-xl flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                    <span><strong>ملاحظة الزبون:</strong> {order.customer_notes}</span>
                  </div>
                )}

                {/* Ordered Files & Notes Summary */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-700">الملفات والمواصفات ({order.total_items_count} عناصر):</p>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {order.items?.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-xs bg-slate-50 hover:bg-slate-100/80 p-2 rounded-lg border border-slate-200/60"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                          <span className="font-semibold text-slate-800 truncate">{item.item_title}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 text-slate-500 font-medium">
                          {item.custom_page_range && (
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded text-[10px]" title="نطاق الصفحات المطلوب">
                              ص {item.custom_page_range}
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 bg-white rounded border text-[10px]">
                            {item.color_mode === 'color' ? 'ملون' : 'أسود'}
                          </span>
                          <span className="px-1.5 py-0.5 bg-white rounded border text-[10px]">
                            {item.duplex === 'duplex' ? 'وجهين' : 'وجه واحد'}
                          </span>
                          <span className="font-bold text-slate-800">
                            {item.page_count} ص × {item.copies_count} نسـخ
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sham Cash Review Button if receipt uploaded */}
                {hasShamCashReceipt && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-indigo-700 shrink-0" />
                      <span className="text-xs font-bold text-indigo-950">إيصال تحويل شام كاش مرفق</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedReceiptUrl(order.payment_receipt_path || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop');
                        setReceiptModalOrderId(order.id);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center gap-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      معاينة الإيصال
                    </button>
                  </div>
                )}

                {/* Streamlined Action Buttons */}
                <div className="pt-2 border-t border-slate-100">
                  {isRejected ? (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-2 bg-rose-50 p-3 rounded-xl border border-rose-200">
                      <div className="flex items-center gap-1.5 text-xs text-rose-900">
                        <Ban className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>
                          <strong>طلب معتذر عنه:</strong>{' '}
                          {order.customer_notes?.match(/\[سبب الرفض:\s*([^\]]+)\]/)?.[1] || order.customer_notes || 'لم يحدد سبب'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRestoreOrder(order)}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center gap-1 shrink-0 shadow-xs"
                        title="إعادة هذا الطلب إلى طابور المراجعة"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>استرجاع للمراجعة</span>
                      </button>
                    </div>
                  ) : isPending ? (
                    <div className="flex items-center gap-2">
                      {/* Main Primary Button: "تأكيد وطباعة" */}
                      <button
                        onClick={() => handleConfirmAndPrint(order)}
                        className="flex-1 py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md shadow-brand-600/25 transition-all flex items-center justify-center gap-2"
                      >
                        <Printer className="w-4 h-4" />
                        تأكيد وطباعة (تحويل للطابعة)
                      </button>

                      {/* Small Emergency Manual Confirmation Button */}
                      <button
                        onClick={() => handleManualEmergencyConfirm(order)}
                        className="py-3 px-3 rounded-xl bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-800 font-bold text-xs border border-slate-200 hover:border-amber-300 transition-colors flex items-center gap-1 shrink-0"
                        title="يُستخدم في حال تعطل وكيل الطباعة وقام الموظف بالطباعة يدوياً من جهازه، ليتم تسجيل الأوراق في سجل التدقيق وتحديث شاشة الزبون"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>تأكيد يدوي</span>
                      </button>

                      {/* Reject Order Button */}
                      <button
                        onClick={() => setRejectingOrder(order)}
                        className="py-3 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 hover:border-rose-300 transition-colors flex items-center gap-1 shrink-0"
                        title="الاعتذار عن تنفيذ الطلب وإرسال سبب الرفض"
                      >
                        <Ban className="w-3.5 h-3.5 text-rose-600" />
                        <span>رفض الطلب</span>
                      </button>
                    </div>
                  ) : (
                    /* For Orders Transferred to Printer / Completed */
                    <div className="flex items-center justify-between w-full gap-2">
                      <a
                        href={buildWhatsAppPickupLink(order.customer_phone, order.daily_order_code, 'فرع مجمع الكليات', order.customer_name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs border border-emerald-200 transition-colors flex items-center gap-1.5"
                      >
                        <MessageCircle className="w-4 h-4 text-emerald-600" />
                        إشعار واتساب بالجهوزية
                      </a>

                      <button
                        onClick={() => handleRePrint(order.id)}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition-colors flex items-center gap-1.5"
                        title="إعادة إرسال الملف للطابعة في حال حدوث عطل ورقي"
                      >
                        <RotateCw className="w-3.5 h-3.5 text-slate-600" />
                        إعادة الطباعة
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sham Cash Receipt Review Modal */}
      {selectedReceiptUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900">إيصال تحويل شام كاش المرفق</h3>
              <button
                onClick={() => setSelectedReceiptUrl(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-100 rounded-xl p-2 flex items-center justify-center max-h-96 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedReceiptUrl}
                alt="إيصال شام كاش"
                className="max-h-80 w-auto rounded-lg object-contain shadow-md"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  const targetOrder = orders.find(o => o.id === receiptModalOrderId);
                  if (targetOrder) handleConfirmAndPrint(targetOrder);
                  setSelectedReceiptUrl(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition-all flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                اعتماد الإيصال والطباعة فوراً
              </button>
              <button
                onClick={() => setSelectedReceiptUrl(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Order Modal */}
      <RejectOrderModal
        order={rejectingOrder}
        isOpen={!!rejectingOrder}
        onClose={() => setRejectingOrder(null)}
        onConfirmReject={handleRejectOrder}
      />
    </div>
    </ModuleRouteGuard>
  );
}
