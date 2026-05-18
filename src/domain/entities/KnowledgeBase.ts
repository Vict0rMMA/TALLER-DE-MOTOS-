export type KnowledgeBase = {
  id: string;
  workshopId?: string;
  title: string;
  content: string;
  tags: string[];
  compatibleModels: string[];
  createdAt: Date;
};
