import { Product } from "./api";

// KDS Item Status
export type KdsItemStatus = "hold" | "fire" | "cooking" | "done";

export interface KdsItem {
  name: string;
  quantity: number;
  prep_time: number; // minutes
  fire_at: number; // Timestamp (ms)
  status: KdsItemStatus;
  originalIndex: number; // To maintain stability if needed
  modifiers?: any[];
  customer_note?: string;
  is_late?: boolean; // New Flag
}

export interface KdsOrder {
  id: string;
  order_number: string;
  created_at: string;
  accepted_at?: string; // New Field
  status: string; // New Field
  target_finish_time: number; // Timestamp (ms)
  items: KdsItem[];
  max_prep_time: number; // minutes
}

/**
 * INTELLIGENT ROUTING ALGORITHM: "Anchor & Fire"
 *
 * Goal: All items finish at the same time.
 * 1. Find the "Anchor Item" (Longest Prep Time).
 * 2. Calculate Order Target Finish Time = Now + MaxPrepTime.
 * 3. Back-calculate Fire Time for each item = TargetFinishTime - ItemPrepTime.
 *
 * Example:
 * - Burger (10m) -> Fire NOW.
 * - Fries (3m) -> Fire in 7 mins.
 */
export function calculateOrderTimings(
  order: any,
  allProducts: Product[],
): KdsOrder {
  const created = new Date(order.created_at).getTime();
  const now = Date.now();

  // 1. Augment Order Items with Prep Time
  // We need to look up the product to get its prep_time, as 'order.items' usually just has jsonb snapshots
  // If the snapshot has prep_time, use it; otherwise lookup.
  // For now, we simulate lookup or fallback.
  // In a real app, 'allProducts' should be passed in or cached.

  const itemsWithPrep: KdsItem[] = order.items.map((item: any, idx: number) => {
    // Try to find product in allProducts to get latest prep_time
    // Or use a default if not found
    const product = allProducts.find((p) => p.name === item.name); // Weak match by name if ID missing in JSONB
    const prepTime = product?.prep_time || 5; // Default 5 mins

    return {
      ...item,
      prep_time: prepTime,
      originalIndex: idx,
      fire_at: 0, // Placeholder
      status: "hold", // Placeholder
    };
  });

  // 2. Identify Anchor (Max Prep Time)
  const maxPrepTime = Math.max(...itemsWithPrep.map((i) => i.prep_time));

  // 3. Calculate Target Finish Time
  // KDS V2: Time starts only when "ACCEPTED" (status === 'preparing')
  // If pending, we estimate based on Now (provisional) OR we just don't calculate fire times yet.
  // But to show "Potential Fire Times", let's use:
  // - If accepted_at exists: use it.
  // - Else: use Now (as if accepted this second).

  const startTime = order.accepted_at
    ? new Date(order.accepted_at).getTime()
    : now;
  const targetFinishTime = startTime + maxPrepTime * 60 * 1000;

  // 4. Calculate Status & Fire Times
  const itemsWithStatus = itemsWithPrep.map((item) => {
    const fireAt = targetFinishTime - item.prep_time * 60 * 1000;

    let status: KdsItemStatus = "hold";

    // Status Logic
    // If Now >= FireAt, it's time to cook!
    if (now >= fireAt) {
      status = "fire";
      // If we are significantly past fire time (+1 min), maybe "cooking"?
      // But usually "FIRE" stays until bumped.
      // Let's call it "cooking" if it's been firing for > 30 seconds?
      // Actually standard:
      // Hold -> (Time reaches FireAt) -> FIRE (Flash) -> (Cook starts) -> Cooking.
      // Without bumps, we infer "Cooking" if widely past FireAt?
      // For this UI, let's keep it simple:
      // If Now < FireAt -> HOLD
      // If Now >= FireAt -> FIRE / COOKING
      status = "fire";
    }

    return {
      ...item,
      fire_at: fireAt,
      status,
    };
  });

  // Sort by Fire Time (Earliest to Latest) -> So top items are "Do This Now"
  itemsWithStatus.sort((a, b) => a.fire_at - b.fire_at);

  return {
    id: order.id,
    order_number: order.order_number,
    created_at: order.created_at,
    accepted_at: order.accepted_at,
    status: order.status,
    target_finish_time: targetFinishTime,
    items: itemsWithStatus,
    max_prep_time: maxPrepTime,
  };
}

/**
 * Helper to get time until action
 */
export function getTimeToFire(fireAt: number): string {
  const diff = fireAt - Date.now();
  if (diff <= 0) return "NOW";

  const mins = Math.floor(diff / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
