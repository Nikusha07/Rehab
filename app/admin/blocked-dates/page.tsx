import { requireAdminPage } from "@/lib/auth";
import AdminShell from "@/components/AdminShell";
import BlockedDatesManager from "@/components/admin/BlockedDatesManager";

export const dynamic="force-dynamic";
export const metadata={title:"დაბლოკილი დღეები | Admin"};
export default async function BlockedDatesPage(){const auth=await requireAdminPage();return <AdminShell username={String(auth.username||"admin")}><BlockedDatesManager/></AdminShell>}
