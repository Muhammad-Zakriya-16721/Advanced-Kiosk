export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: "burgers" | "pizza" | "drinks" | "popular" | string;
  image: string;
  popular: boolean;
}

export const menuItems: MenuItem[] = [
  // --- BURGERS ---
  {
    id: 101,
    name: "Double Cheddar Stack",
    description: "Two flame-grilled beef patties, melted sharp cheddar, pickles, and our signature smoky sauce.",
    price: 12.99,
    category: "burgers",
    image: "https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=800",
    popular: true,
  },
  {
    id: 102,
    name: "Spicy Jalapeño Crunch",
    description: "Crispy chicken breast topped with fresh jalapeños, pepper jack cheese, and chipotle mayo.",
    price: 10.49,
    category: "burgers",
    image: "https://images.pexels.com/photos/2983101/pexels-photo-2983101.jpeg?auto=compress&cs=tinysrgb&w=800",
    popular: false,
  },
  {
    id: 103,
    name: "Mushroom Swiss Melt",
    description: "Sautéed mushrooms, caramelized onions, and swiss cheese on a brioche bun.",
    price: 11.99,
    category: "burgers",
    image: "https://images.pexels.com/photos/1251198/pexels-photo-1251198.jpeg?auto=compress&cs=tinysrgb&w=800",
    popular: false,
  },

  // --- PIZZA ---
  {
    id: 201,
    name: "Pepperoni Feast",
    description: "Double pepperoni, mozzarella, and san marzano tomato sauce.",
    price: 14.99,
    category: "pizza",
    image: "https://images.pexels.com/photos/367915/pexels-photo-367915.jpeg?auto=compress&cs=tinysrgb&w=800",
    popular: true,
  },
  {
    id: 202,
    name: "Veggie Supreme",
    description: "Bell peppers, onions, olives, mushrooms, and cherry tomatoes.",
    price: 13.49,
    category: "pizza",
    image: "https://images.pexels.com/photos/2619970/pexels-photo-2619970.jpeg?auto=compress&cs=tinysrgb&w=800",
    popular: false,
  },

  // --- DRINKS ---
  {
    id: 301,
    name: "Berry Blast Smoothie",
    description: "Strawberries, blueberries, raspberries, and greek yogurt.",
    price: 5.99,
    category: "drinks",
    image: "https://images.pexels.com/photos/2103949/pexels-photo-2103949.jpeg?auto=compress&cs=tinysrgb&w=800",
    popular: true,
  },
  {
    id: 302,
    name: "Iced Caramel Macchiato",
    description: "Freshly brewed espresso with vanilla syrup, milk, and caramel drizzle.",
    price: 4.49,
    category: "drinks",
    image: "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800",
    popular: false,
  }
];