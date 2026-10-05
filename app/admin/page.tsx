import Image from "next/image";
import { requireAdminPage } from "@/lib/auth";
import AdminDashboard from "@/components/AdminDashboard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard | რეაბილიტაციის ცენტრი" };

export default async function AdminPage() {
  const auth = await requireAdminPage();
  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <div className="container admin-topbar-inner">
          <div className="admin-brand"><Image src="/logo-symbol.png" alt="" width={36} height={42} /> რეაბილიტაციის ცენტრი — Admin</div>
          <div className="admin-actions"><a href="/" target="_blank">საიტის ნახვა ↗</a><span>{String(auth.username || "admin")}</span></div>
        </div>
      </header>
      <div className="container admin-main"><AdminDashboard /></div>
    </main>
  );
}
