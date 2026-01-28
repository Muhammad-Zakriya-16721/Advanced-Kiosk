import { createClient } from "@/lib/supabase-server";
import AdminLoginForm from "@/components/admin/auth";
import AdminDashboard from "@/components/admin/dashboard";

export default async function AdminPage() {
  const supabase = await createClient();

  // 1. Check Auth (Server Side)
  // This ensures the protected dashboard HTML NEVER reaches the browser
  // unless the user is logged in as an admin/owner.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 2. Conditional Rendering
  if (!user) {
    return <AdminLoginForm />;
  }

  // 3. Render Dashboard
  return <AdminDashboard />;
}
