import type { Metadata } from "next";
import PwaRegister from "@/components/PwaRegister";
import "./globals.css";
import "./polish.css";
import "./typography.css";
import "./map.css";
import "./public-extras.css";
import "./admin-contrast.css";
import "./admin-suite.css";
import "./responsive-final.css";
import "./calendar-mobile.css";
import "./admin-mobile-fixes.css";
import "./admin-enhancements.css";
import "./public-overhaul.css";
import "./booking-verification.css";
import "./booking-premium.css";
import "./booking-final-v2.css";
import "./booking-final-v3.css";
import "./mobile-menu-fix.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://rehasackhere.ge"),
  title: "რეაბილიტაციის ცენტრი საჩხერეში | Reha Sachkhere",
  description: "Reha Sachkhere — სამკურნალო ფიზკულტურისა და რეაბილიტაციის ცენტრი საჩხერეში. გაეცანით მომსახურებებს, სპეციალისტებს და დაჯავშნეთ ვიზიტი ონლაინ.",
  icons: {
    icon: [{ url: "/favicon.png", sizes: "96x96", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website", locale: "ka_GE", siteName: "Reha Sachkhere",
    title: "რეაბილიტაციის ცენტრი საჩხერეში | Reha Sachkhere",
    description: "სამკურნალო ფიზკულტურა და რეაბილიტაცია საჩხერეში. ინფორმაცია მომსახურებებზე და ონლაინ ჩაწერა.",
    images: [{ url: "/icon.png", width: 512, height: 512, alt: "Reha Sachkhere — ცენტრის ლოგო" }],
  },
  twitter: { card: "summary", title: "Reha Sachkhere — რეაბილიტაცია საჩხერეში", images: ["/icon.png"] },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Reha Sachkhere", statusBarStyle: "default" },
  formatDetection: { telephone: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ka">
      <body>{children}<PwaRegister /></body>
    </html>
  );
}
