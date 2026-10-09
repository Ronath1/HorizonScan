import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HorizonScan | AI-Powered PESTLE Market Intelligence & Risk Analysis',
  description:
    'Real-time macro environmental risk assessment across Political, Economic, Social, Technological, Legal, and Environmental dimensions powered by Tavily Search and Gemini Flash.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        {children}
      </body>
    </html>
  );
}
