import { Request, Response, NextFunction } from 'express';
import { PrismaProductRepository } from '../../infrastructure/repositories/PrismaProductRepository';
import { CreateProduct } from '../../application/usecases/inventory/CreateProduct';
import { UpdateProduct } from '../../application/usecases/inventory/UpdateProduct';
import { DeleteProduct } from '../../application/usecases/inventory/DeleteProduct';
import { GetProductById } from '../../application/usecases/inventory/GetProductById';
import { GetLowStockProducts } from '../../application/usecases/inventory/GetLowStockProducts';
import { RegisterStockMovement } from '../../application/usecases/inventory/RegisterStockMovement';
import { toProductResponse } from '../../application/dtos/ProductDto';
import prisma from '../../infrastructure/prisma/client';

const productRepo = new PrismaProductRepository();

function mapRow(r: any) {
  return toProductResponse({
    id: r.id,
    workshopId: r.workshopId,
    sku: r.sku,
    name: r.name,
    brand: r.brand ?? undefined,
    category: r.category,
    compatibility: r.compatibility ?? [],
    stock: r.stock,
    stockMin: r.stockMin,
    cost: Number(r.cost),
    price: Number(r.price),
    barcode: r.barcode ?? undefined,
    active: r.active,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  });
}

export const listProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = req.query as Record<string, string>;
    const workshopId = req.workshopId!;
    const page = Math.max(1, Number(q.page ?? 1));
    const limit = Math.min(100, Number(q.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: any = { workshopId, active: true };
    if (q.category) where.category = q.category;
    if (q.search) {
      where.OR = [
        { name: { contains: q.search, mode: 'insensitive' } },
        { sku: { contains: q.search, mode: 'insensitive' } },
        { brand: { contains: q.search, mode: 'insensitive' } },
      ];
    }

    const [rows, total] = await Promise.all([
      (prisma as any).product.findMany({ where, orderBy: { name: 'asc' }, skip, take: limit }),
      (prisma as any).product.count({ where }),
    ]);

    let data = rows.map(mapRow);

    if (q.lowStock === 'true') {
      data = data.filter((p: any) => p.isLowStock);
    }

    res.json({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (e) {
    next(e);
  }
};

export const getLowStock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await new GetLowStockProducts(productRepo).execute(req.workshopId!);
    res.json({ data: products.map(toProductResponse), pagination: { total: products.length } });
  } catch (e) {
    next(e);
  }
};

export const getProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await new GetProductById(productRepo).execute(String(req.params.id), req.workshopId!));
  } catch (e) {
    next(e);
  }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await new CreateProduct(productRepo).execute({ ...req.body, workshopId: req.workshopId! });
    res.status(201).json(toProductResponse(result));
  } catch (e) {
    next(e);
  }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await new UpdateProduct(productRepo).execute({
      id: String(req.params.id),
      workshopId: req.workshopId!,
      data: req.body,
    });
    res.json(toProductResponse(result));
  } catch (e) {
    next(e);
  }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await new DeleteProduct(productRepo).execute(String(req.params.id), req.workshopId!);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
};

export const registerMovement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await new RegisterStockMovement(productRepo).execute({
      ...req.body,
      workshopId: req.workshopId!,
      userId: req.userId!,
    });
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
};
