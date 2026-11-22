'use client';

import React, { useState } from 'react';
import { 
  Boxes, 
  Plus, 
  Search, 
  AlertTriangle, 
  ArrowRightLeft, 
  Layers, 
  CheckCircle2, 
  Barcode, 
  Package, 
  Edit3,
  TrendingDown
} from 'lucide-react';
import { ModuleRouteGuard } from '@/components/ModuleRouteGuard';
import { formatCurrency } from '@/lib/utils';

export default function InventoryPage() {
  const [search, setSearch] = useState('');

  const [items, setItems] = useState([
    {
      id: 'inv-1',
      barcode: '621003',
      name: 'رزمة ورق تصوير A4 (وزن 80 غرام - Double A)',
      category: 'ورق خام',
      quantity: 14,
      minAlert: 20,
      costPrice: 32000,
      retailPrice: 38000,
      location: 'مستودع 1 - الرف B2'
    },
    {
      id: 'inv-2',
      barcode: '621007',
      name: 'تونر ليزر أسود HP 05A (لطابعة P2035)',
      category: 'أحبار وطابعات',
      quantity: 3,
      minAlert: 2,
      costPrice: 95000,
      retailPrice: 120000,
      location: 'خزانة المواد الاستهلاكية'
    },
    {
      id: 'inv-3',
      barcode: '621001',
      name: 'دفتر سلك 100 ورقة مقسم جامعي',
      category: 'قرطاسية ودفاتر',
      quantity: 65,
      minAlert: 15,
      costPrice: 6000,
      retailPrice: 8500,
      location: 'واجهة العرض - قسم الدفاتر'
    },
    {
      id: 'inv-4',
      barcode: '621008',
      name: 'سلك حلزوني بلاستيكي قياس 12mm (علبة 100 حبة)',
      category: 'مواد تجليد وتشطيب',
      quantity: 5,
      minAlert: 8,
      costPrice: 45000,
      retailPrice: 60000,
      location: 'طاولة التجليد'
    },
    {
      id: 'inv-5',
      barcode: '621005',
      name: 'كتاب الرياضيات الهندسية 1 (جامعة دمشق)',
      category: 'كتب ومناهج',
      quantity: 28,
      minAlert: 10,
      costPrice: 18000,
      retailPrice: 25000,
      location: 'رف الكتب الهندسية'
    }
  ]);

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.barcode.includes(search) ||
    item.category.includes(search)
  );

  return (
    <ModuleRouteGuard moduleKey="inventory">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center font-bold">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                إدارة المخزون والمستودعات
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                مراقبة رزم الورق، خراطيش الحبر، الدفاتر والقرطاسية مع تنبيهات النواقص التلقائية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => alert('ميزة التحويل المخزني بين الفروع')}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition-colors flex items-center gap-1.5"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>تحويل مخزني لفرع آخر</span>
            </button>

            <button
              onClick={() => alert('إضافة مادة جديدة للمخزون')}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة صنف جديد</span>
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-bold block">إجمالي أصناف المستودع</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{items.length} صنفاً</p>
            <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">متوفر للبيع والطباعة</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-bold block">تنبيهات نواقص المخزون</span>
            <p className="text-2xl font-black text-rose-600 mt-1">
              {items.filter(i => i.quantity <= i.minAlert).length} أصناف
            </p>
            <span className="text-[11px] text-rose-500 font-semibold mt-0.5 block">وصلت لحد إعادة الطلب</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-bold block">رزم ورق A4 المتوفرة</span>
            <p className="text-2xl font-black text-indigo-700 mt-1">14 رزمة</p>
            <span className="text-[11px] text-amber-600 font-semibold mt-0.5 block">تكفي لـ 7,000 ورقة تقريباً</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-bold block">قيمة المخزون الإجمالية (سعر الشراء)</span>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {formatCurrency(items.reduce((s, i) => s + (i.costPrice * i.quantity), 0), 'SYP')}
            </p>
            <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">في فرع مجمع الكليات</span>
          </div>
        </div>

        {/* Inventory Items Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="relative flex-1 sm:max-w-md w-full">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                placeholder="ابحث باسم المادة، الباركود، أو التصنيف..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pr-9 pl-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <span className="text-xs text-slate-500 font-semibold">
              يتم الخصم تلقائياً عند البيع أو الطباعة
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">الباركود والمادة</th>
                  <th className="p-3.5">التصنيف</th>
                  <th className="p-3.5">موقع الرف</th>
                  <th className="p-3.5 text-center">الكمية الحالية</th>
                  <th className="p-3.5">سعر التكلفة</th>
                  <th className="p-3.5">سعر البيع</th>
                  <th className="p-3.5 text-center">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredItems.map(item => {
                  const isLow = item.quantity <= item.minAlert;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{item.name}</span>
                            <span className="font-mono text-[11px] text-slate-400">#{item.barcode}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px]">
                          {item.category}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-500 text-[11px]">{item.location}</td>
                      <td className="p-3.5 text-center">
                        <span className={`text-sm font-black ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>
                          {item.quantity}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-500">{formatCurrency(item.costPrice, 'SYP')}</td>
                      <td className="p-3.5 font-bold text-slate-900">{formatCurrency(item.retailPrice, 'SYP')}</td>
                      <td className="p-3.5 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3 h-3" />
                            نقص مخزون
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            متوفر
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ModuleRouteGuard>
  );
}
