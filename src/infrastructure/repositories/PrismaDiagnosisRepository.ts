import prisma from '../prisma/client';
import { DiagnosisSession } from '../../domain/entities/DiagnosisSession';
import { DiagnosisRepository } from '../../domain/repositories/DiagnosisRepository';

export class PrismaDiagnosisRepository implements DiagnosisRepository {
  async findById(id: string): Promise<DiagnosisSession | null> {
    const r = await (prisma as any).diagnosisSession.findUnique({ where: { id } });
    return r ? this.toDomain(r) : null;
  }

  async findByWorkshop(workshopId: string, limit = 20): Promise<DiagnosisSession[]> {
    const rows = await (prisma as any).diagnosisSession.findMany({
      where: { workshopId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map((r: any) => this.toDomain(r));
  }

  async findByMotorcycle(motorcycleId: string): Promise<DiagnosisSession[]> {
    const rows = await (prisma as any).diagnosisSession.findMany({
      where: { motorcycleId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r: any) => this.toDomain(r));
  }

  async create(data: Omit<DiagnosisSession, 'id' | 'createdAt'>): Promise<DiagnosisSession> {
    const r = await (prisma as any).diagnosisSession.create({ data });
    return this.toDomain(r);
  }

  private toDomain(r: any): DiagnosisSession {
    return {
      id: r.id,
      workshopId: r.workshopId,
      motorcycleId: r.motorcycleId ?? undefined,
      symptoms: r.symptoms ?? [],
      diagnosis: r.diagnosis,
      urgency: r.urgency,
      confidence: r.confidence,
      aiModel: r.aiModel,
      createdAt: r.createdAt,
    };
  }
}
