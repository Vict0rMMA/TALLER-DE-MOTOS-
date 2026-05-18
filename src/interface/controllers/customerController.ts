import { Request, Response, NextFunction } from 'express';
import { PrismaCustomerRepository } from '../../infrastructure/repositories/PrismaCustomerRepository';
import { CreateCustomer } from '../../application/usecases/customers/CreateCustomer';
import { UpdateCustomer } from '../../application/usecases/customers/UpdateCustomer';
import { GetCustomers } from '../../application/usecases/customers/GetCustomers';
import { GetCustomerById } from '../../application/usecases/customers/GetCustomerById';
import { SearchCustomers } from '../../application/usecases/customers/SearchCustomers';

const customerRepo = new PrismaCustomerRepository();

export const listCustomers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = req.query as Record<string, string>;
    const page = Math.max(1, Number(q.page ?? 1));
    const limit = Math.min(100, Number(q.limit ?? 50));

    if (q.search) {
      const data = await new SearchCustomers(customerRepo).execute(req.workshopId!, q.search);
      return res.json({ data, pagination: { page: 1, limit, total: data.length, totalPages: 1 } });
    }

    const result = await new GetCustomers(customerRepo).execute(req.workshopId!, page, limit);
    res.json({
      data: result.customers,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (e) {
    next(e);
  }
};

export const getCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await new GetCustomerById(customerRepo).execute(String(req.params.id), req.workshopId!));
  } catch (e) {
    next(e);
  }
};

export const createCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await new CreateCustomer(customerRepo).execute({
      ...req.body,
      workshopId: req.workshopId!,
    });
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
};

export const updateCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(
      await new UpdateCustomer(customerRepo).execute({
        id: String(req.params.id),
        workshopId: req.workshopId!,
        data: req.body,
      }),
    );
  } catch (e) {
    next(e);
  }
};
