export type Product = {
  id: string;
  workshopId: string;
  sku: string;
  name: string;
  brand?: string;
  category: string;
  compatibility: string[];
  stock: number;
  stockMin: number;
  cost: number;
  price: number;
  barcode?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};
