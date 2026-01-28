import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

// NOTE: We need a direct Supabase client here because we are on the server.
// We can use the existing public env vars for the check.
// If we want to UPDATE last_active, we theoretically need permission.
// Since RLS restricts updates to Owner, the updateLastActive step might fail
// unless we have a Service Role Key or an RLS policy allowing it.
// For this demo, we will try to update but not block access if it fails.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const checkKitchenAccess = async () => {
  const cookieStore = await cookies();
  const staffId = cookieStore.get("kitchen_token")?.value;

  if (!staffId) return false;

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Verify Staff Status via RPC (Bypasses RLS)
  const { data: statusStr, error } = await supabase.rpc("get_staff_status", {
    p_staff_id: staffId,
  });

  if (error || !statusStr) return false;

  // 2. Check Status
  if (statusStr !== "approved") return false;

  return true;
};
