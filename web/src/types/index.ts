export type TenantPlan = 'smart_print' | 'integrated_library' | 'enterprise_branches';
export type UserRole = 'super_admin' | 'tenant_owner' | 'branch_manager' | 'operator' | 'cashier';
export type OrderType = 'in_store' | 'remote';
export type OrderStatus = 'pending' | 'approved' | 'printing' | 'completed' | 'cancelled' | 'rejected';
export type PaymentStatus = 'unpaid' | 'receipt_uploaded' | 'verified' | 'waived' | 'cash_on_delivery';
export type PaperSize = 'A4' | 'A3' | 'A5' | 'custom';
export type ColorMode = 'bw' | 'color';
export type DuplexMode = 'simplex' | 'duplex';

export type AppModuleKey = 
  | 'smart_print'
  | 'notes_catalog'
  | 'shamcash_pay'
  | 'pos'
  | 'inventory'
  | 'multi_branch'
  | 'audit_reports';

export type TenantFeatureFlags = {
  smart_print: boolean;
  notes_catalog: boolean;
  shamcash_pay: boolean;
  pos: boolean;
  inventory: boolean;
  multi_branch: boolean;
  audit_reports: boolean;
  [key: string]: boolean;
};

export type BackgroundTheme = 
  | 'damascus_geometric'
  | 'arabesque_floral'
  | 'islamic_calligraphy'
  | 'mashrabiya_lattice'
  | 'custom';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  tagline?: string | null;
  plan: TenantPlan;
  feature_flags: TenantFeatureFlags;
  logo_url?: string | null;
  cover_image_url?: string | null;
  primary_color?: string; // Hex color e.g. #16a34a
  secondary_color?: string; // Hex color e.g. #052e16
  background_theme?: BackgroundTheme;
  custom_background_url?: string | null;
  contact_phone?: string | null;
  is_active: boolean;
  branches_count?: number;
  branches?: Branch[];
  created_at?: string;
}

export interface Branch {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  address?: string | null;
  phone?: string | null;
  default_currency: 'SYP' | 'TRY' | string;
  exchange_rate: number; // 1 TRY = exchange_rate SYP (e.g. 450.00)
  show_dual_currency?: boolean;
  allow_currency_toggle?: boolean;
  sham_cash_enabled: boolean;
  sham_cash_account_info?: string | null;
  sham_cash_qr_url?: string | null;
  sham_cash_min_amount: number;
  auto_print_enabled: boolean;
  allowed_auto_print_max_pages: number;
  agent_auth_token?: string | null;
  is_active: boolean;
}

export interface PrintPricing {
  id: string;
  tenant_id: string;
  branch_id?: string | null;
  paper_size: PaperSize;
  color_mode: ColorMode;
  duplex: DuplexMode;
  price_per_page: number;
}

export interface PrintService {
  id: string;
  tenant_id: string;
  branch_id?: string | null;
  service_key: string;
  name_ar: string;
  price: number;
  is_available: boolean;
}

export interface NoteItem {
  id: string;
  tenant_id: string;
  branch_id?: string | null;
  title: string;
  category: string;
  faculty_or_school?: string | null;
  subject: string;
  professor_or_author?: string | null;
  description?: string | null;
  file_path: string;
  preview_image_url?: string | null;
  page_count: number;
  fixed_printing_price?: number | null;
  is_active: boolean;
}

export interface PrintOrderItem {
  id?: string;
  order_id?: string;
  item_type: 'file_upload' | 'catalog_note';
  note_id?: string | null;
  item_title: string;
  file_path?: string | null;
  file_original_name?: string | null;
  file_size_bytes?: number | null;
  file_mime_type?: string | null;
  page_count: number;
  original_page_count?: number;
  page_selection_type?: 'all' | 'custom';
  custom_page_from?: number;
  custom_page_to?: number;
  copies_count: number;
  paper_size: PaperSize;
  color_mode: ColorMode;
  duplex: DuplexMode;
  custom_page_range?: string | null;
  selected_services: Array<{ key: string; name_ar: string; price: number }>;
  item_price: number;
  _localFile?: File;
}

export interface PrintOrder {
  id: string;
  tenant_id: string;
  branch_id: string;
  daily_order_code: number;
  order_type: OrderType;
  tracking_token: string;
  customer_name?: string | null;
  customer_phone: string;
  customer_notes?: string | null;
  total_items_count: number;
  total_pages_count: number;
  total_price: number;
  currency: string;
  exchange_rate_snapshot?: number;
  payment_status: PaymentStatus;
  payment_receipt_path?: string | null;
  sham_cash_tx_ref?: string | null;
  status: OrderStatus;
  agent_claimed_at?: string | null;
  printed_at?: string | null;
  completed_at?: string | null;
  files_purged: boolean;
  created_at: string;
  updated_at: string;
  items?: PrintOrderItem[];
  branch?: Branch;
  tenant?: Tenant;
}
