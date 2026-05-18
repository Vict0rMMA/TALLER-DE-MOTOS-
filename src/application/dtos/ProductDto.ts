import { Product } from '../../domain/entities/Product';

export const toProductResponse = (p: Product) => ({
  id: p.id,
  workshopId: p.workshopId,
  sku: p.sku,
  name: p.name,
  brand: p.brand,
  category: p.category,
  compatibility: p.compatibility,
  stock: p.stock,
  stockMin: p.stockMin,
  isLowStock: p.stock <= p.stockMin,
  cost: p.cost,
  price: p.price,
  margin: p.cost > 0 ? Math.round(((p.price - p.cost) / p.cost) * 100) : 0,
  barcode: p.barcode,
  active: p.active,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
});
