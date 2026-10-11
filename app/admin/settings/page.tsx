import { redirect } from "next/navigation";
import { hasAdminPermission, requireAdminPage } from "@/lib/auth";
import AdminShell from "@/components/AdminShell";
import SettingsManager from "@/components/admin/SettingsManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "პარამეტრები | Admin" };

export default async function SettingsPage() {
  const auth = await requireAdminPage();
  if (!hasAdminPermission(auth, "settings.write")) redirect("/admin");
  const primaryUsername = (process.env.ADMIN_USERNAME || "admin").trim().toLowerCase();
  const isPrimaryOwner = String(auth.username || "").trim().toLowerCase() === primaryUsername;
  const role = (isPrimaryOwner ? "owner" : (["owner", "reception", "doctor"].includes(String(auth.accessRole)) ? String(auth.accessRole) : "owner")) as "owner" | "reception" | "doctor";
  return (
    <AdminShell username={String(auth.username || "admin")} accessRole={role}>
      <SettingsManager />
    </AdminShell>
  );
}
