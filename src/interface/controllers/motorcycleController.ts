import { Request, Response, NextFunction } from 'express';
import { PrismaMotorcycleRepository } from '../../infrastructure/repositories/PrismaMotorcycleRepository';
import { PrismaCustomerRepository } from '../../infrastructure/repositories/PrismaCustomerRepository';
import { PrismaServiceRepository } from '../../infrastructure/repositories/PrismaServiceRepository';
import { CreateMotorcycle } from '../../application/usecases/motorcycles/CreateMotorcycle';
import { UpdateMotorcycle } from '../../application/usecases/motorcycles/UpdateMotorcycle';
import { GetMotorcyclesByCustomer } from '../../application/usecases/motorcycles/GetMotorcyclesByCustomer';
import { GetMotorcycleHistory } from '../../application/usecases/motorcycles/GetMotorcycleHistory';

const motorcycleRepo = new PrismaMotorcycleRepository();
const customerRepo = new PrismaCustomerRepository();
const serviceRepo = new PrismaServiceRepository();

export const getByCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await new GetMotorcyclesByCustomer(motorcycleRepo, customerRepo).execute(
      String(req.params.customerId),
      req.workshopId!,
    );
    res.json({ data: result.motorcycles, pagination: { total: result.motorcycles.length } });
  } catch (e) {
    next(e);
  }
};

export const getHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await new GetMotorcycleHistory(motorcycleRepo, serviceRepo).execute(String(req.params.id)));
  } catch (e) {
    next(e);
  }
};

export const createMotorcycle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await new CreateMotorcycle(motorcycleRepo, customerRepo).execute({
      ...req.body,
      workshopId: req.workshopId!,
    });
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
};

export const updateMotorcycle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(
      await new UpdateMotorcycle(motorcycleRepo).execute({
        id: String(req.params.id),
        data: req.body,
      }),
    );
  } catch (e) {
    next(e);
  }
};
