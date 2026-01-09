# QuickBite | Next-Gen Food Kiosk Interface

A production-ready, touch-first self-service kiosk and mobile ordering application. This project demonstrates advanced React patterns, high-performance animations, and rigorous responsive design.

### 🚀 [**View Live Demo**](https://quickbite-kiosk.vercel.app/)

## ✨ High-Performance Features
- **Kiosk-Optimized UX:** Engineered for large-scale touch targets, zero-hover dependency, and high-contrast visual hierarchy.
- **Fluid Motion Design:** Utilizes `Framer Motion` for staggered grid entrance, layout transitions, and interactive feedback loops.
- **Mobile Safe-Area Aware:** Implements `env(safe-area-inset)` logic to ensure 100% compatibility with modern notches and gesture bars.
- **State & Persistence:** Robust cart logic with `useCallback` optimization and `LocalStorage` data synchronization.
- **A11y Compliant:** Semantic HTML, ARIA labels, and focus-trap management for inclusive design.

## 🛠️ Tech Stack
- **Library:** React 18
- **Styling:** Tailwind CSS (Utility-first, Mobile-first)
- **Animation:** Framer Motion
- **Icons:** Lucide React
- **Deployment:** Vercel

## 📸 Preview
<img width="100%" alt="QuickBite Kiosk Interface Preview" src="https://github.com/user-attachments/assets/ac8ea3dc-6ced-473e-a9ec-1888acc8bf68" />

## 🧠 Engineering Challenges
### 1. Kiosk-First Layout Stability
Used `min-h-[100svh]` and strict overflow management to prevent the "jumpy" UI often caused by mobile browser address bars, ensuring a stable, app-like experience.

### 2. Gesture-Safe Navigation
Navigating the "Safe Area" challenges of modern smartphones by implementing dynamic padding that respects system-level gesture bars and notches.

### 3. State Synchronization
Managed a persistent cart state that remains consistent across page refreshes while ensuring memoized handlers (`useCallback`) prevent unnecessary re-renders in a high-density menu grid.

## 💻 Run Locally

```bash
# 1. Clone the repository
git clone [https://github.com/Muhammad-Zakriya-16721/quickbite-kiosk.git](https://github.com/Muhammad-Zakriya-16721/quickbite-kiosk.git)

# 2. Enter the directory
cd quickbite-kiosk

# 3. Install dependencies
npm install

# 4. Start the development server
npm run dev
