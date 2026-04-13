export type BaselineDataObj = {
  [taxonId: string]: {
    readonly name: string;
    readonly isActive: boolean;
    readonly researchGradeReviewCount?: number;
    readonly totalObservationCount?: number;
    readonly curatorReviewCount?: number;
    readonly publicNotes?: string;
    readonly privateNotes?: string;
    readonly taxonomy?: Record<string, string>;
  };
};

export type SortCol = 'id' | 'name' | 'isActive' | 'researchGradeReviewCount' | 'curatorReviewCount' | 'notes';
export type SortDir = 'asc' | 'desc';
