import { NextRequest, NextResponse } from 'next/server';
import { authenticateAgent } from '@/lib/agent-auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
};

export async function GET(request: NextRequest) {
  const auth = await authenticateAgent(request);

  if (!auth.success || !auth.branch) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status || 401, headers: NO_CACHE_HEADERS }
    );
  }

  const { branch } = auth;
  const supabase = createAdminClient();

  try {
    // 1. Fetch pending print jobs for this branch
    // A job is ready for printing if:
    // - status is 'printing' or 'approved'
    // - OR status is 'completed' and printed_at IS NULL (ready for physical print dispatch)
    const { data: rawOrders, error } = await supabase
      .from('print_orders')
      .select('*, items:print_order_items(*)')
      .eq('branch_id', branch.id)
      .or('status.eq.printing,status.eq.approved,and(status.eq.completed,printed_at.is.null)')
      .order('created_at', { ascending: true })
      .limit(10);

    if (error) {
      console.error('Supabase error fetching agent jobs:', error);
      return NextResponse.json(
        { error: `فشل جلب المهام من قاعدة البيانات: ${error.message}` },
        { status: 500, headers: NO_CACHE_HEADERS }
      );
    }

    const jobs = await Promise.all(
      (rawOrders || []).map(async (order: any) => {
        const enrichedItems = await Promise.all(
          (order.items || []).map(async (item: any) => {
            let downloadUrl: string | null = null;

            if (item.file_path) {
              if (item.file_path.startsWith('http://') || item.file_path.startsWith('https://')) {
                downloadUrl = item.file_path;
              } else {
                // Generate Signed URL from Supabase Storage (valid for 1 hour)
                const bucketName = item.item_type === 'catalog_note' ? 'notes-catalog-files' : 'customer-files';
                try {
                  const { data: signedData, error: signErr } = await supabase.storage
                    .from(bucketName)
                    .createSignedUrl(item.file_path, 3600);

                  if (!signErr && signedData?.signedUrl) {
                    downloadUrl = signedData.signedUrl;
                  } else {
                    // Fallback to public URL format
                    const { data: pubData } = supabase.storage
                      .from(bucketName)
                      .getPublicUrl(item.file_path);
                    downloadUrl = pubData?.publicUrl || item.file_path;
                  }
                } catch {
                  downloadUrl = item.file_path;
                }
              }
            }

            return {
              id: item.id,
              item_title: item.item_title,
              item_type: item.item_type,
              download_url: downloadUrl,
              file_path: item.file_path,
              file_mime_type: item.file_mime_type,
              page_count: item.page_count || 1,
              copies_count: item.copies_count || 1,
              paper_size: (item.paper_size || 'A4').toUpperCase(),
              color_mode: item.color_mode || 'bw', // 'bw' or 'color'
              duplex: item.duplex || 'simplex',    // 'simplex' or 'duplex'
              custom_page_range: item.custom_page_range || null,
              selected_services: item.selected_services || [],
              item_price: item.item_price || 0,
            };
          })
        );

        return {
          id: order.id,
          daily_order_code: order.daily_order_code,
          order_type: order.order_type,
          customer_name: order.customer_name || 'زبون الفرع',
          customer_phone: order.customer_phone,
          customer_notes: order.customer_notes,
          total_pages_count: order.total_pages_count,
          total_price: order.total_price,
          currency: order.currency,
          status: order.status,
          agent_claimed_at: order.agent_claimed_at,
          created_at: order.created_at,
          items: enrichedItems,
        };
      })
    );

    return NextResponse.json(
      {
        jobs_count: jobs.length,
        jobs,
      },
      { status: 200, headers: NO_CACHE_HEADERS }
    );
  } catch (err: any) {
    console.error('Fatal error in GET /api/agent/jobs:', err);
    return NextResponse.json(
      { error: err?.message || 'Server error' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
