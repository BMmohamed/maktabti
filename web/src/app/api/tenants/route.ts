import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Tenant } from '@/types';
import { createAdminClient } from '@/lib/supabase/admin';

const DATA_DIR = path.join(process.cwd(), '.data');
const TENANTS_FILE = path.join(DATA_DIR, 'tenants.json');

function getInitialTenants(): Tenant[] {
  return [
    {
      id: 'a1000000-0000-0000-0000-000000000001',
      name: 'مكتبة النور الحديثة',
      slug: 'al-noor',
      tagline: 'مركز الطباعة الذكية والخدمات الجامعية الحديثة',
      plan: 'smart_print',
      primary_color: '#16a34a', // Emerald Green
      secondary_color: '#052e16',
      background_theme: 'damascus_geometric',
      custom_background_url: null,
      logo_url: null,
      cover_image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1200&auto=format&fit=crop',
      feature_flags: {
        smart_print: true,
        notes_catalog: true,
        shamcash_pay: true,
        pos: false,
        inventory: false,
        multi_branch: true,
        audit_reports: true,
      },
      contact_phone: '+963 988 776 655',
      is_active: true,
      branches_count: 2,
      branches: [
        {
          id: 'b1000000-0000-0000-0000-000000000001',
          tenant_id: 'a1000000-0000-0000-0000-000000000001',
          name: 'فرع مجمع الكليات الجامعي',
          slug: 'campus',
          address: 'بوابة كلية العلوم - مقابل مجمع الكليات',
          phone: '+963 988 776 655',
          default_currency: 'SYP',
          exchange_rate: 450.0,
          show_dual_currency: true,
          allow_currency_toggle: true,
          sham_cash_enabled: true,
          sham_cash_account_info: 'حساب شام كاش: 0988776655 - مكتبة النور',
          sham_cash_min_amount: 10000,
          auto_print_enabled: false,
          allowed_auto_print_max_pages: 50,
          is_active: true,
        },
        {
          id: 'b2000000-0000-0000-0000-000000000002',
          tenant_id: 'a1000000-0000-0000-0000-000000000001',
          name: 'فرع ساحة الشهباء - وسط المدينة',
          slug: 'downtown',
          address: 'شارع المكتبات - جانب البريد المركزي',
          phone: '+963 988 776 656',
          default_currency: 'SYP',
          exchange_rate: 450.0,
          show_dual_currency: true,
          allow_currency_toggle: true,
          sham_cash_enabled: true,
          sham_cash_account_info: 'حساب شام كاش: 0988776656 - مكتبة النور',
          sham_cash_min_amount: 5000,
          auto_print_enabled: false,
          allowed_auto_print_max_pages: 50,
          is_active: true,
        }
      ],
      created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 'a2000000-0000-0000-0000-000000000002',
      name: 'دار المعرفة للطباعة والقرطاسية',
      slug: 'dar-al-marefa',
      tagline: 'دار المعرفة - طباعة رقمية وقرطاسية وكتب مدرسية',
      plan: 'integrated_library',
      primary_color: '#4f46e5', // Royal Indigo
      secondary_color: '#1e1b4b',
      background_theme: 'arabesque_floral',
      custom_background_url: null,
      logo_url: null,
      cover_image_url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1200&auto=format&fit=crop',
      feature_flags: {
        smart_print: true,
        notes_catalog: true,
        shamcash_pay: true,
        pos: true,
        inventory: true,
        multi_branch: false,
        audit_reports: true,
      },
      contact_phone: '+963 911 223 344',
      is_active: true,
      branches_count: 1,
      branches: [
        {
          id: 'b3000000-0000-0000-0000-000000000003',
          tenant_id: 'a2000000-0000-0000-0000-000000000002',
          name: 'الفرع الرئيسي - شارع الجامعة',
          slug: 'main',
          address: 'شارع الجامعة - مقابل نزلة كليات الآداب',
          phone: '+963 911 223 344',
          default_currency: 'SYP',
          exchange_rate: 450.0,
          show_dual_currency: true,
          allow_currency_toggle: true,
          sham_cash_enabled: true,
          sham_cash_account_info: 'حساب شام كاش: 0911223344 - دار المعرفة',
          sham_cash_min_amount: 8000,
          auto_print_enabled: true,
          allowed_auto_print_max_pages: 50,
          is_active: true,
        }
      ],
      created_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 'a3000000-0000-0000-0000-000000000003',
      name: 'مؤسسة الشام للخدمات الطلابية',
      slug: 'al-sham-center',
      tagline: 'سلسلة مراكز الشام المتكاملة للطباعة والبحوث',
      plan: 'enterprise_branches',
      primary_color: '#e11d48', // Crimson / Ruby
      secondary_color: '#4c0519',
      background_theme: 'islamic_calligraphy',
      custom_background_url: null,
      logo_url: null,
      cover_image_url: 'https://images.unsplash.com/photo-1507842229452-9426f316a75f?w=1200&auto=format&fit=crop',
      feature_flags: {
        smart_print: true,
        notes_catalog: true,
        shamcash_pay: true,
        pos: true,
        inventory: true,
        multi_branch: true,
        audit_reports: true,
      },
      contact_phone: '+963 933 445 566',
      is_active: true,
      branches_count: 2,
      branches: [
        {
          id: 'b4000000-0000-0000-0000-000000000004',
          tenant_id: 'a3000000-0000-0000-0000-000000000003',
          name: 'فرع مجمع الهندسات',
          slug: 'engineering',
          address: 'كلية الهندسة الميكانيكية',
          phone: '+963 933 445 566',
          default_currency: 'SYP',
          exchange_rate: 450.0,
          show_dual_currency: true,
          allow_currency_toggle: true,
          sham_cash_enabled: true,
          sham_cash_account_info: 'حساب شام كاش: 0933445566',
          sham_cash_min_amount: 10000,
          auto_print_enabled: false,
          allowed_auto_print_max_pages: 50,
          is_active: true,
        }
      ],
      created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    }
  ];
}

