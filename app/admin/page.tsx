import { redirect } from "next/navigation";
import { hasAdminSession } from "../../lib/admin/admin-session";
import { AdminDashboard } from "./ui/admin-dashboard";

export default async function AdminPage() {
  if (!(await hasAdminSession())) redirect("/admin/login");
  return <AdminDashboard />;
}
