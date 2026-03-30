/**
 * Package exports:
 *
 * import { App, generateDataFiles } from '@ecophilia/inat-curated-species-list';
 *
 * - `App`:               the top-level app. This outputs two tabs, one for the full species list table and another
 *                        showing new additions to the list.
 * - `generateDataFiles`: the script command used for generating the data files.
 */
import { RefObject } from 'react';

export type AppProps = {
  readonly placeId: number;
  readonly taxonId: number;
  readonly curatorUsernames: string[];
  readonly dataUrl: string;
  readonly showSpeciesList: boolean;
  readonly showNewAdditions: boolean;
};

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

// not exhaustive. Just contains a couple of things we use from their data model
export type INatTaxonAncestor = {
  readonly rank: Taxon;
  readonly name: string;
};

export type INatApiObsRequestParams = {
  readonly place_id: number;
  readonly taxon_id: number;
  readonly order: string;
  readonly per_page: number;
  readonly order_by: 'id';
  readonly verifiable: 'any';
  readonly ident_user_id: string;
  id_above?: number;
};

export type TaxonomyMap = {
  [rank in Taxon]: string;
};

export type LogType = 'info' | 'error' | 'success';
export type LogRow = [string, string];
export type LoggerHandle = {
  addLogRow: (str: string, logType: LogType) => number;
  addLogRows: (arr: LogRow[]) => void;
  replaceLogRow: (rowId: number, str: string, logType: LogType) => void;
  clear: () => void;
};

export type CuratedSpeciesData = {
  [taxonId: string]: {
    data: TaxonomyMap;
    count: number;
  };
};

export type CuratedSpeciesTaxon = {
  data: TaxonomyMap;
  count: number;
  taxonId: string;
};

export type DownloadDataByPacket = {
  readonly curators: string;
  readonly placeId: number;
  readonly taxonId: number;
  readonly visibleTaxons: Taxon[];
  readonly packetNum: number;
  readonly logger: RefObject<LoggerHandle>;
  readonly onSuccess: (data: CuratedSpeciesData, newAdditions: any) => void;
  readonly onError: () => void;
  readonly logFormat: 'html' | 'text';
  readonly maxResults?: number;
};

export type GetDataPacketResponse = {
  readonly total_results: number;
  readonly results: [
    {
      id: number;

      // user info about who made the observation
      user: {
        login: string;
      };

      // the full taxonomy of the observation. This looks like it's the latest best reflection of the identifications made on the osb
      taxon: {
        rank: Taxon;
      };

      // an array of identifications made on this observation
      identifications: [
        {
          taxon_id: string;
          user: {
            login: string;
          };

          // this seems to indicate whether the user has overwritten it with a newer one, or maybe removed. Regardless: it's
          // needed to filter out dud identifications
          current: boolean;
          taxon: {
            name: string;
            rank: Taxon;
            ancestors: [];
          };
        },
      ];
    },
  ];
};
