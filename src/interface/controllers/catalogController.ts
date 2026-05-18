import { Request, Response, NextFunction } from 'express';
import prisma from '../../infrastructure/prisma/client';
import { DomainError } from '../../domain/errors/DomainError';

export const listCatalog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await prisma.repairCatalogItem.findMany({
      where: { workshopId: req.workshopId!, active: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
    res.json(items.map(toDto));
  } catch (e) { next(e); }
};

export const createCatalogItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, category, description, minPrice, maxPrice, keywords } = req.body;
    if (!name || !category || minPrice === undefined || maxPrice === undefined) {
      return next(new DomainError('name, category, minPrice y maxPrice son requeridos', 400));
    }
    const item = await prisma.repairCatalogItem.create({
      data: {
        workshopId: req.workshopId!,
        name,
        category,
        description: description ?? null,
        minPrice,
        maxPrice,
        keywords: keywords ?? [],
      },
    });
    res.status(201).json(toDto(item));
  } catch (e) { next(e); }
};

export const updateCatalogItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const existing = await prisma.repairCatalogItem.findFirst({ where: { id, workshopId: req.workshopId! } });
    if (!existing) return next(new DomainError('Item no encontrado', 404));

    const { name, category, description, minPrice, maxPrice, keywords, active } = req.body;
    const item = await prisma.repairCatalogItem.update({
      where: { id },
      data: { name, category, description, minPrice, maxPrice, keywords, active },
    });
    res.json(toDto(item));
  } catch (e) { next(e); }
};

export const deleteCatalogItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const existing = await prisma.repairCatalogItem.findFirst({ where: { id, workshopId: req.workshopId! } });
    if (!existing) return next(new DomainError('Item no encontrado', 404));
    await prisma.repairCatalogItem.update({ where: { id }, data: { active: false } });
    res.status(204).send();
  } catch (e) { next(e); }
};

function toDto(item: any) {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    description: item.description,
    minPrice: Number(item.minPrice),
    maxPrice: Number(item.maxPrice),
    keywords: item.keywords,
    active: item.active,
    createdAt: item.createdAt,
  };
}
