export type Taxon =
  | 'kingdom'
  | 'phylum'
  | 'subphylum'
  | 'class'
  | 'subclass'
  | 'order'
  | 'superfamily'
  | 'family'
  | 'subfamily'
  | 'tribe'
  | 'subtribe'
  | 'genus'
  | 'subgenus'
  | 'section'
  | 'species';

export type CuratedSpeciesData = {
  [taxonId: string]: {
    data: TaxonomyMap;
    count: number;
  };
};

export type TaxonomyMap = {
  [rank in Taxon]: string;
};

export type CuratedSpeciesArrayItem = {
  data: TaxonomyMap;
  count: number;
  taxonId: string;
};

export type TaxonMinificationDataMap = Partial<Record<string, string>>;

export type CuratedSpeciesDataMinified = {
  taxonMap: TaxonMinificationDataMap;
  taxonData: {
    [taxonName: string]: string;
  };
  taxons: Taxon[];
  dateGenerated: string;
  '@ecophilia/inat-curated-species-list-tools': string;
};
