export interface Modifier {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  id: string | number;
  cartId?: string; // unique ID for cart instance (handling same item, different mods)
  name: string;
  price: number | string; // Codebase seems to mix string/number, better to normalize, but keeping flexibility for now
  image?: string;
  quantity: number;
  selectedModifiers?: Modifier[];
  // Add other potential product fields that might be passed through
  category?: string;
  description?: string;
}
