import { FC, useCallback, useState } from 'react';
import { SpeciesTab } from './SpeciesTab';
import { NewAdditionsTab } from './NewAdditionsTab';
import { TaxonChangesTab } from './TaxonChangesTab';
import { formatDate } from '../utils/helpers';
import { CuratedSpeciesDataMinified } from '@ecophilia/inat-curated-species-list-common';

export interface CuratedSpeciesTableProps {
  readonly speciesDataUrl: string;
  readonly curatorUsernames: string[];
  readonly placeId: number;
  readonly showLastGeneratedDate: boolean;
  readonly showRowNumbers?: boolean;
  readonly showReviewerCount?: boolean;
  readonly showNewAdditions?: boolean;
  readonly newAdditionsDataUrl?: string;
  readonly showTaxonChanges?: boolean;
  readonly taxonChangesDataUrl?: string;

  readonly tabText?: {
    readonly speciesTab?: any;
    readonly newAdditionsTab?: any;
    readonly taxonChangesTab?: any;
  };
}

export const CuratedSpeciesTable: FC<CuratedSpeciesTableProps> = ({
  speciesDataUrl,
  curatorUsernames,
  placeId,
  showLastGeneratedDate,
  showRowNumbers = true,
  showReviewerCount = false,
  showNewAdditions,
  newAdditionsDataUrl,
  showTaxonChanges,
  taxonChangesDataUrl,
  tabText = {},
}) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [lastGenerated, setLastGeneratedDate] = useState('');
  const hasNewAdditions = showNewAdditions && newAdditionsDataUrl;
  const hasTaxonChanges = showTaxonChanges && taxonChangesDataUrl;

  const onLoadSpeciesData = useCallback((data: CuratedSpeciesDataMinified) => {
    setLastGeneratedDate(formatDate(data.dateGenerated));
  }, []);

  const getTabs = () => {
    // if we're only showing curated species, don't show any tabs
    if (!hasNewAdditions && !hasTaxonChanges) {
      return null;
    }

    const speciesTabClass = tabIndex === 0 ? 'icsl-tab-selected' : '';
    const newAdditionsTabClass = tabIndex === 1 ? 'icsl-tab-selected' : '';
    const taxonChangesTabClass = tabIndex === 2 ? 'icsl-tab-selected' : '';

    return (
      <div style={{ position: 'relative' }}>
        {showLastGeneratedDate && lastGenerated && (
          <div className="icsl-last-generated-date">
            Last generated: <span>{lastGenerated}</span>
          </div>
        )}
        <ul className="icsl-tabs">
          <li className={speciesTabClass} onClick={() => setTabIndex(0)}>
            <button>Species</button>
          </li>
          {hasNewAdditions && (
            <li className={newAdditionsTabClass} onClick={() => setTabIndex(1)}>
              <button>New Additions</button>
            </li>
          )}
          {hasTaxonChanges && (
            <li className={taxonChangesTabClass} onClick={() => setTabIndex(2)}>
              <button>Taxon Changes</button>
            </li>
          )}
        </ul>
      </div>
    );
  };

  return (
    <>
      {getTabs()}

      <div style={{ display: tabIndex === 0 ? 'block' : 'none' }}>
        <SpeciesTab
          dataUrl={speciesDataUrl}
          onLoad={onLoadSpeciesData}
          curatorUsernames={curatorUsernames}
          placeId={placeId}
          showRowNumbers={showRowNumbers}
          showReviewerCount={showReviewerCount}
          tabText={tabText.speciesTab}
        />
      </div>

      {hasNewAdditions && (
        <div style={{ display: tabIndex === 1 ? 'block' : 'none' }}>
          <NewAdditionsTab dataUrl={newAdditionsDataUrl} showRowNumbers={showRowNumbers} />
        </div>
      )}

      {hasTaxonChanges && (
        <div style={{ display: tabIndex === 2 ? 'block' : 'none' }}>
          <TaxonChangesTab dataUrl={taxonChangesDataUrl} showRowNumbers={showRowNumbers} />
        </div>
      )}
    </>
  );
};
