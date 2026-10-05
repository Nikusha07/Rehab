import { requireAdminPage } from "@/lib/auth";
import AdminShell from "@/components/AdminShell";
import ScheduleManager from "@/components/admin/ScheduleManager";

export const dynamic="force-dynamic";
export const metadata={title:"სამუშაო გრაფიკი | Admin"};
export default async function SchedulePage(){const auth=await requireAdminPage();return <AdminShell username={String(auth.username||"admin")}><ScheduleManager/></AdminShell>}
