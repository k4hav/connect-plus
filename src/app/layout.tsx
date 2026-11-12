import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Connect⁺", template: "%s · Connect⁺" },
  description:
    "Raise Your Voice Together. An independent student-led platform to raise campus issues, organize support and track resolutions.",
};

export const viewport: Viewport = {
  themeColor: "#080A10",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="app-backdrop">
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="orb orb-a animate-float" />
          <div className="orb orb-b animate-float-delay" />
        </div>
        {children}
      </body>
    </html>
  );
}
