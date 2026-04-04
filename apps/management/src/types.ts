export type BaselineSpeciesInatData = {
  readonly id: number;
  readonly name: string;
  readonly isActive: boolean;
  readonly researchGradeReviewCount?: number;
  readonly totalObservationCount?: number;
  readonly curatorReviewCount?: number;
  readonly publicNotes?: string;
  readonly privateNotes?: string;
};

export type BaselineDataFileContent = {
  data: BaselineSpeciesInatData[];
  validationDate: string;
};

export type MainSettings = {
  readonly curators: string;
  readonly taxonId?: number | null;
  readonly placeId?: number | null;
  readonly omitObservationsByUsers?: string;
  readonly baselineCompletionDate?: string;
};

export type RegionSpecies = {
  [taxonId: string]: {
    count: number;
    isActive: boolean;
  };
};

export type MessageType = 'success' | 'error' | 'info';
