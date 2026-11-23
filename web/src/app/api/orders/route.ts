import { NextRequest, NextResponse } from 'next/server';
import { PrintOrder } from '@/types';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
};

// GET: Retrieve all orders or a single order by ID or daily_order_code directly from Supabase
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const admin = createAdminClient();

    // 1. Single order lookup
    if (id) {
      const cleanId = id.trim().replace('#', '');
      const isDailyCode = /^\d+$/.test(cleanId);

      let query = admin.from('print_orders').select('*, items:print_order_items(*)');
      if (isDailyCode) {
        query = query.eq('daily_order_code', parseInt(cleanId, 10));
      } else if (isValidUUID(cleanId)) {
        query = query.eq('id', cleanId);
      } else {
        return NextResponse.json(
          { error: 'معرف الطلب غير صالح (يجب أن يكون رقم الطلب اليومي أو رمز UUID صالح)' },
          { status: 400, headers: NO_CACHE_HEADERS }
        );
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('Supabase error fetching single order:', error);
        return NextResponse.json(
          { error: `خطأ Supabase: ${error.message}`, details: error },
          { status: 400, headers: NO_CACHE_HEADERS }
        );
      }

      if (!data) {
        return NextResponse.json(
          { error: `الطلب رقم (${cleanId}) غير موجود في قاعدة البيانات` },
          { status: 404, headers: NO_CACHE_HEADERS }
        );
      }

      return NextResponse.json(data, { headers: NO_CACHE_HEADERS });
    }

    // 2. All orders list ordered by created_at DESC
    const { data, error } = await admin
      .from('print_orders')
      .select('*, items:print_order_items(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching print_orders:', error);
      return NextResponse.json(
        { error: `خطأ Supabase أثناء جلب طابور الطلبات: ${error.message}`, details: error },
        { status: 500, headers: NO_CACHE_HEADERS }
      );
    }

    return NextResponse.json(data || [], { headers: NO_CACHE_HEADERS });
  } catch (err: any) {
    console.error('Fatal unhandled error in GET /api/orders:', err);
    return NextResponse.json(
      { error: `خطأ في الخادم: ${err?.message || 'Unknown Server Error'}` },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

// POST: Create a new order directly in Supabase (100% cloud native)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const admin = createAdminClient();

    // 1. Calculate sequential daily order code (#101, #102, ...)
    const { data: latestOrder, error: latestError } = await admin
      .from('print_orders')
      .select('daily_order_code')
      .order('daily_order_code', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestError) {
      console.error('Supabase error fetching latest daily_order_code:', latestError);
    }

    const nextDailyCode = (latestOrder?.daily_order_code || 100) + 1;
    const orderId = (body.id && isValidUUID(body.id)) ? body.id : crypto.randomUUID();
    const trackingToken = crypto.randomUUID();

    // 2. Insert master order row
    const orderPayload = {
      id: orderId,
      tenant_id: body.tenant_id || 'a1000000-0000-0000-0000-000000000001',
      branch_id: body.branch_id || 'b1000000-0000-0000-0000-000000000001',
      daily_order_code: nextDailyCode,
      order_type: body.order_type || 'in_store',
      tracking_token: trackingToken,
      customer_name: body.customer_name || 'زبون سريع',
      customer_phone: body.customer_phone || (body.order_type === 'in_store' ? 'استلام مباشر داخل الفرع' : '0900000000'),
      customer_notes: body.customer_notes || null,
      total_items_count: body.items?.length || body.total_items_count || 1,
      total_pages_count: body.total_pages_count || 1,
      total_price: body.total_price || 0,
      currency: body.currency || 'SYP',
      payment_status: body.payment_status || (body.payment_receipt_path ? 'receipt_uploaded' : 'unpaid'),
      payment_receipt_path: body.payment_receipt_path || null,
      status: body.status || 'pending',
    };

    const { data: insertedOrder, error: orderInsertError } = await admin
      .from('print_orders')
      .insert([orderPayload])
      .select()
      .single();

    if (orderInsertError) {
      console.error('Supabase error inserting print_orders row:', orderInsertError);
      return NextResponse.json(
        {
          error: `فشل إنشاء الطلب في Supabase: ${orderInsertError.message}`,
          details: orderInsertError,
          attemptedPayload: orderPayload,
        },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    // 3. Insert items rows
    let insertedItems: any[] = [];
    if (body.items && Array.isArray(body.items) && body.items.length > 0) {
      const itemsPayload = body.items.map((item: any) => ({
        id: (item.id && isValidUUID(item.id)) ? item.id : crypto.randomUUID(),
        order_id: orderId,
        item_type: item.item_type || 'file_upload',
        note_id: (item.note_id && isValidUUID(item.note_id)) ? item.note_id : null,
        item_title: item.item_title || 'ملف طباعة',
        file_path: item.file_path || null,
        page_count: item.page_count || 1,
        copies_count: item.copies_count || 1,
        paper_size: item.paper_size || 'A4',
        color_mode: item.color_mode || 'bw',
        duplex: item.duplex || 'simplex',
        custom_page_range: item.custom_page_range || null,
        selected_services: item.selected_services || [],
        item_price: item.item_price || 0,
      }));

      const { data: itemsData, error: itemsInsertError } = await admin
        .from('print_order_items')
        .insert(itemsPayload)
        .select();

      if (itemsInsertError) {
        console.error('Supabase error inserting print_order_items:', itemsInsertError);
        return NextResponse.json(
          {
            error: `تم إنشاء الطلب ولكن فشل إدراج عناصر الملفات: ${itemsInsertError.message}`,
            details: itemsInsertError,
            order: insertedOrder,
          },
          { status: 400, headers: NO_CACHE_HEADERS }
        );
      }

      insertedItems = itemsData || [];
    }

    return NextResponse.json(
      {
        ...insertedOrder,
        items: insertedItems,
      },
      { status: 201, headers: NO_CACHE_HEADERS }
    );
  } catch (err: any) {
    console.error('Fatal unhandled error in POST /api/orders:', err);
    return NextResponse.json(
      { error: `خطأ غير متوقع أثناء إنشاء الطلب: ${err?.message || 'Unknown Server Error'}` },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

// PATCH: Update order status or payment verification directly in Supabase
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, payment_status } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'معرف الطلب (id) مطلوب لتحديث الحالة' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const admin = createAdminClient();

    const updateFields: any = {
      updated_at: new Date().toISOString(),
    };
    if (status) updateFields.status = status;
    if (payment_status) updateFields.payment_status = payment_status;
    if (body.customer_notes !== undefined) {
      updateFields.customer_notes = body.customer_notes;
    } else if (body.rejection_reason) {
      updateFields.customer_notes = `[سبب الرفض: ${body.rejection_reason}]`;
    }
    if (status === 'completed') {
      updateFields.completed_at = new Date().toISOString();
      if (!body.trigger_agent) {
        updateFields.printed_at = new Date().toISOString();
      }
    } else if (status === 'printing') {
      updateFields.agent_claimed_at = new Date().toISOString();
    }

    const { data: updatedOrder, error: updateError } = await admin
      .from('print_orders')
      .update(updateFields)
      .eq('id', id)
      .select('*, items:print_order_items(*)')
      .single();

    if (updateError) {
      console.error('Supabase error updating order in PATCH:', updateError);
      return NextResponse.json(
        {
          error: `فشل تحديث حالة الطلب في Supabase: ${updateError.message}`,
          details: updateError,
        },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    return NextResponse.json(updatedOrder, { headers: NO_CACHE_HEADERS });
  } catch (err: any) {
    console.error('Fatal unhandled error in PATCH /api/orders:', err);
    return NextResponse.json(
      { error: `خطأ في تحديث الطلب: ${err?.message || 'Unknown Server Error'}` },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
