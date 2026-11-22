import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // 1. Check if configured
  const isUrlConfigured = !!supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co');
  const isAnonConfigured = !!anonKey && !anonKey.includes('placeholder');
  const isServiceConfigured = !!serviceKey && !serviceKey.includes('placeholder');

  if (!isUrlConfigured || (!isAnonConfigured && !isServiceConfigured)) {
    return NextResponse.json({
      status: 'unconfigured',
      connected: false,
      message: 'لم يتم ضبط متغيرات بيئة Supabase بعد (NEXT_PUBLIC_SUPABASE_URL و المفاتيح مفقودة)',
      details: {
        hasUrl: isUrlConfigured,
        hasAnonKey: isAnonConfigured,
        hasServiceKey: isServiceConfigured,
        supabaseUrl: supabaseUrl ? supabaseUrl.replace(/https:\/\/(.*?)\.supabase\.co.*/, '$1.supabase.co') : null,
      },
      latencyMs: null,
      timestamp: new Date().toISOString(),
    });
  }

  // 2. Perform live check to Supabase
  try {
    const supabase = createAdminClient();
    
    // We try to fetch the tenants table count or do a basic select
    const { data, count, error, status } = await supabase
      .from('tenants')
      .select('id, name', { count: 'exact', head: false })
      .limit(1);

    const latencyMs = Date.now() - startTime;

    if (error) {
      // Check if it's permission error or table doesn't exist or blocked
      return NextResponse.json({
        status: status === 401 || status === 403 ? 'blocked' : 'error',
        connected: false,
        message: status === 401 || status === 403
          ? 'تم حظر الاتصال أو رفض الصلاحيات (Invalid API Key / Unauthorized)'
          : `خطأ في الاتصال بقاعدة البيانات: ${error.message}`,
        details: {
          errorCode: error.code,
          errorMessage: error.message,
          httpStatus: status,
          supabaseUrl: supabaseUrl.replace(/https:\/\/(.*?)\.supabase\.co.*/, '$1.supabase.co'),
          hasServiceKey: isServiceConfigured,
          hasAnonKey: isAnonConfigured,
        },
        latencyMs,
        timestamp: new Date().toISOString(),
      }, { status: 200 }); // return 200 so UI receives full json
    }

    // Success!
    return NextResponse.json({
      status: 'connected',
      connected: true,
      message: 'الاتصال متصل ويعمل بكفاءة عالية مع خادم سوبا بيس السحابي',
      details: {
        supabaseUrl: supabaseUrl.replace(/https:\/\/(.*?)\.supabase\.co.*/, '$1.supabase.co'),
        tenantsFound: count ?? (data ? data.length : 0),
        hasServiceKey: isServiceConfigured,
        hasAnonKey: isAnonConfigured,
      },
      latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return NextResponse.json({
      status: 'blocked',
      connected: false,
      message: 'تعذر الوصول إلى منصة Supabase (قد يكون هناك حظر شبكي أو انقطاع اتصال): ' + (err?.message || 'خطأ غير معروف'),
      details: {
        errorMessage: err?.message,
        supabaseUrl: supabaseUrl ? supabaseUrl.replace(/https:\/\/(.*?)\.supabase\.co.*/, '$1.supabase.co') : null,
      },
      latencyMs,
      timestamp: new Date().toISOString(),
    }, { status: 200 });
  }
}
