import { requireAdminPage } from "@/lib/auth";
import AdminShell from "@/components/AdminShell";
import PatientsManager from "@/components/admin/PatientsManager";

export const dynamic="force-dynamic";
export const metadata={title:"პაციენტები | Admin"};
export default async function PatientsPage(){const auth=await requireAdminPage();return <AdminShell username={String(auth.username||"admin")}><PatientsManager/></AdminShell>}
