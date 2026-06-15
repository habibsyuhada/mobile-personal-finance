// Smart insights: analisis personal on-device tanpa server.
// Pure functions: input data, output list of insight cards.

export type InsightPriority = 'low' | 'medium' | 'high';

export interface Insight {
  id: string;
  emoji: string;
  title: string;
  body: string;
  priority: InsightPriority;
}
