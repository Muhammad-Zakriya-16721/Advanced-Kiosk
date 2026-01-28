import { Product } from "@/lib/api";

export interface ProductDraft {
  name: string;
  description: string;
  price: string;
  category: string;
  image: string;
  calories: string;
  isPopular: boolean;
  dealEndsAt: string;
  // Advanced Pricing
  discountType: "percent" | "fixed";
  discountValue: number;
  discountStartAt: string;
  discountEndsAt: string;
  customModifiers: { name: string; price: number }[];
  // Deal specific
  bundleItems: { product_id: string; quantity: number }[];
  step: number;
}

export const DEFAULT_DRAFT: ProductDraft = {
  name: "",
  description: "",
  price: "",
  category: "burgers",
  image: "",
  calories: "",
  isPopular: false,
  dealEndsAt: "",
  discountType: "percent",
  discountValue: 0,
  discountStartAt: "",
  discountEndsAt: "",
  customModifiers: [],
  bundleItems: [],
  step: 1,
};
