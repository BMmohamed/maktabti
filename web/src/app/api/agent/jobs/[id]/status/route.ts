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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await authenticateAgent(request);

  if (!auth.success || !auth.branch) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status || 401, headers: NO_CACHE_HEADERS }
    );
  }

  const orderId = params.id;
  if (!orderId) {
    return NextResponse.json(
      { error: 'معرف الطلب مطلوب' },
      { status: 400, headers: NO_CACHE_HEADERS }
    );
  }

  const { branch } = auth;
  const supabase = createAdminClient();

  try {
    const body = await request.json().catch(() => ({}));
    const { status, error_message, printer_name } = body;

    // Verify order belongs to this branch
    const { data: existingOrder, error: fetchErr } = await supabase
      .from('print_orders')
      .select('id, branch_id, status, customer_notes, total_pages_count, total_price, currency, daily_order_code')
      .eq('id', orderId)
      .maybeSingle();

    if (fetchErr) {
      return NextResponse.json(
        { error: `خطأ في جلب بيانات الطلب: ${fetchErr.message}` },
        { status: 500, headers: NO_CACHE_HEADERS }
      );
    }

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'الطلب غير موجود في قاعدة البيانات' },
        { status: 404, headers: NO_CACHE_HEADERS }
      );
    }

    if (existingOrder.branch_id !== branch.id) {
      return NextResponse.json(
        { error: 'غير مصرح: هذا الطلب يتبع لفرع آخر' },
        { status: 403, headers: NO_CACHE_HEADERS }
      );
    }

    const nowIso = new Date().toISOString();
    const updateFields: any = {
      updated_at: nowIso,
    };

    if (status === 'printing') {
      updateFields.status = 'printing';
      updateFields.agent_claimed_at = nowIso;
    } else if (status === 'completed') {
      updateFields.status = 'completed';
      updateFields.printed_at = nowIso;
      updateFields.completed_at = nowIso;

      // Also record in print_audit_logs for anti-leakage audit
      try {
        await supabase.from('print_audit_logs').insert([{
          tenant_id: branch.tenant_id,
          branch_id: branch.id,
          order_id: existingOrder.id,
          printer_name: printer_name || 'طابعة وكيل MaktabatiPrint',
          pages_bw: existingOrder.total_pages_count || 1,
          pages_color: 0,
          total_sheets: existingOrder.total_pages_count || 1,
          revenue_amount: existingOrder.total_price || 0,
          currency: existingOrder.currency || 'SYP',
          logged_at: nowIso,
        }]);
      } catch (auditErr) {
        console.warn('Could not insert print audit log:', auditErr);
      }
    } else if (status === 'failed') {
      const errorNote = error_message ? `[فشل في الطباعة المادية: ${error_message}]` : '[فشل في الطباعة المادية]';
      updateFields.customer_notes = existingOrder.customer_notes 
        ? `${existingOrder.customer_notes}\n${errorNote}`
        : errorNote;
    }

    const { data: updatedOrder, error: updateErr } = await supabase
      .from('print_orders')
      .update(updateFields)
      .eq('id', orderId)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json(
        { error: `فشل تحديث حالة الطلب في Supabase: ${updateErr.message}` },
        { status: 500, headers: NO_CACHE_HEADERS }
      );
    }

    return NextResponse.json(
      {
        success: true,
        order_id: orderId,
        status: updatedOrder.status,
        printed_at: updatedOrder.printed_at,
      },
      { status: 200, headers: NO_CACHE_HEADERS }
    );
  } catch (err: any) {
    console.error('Fatal error in POST /api/agent/jobs/[id]/status:', err);
    return NextResponse.json(
      { error: err?.message || 'Server error' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
