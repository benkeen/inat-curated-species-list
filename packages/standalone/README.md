## @ecophilia/inat-curated-species-list-standalone

This package contains a generated, minified version of the front-end JS code that you can add to your webpage and add the curated
checklist and related features (new additions, taxon changes). You'll need to have generated the data files and.

Once the data files have been generated and your site is showing it, you don't need to make any further changes. Just update the data
files on whatever frequency you think it suitable.

### How to add

1. First, add this to the `<head>` of your document (the body is fine, if adding it `head` is a problem).

<script src="/path/to/inat-curated-species-list-standalone.js"></script>

2. Anywhere after that, add the following:

```html
<div id="icsl"></div>
<script>
  window.initInatCuratedSpeciesList('icsl', {
    speciesDataUrl: 'path/to.species-data.json',
    curatorUsernames: ['reviewer1', 'reviewer2', 'reviewer3'],
    placeId: 123,
    showLastGeneratedDate: true,
    showRowNumbers: true,
    showNewAdditions: true,
    newAdditionsDataUrl: 'path/to/new-additions-data.json',
    showTaxonChanges: true,
    newAdditionsDataUrl: 'path/to/taxon-changes-data.json',
  });
</script>
```

Most of these settings will be familiar from the generation step, but here's a few more details:

- the div with ID `iscl` specifies where the content will be added to your webpage.
- The data files you generated can be stored on any public website. They don't need to be on your same site, but in most cases it's
  probably the most convenient place. You can link to them using either a full URL or a relative path. Once they're uploaded, a simple
  way to find the path is to experiment with the URL to

### Caching and the data files

Bear in mind that a plain JSON file being doled up by your server may have specific headers attached, telling user's browsers to cache
it for certain periods of time - or never! You may want to check the headers to make sure that after a data file update, the website
is updating right away - or within a reasonable period of time. If not, you may need to adjust your servers headers to send the appropriate
expiry information. If you don't have control over that, a quick solution is to upload data files with different names and update the config
listed above for the new filenames. That'll guarantee your users see the new content right away.
