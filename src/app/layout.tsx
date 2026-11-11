import type { Metadata } from "next";
import { Cairo, Tajawal, Inter } from "next/font/google";
import "./globals.css";
import FloatingSupportWidget from "@/components/public/FloatingSupportWidget";

// Arabic fonts
const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  variable: "--font-tajawal",
  weight: ["300", "400", "500", "700", "800"],
  display: "swap",
});

// Latin font
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "روابي فرح | Rawabi Al-Farah",
    template: "%s | روابي فرح",
  },
  description:
    "روابي فرح — متجر إلكتروني، توريد للمحلات والمطاعم، ونقاط بيع المخبوزات والحلويات الطازجة في عمّان، الأردن.",
  keywords: ["روابي فرح", "Rawabi Al-Farah", "حلويات", "خبز", "عمّان", "الأردن"],
  authors: [{ name: "Rawabi Al-Farah" }],
  creator: "Rawabi Al-Farah",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "ar_JO",
    alternateLocale: "en_US",
    siteName: "روابي الفرح",
  },
  icons: {
    icon: "/rwabifarah.png",
    shortcut: "/rwabifarah.png",
    apple: "/rwabifarah.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${cairo.variable} ${tajawal.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('bakery_theme') || 'light';
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                  document.documentElement.setAttribute('data-theme', 'dark');
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.setAttribute('data-theme', 'light');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="antialiased">
        {children}
        <FloatingSupportWidget />
      </body>
    </html>
  );
}
