import { redirect } from 'next/navigation';

interface TenantPageProps {
  params: {
    tenant: string;
  };
}

export default async function TenantRootPage({ params }: TenantPageProps) {
  const tenantSlug = params.tenant;

  try {
    const res = await fetch(`http://localhost:3000/api/tenants?slug=${tenantSlug}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      const currentTenant = Array.isArray(data) ? data[0] : data;
      if (currentTenant && currentTenant.branches && currentTenant.branches.length > 0) {
        redirect(`/${tenantSlug}/${currentTenant.branches[0].slug}`);
      }
    }
  } catch (err) {
    // Fallback redirect for known tenants
  }

  if (tenantSlug === 'dar-al-marefa') {
    redirect('/dar-al-marefa/main');
  } else if (tenantSlug === 'al-sham-center') {
    redirect('/al-sham-center/headquarters');
  } else {
    redirect(`/${tenantSlug}/campus`);
  }
}
