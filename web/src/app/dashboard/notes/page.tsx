'use client';

import React, { useState } from 'react';
import { BookOpen, Plus, Search, Trash2, Check, FileText, Upload, Sparkles } from 'lucide-react';
import { NoteItem } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { ModuleRouteGuard } from '@/components/ModuleRouteGuard';

export default function NotesCatalogAdminPage() {
  const [notes, setNotes] = useState<NoteItem[]>([
    {
      id: 'c1',
      tenant_id: '1',
      title: 'ملخص الرياضيات الهندسية 1 - شامل ومحلول',
      category: 'جامعي',
      faculty_or_school: 'كلية الهندسة الميكانيكية والكهربائية',
      subject: 'رياضيات هندسية',
      professor_or_author: 'د. أحمد كنعان',
      description: 'نوطة شاملة لكافة تمارين ومسائل الدورات السابقة مع الحلول.',
      file_path: 'notes-catalog-files/math1_summary.pdf',
      page_count: 48,
      fixed_printing_price: 15000,
      is_active: true,
    },
    {
      id: 'c2',
      tenant_id: '1',
      title: 'مكثفة الكيمياء العضوية - لطلاب التحضيرية الطبية',
      category: 'سنة تحضيرية',
      faculty_or_school: 'الكليات الطبية',
      subject: 'كيمياء عضوية',
      professor_or_author: 'فريق التميز الأكاديمي',
      description: 'جداول مقارنة وملخص التفاعلات والأفكار الامتحانية الأكثر تكراراً.',
      file_path: 'notes-catalog-files/organic_chem.pdf',
      page_count: 32,
      fixed_printing_price: 12000,
      is_active: true,
    },
    {
      id: 'c3',
      tenant_id: '1',
      title: 'ملخص مادة التاريخ والجغرافيا - دورة البكالوريا',
      category: 'بكالوريا علمي وأدبي',
      faculty_or_school: 'ثانويات دمشق',
      subject: 'تاريخ وجغرافيا',
      professor_or_author: 'أ. محمود رضوان',
      description: 'خرائط ذهنية وتلخيص مكثف مع أسئلة التوقعات.',
      file_path: 'notes-catalog-files/history_geo.pdf',
      page_count: 64,
      fixed_printing_price: 18000,
      is_active: true,
    }
  ]);

  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('جامعي');
  const [newSubject, setNewSubject] = useState('');
  const [newFaculty, setNewFaculty] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newPageCount, setNewPageCount] = useState(20);
  const [newPrice, setNewPrice] = useState(10000);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSubject.trim()) return;

    const item: NoteItem = {
      id: `note-${Date.now()}`,
      tenant_id: '1',
      title: newTitle,
      category: newCategory,
      faculty_or_school: newFaculty,
      subject: newSubject,
      professor_or_author: newAuthor,
      file_path: 'notes-catalog-files/uploaded_note.pdf',
      page_count: Number(newPageCount) || 1,
      fixed_printing_price: Number(newPrice) || 0,
      is_active: true,
    };

    setNotes([item, ...notes]);
    setIsAdding(false);
    setNewTitle('');
    setNewSubject('');
    setNewFaculty('');
    setNewAuthor('');
  };

  const toggleActive = (id: string) => {
    setNotes(notes.map(n => n.id === id ? { ...n, is_active: !n.is_active } : n));
  };

  const deleteNote = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه النوطة من العرض للزبائن؟')) {
      setNotes(notes.filter(n => n.id !== id));
    }
  };

  return (
    <ModuleRouteGuard moduleKey="notes_catalog">
      <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-brand-600" />
            إدارة مكتبة النوط والملخصات الجاهزة
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            ارفع النوط والملخصات المصنفة لتتيح للطلاب اختيارها وطباعتها مباشرة عبر QR الفرع
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          إضافة نوطة جديدة
        </button>
      </div>

      {/* Add New Note Form Modal / Expandable */}
      {isAdding && (
        <form onSubmit={handleAddNote} className="bg-white rounded-2xl p-5 border-2 border-brand-200 shadow-md space-y-4">
          <h3 className="font-bold text-base text-slate-900">بيانات النوطة أو الملخص الجديد</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-600 block mb-1">عنوان النوطة الكامل</label>
              <input
                type="text"
                required
                placeholder="مثال: نوطة الفيزياء العامة 1 - دورات محلولة"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="w-full text-xs bg-slate-50 border rounded-lg p-2.5 focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">التصنيف الأكاديمي</label>
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                className="w-full text-xs bg-slate-50 border rounded-lg p-2.5"
              >
                <option value="جامعي">جامعي</option>
                <option value="سنة تحضيرية">سنة تحضيرية</option>
                <option value="بكالوريا علمي">بكالوريا علمي</option>
                <option value="بكالوريا أدبي">بكالوريا أدبي</option>
                <option value="تاسع / إعدادي">تاسع / إعدادي</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">اسم المادة</label>
              <input
                type="text"
                required
                placeholder="مثال: فيزياء 1"
                value={newSubject}
                onChange={e => setNewSubject(e.target.value)}
                className="w-full text-xs bg-slate-50 border rounded-lg p-2.5"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">الكلية أو المدرسة</label>
              <input
                type="text"
                placeholder="مثال: كلية الهندسة المدنية"
                value={newFaculty}
                onChange={e => setNewFaculty(e.target.value)}
                className="w-full text-xs bg-slate-50 border rounded-lg p-2.5"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">الدكتور أو الأستاذ</label>
              <input
                type="text"
                placeholder="مثال: د. غسان علي"
                value={newAuthor}
                onChange={e => setNewAuthor(e.target.value)}
                className="w-full text-xs bg-slate-50 border rounded-lg p-2.5"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">عدد الصفحات</label>
              <input
                type="number"
                min="1"
                value={newPageCount}
                onChange={e => setNewPageCount(Number(e.target.value))}
                className="w-full text-xs bg-slate-50 border rounded-lg p-2.5"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">السعر المقطوع للنسخة (ل.س)</label>
              <input
                type="number"
                min="0"
                value={newPrice}
                onChange={e => setNewPrice(Number(e.target.value))}
                className="w-full text-xs bg-slate-50 border rounded-lg p-2.5"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-brand-600 text-white font-bold text-xs shadow-sm hover:bg-brand-700"
            >
              حفظ ونشر النوطة
            </button>
          </div>
        </form>
      )}

      {/* Notes List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="ابحث في النوط المرفوعة..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pr-9 pl-3 py-2 text-xs bg-slate-50 border rounded-xl focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <span className="text-xs text-slate-500 font-semibold">{notes.length} نوطة متاحة</span>
        </div>

        <div className="divide-y divide-slate-100">
          {notes
            .filter(n => n.title.includes(search) || n.subject.includes(search))
            .map(note => (
              <div key={note.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-xs border border-brand-100 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">{note.title}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {note.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {note.subject} • {note.faculty_or_school} {note.professor_or_author ? `• إعداد: ${note.professor_or_author}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-left">
                    <span className="font-bold text-sm text-brand-700 block">
                      {formatCurrency(note.fixed_printing_price || 0, 'SYP')}
                    </span>
                    <span className="text-[11px] text-slate-400">{note.page_count} صفحة</span>
                  </div>

                  <button
                    onClick={() => toggleActive(note.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      note.is_active
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {note.is_active ? 'نشطة بالعرض' : 'معطلة مؤقتاً'}
                  </button>

                  <button
                    onClick={() => deleteNote(note.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
    </ModuleRouteGuard>
  );
}
