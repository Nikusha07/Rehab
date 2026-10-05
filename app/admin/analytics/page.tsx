import { requireAdminPage } from "@/lib/auth";
import AdminShell from "@/components/AdminShell";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";

export const dynamic="force-dynamic";
export const metadata={title:"ანალიტიკა | Admin"};
export default async function AnalyticsPage(){const auth=await requireAdminPage();return <AdminShell username={String(auth.username||"admin")}><AnalyticsDashboard/></AdminShell>}
