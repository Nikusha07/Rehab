import { requireAdminPage } from "@/lib/auth";
import AdminShell from "@/components/AdminShell";
import ServicesManager from "@/components/admin/ServicesManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "სერვისები | Admin" };

export default async function ServicesPage(){
  const auth=await requireAdminPage();
  return <AdminShell username={String(auth.username||"admin")}><ServicesManager/></AdminShell>;
}
