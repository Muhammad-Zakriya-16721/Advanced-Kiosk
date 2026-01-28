import React from "react";
import { formatPrice } from "@/lib/money";

interface ReceiptItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  selectedModifiers?: { name: string; price: number }[];
}

interface DigitalReceiptProps {
  orderNumber: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  total: number;
  date: Date;
}

const DigitalReceipt = ({
  orderNumber,
  items,
  subtotal,
  tax,
  total,
  date,
}: DigitalReceiptProps) => {
  return (
    <div className="bg-white p-6 max-w-sm mx-auto shadow-lg md:shadow-none font-mono text-sm text-black">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-black uppercase tracking-widest mb-2">
          QuickBite
        </h1>
        <p className="text-xs text-gray-500 uppercase">
          123 Flavor Street
          <br />
          Food City, FC 90210
        </p>
        <p className="mt-4 text-xs text-gray-400">
          {date.toLocaleString("en-US", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        <p className="mt-1 font-bold text-lg">Order #{orderNumber}</p>
      </div>

      {/* Divider */}
      <div className="border-b-2 border-dashed border-gray-300 my-4" />

      {/* Items */}
      <div className="space-y-3 mb-4">
        {items.map((item, idx) => (
          <div key={`${item.id}-${idx}`}>
            <div className="flex justify-between font-bold">
              <span>
                {item.quantity}x {item.name}
              </span>
              <span>{formatPrice(item.price * item.quantity)}</span>
            </div>
            {item.selectedModifiers && item.selectedModifiers.length > 0 && (
              <div className="pl-4 text-xs text-gray-500 mt-1">
                {item.selectedModifiers.map((mod, mIdx) => (
                  <div key={mIdx} className="flex justify-between">
                    <span>+ {mod.name}</span>
                    {mod.price > 0 && <span>{formatPrice(mod.price)}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="border-b-2 border-dashed border-gray-300 my-4" />

      {/* Totals */}
      <div className="space-y-2 mb-6">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Tax</span>
          <span>{formatPrice(tax)}</span>
        </div>
        <div className="flex justify-between text-xl font-black border-t-2 border-black pt-2 mt-2">
          <span>TOTAL</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center space-y-4">
        <div className="w-full h-16 bg-black/10 flex items-center justify-center font-bold text-xs tracking-widest uppercase">
          [ Barcode Area ]
        </div>
        <p className="text-xs font-bold">Thank you for dining with us!</p>
        <p className="text-[10px] text-gray-400">quickbite.com</p>
      </div>
    </div>
  );
};

export default DigitalReceipt;
