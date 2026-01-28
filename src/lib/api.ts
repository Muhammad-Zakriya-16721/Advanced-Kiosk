import { supabase } from "@/lib/supabase";
import { Modifier, ModifierGroup } from "@/data/modifiers";

// Define the shape of our Product for the Frontend
// This matches what our UI components expect
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  calories: number;
  popular: boolean;
  modifiers?: ModifierGroup[] | any[];
  is_available: boolean;
  discount_percentage: number; // Keep for legacy/backward compat
  discount_type?: "percent" | "fixed";
  discount_value?: number;
  discount_start_at?: string;
  discount_ends_at?: string;
  // related_products?: string[]; // DEPRECATED: Replaced by AI Upsell Engine
  // New Deal Fields
  type?: "single" | "deal";
  deal_ends_at?: string;
  bundle_items?: {
    product_id: string;
    quantity: number;
    product_name?: string;
  }[];

  // Stock Fields
  stock_level?: number;
  low_stock_threshold?: number;

  // KDS Fields
  prep_time?: number; // Minutes
}

export const getProducts = async (): Promise<Product[]> => {
  try {
    // 1. Fetch Products
    const { data: productsData, error: productsError } = await supabase
      .from("products")
      .select("*")
      .order("popular", { ascending: false });

    if (productsError) {
      console.error("Error fetching products:", productsError);
      return [];
    }

    if (!productsData) return [];

    // 2. Fetch Bundles for Deal items
    // Optimization: Only fetch if there are deals
    const dealIds = productsData
      .filter((p: any) => p.type === "deal")
      .map((p: any) => p.id);

    let bundlesMap: Record<string, any[]> = {};

    if (dealIds.length > 0) {
      const { data: bundlesData, error: bundlesError } = await supabase
        .from("product_bundles")
        .select("deal_id, product_id, quantity, products(name)") // Fetch product name too if possible
        .in("deal_id", dealIds);

      if (!bundlesError && bundlesData) {
        bundlesData.forEach((b: any) => {
          if (!bundlesMap[b.deal_id]) bundlesMap[b.deal_id] = [];

          // Map to expected structure
          bundlesMap[b.deal_id].push({
            product_id: b.product_id,
            quantity: b.quantity,
            product_name: b.products?.name, // Assuming generic join works, if not we handle gracefully
          });
        });
      } else if (bundlesError) {
        console.warn("Error fetching bundles:", bundlesError);
      }
    }

    // Map Database Schema -> Frontend Schema
    const mappedProducts: Product[] = productsData.map((item: any) => {
      // Get bundles if this is a deal
      const bundles = bundlesMap[item.id] || [];

      return {
        id: item.id,
        name: item.name,
        description: item.description,
        price: Number(item.price),
        category: item.category,
        image: item.image_url || "https://placehold.co/400x300?text=No+Image",
        calories: item.calories || 0,
        popular: item.popular || false,
        modifiers: Array.isArray(item.modifiers) ? item.modifiers : [],
        is_available:
          item.is_available !== undefined ? item.is_available : true,
        discount_percentage: item.discount_percentage || 0,
        discount_type: item.discount_type || "percent",
        discount_value: item.discount_value || item.discount_percentage || 0,
        discount_start_at: item.discount_start_at || undefined,
        discount_ends_at: item.discount_ends_at || undefined,
        related_products: item.related_products || [],

        // New Mapping
        type: item.type || "single",
        deal_ends_at: item.deal_ends_at || undefined,
        bundle_items: bundles,

        stock_level: item.stock_level,
        low_stock_threshold: item.low_stock_threshold,

        // KDS
        prep_time: item.prep_time || 5,
      };
    });

    return mappedProducts;
  } catch (err) {
    console.error("Unexpected error fetching products:", err);
    return [];
  }
};

export const createProduct = async (product: Partial<Product>) => {
  // Minimal map back to DB schema
  const dbPayload: any = { ...product };
  if (product.image) {
    dbPayload.image_url = product.image;
    delete dbPayload.image;
  }
  // Remove frontend-only or readonly fields
  delete dbPayload.bundle_items;

  const { data, error } = await supabase
    .from("products")
    .insert([dbPayload])
    .select()
    .single();
  if (error) {
    console.error("Create Product Error:", error);
    return null;
  }
  return data;
};

export const createDeal = async (
  deal: Partial<Product>,
  bundleItems: { product_id: string; quantity: number }[],
) => {
  // 1. Create the Deal Product
  const dealPayload: any = { ...deal, type: "deal" };
  if (deal.image) {
    dealPayload.image_url = deal.image;
    delete dealPayload.image;
  }

  const { data: dealData, error: dealError } = await supabase
    .from("products")
    .insert([dealPayload])
    .select()
    .single();

  if (dealError || !dealData) {
    console.error("Error creating deal:", dealError);
    return null;
  }

  // 2. Create Bundle Entries
  const bundles = bundleItems.map((item) => ({
    deal_id: dealData.id,
    product_id: item.product_id,
    quantity: item.quantity,
  }));

  const { error: bundleError } = await supabase
    .from("product_bundles")
    .insert(bundles);

  if (bundleError) {
    console.error("Error creating bundle items:", bundleError);
    return null;
  }

  return dealData;
};

