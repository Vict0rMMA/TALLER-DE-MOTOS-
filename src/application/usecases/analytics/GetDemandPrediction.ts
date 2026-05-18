import { runDemandPrediction } from '../../../infrastructure/jobs/demandPredictionJob';

export class GetDemandPrediction {
  async execute(workshopId: string): Promise<void> {
    return runDemandPrediction(workshopId);
  }
}
