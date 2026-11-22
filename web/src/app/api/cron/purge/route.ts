import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Automated 24-Hour / Completion File Purge Cron Handler
 * Physically deletes expired customer documents and Sham Cash receipts
 * from Supabase Storage buckets to ensure complete privacy & save quota.
 */
export async function GET(request: NextRequest) {
  return handlePurge(request);
}

export async function POST(request: NextRequest) {
  return handlePurge(request);
}

async function handlePurge(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || 'super-secret-purge-key-9988';

  // Optional: Verify caller token
  if (authHeader && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabaseAdmin = createAdminClient();

    // 1. Fetch expired orders (completed, cancelled, or older than 24 hours) where files are not yet purged
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: expiredOrders, error: orderFetchErr } = await supabaseAdmin
      .from('print_orders')
      .select('id, payment_receipt_path, status, created_at')
      .eq('files_purged', false)
      .or(`status.in.(completed,cancelled,rejected),created_at.lt.${twentyFourHoursAgo}`);

    if (orderFetchErr) {
      return NextResponse.json({ error: orderFetchErr.message }, { status: 500 });
    }

    if (!expiredOrders || expiredOrders.length === 0) {
      return NextResponse.json({ 
        message: 'No expired files found to purge.', 
        purgedOrdersCount: 0 
      });
    }

    const orderIds = expiredOrders.map(o => o.id);

    // 2. Fetch associated files from print_order_items
    const { data: items, error: itemsErr } = await supabaseAdmin
      .from('print_order_items')
      .select('id, order_id, file_path')
      .in('order_id', orderIds)
      .not('file_path', 'is', null);

    const customerFilePaths: string[] = [];
    if (items) {
      for (const item of items) {
        if (item.file_path) {
          customerFilePaths.push(item.file_path);
        }
      }
    }

    const receiptPaths: string[] = [];
    for (const order of expiredOrders) {
      if (order.payment_receipt_path) {
        receiptPaths.push(order.payment_receipt_path);
      }
    }

    // 3. PHYSICALLY DELETE FILES FROM SUPABASE STORAGE API
    let deletedCustomerFilesCount = 0;
    let deletedReceiptsCount = 0;

    if (customerFilePaths.length > 0) {
      const { data: removedCustomerFiles, error: rmErr1 } = await supabaseAdmin
        .storage
        .from('customer-files')
        .remove(customerFilePaths);

      if (!rmErr1 && removedCustomerFiles) {
        deletedCustomerFilesCount = removedCustomerFiles.length;
      }
    }

    if (receiptPaths.length > 0) {
      const { data: removedReceipts, error: rmErr2 } = await supabaseAdmin
        .storage
        .from('payment-receipts')
        .remove(receiptPaths);

      if (!rmErr2 && removedReceipts) {
        deletedReceiptsCount = removedReceipts.length;
      }
    }

    // 4. Update Database: mark orders as files_purged = true and clear references
    await supabaseAdmin
      .from('print_orders')
      .update({
        files_purged: true,
        payment_receipt_path: null,
        updated_at: new Date().toISOString(),
      })
      .in('id', orderIds);

    await supabaseAdmin
      .from('print_order_items')
      .update({
        file_path: null,
      })
      .in('order_id', orderIds);

    return NextResponse.json({
      success: true,
      message: 'Physical storage purge completed successfully.',
      purgedOrdersCount: expiredOrders.length,
      deletedCustomerFilesCount,
      deletedReceiptsCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Storage purge error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Internal server error during purge' },
      { status: 500 }
    );
  }
}
