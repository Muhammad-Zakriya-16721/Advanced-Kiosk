import { checkKitchenAccess } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function KitchenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAllowed = await checkKitchenAccess();

  if (!isAllowed) {
    redirect("/kitchen/login");
  }

  return <>{children}</>;
}
