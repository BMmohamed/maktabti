import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { branch_id } = body;

    if (!branch_id) {
      return NextResponse.json({ error: 'branch_id is required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const newToken = `agent-token-${branch_id.substring(0, 8)}-${crypto.randomUUID().replace(/-/g, '').substring(0, 16)}`;

    const { data: updatedBranch, error } = await supabase
      .from('branches')
      .update({
        agent_auth_token: newToken,
        updated_at: new Date().toISOString(),
      })
      .eq('id', branch_id)
      .select('id, name, slug, agent_auth_token')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      branch_id: updatedBranch.id,
      branch_name: updatedBranch.name,
      agent_auth_token: updatedBranch.agent_auth_token,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
