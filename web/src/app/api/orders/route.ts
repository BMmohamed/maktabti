import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { PrintOrder } from '@/types';
import { createAdminClient } from '@/lib/supabase/admin';

// Local storage path for offline/demo persistence
const DATA_DIR = path.join(process.cwd(), '.data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

// Initialize local storage file with default demo data if missing
function getInitialMockOrders(): PrintOrder[] {
  return [
    {
      id: 'mock-try-1',
      tenant_id: 'a1000000-0000-0000-0000-000000000001',
      branch_id: 'b1000000-0000-0000-0000-000000000001',
      daily_order_code: 105,
      order_type: 'in_store',
      tracking_token: 'token-105',
      customer_name: 'محمد خالد (دفع بالليرة التركية)',
      customer_phone: '0955667788',
      customer_notes: 'طلب مسعر بالليرة التركية ₺',
      total_items_count: 1,
      total_pages_count: 30,
      total_price: 45.0,
      currency: 'TRY',
      exchange_rate_snapshot: 450,
      payment_status: 'cash_on_delivery',
      status: 'pending',
      files_purged: false,
      created_at: new Date(Date.now() - 2 * 60000).toISOString(),
      updated_at: new Date().toISOString(),
      items: [
        {
          id: 'item-try-1',
          item_type: 'file_upload',
          item_title: 'ملف_أبحاث_الهندسة_المعمارية.pdf',
          page_count: 30,
          copies_count: 1,
          paper_size: 'A4',
          color_mode: 'color',
          duplex: 'duplex',
          selected_services: [{ key: 'spiral_binding', name_ar: 'تسليك سلك حلزوني', price: 9.0 }],
          item_price: 45.0,
        }
      ]
    },
    {
      id: 'mock-1',
      tenant_id: 'a1000000-0000-0000-0000-000000000001',
      branch_id: 'b1000000-0000-0000-0000-000000000001',
      daily_order_code: 104,
      order_type: 'remote',
      tracking_token: 'token-104',
      customer_name: 'عمر الحلبي',
      customer_phone: '0988112233',
      customer_notes: 'يرجى تكبيس الأوراق بدبوسين في الزاوية',
      total_items_count: 2,
      total_pages_count: 52,
      total_price: 18500,
      currency: 'SYP',
      exchange_rate_snapshot: 450,
      payment_status: 'receipt_uploaded',
      payment_receipt_path: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop',
      status: 'pending',
      files_purged: false,
      created_at: new Date(Date.now() - 5 * 60000).toISOString(),
      updated_at: new Date().toISOString(),
      items: [
        {
          id: 'item-1',
          item_type: 'file_upload',
          item_title: 'تقرير_مشروع_التخرج_النهائي.pdf',
          page_count: 36,
          copies_count: 1,
          paper_size: 'A4',
          color_mode: 'color',
          duplex: 'simplex',
          selected_services: [{ key: 'spiral_binding', name_ar: 'تسليك سلك حلزوني', price: 4000 }],
          item_price: 13500,
        },
        {
          id: 'item-2',
          item_type: 'catalog_note',
          item_title: 'ملخص الرياضيات الهندسية 1',
          page_count: 16,
          copies_count: 1,
          paper_size: 'A4',
          color_mode: 'bw',
          duplex: 'duplex',
          selected_services: [{ key: 'staple', name_ar: 'تكبيس زاوية', price: 500 }],
          item_price: 5000,
        }
      ]
    },
    {
      id: 'mock-2',
      tenant_id: 'a1000000-0000-0000-0000-000000000001',
      branch_id: 'b1000000-0000-0000-0000-000000000001',
      daily_order_code: 103,
      order_type: 'in_store',
      tracking_token: 'token-103',
      customer_name: 'سارة العلي',
      customer_phone: '0933445566',
      total_items_count: 1,
      total_pages_count: 12,
      total_price: 3600,
      currency: 'SYP',
      payment_status: 'cash_on_delivery',
      status: 'printing',
      files_purged: false,
      created_at: new Date(Date.now() - 15 * 60000).toISOString(),
      updated_at: new Date().toISOString(),
      items: [
        {
          id: 'item-3',
          item_type: 'file_upload',
          item_title: 'وظيفة_الفيزياء_العملي.pdf',
          page_count: 12,
          copies_count: 1,
          paper_size: 'A4',
          color_mode: 'bw',
          duplex: 'duplex',
          selected_services: [],
          item_price: 3600,
        }
      ]
    }
  ];
}

function readLocalOrders(): PrintOrder[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(ORDERS_FILE)) {
      const initial = getInitialMockOrders();
      fs.writeFileSync(ORDERS_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const content = fs.readFileSync(ORDERS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading local orders file:', err);
    return getInitialMockOrders();
  }
}

function writeLocalOrders(orders: PrintOrder[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing local orders file:', err);
  }
}

// GET: Retrieve all orders or a single order by ID
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  // Check Supabase first if configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
    try {
      const admin = createAdminClient();
      let query = admin.from('print_orders').select('*, items:print_order_items(*)').order('created_at', { ascending: false });
      if (id) {
        query = query.eq('id', id);
        const { data, error } = await query.single();
        if (!error && data) return NextResponse.json(data);
      } else {
        const { data, error } = await query;
        if (!error && data && data.length > 0) return NextResponse.json(data);
      }
    } catch {
      // Fallback to local storage if Supabase is offline or fails
    }
  }

  const localOrders = readLocalOrders();
  if (id) {
    const cleanId = id.trim().replace('#', '');
    const found = localOrders.find(o => o.id === id || String(o.daily_order_code) === cleanId || o.id === cleanId);
    if (found) return NextResponse.json(found);
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  return NextResponse.json(localOrders);
}

// POST: Create a new order (saves locally & syncs to Supabase if configured)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const localOrders = readLocalOrders();

    // Determine sequential daily order code (#105, #106, etc.)
    const maxCode = localOrders.reduce((max, o) => Math.max(max, o.daily_order_code || 100), 100);
    const newCode = maxCode + 1;

    const newOrder: PrintOrder = {
      id: body.id || `ord-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      tenant_id: body.tenant_id || 'a1000000-0000-0000-0000-000000000001',
      branch_id: body.branch_id || 'b1000000-0000-0000-0000-000000000001',
      daily_order_code: newCode,
      order_type: body.order_type || 'in_store',
      tracking_token: `token-${newCode}`,
      customer_name: body.customer_name || 'زبون سريع',
      customer_phone: body.customer_phone || '0900000000',
      customer_notes: body.customer_notes || null,
      total_items_count: body.items ? body.items.length : 1,
      total_pages_count: body.total_pages_count || 1,
      total_price: body.total_price || 0,
      currency: body.currency || 'SYP',
      exchange_rate_snapshot: body.exchange_rate_snapshot || 450,
      payment_status: body.payment_status || (body.payment_receipt_path ? 'receipt_uploaded' : 'unpaid'),
      payment_receipt_path: body.payment_receipt_path || null,
      status: body.status || 'pending',
      files_purged: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: body.items || [],
    };

    // Prepend to local storage
    const updatedOrders = [newOrder, ...localOrders];
    writeLocalOrders(updatedOrders);

    // Also sync to Supabase if available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
      try {
        const admin = createAdminClient();
        await admin.from('print_orders').insert([{
          id: newOrder.id,
          tenant_id: newOrder.tenant_id,
          branch_id: newOrder.branch_id,
          daily_order_code: newOrder.daily_order_code,
          order_type: newOrder.order_type,
          customer_name: newOrder.customer_name,
          customer_phone: newOrder.customer_phone,
          customer_notes: newOrder.customer_notes,
          total_items_count: newOrder.total_items_count,
          total_pages_count: newOrder.total_pages_count,
          total_price: newOrder.total_price,
          currency: newOrder.currency,
          payment_status: newOrder.payment_status,
          payment_receipt_path: newOrder.payment_receipt_path,
          status: newOrder.status,
        }]);

        if (newOrder.items && newOrder.items.length > 0) {
          const itemsPayload = newOrder.items.map(item => ({
            order_id: newOrder.id,
            item_type: item.item_type,
            note_id: item.note_id || null,
            item_title: item.item_title,
            file_path: item.file_path || null,
            page_count: item.page_count,
            copies_count: item.copies_count,
            paper_size: item.paper_size,
            color_mode: item.color_mode,
            duplex: item.duplex,
            selected_services: item.selected_services,
            item_price: item.item_price,
          }));
          await admin.from('print_order_items').insert(itemsPayload);
        }
      } catch (e) {
        console.warn('Could not sync order to cloud Supabase:', e);
      }
    }

    return NextResponse.json(newOrder, { status: 201 });
  } catch (err: unknown) {
    console.error('Error in POST /api/orders:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// PATCH: Update order status or payment verification
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, payment_status } = body;
    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const localOrders = readLocalOrders();
    const index = localOrders.findIndex(o => o.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = localOrders[index];
    if (status) order.status = status;
    if (payment_status) order.payment_status = payment_status;
    order.updated_at = new Date().toISOString();

    if (status === 'completed') {
      order.completed_at = new Date().toISOString();
      order.printed_at = order.printed_at || new Date().toISOString();

      // Record audit log for Anti-Leakage Tracking
      if (body.record_audit) {
        try {
          const auditFile = path.join(DATA_DIR, 'audit_logs.json');
          let auditLogs = [];
          if (fs.existsSync(auditFile)) {
            auditLogs = JSON.parse(fs.readFileSync(auditFile, 'utf-8'));
          }
          const totalSheets = order.items?.reduce((sum, item) => {
            const pages = item.page_count || 1;
            const copies = item.copies_count || 1;
            return sum + (item.duplex === 'duplex' ? Math.ceil(pages / 2) * copies : pages * copies);
          }, 0) || order.total_pages_count || 1;

          auditLogs.unshift({
            id: `audit-${Date.now()}`,
            daily_code: order.daily_order_code,
            time: new Date().toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' }),
            branch: 'فرع مجمع الكليات',
            operator: body.audit_operator || 'موظف الفرع (يدوي)',
            printer: 'طابعة المكتبة (يدوي)',
            bwPages: order.total_pages_count,
            colorPages: 0,
            physicalSheets: totalSheets,
            revenue: order.total_price,
            logged_at: new Date().toISOString()
          });
          fs.writeFileSync(auditFile, JSON.stringify(auditLogs, null, 2), 'utf-8');
        } catch (e) {
          console.warn('Could not record local audit log:', e);
        }
      }
    } else if (status === 'printing') {
      order.agent_claimed_at = new Date().toISOString();
    }

    localOrders[index] = order;
    writeLocalOrders(localOrders);

    // Sync update to Supabase if configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
      try {
        const admin = createAdminClient();
        await admin.from('print_orders').update({
          ...(status && { status }),
          ...(payment_status && { payment_status }),
          updated_at: order.updated_at,
        }).eq('id', id);
      } catch {}
    }

    return NextResponse.json(order);
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
