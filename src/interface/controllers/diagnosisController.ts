import { Request, Response, NextFunction } from 'express';
import { PrismaDiagnosisRepository } from '../../infrastructure/repositories/PrismaDiagnosisRepository';
import { PrismaMotorcycleRepository } from '../../infrastructure/repositories/PrismaMotorcycleRepository';
import { GroqAIService } from '../../infrastructure/ai/GroqAIService';
import { GeminiAIService } from '../../infrastructure/ai/GeminiAIService';
import { RunDiagnosis } from '../../application/usecases/diagnosis/RunDiagnosis';
import { GetDiagnosisHistory } from '../../application/usecases/diagnosis/GetDiagnosisHistory';
import { env } from '../../infrastructure/config/env';
import { DomainError } from '../../domain/errors/DomainError';

const diagnosisRepo = new PrismaDiagnosisRepository();
const motorcycleRepo = new PrismaMotorcycleRepository();

const getAIService = () => {
  if (env.GROQ_API_KEY) return new GroqAIService();
  if (env.GEMINI_API_KEY) return new GeminiAIService();
  throw new DomainError(
    'IA no configurada. Agrega GROQ_API_KEY o GEMINI_API_KEY en el archivo .env del servidor.',
    503,
  );
};

export const getDiagnosisStatus = async (_req: Request, res: Response) => {
  const provider = env.GROQ_API_KEY ? 'groq' : env.GEMINI_API_KEY ? 'gemini' : null;
  res.json({
    configured: Boolean(provider),
    provider,
    model: provider === 'groq' ? 'llama-3.3-70b-versatile' : provider === 'gemini' ? 'gemini-1.5-flash' : null,
  });
};

export const listDiagnosis = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Number(req.query.limit ?? 20);
    const data = await diagnosisRepo.findByWorkshop(req.workshopId!, limit);
    res.json({ data, pagination: { total: data.length } });
  } catch (e) {
    next(e);
  }
};

export const runDiagnosis = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await new RunDiagnosis(diagnosisRepo, motorcycleRepo, getAIService()).execute({
      ...req.body,
      workshopId: req.workshopId!,
    });
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
};

export const getDiagnosisHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(
      await new GetDiagnosisHistory(diagnosisRepo, motorcycleRepo).execute(
        req.params.motorcycleId as string,
      ),
    );
  } catch (e) {
    next(e);
  }
};
