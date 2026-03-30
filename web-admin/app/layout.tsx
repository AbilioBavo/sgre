import Link from 'next/link';
import './globals.css';

const links = [
  ['Dashboard', '/dashboard'],
  ['Mapa', '/map'],
  ['Incidentes', '/incidents'],
  ['Abrigos', '/shelters'],
  ['Alertas', '/alerts'],
  ['Configurações', '/settings'],
] as const;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body>
        <div className="layout">
          <aside className="sidebar">
            <h2>SGRE Admin</h2>
            {links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
          </aside>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
