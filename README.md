# QuickBite Kiosk

> A modern, high-performance self-service food ordering system built for speed, accuracy, and detailed kitchen management.

QuickBite Kiosk is a Next.js 16 application designed to streamline the ordering process in fast-casual restaurants. It features a customer-facing kiosk, a real-time Kitchen Display System (KDS), a customer order tracker, and a comprehensive admin dashboard.

## 🚀 Key Features

### 🖥️ Customer Kiosk

- **Interactive Menu**: Dynamic grid with filtering (Categories, Dietary Tags) and search.
- **Smart Customization**: Add modifiers (toppings, sauces) with real-time price updates.
- **AI Upselling**: Intelligent "Frequently Bought Together" suggestions to increase average order value.
- **Accessibility**: Full keyboard navigation support and accessible ARIA attributes.

### 🍳 Kitchen Display System (KDS)

- **Real-time Orders**: Instant updates via WebSockets (Supabase Realtime).
- **Smart Pacing**: "Anchor & Fire" logic to ensure all items in an order are ready simultaneously.
- **Station Management**: Route items to specific stations (Hot Line, Cold Station, etc.).
- **Staff Sessions**: Secure PIN-based login with attendance tracking.

### 📊 Admin Dashboard

- **Menu Management**: Full CRUD for products, modifiers, and availability toggle.
- **Analytics**: Real-time sales heatmaps, popular items, and revenue tracking.
- **Staff Manager**: Manage access codes and view active kitchen staff.
- **Inventory Control**: "Living Menu" that automatically disables items when out of stock.

### 📱 Waiter Companion App

- **Mobile Optimized**: Dedicated view for floor staff to take orders at the table.
- **Table Management**: Real-time status (Free, Busy, Paying).

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 + Framer Motion (Animations)
- **State Management**: Zustand (Global Store)
- **Database**: Supabase (PostgreSQL)
- **Realtime**: Supabase Realtime
- **Testing**: Vitest + React Testing Library

## 🏁 Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase project (for DB and Realtime)

### Installation

1.  **Clone the repository**

    ```bash
    git clone https://github.com/yourusername/quickbite-kiosk.git
    cd quickbite-kiosk
    ```

2.  **Install dependencies**

    ```bash
    npm install
    # or
    pnpm install
    ```

3.  **Environment Setup**
    Create a `.env.local` file in the root directory and add your Supabase credentials:

    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run the development server**

    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📂 Project Structure

```bash
src/
├── app/                  # Next.js App Router pages
│   ├── admin/            # Admin Dashboard (Protected)
│   ├── kitchen/          # Kitchen Display System
│   ├── tracker/          # Customer Order Status Screen
│   └── page.tsx          # Main Kiosk Interface
├── components/           # Reusable UI components
├── lib/                  # Core logic (Supabase, API, Auth)
├── store/                # Zustand state stores
└── types/                # TypeScript definitions
```

## 🔮 Future Roadmap

- [ ] **Gamified Waiting**: Browser games for customers while they wait.
- [ ] **Voice Announcements**: Audio callouts when orders are ready.
- [ ] **Multi-language Support**: i18n for diverse customer bases.

---

**Status**: v1.0 (Completed Jan 2026)
