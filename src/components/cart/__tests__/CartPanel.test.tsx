import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CartPanel from "../CartPanel";
import { CartItem } from "@/types/cart";
import * as cartStore from "@/store/cartStore";

// Mock Lucide icons
vi.mock("lucide-react", () => ({
  Trash2: () => <span data-testid="icon-trash" />,
  Plus: () => <span data-testid="icon-plus" />,
  Minus: () => <span data-testid="icon-minus" />,
  ShoppingBag: () => <span data-testid="icon-bag" />,
  ArrowRight: () => <span data-testid="icon-arrow" />,
  Pencil: () => <span data-testid="icon-pencil" />,
}));

// Mock Framer Motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    aside: ({ children, ...props }: any) => (
      <aside {...props}>{children}</aside>
    ),
    img: ({ children, ...props }: any) => <img {...props} />,
    button: ({ children, ...props }: any) => (
      <button {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  LayoutGroup: ({ children }: any) => <>{children}</>,
  useAnimation: () => ({ start: vi.fn() }),
  useReducedMotion: () => false,
}));

// Mock Store
const updateQuantityMock = vi.fn();
const clearCartMock = vi.fn();
const setClearConfirmingMock = vi.fn();

vi.mock("@/store/cartStore", () => ({
  useCartStore: vi.fn(),
}));

describe("CartPanel Component", () => {
  const mockProps = {
    onCheckout: vi.fn(),
    orderNo: "123",
    isKeyboardEnabled: false,
    isFocusedSection: false,
    focusedIndex: 0,
    onManualFocus: vi.fn(),
    onEdit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders empty state correctly", () => {
    (cartStore.useCartStore as any).mockReturnValue({
      cart: [],
      updateQuantity: updateQuantityMock,
      isClearConfirming: false,
      setClearConfirming: setClearConfirmingMock,
      clearCart: clearCartMock,
    });

    render(<CartPanel {...mockProps} />);
    expect(screen.getByText(/Your tray is empty/i)).toBeInTheDocument();
  });

  it("renders items and calculates totals correctly", () => {
    const items: CartItem[] = [
      { id: "1", name: "Burger", price: 10, quantity: 2, image: "test.jpg" },
      { id: "2", name: "Fries", price: 5, quantity: 1, image: "fries.jpg" },
    ];

    (cartStore.useCartStore as any).mockReturnValue({
      cart: items,
      updateQuantity: updateQuantityMock,
      isClearConfirming: false,
      setClearConfirming: setClearConfirmingMock,
      clearCart: clearCartMock,
    });

    render(<CartPanel {...mockProps} />);

    expect(screen.getByText("Burger")).toBeInTheDocument();
    expect(screen.getByText("Fries")).toBeInTheDocument();

    // Check Total: (20 + 5) * 1.1 = 27.5
    expect(screen.getByText("$27.50")).toBeInTheDocument();
  });

  it("calls updateQuantity on plus/minus click", () => {
    const items: CartItem[] = [
      { id: "1", name: "Burger", price: 10, quantity: 1 },
    ];

    (cartStore.useCartStore as any).mockReturnValue({
      cart: items,
      updateQuantity: updateQuantityMock,
      isClearConfirming: false,
      setClearConfirming: setClearConfirmingMock,
      clearCart: clearCartMock,
    });

    render(<CartPanel {...mockProps} />);

    const plusBtn = screen.getByLabelText("Increase quantity");
    fireEvent.click(plusBtn);
    expect(updateQuantityMock).toHaveBeenCalledWith("1", 1); // Mock uses '1' as id if no cartId
  });
});
