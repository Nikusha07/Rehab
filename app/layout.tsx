import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "რეაბილიტაციის ცენტრი | ონლაინ ჩაწერა",
  description: "სამკურნალო ფიზკულტურისა და რეაბილიტაციის ცენტრი — ონლაინ ჩაწერა, სპეციალისტები და მომსახურებები.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ka">
      <body>{children}</body>
    </html>
  );
}
