import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'مكتبتي | المنصة السحابية الذكية للطباعة والمكتبات',
  description: 'نظام سحابي متكامل لإدارة مراكز الطباعة والخدمات الطلابية مع دعم الدفع السريع والطباعة الصامتة',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-screen bg-slate-50 antialiased font-sans selection:bg-brand-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
