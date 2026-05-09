export interface CaseScore {
  case: string;
  scores: Record<string, number>;
  notes?: string;
}

export interface Report {
  stage: string;
  total: { mean: number; n: number };
  cases: CaseScore[];
}
