import { NextRequest, NextResponse } from 'next/server';
import { authenticateAgent } from '@/lib/agent-auth';

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
      { valid: false, error: auth.error },
      { status: auth.status || 401, headers: NO_CACHE_HEADERS }
    );
  }

  const { branch, tenant } = auth;

  return NextResponse.json(
    {
      valid: true,
      branch_id: branch.id,
      branch_name: branch.name,
      branch_slug: branch.slug,
      tenant_id: branch.tenant_id,
      tenant_name: tenant?.name || 'مكتبتي SaaS',
      default_currency: branch.default_currency || 'SYP',
      auto_print_enabled: branch.auto_print_enabled ?? false,
      server_time: new Date().toISOString(),
    },
    { status: 200, headers: NO_CACHE_HEADERS }
  );
}
