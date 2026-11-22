'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { 
  CheckCircle2, Clock, Printer, CheckCheck, Phone, 
  MapPin, AlertCircle, Sparkles, MessageCircle, ArrowRight,
  FileText, Coins, BookOpen, Layers, Copy
} from 'lucide-react';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/OrderStatusBadge';
import { PrintOrder, OrderStatus } from '@/types';
import { formatCurrency, convertCurrency } from '@/lib/utils';
import Link from 'next/link';

export default function OrderTrackingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const tenantSlug = params.tenant as string;
  const branchSlug = params.branch as string;
  const orderId = params.orderId as string;
  const initialCode = searchParams.get('code') || '104';

  const [order, setOrder] = useState<PrintOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await fetch(`/api/orders?id=${orderId}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
        } else {
          setOrder({
            id: orderId,
            tenant_id: 'a1000000-0000-0000-0000-000000000001',
            branch_id: 'b1000000-0000-0000-0000-000000000001',
            daily_order_code: parseInt(initialCode, 10) || 104,
            order_type: 'in_store',
            tracking_token: 'demo-token',
            customer_name: 'زبون سريع',
            customer_phone: '0911223344',
            total_items_count: 1,
            total_pages_count: 24,
            total_price: 7200,
            currency: 'SYP',
            payment_status: 'receipt_uploaded',
            status: 'pending',
            files_purged: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            items: [
              {
                id: 'demo-item-1',
                item_type: 'file_upload',
                item_title: 'ملف_الطباعة_المطلوب.pdf',
                page_count: 24,
                copies_count: 1,
                paper_size: 'A4',
                color_mode: 'bw',
                duplex: 'duplex',
                selected_services: [],
                item_price: 7200,
              }
            ],
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadOrder();

    // 1. Cross-tab instant communication via BroadcastChannel
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('mktabati_orders');
      bc.onmessage = (event) => {
        if (event.data?.type === 'ORDER_UPDATED' && event.data.orderId === orderId) {
          setOrder((prev) => (prev ? { ...prev, status: event.data.status } : null));
        }
      };
    } catch {}

    // 2. High-frequency polling (every 2 seconds)
    const interval = setInterval(() => {
      fetch(`/api/orders?id=${orderId}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) setOrder(data);
        })
        .catch(() => {});
    }, 2000);

    return () => {
      if (bc) bc.close();
      clearInterval(interval);
    };
  }, [orderId, initialCode]);

  const currentStatus: OrderStatus = order?.status || 'pending';
  // Stage 2 is active if order was confirmed & sent to printer
  const isStage2 = currentStatus === 'completed' || currentStatus === 'printing' || currentStatus === 'approved';

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Main Status Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 text-center relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-brand-500 via-emerald-500 to-teal-500" />
          
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm ${
            isStage2 
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-600 animate-bounce'
              : 'bg-amber-50 border border-amber-200 text-amber-600'
          }`}>
            {isStage2 ? <Printer className="w-9 h-9" /> : <Clock className="w-9 h-9 animate-spin" />}
          </div>

          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            رقم طلبك في الفرع اليوم
          </span>

          <div className="my-2">
            <span className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-slate-900 bg-slate-100/80 px-6 py-2 rounded-2xl border border-slate-200 inline-block shadow-inner">
              #{order?.daily_order_code || initialCode}
            </span>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2">
            <OrderStatusBadge status={currentStatus} />
            {order && <PaymentStatusBadge status={order.payment_status} />}
          </div>
        </div>

        {/* Clear Stage 2 Banner Prompt */}
        {isStage2 ? (
          <div className="bg-emerald-600 text-white rounded-2xl p-5 shadow-lg shadow-emerald-600/20 text-center space-y-2 animate-in fade-in zoom-in-95 duration-300">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/20 text-white mb-1">
              <Printer className="w-5 h-5 animate-pulse" />
            </div>
            <h3 className="text-lg font-black leading-tight">
              تم تحويل ملفاتك للطابعة بنجاح!
            </h3>
            <p className="text-sm font-semibold text-emerald-100">
              يرجى التوجه لكاونتر الطباعة لانتظار واستلام أوراقك فور خروجها من الطابعة.
            </p>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
            <p className="text-xs font-bold text-amber-800">
              طلبك مسجل في طابور المكتبة وبانتظار المراجعة؛ سيتم تحويله للطابعة فوراً.
            </p>
          </div>
        )}

        {/* Streamlined 2-Stage Progress Tracker */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            مراحل الطلب (مرحلتان فقط)
          </h3>

          <div className="space-y-4">
            {/* Stage 1 */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black bg-brand-600 text-white shadow-sm">
                1
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900">تم استلام الطلب بالفرع</p>
                <p className="text-xs text-slate-400">الملفات بانتظار المراجعة وتأكيد الإيصال</p>
              </div>
              <CheckCheck className="w-5 h-5 text-brand-600" />
            </div>

            {/* Stage 2 */}
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-colors ${
                isStage2 
                  ? 'bg-emerald-600 text-white shadow-sm ring-4 ring-emerald-100' 
                  : 'bg-slate-100 text-slate-400'
              }`}>
                2
              </div>
              <div className="flex-1">
                <p className={`text-sm font-bold ${isStage2 ? 'text-emerald-800' : 'text-slate-500'}`}>
                  تم التحويل للطابعة
                </p>
                <p className="text-xs text-slate-400">
                  {isStage2 
                    ? 'الأوراق تُسحب الآن، تفضل أمام كاونتر الفرع للاستلام' 
                    : 'يتحول تلقائياً بمجرد ضغط الموظف أو عبر الطباعة الفورية'}
                </p>
              </div>
              {isStage2 ? (
                <CheckCheck className="w-5 h-5 text-emerald-600" />
              ) : (
                <Clock className="w-4 h-4 text-slate-300" />
              )}
            </div>
          </div>
        </div>

        {/* Requested Print Items Card (محتويات وملفات الطباعة المطلوبة) */}
        {order && order.items && order.items.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  تفاصيل الملفات والطباعة المطلوبة ({order.items.length} عنصر)
                </h3>
              </div>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg font-mono">
                إجمالي {order.total_pages_count} صفحة
              </span>
            </div>

            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div
                  key={item.id || index}
                  className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-slate-50 transition-colors space-y-3"
                >
                  {/* File Title & Price */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-brand-600 font-bold text-xs shrink-0 shadow-2xs mt-0.5">
                        {item.item_type === 'catalog_note' ? (
                          <BookOpen className="w-4 h-4 text-amber-600" />
                        ) : (
                          <FileText className="w-4 h-4 text-brand-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-slate-900 break-words leading-snug">
                          {item.item_title}
                        </h4>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {item.item_type === 'catalog_note' ? 'نوطة من الكتالوج الجامعي' : 'ملف مرفوع للطباعة'}
                        </span>
                      </div>
                    </div>

                    <div className="text-left shrink-0">
                      <span className="text-xs font-black text-slate-900 block font-mono">
                        {formatCurrency(item.item_price, order.currency)}
                      </span>
                      {order.exchange_rate_snapshot && (
                        <span className="text-[10px] font-semibold text-slate-400 block">
                          ({formatCurrency(
                            convertCurrency(
                              item.item_price,
                              (order.currency as any) || 'SYP',
                              order.currency === 'TRY' ? 'SYP' : 'TRY',
                              order.exchange_rate_snapshot
                            ),
                            order.currency === 'TRY' ? 'SYP' : 'TRY'
                          )})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Print Options Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200/50 text-xs">
                    {/* Copies */}
                    <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-bold text-slate-800 flex items-center gap-1 shadow-2xs">
                      <span className="text-slate-500">عدد النسخ:</span>
                      <strong className="text-brand-700">{item.copies_count} {item.copies_count === 1 ? 'نسخة' : 'نسخ'}</strong>
                    </span>

                    {/* Pages & Range */}
                    {item.custom_page_range ? (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-300/80 font-bold text-amber-900 flex items-center gap-1 shadow-2xs">
                        <span>نطاق الصفحات:</span>
                        <strong className="text-amber-950 font-black">ص {item.custom_page_range}</strong>
                        <span className="text-[11px] text-amber-800 font-medium">({item.page_count} صفحات من أصل {item.original_page_count || item.page_count})</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-medium text-slate-700 flex items-center gap-1 shadow-2xs">
                        <span className="text-slate-500">الصفحات:</span>
                        <strong className="text-slate-900 font-bold">كامل الملف ({item.page_count} صفحة)</strong>
                      </span>
                    )}

                    {/* Paper Size */}
                    <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-bold text-slate-700 shadow-2xs">
                      مقاس {item.paper_size || 'A4'}
                    </span>

                    {/* Color Mode */}
                    <span className={`px-2.5 py-1 rounded-lg border font-bold shadow-2xs ${
                      item.color_mode === 'color'
                        ? 'bg-purple-50 border-purple-200 text-purple-800'
                        : 'bg-slate-100 border-slate-200 text-slate-800'
                    }`}>
                      {item.color_mode === 'color' ? '🎨 ألوان كاملة' : '🖨️ أبيض وأسود (ليزر)'}
                    </span>

                    {/* Duplex */}
                    <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-semibold text-slate-700 shadow-2xs">
                      {item.duplex === 'duplex' ? '📄 طباعة على الوجهين' : '📃 وجه واحد فقط'}
                    </span>
                  </div>

                  {/* Finishing Services if any */}
                  {item.selected_services && item.selected_services.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                      <span className="text-slate-500 font-semibold">خدمات إضافية:</span>
                      {item.selected_services.map((srv, si) => (
                        <span
                          key={si}
                          className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold"
                        >
                          ✓ {srv.name_ar}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Customer Notes if present */}
            {order.customer_notes && (
              <div className="text-xs bg-amber-50/80 border border-amber-200 text-amber-900 p-3 rounded-xl flex items-start gap-2 mt-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <strong className="block font-bold mb-0.5">ملاحظتك للموظف:</strong>
                  <span>{order.customer_notes}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Order Details & Dual Currency Total Card */}
        {order && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>تفاصيل الفاتورة والمبلغ</span>
              <span className="text-[11px] font-semibold text-slate-500 font-mono">
                {order.total_items_count} عناصر • {order.total_pages_count} صفحة
              </span>
            </h3>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-600">المبلغ الإجمالي للطلب:</span>
              <div className="text-left">
                <span className="text-lg font-black text-slate-900 block leading-tight">
                  {formatCurrency(order.total_price, order.currency)}
                </span>
                {order.exchange_rate_snapshot && (
                  <span className="text-xs font-semibold text-slate-400 block mt-0.5">
                    (يعادل تقريباً {formatCurrency(
                      convertCurrency(
                        order.total_price,
                        (order.currency as any) || 'SYP',
                        order.currency === 'TRY' ? 'SYP' : 'TRY',
                        order.exchange_rate_snapshot
                      ),
                      order.currency === 'TRY' ? 'SYP' : 'TRY'
                    )})
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`مرحباً، أستفسر عن طلب الطباعة رقم #${order?.daily_order_code || initialCode}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            تواصل مع الفرع عبر واتساب
          </a>

          <Link
            href={`/${tenantSlug}/${branchSlug}`}
            className="py-3 px-4 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm transition-all flex items-center justify-center gap-1.5"
          >
            طلب طباعة جديد
            <ArrowRight className="w-4 h-4 rotate-180" />
          </Link>
        </div>
      </div>
    </div>
  );
}
