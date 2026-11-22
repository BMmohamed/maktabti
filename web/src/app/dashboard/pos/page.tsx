'use client';

import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Barcode, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Receipt, 
  CreditCard, 
  Banknote, 
  User, 
  Sparkles,
  Printer,
  CheckCircle2
} from 'lucide-react';
import { ModuleRouteGuard } from '@/components/ModuleRouteGuard';
import { formatCurrency } from '@/lib/utils';

export default function POSPage() {
  const [cart, setCart] = useState<Array<{ id: string; name: string; price: number; qty: number; type: string }>>([
    { id: '1', name: 'دفتر سلك 100 ورقة جامعي', price: 8500, qty: 2, type: 'قرطاسية' },
    { id: '2', name: 'قلم جاف أزرق Schneider', price: 2000, qty: 3, type: 'قرطاسية' },
  ]);

  const [barcodeInput, setBarcodeInput] = useState('');

  // Sample quick inventory items
  const quickItems = [
    { id: '1', name: 'دفتر سلك 100 ورقة', price: 8500, barcode: '621001', type: 'قرطاسية' },
    { id: '2', name: 'قلم جاف أزرق Schneider', price: 2000, barcode: '621002', type: 'قرطاسية' },
    { id: '3', name: 'رزمة ورق A4 (80g)', price: 38000, barcode: '621003', type: 'ورق خام' },
    { id: '4', name: 'ملف بلاستيك شفاف U', price: 1500, barcode: '621004', type: 'قرطاسية' },
    { id: '5', name: 'كتاب الرياضيات الهندسية 1', price: 25000, barcode: '621005', type: 'كتب' },
    { id: '6', name: 'هايلايتر أصفر فسفوري', price: 3500, barcode: '621006', type: 'قرطاسية' },
  ];

  const addToCart = (item: typeof quickItems[0]) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, qty: 1, type: item.type }];
    });
  };

  // Add print order to POS cart (Unified Core Integration!)
  const addPrintOrderToCart = () => {
    const printOrderId = Math.floor(100 + Math.random() * 900);
    setCart(prev => [
      ...prev,
      {
        id: `print-${Date.now()}`,
        name: `تحصيل طلب طباعة #${printOrderId} (34 صفحة ملون)`,
        price: 18500,
        qty: 1,
        type: 'خدمة طباعة'
      }
    ]);
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  return (
    <ModuleRouteGuard moduleKey="pos">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center font-bold">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                نقطة البيع والكاشير السريع (POS)
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                بيع القرطاسية والكتب بالباركود، مع إمكانية تحصيل رسوم طلبات الطباعة في نفس الفاتورة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={addPrintOrderToCart}
              className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 transition-colors flex items-center gap-1.5"
              title="تحصيل أمر طباعة من الزبون عبر الكاشير"
            >
              <Printer className="w-4 h-4" />
              <span>تحصيل طلب طباعة في الصندوق</span>
            </button>
          </div>
        </div>

        {/* POS Grid: Items Selector (Left) & Cart / Receipt (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Quick Items & Barcode Search (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Barcode Search Bar */}
            <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm flex items-center gap-2">
              <Barcode className="w-5 h-5 text-slate-400 shrink-0 mr-1" />
              <input
                type="text"
                placeholder="امسح الباركود أو اكتب اسم المادة للبحث السريع..."
                value={barcodeInput}
                onChange={e => setBarcodeInput(e.target.value)}
                className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* Quick Categories & Items */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {quickItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="bg-white hover:bg-purple-50/40 p-4 rounded-2xl border border-slate-200 hover:border-purple-300 text-right transition-all flex flex-col justify-between h-28 group shadow-xs hover:shadow-sm"
                >
                  <div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 block w-fit mb-1">
                      {item.type}
                    </span>
                    <h4 className="font-bold text-xs text-slate-900 group-hover:text-purple-700 transition-colors line-clamp-2">
                      {item.name}
                    </h4>
                  </div>
                  <div className="flex items-center justify-between w-full pt-1 border-t border-slate-100">
                    <span className="font-mono text-[10px] text-slate-400">#{item.barcode}</span>
                    <span className="font-black text-xs text-purple-700">
                      {formatCurrency(item.price, 'SYP')}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Cart & Register Panel (5 Cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-purple-600" />
                  <h3 className="font-bold text-sm text-slate-900">سلة المبيعات الحالية ({cart.length})</h3>
                </div>
                <button
                  onClick={() => setCart([])}
                  className="text-xs text-slate-400 hover:text-rose-600 font-semibold"
                >
                  إفراغ السلة
                </button>
              </div>

              {/* Cart Items List */}
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1 my-3">
                {cart.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    السلة فارغة. امسح الباركود أو اختر أصنافاً للإضافة.
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h5 className="font-bold text-xs text-slate-800 truncate">{item.name}</h5>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {formatCurrency(item.price, 'SYP')} للوحدة
                        </span>
                      </div>

                      {/* Qty Controls */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 text-xs font-bold"
                        >
                          -
                        </button>
                        <span className="w-6 text-center text-xs font-black">{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 text-xs font-bold"
                        >
                          +
                        </button>

                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-slate-300 hover:text-rose-600 p-1 mr-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Total and Checkout */}
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-bold">المجموع الإجمالي المطلوب:</span>
                <span className="text-2xl font-black text-purple-700">
                  {formatCurrency(totalAmount, 'SYP')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    alert('تم قبض الفاتورة نقداً بنجاح وطباعة إيصال الصندوق!');
                    setCart([]);
                  }}
                  disabled={cart.length === 0}
                  className="py-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <Banknote className="w-4 h-4" />
                  <span>قبض نقدي (كاش)</span>
                </button>

                <button
                  onClick={() => {
                    alert('تم تحويل الفاتورة للدفع الإلكتروني عبر شام كاش!');
                    setCart([]);
                  }}
                  disabled={cart.length === 0}
                  className="py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>دفع شام كاش</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModuleRouteGuard>
  );
}
