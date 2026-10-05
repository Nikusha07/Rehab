import { requireAdminPage } from "@/lib/auth";
import AdminShell from "@/components/AdminShell";
import CalendarManager from "@/components/admin/CalendarManager";

export const dynamic="force-dynamic";
export const metadata={title:"კალენდარი | Admin"};
export default async function CalendarPage(){const auth=await requireAdminPage();return <AdminShell username={String(auth.username||"admin")}><CalendarManager/></AdminShell>}
