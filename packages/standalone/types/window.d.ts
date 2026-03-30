import { CuratedSpeciesTableProps } from '@ecophilia/inat-curated-species-list-ui';

declare global {
  interface Window {
    initInatCuratedSpeciesList: (domElementId: string, config: CuratedSpeciesTableProps) => void;
  }
}
