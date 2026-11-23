## @ecophilia/inat-curated-species-list-ui

This package contains the UI components for the inat-curated-species-list script.

The checklist's Species tab offers Table and Tree views. The filter applies to both;
the Tree view shows a left-to-right hierarchy with independently expandable taxonomic
groups and species counts. Scroll to explore larger trees. Missing ranks are grouped
as unclassified. Species options menus include **View on iNaturalist**, opening
their curated observations in a new tab; species labels themselves are not links.
Filtering reveals the ancestors of matching ranks or species and highlights matches,
without opening all descendants of a matching group. Clearing the filter restores
the branches opened before searching.

`TaxonomyTree` is also exported separately. It accepts expanded `CuratedSpeciesData`,
the ordered `taxons` ranks, `curatorUsernames`, `placeId`, and an optional
`showReviewerCount` flag. The optional `filter` prop reveals and highlights matching
nodes in the supplied data; the checklist supplies its already-filtered species.

Each taxon's options menu offers **Pin taxon** (make it the visible root) and
**Hide siblings** (hide other taxa under the same parent). Use **Unpin taxon**,
**Show siblings**, or **Show all siblings** to restore context. Pinning opens the
selected group without changing the open/closed state of its descendants.

The shared checklist stores its filter, Table/Tree selection, selected tab, open
branches (including search-time expansion), pinned taxon, and hidden siblings in the
URL hash's `icsl` parameter. Copy the URL to bookmark the current view. Management
also stores whether the checklist modal is open and reopens it when that URL loads.
Other hash parameters are preserved. Changes replace the current history entry so
typing does not flood browser history; loading another hash or navigating Back/Forward
restores its state. Invalid bookmarks display an error. If a pinned taxon is absent
from the current dataset or filter, unpin it or clear the filter.

`useChecklistLocation` is exported for hosts that need to coordinate with the
checklist (for example to open a modal). A page's checklist instances share this
URL state.