function readLocalTenants(): Tenant[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(TENANTS_FILE)) {
      const initial = getInitialTenants();
      fs.writeFileSync(TENANTS_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const content = fs.readFileSync(TENANTS_FILE, 'utf-8');
    const parsed = JSON.parse(content);
    // If parsed file doesn't have primary_color or branches, re-seed with fresh rich data
    if (!parsed[0]?.primary_color || !parsed[0]?.branches) {
      const initial = getInitialTenants();
      fs.writeFileSync(TENANTS_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    return parsed;
  } catch (err) {
    console.error('Error reading local tenants:', err);
    return getInitialTenants();
  }
}

function writeLocalTenants(tenants: Tenant[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(TENANTS_FILE, JSON.stringify(tenants, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing local tenants:', err);
  }
}

// GET: List all tenants or find by slug / id
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  const id = searchParams.get('id');

  const tenants = readLocalTenants();

  if (slug) {
    const found = tenants.find(t => t.slug === slug);
    if (found) return NextResponse.json(found);
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }

  if (id) {
    const found = tenants.find(t => t.id === id);
    if (found) return NextResponse.json(found);
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }

  return NextResponse.json(tenants);
}

// POST: Create a new library / tenant (Used in Super Admin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tenants = readLocalTenants();

    const slug = body.slug || body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') || `lib-${Date.now()}`;

    // Verify slug uniqueness
    if (tenants.some(t => t.slug === slug)) {
      return NextResponse.json({ error: 'اسم المعرف (Slug) مستخدم لمكتبة أخرى بالفعل' }, { status: 400 });
    }

    const newTenant: Tenant = {
      id: body.id || `tenant-${Date.now()}`,
      name: body.name,
      slug,
      tagline: body.tagline || 'مركز الطباعة والخدمات الطلابية',
      plan: body.plan || 'smart_print',
      primary_color: body.primary_color || '#16a34a',
      secondary_color: body.secondary_color || '#052e16',
      background_theme: body.background_theme || 'damascus_geometric',
      custom_background_url: body.custom_background_url || null,
      logo_url: body.logo_url || null,
      cover_image_url: body.cover_image_url || null,
      feature_flags: {
        smart_print: body.feature_flags?.smart_print ?? true,
        notes_catalog: body.feature_flags?.notes_catalog ?? true,
        shamcash_pay: body.feature_flags?.shamcash_pay ?? true,
        pos: body.feature_flags?.pos ?? false,
        inventory: body.feature_flags?.inventory ?? false,
        multi_branch: body.feature_flags?.multi_branch ?? false,
        audit_reports: body.feature_flags?.audit_reports ?? true,
      },
      contact_phone: body.contact_phone || null,
      is_active: true,
      branches_count: 1,
      branches: [
        {
          id: `branch-${Date.now()}`,
          tenant_id: body.id || `tenant-${Date.now()}`,
          name: 'الفرع الرئيسي',
          slug: 'main',
          address: 'الفرع الرئيسي للمكتبة',
          phone: body.contact_phone || null,
          default_currency: 'SYP',
          exchange_rate: 450.0,
          show_dual_currency: true,
          allow_currency_toggle: true,
          sham_cash_enabled: true,
          sham_cash_account_info: null,
          sham_cash_min_amount: 10000,
          auto_print_enabled: false,
          allowed_auto_print_max_pages: 50,
          is_active: true,
        }
      ],
      created_at: new Date().toISOString(),
    };

    tenants.unshift(newTenant);
    writeLocalTenants(tenants);

    return NextResponse.json(newTenant, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// PATCH: Update tenant feature flags, branding, or details
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      id, 
      feature_flags, 
      name, 
      tagline,
      plan, 
      is_active, 
      primary_color, 
      secondary_color, 
      background_theme,
      custom_background_url,
      logo_url, 
      cover_image_url,
      contact_phone 
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'معرف المكتبة مطلوب' }, { status: 400 });
    }

    const tenants = readLocalTenants();
    const index = tenants.findIndex(t => t.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'المكتبة غير موجودة' }, { status: 404 });
    }

    const tenant = tenants[index];
    if (feature_flags) {
      tenant.feature_flags = {
        ...tenant.feature_flags,
        ...feature_flags,
      };
    }
    if (name) tenant.name = name;
    if (tagline !== undefined) tenant.tagline = tagline;
    if (plan) tenant.plan = plan;
    if (typeof is_active === 'boolean') tenant.is_active = is_active;
    if (primary_color) tenant.primary_color = primary_color;
    if (secondary_color) tenant.secondary_color = secondary_color;
    if (background_theme) tenant.background_theme = background_theme;
    if (custom_background_url !== undefined) tenant.custom_background_url = custom_background_url;
    if (logo_url !== undefined) tenant.logo_url = logo_url;
    if (cover_image_url !== undefined) tenant.cover_image_url = cover_image_url;
    if (contact_phone !== undefined) tenant.contact_phone = contact_phone;

    // Update branch currency / exchange rate if provided
    const { branch_id, default_currency, exchange_rate, show_dual_currency, allow_currency_toggle } = body;
    if (tenant.branches && tenant.branches.length > 0) {
      tenant.branches = tenant.branches.map(b => {
        if (!branch_id || b.id === branch_id || b.slug === branch_id) {
          return {
            ...b,
            default_currency: default_currency || b.default_currency,
            exchange_rate: typeof exchange_rate === 'number' ? exchange_rate : b.exchange_rate,
            show_dual_currency: typeof show_dual_currency === 'boolean' ? show_dual_currency : b.show_dual_currency,
            allow_currency_toggle: typeof allow_currency_toggle === 'boolean' ? allow_currency_toggle : b.allow_currency_toggle,
          };
        }
        return b;
      });
    }

    tenants[index] = tenant;
    writeLocalTenants(tenants);

    // Sync to Supabase if available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
      try {
        const admin = createAdminClient();
        await admin.from('tenants').update({
          feature_flags: tenant.feature_flags,
          name: tenant.name,
          plan: tenant.plan,
          is_active: tenant.is_active,
          primary_color: tenant.primary_color,
          secondary_color: tenant.secondary_color,
          tagline: tenant.tagline,
          logo_url: tenant.logo_url,
          cover_image_url: tenant.cover_image_url,
        }).eq('id', id);
      } catch (e) {
        console.warn('Could not sync tenant to Supabase:', e);
      }
    }

    return NextResponse.json(tenant);
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
