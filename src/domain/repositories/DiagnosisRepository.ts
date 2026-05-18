import { DiagnosisSession } from '../entities/DiagnosisSession';

export interface DiagnosisRepository {
  findById(id: string): Promise<DiagnosisSession | null>;
  findByWorkshop(workshopId: string, limit?: number): Promise<DiagnosisSession[]>;
  findByMotorcycle(motorcycleId: string): Promise<DiagnosisSession[]>;
  create(data: Omit<DiagnosisSession, 'id' | 'createdAt'>): Promise<DiagnosisSession>;
}
