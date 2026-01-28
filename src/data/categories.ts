import {
  Flame,
  Pizza,
  Sandwich,
  Coffee,
  IceCream,
  Utensils,
} from "lucide-react";

export const CATEGORIES = [
  { id: "burgers", name: "Burgers", icon: Utensils },
  { id: "pizza", name: "Pizza", icon: Pizza },
  { id: "wraps", name: "Wraps", icon: Sandwich },
  { id: "drinks", name: "Drinks", icon: Coffee },
  { id: "dessert", name: "Dessert", icon: IceCream },
];

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id);
