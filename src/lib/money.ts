export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
};

export const toCents = (price: number): number => {
  return Math.round(price * 100);
};

export const fromCents = (cents: number): number => {
  return cents / 100;
};
