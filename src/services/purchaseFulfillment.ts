import type { Purchase } from "expo-iap";

import { PACK_CREDITS } from "../constants/billing";

export function purchaseTransactionId(purchase: Purchase): string {
  return purchase.transactionId || purchase.id;
}

export function isReadyPurchase(purchase: Purchase): boolean {
  return purchase.purchaseState === "purchased";
}

export function packCreditAmount(
  productId: string,
  quantity: number,
): number | null {
  const unit = PACK_CREDITS[productId];
  if (!unit) {
    return null;
  }

  const count = Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1;
  return unit * count;
}
