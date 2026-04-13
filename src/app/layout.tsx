import type { Metadata } from "next";
import { fontVariables } from "@/lib/fonts";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Early Thunder — Hear the Storm Before Anyone Else",
    template: "%s | Early Thunder",
  },
  description:
    "Automated intelligence tracking pre-mainstream asymmetric investment opportunities across digital assets, public equities, and private markets.",
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
    <html lang="en" className={`${fontVariables} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-base text-text-primary">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
