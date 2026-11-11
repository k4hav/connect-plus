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
      <body className="app-backdrop">{children}</body>
    </html>
  );
}