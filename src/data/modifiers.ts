export interface Modifier {
  id: string;
  name: string;
  price: number;
}

export const MODIFIERS: Record<string, Modifier[]> = {
  burgers: [
    { id: "extra_cheese", name: "Extra Cheese", price: 1.00 },
    { id: "bacon", name: "Add Bacon", price: 1.50 },
    { id: "no_onion", name: "No Onions", price: 0.00 },
    { id: "no_pickles", name: "No Pickles", price: 0.00 },
    { id: "spicy_sauce", name: "Extra Spicy Sauce", price: 0.50 },
  ],
  pizza: [
    { id: "extra_cheese", name: "Extra Mozzarella", price: 2.00 },
    { id: "pepperoni", name: "Add Pepperoni", price: 1.50 },
    { id: "mushrooms", name: "Add Mushrooms", price: 1.00 },
    { id: "olives", name: "Add Olives", price: 1.00 },
    { id: "thin_crust", name: "Thin Crust", price: 0.00 },
  ],
  drinks: [
    { id: "large", name: "Large Size", price: 0.50 },
    { id: "no_ice", name: "No Ice", price: 0.00 },
    { id: "extra_sugar", name: "Extra Sugar", price: 0.00 },
    { id: "almond_milk", name: "Almond Milk", price: 1.00 },
    { id: "oat_milk", name: "Oat Milk", price: 1.00 },
  ],
  wraps: [
    { id: "extra_meat", name: "Extra Meat", price: 2.00 },
    { id: "avocado", name: "Add Avocado", price: 1.50 },
    { id: "spicy", name: "Make it Spicy", price: 0.00 },
  ],
  dessert: [
    { id: "choc_sauce", name: "Chocolate Sauce", price: 0.50 },
    { id: "nuts", name: "Add Nuts", price: 0.50 },
    { id: "whipped_cream", name: "Whipped Cream", price: 0.50 },
  ],
  popular: [
    { id: "extra_sauce", name: "Extra Sauce", price: 0.50 },
  ]
};

export const getModifiersForCategory = (category: string): Modifier[] => {
  if (!category) return [];
  const normalizedCategory = category.toLowerCase();
  return MODIFIERS[normalizedCategory] || [];
};
