module.exports = function(site, runTask) {
  const fs = require('fs-extra');
  const chokidar = require('chokidar');
  const {
    STATIC,
    PAGES,
    LAYOUTS,
    DATA,
    POSTS
  } = require('./constants');

  let logger = site.getLogger();
  logger.watch('Watching for changes');

  let watchOptions = {
    ignored: /(^|[/\\])\../,
    ignoreInitial: true
  };

  let postsWatcher = chokidar.watch([
    `${POSTS}/**/*md`,
    `${POSTS}/**/*html`
  ], watchOptions);

  postsWatcher.on('all', async(event, path) => {
    await site.handlePostChange(event, path);
    // Need to further refine this to only rebuild changed files
    runTask([[
      'generatePostsFromMarkdown',
      'generatePages',
      'generatePagesForTags'
    ]], site, { event, path });
  });

  let dataWatcher = chokidar.watch([
    `${DATA}/*yml`,
    `${DATA}/*yaml`,
    `${DATA}/*js`,
    `${DATA}/*json`
  ], watchOptions);

  dataWatcher.on('all', (event, path) => {
    if (event === 'add') {
      let size = fs.statSync(path).size;
      if (size === 0) {
        return;
      }
    }

    site.loadData();

    // Need to further refine this to only rebuild changed files
    runTask([[
      'generatePostsFromMarkdown',
      'generatePages',
      'generatePagesForTags'
    ]], site);
  })

  let layoutsWatcher = chokidar.watch(`${LAYOUTS}/*html`, watchOptions);

  layoutsWatcher.on('all', () => {
    // Need to further refine this to only rebuild changed files
    runTask([[
      'generatePostsFromMarkdown',
      'generatePages',
      'generatePagesForTags'
    ]], site);
  });

  let pagesWatcher = chokidar.watch(`${PAGES}/*html`, watchOptions);

  pagesWatcher.on('all', (event, path) => {
    // Need to further refine this to only rebuild changed files
    runTask('generatePages', site, { event, path });
  });

  let majorAssetsWatcher = chokidar.watch([`${STATIC}/css/**/*css`, `${STATIC}/js/**/*js`], watchOptions);

  majorAssetsWatcher.on('all', async(event, path) => {
    runTask('copyMajorStaticAssets', site, { event, path });
  });

  let minorAssetsWatcher = chokidar.watch(`${STATIC}/!(js|css)/**/*`, watchOptions);

  minorAssetsWatcher.on('all', async(event, path) => {
    runTask('copyMinorStaticAssets', site, { event, path });
  });
}
