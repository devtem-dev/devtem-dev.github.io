(function () {
  'use strict';

  var LS_KEY = 'dtd_projects';

  function loadProjects() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch (e) { return []; }
  }
  function saveProjects(arr) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(arr)); } catch (e) {}
  }
  function fmt(ts) {
    var d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) +
           ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }
  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function buildHTML(c) {
    return '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>' + (c.logoName||'Page') + '</title>\n<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/devtemdesign@0.0.2/style.css">\n<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">\n<script src="https://cdn.jsdelivr.net/npm/devtemdesign@0.0.2/script.js"><\/script>\n</head>\n<body>\n<div id="app"></div>\n<script>devtemDesign("app",' + JSON.stringify(c) + ');<\/script>\n</body>\n</html>';
  }

  /* ── THEME ── */
  document.getElementById('btn-dark').addEventListener('click', function () {
    document.documentElement.removeAttribute('data-theme');
    document.getElementById('btn-dark').classList.add('active');
    document.getElementById('btn-light').classList.remove('active');
  });
  document.getElementById('btn-light').addEventListener('click', function () {
    document.documentElement.setAttribute('data-theme', 'light');
    document.getElementById('btn-light').classList.add('active');
    document.getElementById('btn-dark').classList.remove('active');
  });

  /* ── PREVIEW MODAL ── */
  var previewModal   = document.getElementById('preview-modal');
  var modalTitle     = document.getElementById('modal-title');
  var modalFrame     = document.getElementById('modal-frame');
  var modalClose     = document.getElementById('modal-close');
  var modalEditBtn   = document.getElementById('modal-edit-btn');
  var modalExportBtn = document.getElementById('modal-export-btn');
  var _modalCfg = null;
  var _modalId  = null;

  function openModal(id, name, cfg) {
    _modalCfg = cfg; _modalId = id;
    modalTitle.textContent = name;
    modalFrame.srcdoc = buildHTML(cfg);
    modalEditBtn.href = 'index.html?id=' + id;
    previewModal.classList.add('open');
  }
  modalClose.addEventListener('click', function () {
    previewModal.classList.remove('open');
    modalFrame.srcdoc = '';
  });
  previewModal.addEventListener('click', function (e) {
    if (e.target === previewModal) modalClose.click();
  });
  modalExportBtn.addEventListener('click', function () {
    if (!_modalCfg) return;
    var html = buildHTML(_modalCfg);
    var name = (_modalCfg.logoName||'page').toLowerCase().replace(/\s+/g,'-');
    var blob = new Blob([html],{type:'text/html'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name+'.html'; a.click();
    URL.revokeObjectURL(a.href);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && previewModal.classList.contains('open')) modalClose.click();
  });

  /* ── RENDER ── */
  var grid       = document.getElementById('projects-grid');
  var emptyState = document.getElementById('empty-state');
  var countBadge = document.getElementById('count-badge');
  var searchInput= document.getElementById('search-input');

  function render(filter) {
    var list = loadProjects();
    if (filter) {
      var f = filter.toLowerCase();
      list = list.filter(function (p) { return p.name.toLowerCase().includes(f); });
    }
    countBadge.textContent = loadProjects().length; // always real count

    if (list.length === 0) {
      emptyState.style.display = 'flex';
      grid.innerHTML = '';
      return;
    }
    emptyState.style.display = 'none';

    // Sort newest first
    list = list.slice().sort(function (a, b) { return b.updatedAt - a.updatedAt; });

    grid.innerHTML = list.map(function (p) {
      return '<div class="proj-card" data-id="' + p.id + '">' +
        '<div class="proj-thumb" data-preview-id="' + p.id + '">' +
          '<iframe srcdoc="' + esc(buildHTML(p.config)) + '" sandbox="allow-scripts allow-same-origin"></iframe>' +
          '<div class="proj-thumb-overlay"><button class="ov-btn" data-preview-id="' + p.id + '"><i class="fas fa-eye"></i> Preview</button></div>' +
        '</div>' +
        '<div class="proj-body">' +
          '<div class="proj-name-row">' +
            '<span class="proj-name" data-rename-id="' + p.id + '">' + esc(p.name) + '</span>' +
            '<input class="proj-name-input" type="text" value="' + esc(p.name) + '" data-rename-input="' + p.id + '" maxlength="60">' +
            '<span class="proj-tpl">' + esc(p.config.template||'figsh') + '</span>' +
          '</div>' +
          '<div class="proj-meta">' + fmt(p.updatedAt) + '</div>' +
          '<div class="proj-actions">' +
            '<a class="pa-btn" href="/builder?id=' + p.id + '"><i class="fas fa-pen"></i> Edit</a>' +
            '<button class="pa-btn" data-preview-id="' + p.id + '"><i class="fas fa-eye"></i> Preview</button>' +
            '<button class="pa-btn danger" data-delete-id="' + p.id + '"><i class="fas fa-trash"></i> Delete</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');

    /* rename: click name */
    grid.querySelectorAll('.proj-name[data-rename-id]').forEach(function (el) {
      el.addEventListener('click', function () {
        el.style.display = 'none';
        var inp = el.closest('.proj-name-row').querySelector('.proj-name-input');
        inp.style.display = 'block'; inp.focus(); inp.select();
      });
    });
    grid.querySelectorAll('.proj-name-input[data-rename-input]').forEach(function (inp) {
      function commit() {
        var val = inp.value.trim(); if (!val) { render(searchInput.value); return; }
        var id = inp.dataset.renameInput;
        var all = loadProjects(); var p = all.find(function(x){return x.id===id;});
        if (p) { p.name = val; saveProjects(all); }
        render(searchInput.value);
      }
      inp.addEventListener('blur', commit);
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); commit(); }
        if (e.key === 'Escape') render(searchInput.value);
      });
    });

    /* preview */
    grid.querySelectorAll('[data-preview-id]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        var id = el.dataset.previewId;
        var all = loadProjects(); var p = all.find(function(x){return x.id===id;});
        if (p) openModal(p.id, p.name, p.config);
      });
    });

    /* delete */
    grid.querySelectorAll('[data-delete-id]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!confirm('Delete "' + btn.closest('.proj-card').querySelector('.proj-name').textContent + '"?')) return;
        var id = btn.dataset.deleteId;
        saveProjects(loadProjects().filter(function(x){return x.id!==id;}));
        render(searchInput.value);
      });
    });
  }

  searchInput.addEventListener('input', function () { render(this.value); });
  render();

})();
