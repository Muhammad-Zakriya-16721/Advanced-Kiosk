# QuickBite Kiosk 🍔🍟

A modern, high-performance self-service kiosk application built with Next.js, TypeScript, and Tailwind CSS. Designed for speed, accessibility, and a premium visual experience.

![Project Preview](/public/preview.png)

> **Note**: This is a Frontend-Only Portfolio Project using mock data. No backend server is required.

## ✨ Features

- **Client-side Filtering**: Real-time filtering, sorting, and search with instant feedback (Mock Data).
- **Visual Richness**: Glassmorphism UI, smooth Framer Motion animations, and responsive layouts.
- **Smart Cart**: Optimistic UI updates, modifier support (customizations), and localized cart retention.
- **Checkout UI Flow**:
  - Frontend-only Payment Simulation (with randomized 10% failure state).
- Secure Integer-based currency math.
- Tipping logic (10%, 15%, 20%).
- **Accessibility (A11y)**: Full keyboard navigation (Tab/Enter/Space), ARIA roles, and focus management.
- **Performance**: Optimized `next/image` usage, prioritized LCP loading, and code splitting.

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + CSS Variables
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Language**: TypeScript

## 🚀 Getting Started

1.  **Install Dependencies**:

    ```bash
    npm install
    ```

2.  **Run Development Server**:

    ```bash
    npm run dev
    ```

3.  **Open Kiosk**:
    Navigate to [http://localhost:3000](http://localhost:3000)

## 📂 Project Structure

- `src/app`: Page routes and layouts.
- `src/components`: Reusable UI components (Sidebar, MenuGrid, Modals).
- `src/hooks`: Custom logic hooks (`useMenuFilter`, `useKeyboardControls`).
- `src/lib`: Utilities (`money.ts` for safe math).
- `src/data`: Mock data for menus and modifiers.

## 🎨 Customization

- **Theme**: Toggle Dark/Light mode via Settings (Gear Icon).
- **Data**: Edit `src/data/menuItems.ts` to update the menu.

---

_Built for the Modern Food Service Industry._
