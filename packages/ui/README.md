## @ecophilia/inat-curated-species-list-ui

This package contains the UI components for the inat-curated-species-list script.

The checklist's Species tab offers Table and Tree views. The filter applies to both;
the Tree view shows a left-to-right hierarchy with independently expandable taxonomic
groups and species counts. Scroll to explore larger trees. Missing ranks are grouped
under a gray em dash. Species options menus include **View on iNaturalist**, opening
their curated observations in a new tab; species labels themselves are not links.
All tree menus include **View on iNaturalist**. Higher ranks, including the root,
link to their taxon page when the generated file provides ID metadata; the option
is disabled for missing ranks and older files without IDs. Regenerate the checklist
from existing downloaded packets to populate IDs without new API requests.
Collapsed taxa and species occupy the same compact row: 28px nodes with a 4px
vertical gap. Expanded branches occupy the combined rows of their visible
descendants, with parents centered over that space. Unexpanded siblings remain
compact at every rank.
A sticky header labels each visible rank column and stays in view while scrolling
vertically. Dotted vertical separators distinguish columns; headers scroll
horizontally with their corresponding nodes, including when a taxon is pinned.
Each rank uses a coordinated color for its column tint, header, nodes, count chips,
and incoming connectors. Colors stay consistent when pinning a branch, and search
matches retain a distinct gold highlight. Missing-rank dashes stay gray.
Expanding, collapsing, and hiding siblings use a coordinated 220ms slide/fade
with moving connectors; pinning crossfades between hierarchies. Rapid actions
redirect the current transition, and reduced-motion preferences disable animation.
Filtering reveals the ancestors of matching ranks or species and highlights matches,
without opening all descendants of a matching group. Clearing the filter restores
the branches opened before searching.

`TaxonomyTree` is also exported separately. It accepts expanded `CuratedSpeciesData`,
the ordered `taxons` ranks, `curatorUsernames`, `placeId`, and an optional
`showReviewerCount` flag. An optional `rootTaxon` prop supplies the root ID, name,
and rank (otherwise inferred from expanded records, or labeled "All species" for
legacy data). The optional `filter` prop reveals and highlights matching
nodes in the supplied data; the checklist supplies its already-filtered species.

Each taxon's options menu offers **Pin taxon** (make it the visible root) and
**Hide siblings** (hide other taxa under the same parent). Use **Unpin taxon**,
**Show siblings**, or **Show all siblings** in the dropdown to restore context,
without an extra controls row shifting the tree. Recovery actions also appear in
warnings when a selected taxon is absent from the results. Pinning opens the
selected group without changing the open/closed state of its descendants.
Non-species menus, including the root, also offer **Expand all descendants** to
open every group in that branch through to species. Hidden siblings remain hidden;
the expansion is bookmarkable and, during filtering, applies to the filtered
results without changing the unfiltered expansion state.

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
