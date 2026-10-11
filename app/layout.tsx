import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Coconut • Orchard Dashboard', description: 'ติดตามข้อมูลเซ็นเซอร์สวนมะพร้าวจาก Supabase Coconut' };
export default function Layout({children}: Readonly<{children: React.ReactNode}>) { return <html lang="th"><body>{children}</body></html>; }
