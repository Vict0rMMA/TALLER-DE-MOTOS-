export const STOCK_MOVEMENT_TYPES = ['purchase', 'sale', 'adjustment', 'return', 'waste'] as const;
export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number];

export type StockMovement = {
  id: string;
  productId: string;
  userId: string;
  type: StockMovementType;
  quantity: number;
  reason?: string;
  createdAt: Date;
};
