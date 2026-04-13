import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Early Thunder",
    template: "%s | Early Thunder",
  },
  description: "Pre-mainstream opportunity intelligence.",
  keywords: [
    "investment intelligence",
    "asymmetric opportunities",
    "digital assets",
    "crypto research",
    "alternative investments",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-full flex-col bg-black text-text-primary font-sans">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
