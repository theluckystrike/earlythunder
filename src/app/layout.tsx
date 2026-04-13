import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://earlythunder.com"),
  title: {
    default: "Early Thunder",
    template: "%s | Early Thunder",
  },
  description: "Pre-mainstream opportunity intelligence. Track asymmetric opportunities across crypto, deep tech, and emerging markets.",
  keywords: [
    "investment intelligence",
    "asymmetric opportunities",
    "digital assets",
    "crypto research",
    "alternative investments",
  ],
  openGraph: {
    type: "website",
    siteName: "Early Thunder",
    title: "Early Thunder",
    description: "Hear the storm before anyone else. Pre-mainstream opportunity intelligence.",
    url: "https://earlythunder.com",
    images: [{ url: "/og-default.svg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Early Thunder",
    description: "Pre-mainstream opportunity intelligence.",
  },
  alternates: {
    canonical: "https://earlythunder.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <script
          defer
          data-domain="earlythunder.com"
          src="https://plausible.io/js/script.js"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Early Thunder",
              url: "https://earlythunder.com",
              description: "Pre-mainstream opportunity intelligence. Track asymmetric opportunities across crypto, deep tech, and emerging markets.",
              publisher: {
                "@type": "Organization",
                name: "AUTOM8 LLC",
                url: "https://earlythunder.com",
              },
              potentialAction: {
                "@type": "SearchAction",
                target: "https://earlythunder.com/opportunities?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
      <body className="flex min-h-full flex-col bg-black text-text-primary font-sans">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
