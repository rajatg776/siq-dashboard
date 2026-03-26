export const metadata = {
  title: "SIQ Offline — Revenue Dashboard",
  description: "Multi-month Revenue & Lead Funnel Dashboard",
};
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet"/></head>
      <body style={{ margin:0, padding:0, background:"#0a0e1a" }}>{children}</body>
    </html>
  );
}
