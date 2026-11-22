import { 
  Printer, 
  BookOpen, 
  Smartphone, 
  ShoppingCart, 
  Boxes, 
  Building2, 
  BarChart3,
  LucideIcon
} from 'lucide-react';
import { AppModuleKey, Tenant } from '@/types';

export interface AppModuleDefinition {
  key: AppModuleKey;
  nameAr: string;
  shortNameAr: string;
  descriptionAr: string;
  category: 'core' | 'sales' | 'operations' | 'finance';
  route: string;
  icon: LucideIcon;
  gradient: string;
  accentColor: string;
  badge?: string;
  isAvailableNow: boolean;
}

export const MODULES_REGISTRY: Record<AppModuleKey, AppModuleDefinition> = {
  smart_print: {
    key: 'smart_print',
    nameAr: 'الطباعة الذكية والـ QR',
    shortNameAr: 'الطباعة الذكية',
    descriptionAr: 'طابور الطلبات الفوري المباشر، استقبال ملفات الزبائن، والتحويل التلقائي للطابعات بصمت',
    category: 'core',
    route: '/dashboard',
    icon: Printer,
    gradient: 'from-blue-600 to-indigo-700',
    accentColor: 'text-blue-600 bg-blue-50 border-blue-200',
    isAvailableNow: true,
  },
  notes_catalog: {
    key: 'notes_catalog',
    nameAr: 'مكتبة النوط والملخصات',
    shortNameAr: 'النوط والملخصات',
    descriptionAr: 'رفع وإدارة الملخصات والنوط الأكاديمية والمدرسية لبيعها وطباعتها مباشرة عبر QR الفرع',
    category: 'sales',
    route: '/dashboard/notes',
    icon: BookOpen,
    gradient: 'from-emerald-600 to-teal-700',
    accentColor: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    isAvailableNow: true,
  },
  shamcash_pay: {
    key: 'shamcash_pay',
    nameAr: 'الدفع السريع (شام كاش)',
    shortNameAr: 'شام كاش',
    descriptionAr: 'شباك الدفع السريع بالليرة السورية، توليد رموز QR الحسابات، وفحص إيصالات التحويل',
    category: 'finance',
    route: '/dashboard/settings',
    icon: Smartphone,
    gradient: 'from-amber-500 to-orange-600',
    accentColor: 'text-amber-600 bg-amber-50 border-amber-200',
    isAvailableNow: true,
  },
  pos: {
    key: 'pos',
    nameAr: 'نقطة البيع والكاشير (POS)',
    shortNameAr: 'نقطة البيع',
    descriptionAr: 'كاشير مبيعات القرطاسية والكتب، قراءة الباركود، فواتير فورية، وإدارة صندوق النقدية',
    category: 'sales',
    route: '/dashboard/pos',
    icon: ShoppingCart,
    gradient: 'from-purple-600 to-violet-700',
    accentColor: 'text-purple-600 bg-purple-50 border-purple-200',
    badge: 'قريباً',
    isAvailableNow: true,
  },
  inventory: {
    key: 'inventory',
    nameAr: 'المخزون والقرطاسية',
    shortNameAr: 'المخزون',
    descriptionAr: 'إدارة مخزون الكتب المدرسية، الدفاتر، القرطاسية، عداد الورق، وتنبيهات النواقص',
    category: 'operations',
    route: '/dashboard/inventory',
    icon: Boxes,
    gradient: 'from-indigo-600 to-cyan-700',
    accentColor: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    badge: 'قريباً',
    isAvailableNow: true,
  },
  multi_branch: {
    key: 'multi_branch',
    nameAr: 'تعدد الفروع والتحويلات',
    shortNameAr: 'الفروع',
    descriptionAr: 'إدارة شبكة الفروع، بوسترات QR لكل فرع، التحويلات المخزنية، وبحث التوفر بين الفروع',
    category: 'operations',
    route: '/dashboard/branches',
    icon: Building2,
    gradient: 'from-teal-600 to-emerald-700',
    accentColor: 'text-teal-600 bg-teal-50 border-teal-200',
    isAvailableNow: true,
  },
  audit_reports: {
    key: 'audit_reports',
    nameAr: 'التدقيق وتقارير الأوراق',
    shortNameAr: 'التدقيق والتقارير',
    descriptionAr: 'سجل عداد الأوراق والصفحات الفعلي (Anti-Leakage Audit) لمراقبة الهدر ومطابقة الصندوق',
    category: 'finance',
    route: '/dashboard/audit',
    icon: BarChart3,
    gradient: 'from-rose-600 to-pink-700',
    accentColor: 'text-rose-600 bg-rose-50 border-rose-200',
    isAvailableNow: true,
  },
};

export function getAllModules(): AppModuleDefinition[] {
  return Object.values(MODULES_REGISTRY);
}

export function getModule(key: AppModuleKey): AppModuleDefinition | undefined {
  return MODULES_REGISTRY[key];
}

export function isModuleEnabled(tenant: Tenant | null | undefined, key: AppModuleKey): boolean {
  if (!tenant) return true; // Default to true if not loaded yet
  if (!tenant.feature_flags) return true;
  return Boolean(tenant.feature_flags[key]);
}

export function getEnabledModules(tenant: Tenant | null | undefined): AppModuleDefinition[] {
  const all = getAllModules();
  if (!tenant) return all;
  return all.filter(m => isModuleEnabled(tenant, m.key));
}
