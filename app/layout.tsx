import type { Metadata } from "next";
import "./globals.css";
import "./polish.css";

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
