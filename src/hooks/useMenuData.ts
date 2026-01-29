import { useState, useEffect } from "react";
import { supabase, getProducts, Product } from "@/lib/api";

export const useMenuData = () => {
  const [menuItems, setMenuItems] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (isBackground = false) => {
    if (!isBackground) setIsLoading(true);
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
          // Add 500ms delay to ensure DB propagation and avoid race conditions
          setTimeout(() => {
            fetchData(true); // true = isBackground refresh (no loading spinner)
          }, 500);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { menuItems, isLoading, error, refetch: fetchData };
};
