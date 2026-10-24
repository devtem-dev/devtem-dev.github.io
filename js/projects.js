(function () {
  'use strict';

  /* Shared helpers (/js/shared.js): 0.1.0 output, old-key migration, safe embedding */
  var buildHTML    = DTD.buildHTML;
  var loadProjects = DTD.loadProjects;
  var saveProjects = DTD.saveProjects;
  var esc          = DTD.esc;

  function fmt(ts) {
    var d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) +
           ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
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

  function openModal(id, name, cfg) {
    _modalCfg = cfg;
    modalTitle.textContent = name;
    modalFrame.srcdoc = buildHTML(cfg);
    modalEditBtn.href = '/builder?id=' + id;
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
    var name = (_modalCfg.logoName || 'page').toLowerCase().replace(/\s+/g, '-');
    var blob = new Blob([buildHTML(_modalCfg)], { type: 'text/html' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name + '.html'; a.click();
    URL.revokeObjectURL(a.href);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && previewModal.classList.contains('open')) modalClose.click();
  });

  /* ── RENDER ── */
  var grid        = document.getElementById('projects-grid');
  var emptyState  = document.getElementById('empty-state');
  var countBadge  = document.getElementById('count-badge');
  var searchInput = document.getElementById('search-input');

  function render(filter) {
    var list = loadProjects();
    if (filter) {
      var f = filter.toLowerCase();
      list = list.filter(function (p) { return p.name.toLowerCase().includes(f); });
    }
    countBadge.textContent = loadProjects().length; // always the real count

    if (list.length === 0) {
      emptyState.style.display = 'flex';
      grid.innerHTML = '';
      return;
    }
    emptyState.style.display = 'none';

    list = list.slice().sort(function (a, b) { return b.updatedAt - a.updatedAt; }); // newest first

    grid.innerHTML = list.map(function (p) {
      return '<div class="proj-card" data-id="' + esc(p.id) + '">' +
        '<div class="proj-thumb" data-preview-id="' + esc(p.id) + '">' +
          '<iframe srcdoc="' + esc(buildHTML(p.config, true)) + '" sandbox="allow-scripts allow-same-origin" loading="lazy" title="' + esc(p.name) + '"></iframe>' +
          '<div class="proj-thumb-overlay"><button class="ov-btn" data-preview-id="' + esc(p.id) + '"><i class="fas fa-eye"></i> Preview</button></div>' +
        '</div>' +
        '<div class="proj-body">' +
          '<div class="proj-name-row">' +
            '<span class="proj-name" data-rename-id="' + esc(p.id) + '">' + esc(p.name) + '</span>' +
            '<input class="proj-name-input" type="text" value="' + esc(p.name) + '" data-rename-input="' + esc(p.id) + '" maxlength="60">' +
            '<span class="proj-tpl">' + esc(p.config.template || 'figsh') + '</span>' +
          '</div>' +
          '<div class="proj-meta">' + fmt(p.updatedAt) + '</div>' +
          '<div class="proj-actions">' +
            '<a class="pa-btn" href="/builder?id=' + esc(p.id) + '"><i class="fas fa-pen"></i> Edit</a>' +
            '<button class="pa-btn" data-preview-id="' + esc(p.id) + '"><i class="fas fa-eye"></i> Preview</button>' +
            '<button class="pa-btn danger" data-delete-id="' + esc(p.id) + '"><i class="fas fa-trash"></i> Delete</button>' +
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
        var all = loadProjects(); var p = all.find(function (x) { return x.id === id; });
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
        var p = loadProjects().find(function (x) { return x.id === id; });
        if (p) openModal(p.id, p.name, p.config);
      });
    });

    /* delete */
    grid.querySelectorAll('[data-delete-id]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!confirm('Delete "' + btn.closest('.proj-card').querySelector('.proj-name').textContent + '"?')) return;
        var id = btn.dataset.deleteId;
        saveProjects(loadProjects().filter(function (x) { return x.id !== id; }));
        render(searchInput.value);
      });
    });
  }

  searchInput.addEventListener('input', function () { render(this.value); });
  render();

})();

