import { useState, useEffect } from "react";
import { supabase, getProducts, Product } from "@/lib/api";

export const useMenuData = () => {
  const [menuItems, setMenuItems] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getProducts();
      if (data && data.length > 0) {
        setMenuItems(data);
      } else {
        setMenuItems([]);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load menu. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Subscribe to changes in the "products" table
    const channel = supabase
      .channel("menu-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        (payload) => {
          console.log("Realtime Menu Update:", payload);
          // Simple strategy: Re-fetch all data to ensure consistency and correct mapping
          fetchData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { menuItems, isLoading, error, refetch: fetchData };
};
