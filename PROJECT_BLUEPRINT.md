# QuickBite Kiosk - Project Blueprint

## Project Identity
- **Name:** QuickBite Kiosk
- **Type:** Self-Ordering Restaurant POS (Next.js 15 + Supabase)
- **Core Goal:** A McDonald's-style touch interface with real-time kitchen updates.

## Tech Stack Definition
- **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS v4.
- **Backend:** Supabase (PostgreSQL, Realtime subscriptions).
- **State Management:** URL Search Params + Local Context (for Cart).
- **Payments:** Stripe (Test Mode).

## Database Schema (Supabase)

### Table: `products`
| Column | Type |
| :--- | :--- |
| `id` | `int` |
| `name` | `text` |
| `price` | `numeric` |
| `category` | `text` |
| `image_url` | `text` |
| `is_available` | `bool` |

### Table: `orders`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `int` | Unique identifier |
| `items` | `JSONB array` | Array of cart items |
| `total_price` | `numeric` | Total cost |
| `status` | `text` | 'pending', 'cooking', 'completed' |
| `created_at` | `timestamp` | Creation timestamp |

## Critical Logic
- **Kitchen View:** Must listen to `orders` table changes in real-time.
- **Kiosk View:** Auto-redirects to "Welcome" screen 30 seconds after payment.

## Environment Variables Required
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
