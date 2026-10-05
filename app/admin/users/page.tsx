import { redirect } from "next/navigation";
import { hasAdminPermission, requireAdminPage } from "@/lib/auth";
import AdminShell from "@/components/AdminShell";
import AdminUsersManager from "@/components/admin/AdminUsersManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin მომხმარებლები | Admin" };

export default async function AdminUsersPage() {
  const auth = await requireAdminPage();
  if (!hasAdminPermission(auth, "users.write")) redirect("/admin");
  return <AdminShell username={String(auth.username || "admin")}><AdminUsersManager /></AdminShell>;
}