export const createOrder = async (orderData: {
  items: any[];
  total: number;
  note?: string;
}) => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .insert({
        total_amount: orderData.total,
        items: orderData.items,
        customer_note: orderData.note,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating order:", error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error("Unexpected error creating order:", err);
    return null;
  }
};

// --- KDS API ---

// Re-export supabase for convenience in Realtime components
export { supabase };

export const getActiveOrders = async () => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .in("status", ["pending", "preparing"]) // Strict Allowlist
      .order("created_at", { ascending: true }); // Oldest first

    if (error) {
      console.error("Error fetching active orders:", error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("Unexpected error fetching active orders:", err);
    return [];
  }
};

// Update `updateOrderStatus`
export const updateOrderStatus = async (
  orderId: string,
  status: string,
  extraUpdates: any = {},
) => {
  try {
    const { error } = await supabase
      .from("orders")
      .update({
        status,
        ...extraUpdates,
      })
      .eq("id", orderId);

    if (error) {
      console.error("Error updating order status:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Unexpected error updating order status:", err);
    return false;
  }
};

export const getRecentCompletedOrders = async () => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("status", "completed")
      // Fallback to created_at since updated_at column likely doesn't exist
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching completed orders:", error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("Unexpected error fetching completed orders:", err);
    return [];
  }
};
// Helper to format UUID into a readable short ID (e.g., "9F4A")
export const formatOrderId = (uuid: string | number) => {
  if (!uuid) return "----";
  // Safe cast in case it's a number ID
  return String(uuid).split("-")[0].slice(0, 4).toUpperCase();
};

export const updateProduct = async (id: string, updates: Partial<Product>) => {
  try {
    // Map Frontend Schema -> Database Schema if needed
    // Currently only 'image' maps to 'image_url' but updates usually target primitive fields.
    // If updating image, we need to map it back.
    const dbUpdates: any = { ...updates };
    if (updates.image) {
      dbUpdates.image_url = updates.image;
      delete dbUpdates.image;
    }

    const { error } = await supabase
      .from("products")
      .update(dbUpdates)
      .eq("id", id);

    if (error) {
      console.error("Error updating product:", JSON.stringify(error, null, 2));
      return false;
    }
    return true;
  } catch (err) {
    console.error("Unexpected error product:", err);
    return false;
  }
};

export const getDailyStats = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of day

    const { data: orders, error } = await supabase
      .from("orders")
      .select("*")
      .gte("created_at", today.toISOString())
      .neq("status", "cancelled"); // Exclude cancelled

    if (error) {
      console.error("Error fetching daily stats:", error);
      return null;
    }

    if (!orders) return null;

    // Process Data
    const totalRevenue = orders.reduce(
      (sum, order) => sum + (order.total_amount || 0),
      0,
    );
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate Popular Items
    const itemCounts: Record<string, number> = {};
    orders.forEach((order) => {
      if (Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          if (item.name) {
            itemCounts[item.name] =
              (itemCounts[item.name] || 0) + (item.quantity || 1);
          }
        });
      }
    });

    const popularItems = Object.entries(itemCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5

    return {
      revenue: totalRevenue,
      orders: totalOrders,
      avgValue: avgOrderValue,
      popularItems,
    };
  } catch (err) {
    console.error("Unexpected error fetching stats:", err);
    return null;
  }
};

export const getOrdersHistory = async () => {
  try {
    // Fetch last 1000 orders for heatmap calculation
    const { data, error } = await supabase
      .from("orders")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error) {
      console.error("Error fetching order history:", error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("Unexpected error fetching order history:", err);
    return [];
  }
};

// --- Helper functions for Pricing Logic ---

export const isDiscountActive = (
  product: Product | null | undefined,
): boolean => {
  const now = new Date();

  if (!product) return false;

  // 1. Check if discount exists
  if (!product.discount_value || product.discount_value <= 0) return false;

  // 2. Check Start Date (if set)
  if (product.discount_start_at) {
    if (new Date(product.discount_start_at) > now) return false;
  }

  // 3. Check End Date (if set)
  if (product.discount_ends_at) {
    if (new Date(product.discount_ends_at) < now) return false;
  }

  // 4. Also check legacy deal_ends_at if it's a deal type
  if (product.type === "deal" && product.deal_ends_at) {
    if (new Date(product.deal_ends_at) < now) return false;
  }

  return true;
};

export const calculateDiscountedPrice = (
  product: Product | null | undefined,
): number => {
  if (!product || !isDiscountActive(product)) return product?.price || 0;

  let finalPrice = product.price;
  const value = product.discount_value || 0;

  if (product.discount_type === "fixed") {
    finalPrice = product.price - value;
  } else {
    // Percent
    finalPrice = product.price * (1 - value / 100);
  }

  return Math.max(0, finalPrice);
};
