export type EmbeddingVector = number[];

export async function generateEmbedding(_text: string): Promise<EmbeddingVector> {
  throw new Error('Embeddings no implementados aún — FASE 2');
}

export async function searchSimilar(_embedding: EmbeddingVector, _limit = 5): Promise<string[]> {
  throw new Error('Búsqueda semántica no implementada aún — FASE 2');
}
