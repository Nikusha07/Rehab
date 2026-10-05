import { requireAdminPage } from "@/lib/auth";
import AdminShell from "@/components/AdminShell";
import SmsManager from "@/components/admin/SmsManager";

export const dynamic="force-dynamic";
export const metadata={title:"SMS ჟურნალი | Admin"};
export default async function SmsPage(){const auth=await requireAdminPage();return <AdminShell username={String(auth.username||"admin")}><SmsManager/></AdminShell>}
