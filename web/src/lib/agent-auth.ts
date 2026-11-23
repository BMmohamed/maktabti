import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export interface AgentAuthResult {
  success: boolean;
  error?: string;
  status?: number;
  branch?: any;
  tenant?: any;
}

export async function authenticateAgent(request: NextRequest): Promise<AgentAuthResult> {
  const token = 
    request.headers.get('x-agent-token') || 
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    return {
      success: false,
      error: 'رمز مصادقة وكيل الطباعة مفقود (Missing x-agent-token header)',
      status: 401,
    };
  }

  try {
    const supabase = createAdminClient();
    const { data: branch, error } = await supabase
      .from('branches')
      .select('*, tenant:tenants(*)')
      .eq('agent_auth_token', token)
      .maybeSingle();

    if (error) {
      console.error('Supabase error during agent auth:', error);
      return {
        success: false,
        error: `خطأ في التحقق من قاعدة البيانات: ${error.message}`,
        status: 500,
      };
    }

    if (!branch) {
      return {
        success: false,
        error: 'رمز ربط الوكيل غير صالح أو غير مرتبط بأي فرع نشط (Invalid Agent Token)',
        status: 403,
      };
    }

    if (!branch.is_active) {
      return {
        success: false,
        error: 'هذا الفرع موقوف حالياً من قبل الإدارة',
        status: 403,
      };
    }

    return {
      success: true,
      branch,
      tenant: branch.tenant,
    };
  } catch (err: any) {
    console.error('Fatal error in authenticateAgent:', err);
    return {
      success: false,
      error: err?.message || 'Server error',
      status: 500,
    };
  }
}
