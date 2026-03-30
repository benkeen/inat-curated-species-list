'use client';

import { FC } from 'react';
import { CuratedSpeciesTable } from '@ecophilia/inat-curated-species-list-ui';
import config from '../../dev-generator/config';

const Page: FC = () => {
  return (
    <CuratedSpeciesTable
      speciesDataUrl={`./${config.speciesDataFilename}`}
      curatorUsernames={config.curators}
      placeId={config.placeId}
      showRowNumbers={true}
      showLastGeneratedDate={config.showLastGeneratedDate}
      showReviewerCount={false}
      showNewAdditions={config.trackNewAdditions || false}
      newAdditionsDataUrl={config.newAdditionsFilename ? `./${config.newAdditionsFilename}` : undefined}
      showTaxonChanges={config.trackTaxonChanges || false}
      taxonChangesDataUrl={config.taxonChangesFilename ? `./${config.taxonChangesFilename}` : undefined}
    />
  );
};

export default Page;
