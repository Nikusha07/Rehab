import { redirect } from "next/navigation";
import { hasAdminPermission, requireAdminPage } from "@/lib/auth";
import AdminShell from "@/components/AdminShell";
import AuditManager from "@/components/admin/AuditManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Audit log | Admin" };
export default async function AuditPage(){const auth=await requireAdminPage();if(!hasAdminPermission(auth,"audit.read"))redirect("/admin");return <AdminShell username={String(auth.username||"admin")}><AuditManager/></AdminShell>}
