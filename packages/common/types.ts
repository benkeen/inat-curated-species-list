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
    taxonIds?: Partial<Record<Taxon, number>>;
    rootTaxon?: RootTaxon;
  };
};

export type RootTaxon = { id: number; name: string; rank: Taxon };

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
  taxonIds?: Record<string, number>;
  rootTaxon?: RootTaxon;
  taxonMap: TaxonMinificationDataMap;
  taxonData: {
    [taxonName: string]: string;
  };
  taxons: Taxon[];
  dateGenerated: string;
  '@ecophilia/inat-curated-species-list-tools': string;
};
