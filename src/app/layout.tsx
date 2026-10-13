import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HorizonScan | Evidence-led market research",
  description:
    "Explore the risks and opportunities shaping your market through PESTLE research, source excerpts, and transparent scoring.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
