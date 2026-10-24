/* devtemDesign builder: shared helpers (load before builder.js and projects.js) */
(function (w) {
  'use strict';

  var VERSION = '0.1.0';
  var BASE = 'https://cdn.jsdelivr.net/npm/devtemdesign@' + VERSION + '/';
  var LS_KEY = 'dtd_projects';

  /* Old 0.0.x keys -> 0.1.0 keys. The editor can keep using the old names. */
  var RENAMES = [
    ['heroTag', 'heroBadge'],
    ['featuresSectionLabel', 'featuresLabel'],
    ['featuresSectionTitle', 'featuresTitle']
  ];

  function loadProjects() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch (e) { return []; }
  }
  function saveProjects(arr) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(arr)); } catch (e) {}
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* Returns a copy that the 0.1.0 engine understands. Safe to run on any config. */
  function migrate(c) {
    var o = JSON.parse(JSON.stringify(c || {}));
    RENAMES.forEach(function (p) {
      if (o[p[0]] != null) {
        if (o[p[1]] == null) o[p[1]] = o[p[0]];
        delete o[p[0]];
      }
    });
    if (o.footer && o.footer.copy == null && o.footerCopy) o.footer.copy = o.footerCopy;
    return o;
  }

  /* preview = true: content is shown immediately (no reveal), and the page
     accepts postMessage({ dtdCfg }) so the builder can update without a reload. */
  function buildHTML(c, preview) {
    var cfg = migrate(c);
    var json = JSON.stringify(cfg, null, 2).replace(/</g, '\\u003c');   // blocks </script> breakouts
    var head = '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n' +
      '  <meta name="viewport" content="width=device-width, initial-scale=1">\n' +
      '  <title>' + esc(cfg.logoName || 'Page') + '</title>\n' +
      '  <link rel="stylesheet" href="' + BASE + 'style.min.css">\n' +
      '  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">\n' +
      (preview ? '  <style>.reveal{opacity:1!important;animation:none!important}</style>\n' : '') +
      '  <script src="' + BASE + 'script.min.js"><\/script>\n</head>\n';
    var body = '<body>\n  <div id="app"></div>\n  <script>\n    devtemDesign("app", ' + json + ');\n' +
      (preview
        ? '    addEventListener("message", function (e) {\n' +
          '      if (e.source !== parent || !e.data || !e.data.dtdCfg) return;\n' +
          '      var y = scrollY; devtemDesign("app", e.data.dtdCfg); scrollTo(0, y);\n' +
          '    });\n'
        : '') +
      '  <\/script>\n</body>\n</html>';
    return head + body;
  }

  w.DTD = { VERSION: VERSION, loadProjects: loadProjects, saveProjects: saveProjects, esc: esc, migrate: migrate, buildHTML: buildHTML };
})(window);
