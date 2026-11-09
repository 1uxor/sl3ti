import "./globals.css";
export const metadata = { title: "Sl3ti — Gérez vos biens, simplement", description: "Gestion simple des stocks, équipements et locations" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="fr"><body>{children}</body></html>;
}

