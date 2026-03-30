import Link from 'next/link';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body>
        <div className="container">
          <nav className="topnav panel">
            <Link href="/">Home</Link>
            <Link href="/map">Mapa</Link>
            <Link href="/evacuate">Evacuar</Link>
            <Link href="/report">Reportar</Link>
            <Link href="/alerts">Alertas</Link>
          </nav>
          {children}
        </div>
      </body>
    </html>
  );
}
