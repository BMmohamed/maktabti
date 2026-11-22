import React from 'react';
import { Metadata } from 'next';
import { DamasceneBackground } from '@/components/DamasceneBackground';

interface TenantLayoutProps {
  children: React.ReactNode;
  params: {
    tenant: string;
  };
}

async function getTenant(slug: string) {
  try {
    const res = await fetch(`http://localhost:3000/api/tenants?slug=${slug}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data[0] : data;
    }
  } catch (err) {
    console.error('Failed to fetch tenant in layout:', err);
  }

  // Fallbacks for demo
  if (slug === 'dar-al-marefa') {
    return {
      name: 'دار المعرفة للطباعة والقرطاسية',
      primary_color: '#4f46e5',
      secondary_color: '#1e1b4b',
      background_theme: 'arabesque_floral',
      custom_background_url: null,
    };
  }
  if (slug === 'al-sham-center') {
    return {
      name: 'مؤسسة الشام للخدمات الطلابية',
      primary_color: '#e11d48',
      secondary_color: '#4c0519',
      background_theme: 'islamic_calligraphy',
      custom_background_url: null,
    };
  }

  return {
    name: 'مكتبة النور الحديثة',
    primary_color: '#16a34a',
    secondary_color: '#052e16',
    background_theme: 'damascus_geometric',
    custom_background_url: null,
  };
}

export async function generateMetadata({ params }: TenantLayoutProps): Promise<Metadata> {
  const tenant = await getTenant(params.tenant);
  return {
    title: `${tenant.name} | بوابة الخدمات الطلابية والطباعة الذكية`,
    description: tenant.tagline || 'بوابة الزبائن للطباعة وطلب النوط والكتب',
  };
}

export default async function TenantLayout({ children, params }: TenantLayoutProps) {
  const tenant = await getTenant(params.tenant);
  const primaryColor = tenant.primary_color || '#16a34a';
  const secondaryColor = tenant.secondary_color || '#052e16';
  const backgroundTheme = tenant.background_theme || 'damascus_geometric';
  const customBackgroundUrl = tenant.custom_background_url || null;

  return (
    <div
      style={{
        '--tenant-primary': primaryColor,
        '--tenant-secondary': secondaryColor,
      } as React.CSSProperties}
      className="min-h-screen text-slate-900 transition-colors duration-300 relative isolate"
    >
      {/* Animated Damascene & Arabic Background with Ken Burns & Parallax */}
      <DamasceneBackground
        theme={backgroundTheme}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        customUrl={customBackgroundUrl}
      />

      {/* Main Tenant Portal Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
