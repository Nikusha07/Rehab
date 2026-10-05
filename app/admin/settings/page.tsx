import { requireAdminPage } from "@/lib/auth";
import AdminShell from "@/components/AdminShell";
import SettingsManager from "@/components/admin/SettingsManager";

export const dynamic="force-dynamic";
export const metadata={title:"პარამეტრები | Admin"};
export default async function SettingsPage(){const auth=await requireAdminPage();return <AdminShell username={String(auth.username||"admin")}><SettingsManager/></AdminShell>}
