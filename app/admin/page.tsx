import { requireAdminPage } from "@/lib/auth";
import AdminDashboard from "@/components/AdminDashboard";
import AdminShell from "@/components/AdminShell";

export const dynamic = "force-dynamic";
export const metadata = { title: "ჯავშნები | რეაბილიტაციის ცენტრი" };

export default async function AdminPage() {
  const auth = await requireAdminPage();
  return (
    <AdminShell username={String(auth.username || "admin")}>
      <AdminDashboard />
    </AdminShell>
  );
}
