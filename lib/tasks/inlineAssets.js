module.exports = async function(site) {
  const fs = require('fs-extra');
  const path = require('path');
  const { inlineSource } = require('inline-source');

  const matchGlob = require('../utils/matchGlob');
  const { BUILD, STATIC } = require('../utils/constants');

  try {
    let siteOptions = site.getConfig().inlineSource;
    if (!siteOptions) {
      return;
    }

    let message = 'Inlining Assets';
    let logger = site.getLogger();
    logger.time(message);

    let htmlFiles = matchGlob(`${BUILD}/**/*.html`);
    htmlFiles = htmlFiles.filter(file => !file.startsWith(`${BUILD}/${STATIC}`));

    let inlineSourceOptions = Object.assign({
      rootpath: path.resolve(BUILD),
      // ES6 code will cause build failures if this is set as true
      compress: false,
      fs
    }, siteOptions);

    let inlinePromises = [];
    for (let file of htmlFiles) {
      let html = inlineSource(file, inlineSourceOptions);
      inlinePromises.push(html);
    }

    let inlinedHtmlContents = await Promise.all(inlinePromises);
    for (let [index, inlinedHtml] of inlinedHtmlContents.entries()) {
      fs.writeFileSync(htmlFiles[index], inlinedHtml);
    }

    logger.timeEnd(message);
  } catch (error) {
    throw error;
  }
}
