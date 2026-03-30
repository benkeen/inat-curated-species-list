import React from 'react';
import { createRoot } from 'react-dom/client';
import { CuratedSpeciesTable, CuratedSpeciesTableProps } from '@ecophilia/inat-curated-species-list-ui';

// expose an initialization method on the window object
window.initInatCuratedSpeciesList = (domElementId: string, config: CuratedSpeciesTableProps) => {
  const domNode = document.getElementById(domElementId);
  const root = createRoot(domNode);
  root.render(<CuratedSpeciesTable {...config} />);
};
