export interface Modifier {
  id: string;
  name: string;
  price: number;
}

export interface ModifierOption {
  name: string;
  price: number;
  id?: string;
}

export interface ModifierGroup {
  name: string;
  options: ModifierOption[];
  allow_multiselect?: boolean;
}

export const MODIFIERS: Record<string, Modifier[]> = {
  burgers: [
    { id: "extra_cheese", name: "Extra Cheese", price: 1.0 },
    { id: "bacon", name: "Add Bacon", price: 1.5 },
    { id: "no_onion", name: "No Onions", price: 0.0 },
    { id: "no_pickles", name: "No Pickles", price: 0.0 },
    { id: "spicy_sauce", name: "Extra Spicy Sauce", price: 0.5 },
  ],
  pizza: [
    { id: "extra_cheese", name: "Extra Mozzarella", price: 2.0 },
    { id: "pepperoni", name: "Add Pepperoni", price: 1.5 },
    { id: "mushrooms", name: "Add Mushrooms", price: 1.0 },
    { id: "olives", name: "Add Olives", price: 1.0 },
    { id: "thin_crust", name: "Thin Crust", price: 0.0 },
  ],
  drinks: [
    { id: "large", name: "Large Size", price: 0.5 },
    { id: "no_ice", name: "No Ice", price: 0.0 },
    { id: "extra_sugar", name: "Extra Sugar", price: 0.0 },
    { id: "almond_milk", name: "Almond Milk", price: 1.0 },
    { id: "oat_milk", name: "Oat Milk", price: 1.0 },
  ],
  wraps: [
    { id: "extra_meat", name: "Extra Meat", price: 2.0 },
    { id: "avocado", name: "Add Avocado", price: 1.5 },
    { id: "spicy", name: "Make it Spicy", price: 0.0 },
  ],
  dessert: [
    { id: "choc_sauce", name: "Chocolate Sauce", price: 0.5 },
    { id: "nuts", name: "Add Nuts", price: 0.5 },
    { id: "whipped_cream", name: "Whipped Cream", price: 0.5 },
  ],
  popular: [{ id: "extra_sauce", name: "Extra Sauce", price: 0.5 }],
};

export const getModifiersForCategory = (category: string): Modifier[] => {
  if (!category) return [];
  const normalizedCategory = category.toLowerCase();
  return MODIFIERS[normalizedCategory] || [];
};
