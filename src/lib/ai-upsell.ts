import { Product } from "./api";

export interface UpsellResult {
  product: Product;
  reason: string;
}

/**
 * AI Logic to determine the best upsell product.
 * Heuristics:
 * 1. Filter out items already in the cart.
 * 2. Time of Day Rules (Morning -> Coffee/Breakfast).
 * 3. Category Pairings (Burger -> Fries/Drinks, Pizza -> Wings/Drinks).
 * 4. Fallback to "Popular" items or random "featured" items.
 */
export const getUpsellRecommendation = (
  mainItem: Product,
  allProducts: Product[],
  cartItemsIds: string[] = [], // IDs of items already in cart to exclude
): UpsellResult | null => {
  // 0. Base Filter: Available, Not same as main, Not in cart
  const candidates = allProducts.filter(
    (p) =>
      p.id !== mainItem.id &&
      p.is_available &&
      (p.stock_level === undefined || p.stock_level > 0) &&
      !cartItemsIds.includes(p.id),
  );

  const hour = new Date().getHours();
  // Mocking time for testing if needed, or use real system time
  const isMorning = hour >= 5 && hour < 11;
  const isLunch = hour >= 11 && hour < 15;
  const isEvening = hour >= 17;

  // --- RULE 1: Time of Day ---
  // If Morning, push Coffee or Breakfast items
  if (isMorning) {
    const morningItem = candidates.find(
      (p) =>
        p.category === "drinks" &&
        (p.name.toLowerCase().includes("coffee") ||
          p.name.toLowerCase().includes("tea")),
    );
    if (morningItem) {
      return { product: morningItem, reason: "Start your day right" };
    }
  }

  // --- RULE 3: Category Pairing (The "Combo" Logic) ---
  if (mainItem.category === "burgers") {
    // 1. Suggest Fries
    const fries = candidates.find((p) =>
      p.name.toLowerCase().includes("fries"),
    );
    if (fries) return { product: fries, reason: "Complete your meal" };

    // 2. Suggest Drink
    const drink = candidates.find((p) => p.category === "drinks");
    if (drink) return { product: drink, reason: "Thirsty?" };
  }

  if (mainItem.category === "pizza") {
    // 1. Suggest Wings
    const wings = candidates.find((p) =>
      p.name.toLowerCase().includes("wings"),
    );
    if (wings) return { product: wings, reason: "Great on the side" };

    // 2. Suggest Drink
    const drink = candidates.find((p) => p.category === "drinks");
    if (drink) return { product: drink, reason: "Thirsty?" };
  }

  // --- RULE 4: Dessert Finish (if buying large main) ---
  if (mainItem.price > 15) {
    const dessert = candidates.find(
      (p) => p.category === "dessert" || p.category === "sweets",
    );
    if (dessert) return { product: dessert, reason: "Treat yourself" };
  }

  // --- RULE 5: Popularity Fallback ---
  // Just give me the most popular item I don't have
  const popular = candidates.find((p) => p.popular);
  if (popular) {
    return { product: popular, reason: "Chef's Favorite" };
  }

  // --- RULE 6: Random Fallback ---
  if (candidates.length > 0) {
    const random = candidates[Math.floor(Math.random() * candidates.length)];
    return { product: random, reason: "You might like this" };
  }

  return null;
};
