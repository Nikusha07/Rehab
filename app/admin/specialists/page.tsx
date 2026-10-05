import { redirect } from "next/navigation";
import { hasAdminPermission, requireAdminPage } from "@/lib/auth";
import AdminShell from "@/components/AdminShell";
import SpecialistsManager from "@/components/admin/SpecialistsManager";

export const dynamic="force-dynamic";
export const metadata={title:"სპეციალისტები | Admin"};
export default async function SpecialistsPage(){const auth=await requireAdminPage();if(!hasAdminPermission(auth,"catalog.write"))redirect("/admin");return <AdminShell username={String(auth.username||"admin")}><SpecialistsManager/></AdminShell>}
