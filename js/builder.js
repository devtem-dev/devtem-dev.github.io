(function () {
  'use strict';

  // ── STATE ──────────────────────────────────────────────────────────
  var cfg = null;
  var pageType = 'landing';
  var template = 'figsh';
  // debounce timer for preview refresh
  var previewTimer = null;

  // ── DOM ────────────────────────────────────────────────────────────
  var descEl         = document.getElementById('desc');
  var generateBtn    = document.getElementById('generate-btn');
  var errorBox       = document.getElementById('error-box');
  var errorText      = document.getElementById('error-text');
  var previewFrame   = document.getElementById('preview-frame');
  var previewEmpty   = document.getElementById('preview-empty');
  var editorScroll   = document.getElementById('editor-scroll');
  var sidebarPH      = document.getElementById('sidebar-placeholder');
  var copyBtn        = document.getElementById('copy-btn');
  var exportBtn      = document.getElementById('export-btn');

  // ── THEME ──────────────────────────────────────────────────────────
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

  // ── TOGGLES ────────────────────────────────────────────────────────
  document.querySelectorAll('.toggle-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      btn.closest('.toggle-group').querySelectorAll('.toggle-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      pageType = btn.dataset.type;
    });
  });
  document.querySelectorAll('.tpl-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      btn.closest('.template-grid').querySelectorAll('.tpl-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      template = btn.dataset.tpl;
      if (cfg) { cfg.template = template; schedulePreview(); }
    });
  });

  descEl.addEventListener('input', function () {
    generateBtn.disabled = descEl.value.trim().length < 10;
  });

  // ── ACCORDION ──────────────────────────────────────────────────────
  document.querySelectorAll('.ed-head').forEach(function (head) {
    head.addEventListener('click', function () {
      var sec = head.closest('.ed-section');
      sec.classList.toggle('open');
    });
  });

  // ── PREVIEW ────────────────────────────────────────────────────────
  // Debounced so fast typing doesn't hammer the iframe
  function schedulePreview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(doPreview, 300);
  }

  function doPreview() {
    if (!cfg) return;
    previewFrame.srcdoc = buildHTML(cfg);
    previewEmpty.style.display = 'none';
    previewFrame.style.display = 'block';
  }

  // ── WIRE SIMPLE INPUTS ─────────────────────────────────────────────
  // Called ONCE after generate. No re-wiring, no rebuilding.
  function wireSimpleInputs() {
    function w(id, path) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', function () {
        if (!cfg) return;
        var parts = path.split('.');
        var obj = cfg;
        for (var i = 0; i < parts.length - 1; i++) {
          if (!obj[parts[i]]) obj[parts[i]] = {};
          obj = obj[parts[i]];
        }
        obj[parts[parts.length - 1]] = el.value;
        schedulePreview();
      });
    }
    w('e-logoName',       'logoName');
    w('e-logoUrl',        'logo');
    w('e-heroTag',        'heroTag');
    w('e-heroLine1',      'heroTitleLine1');
    w('e-heroLine2',      'heroTitleLine2');
    w('e-heroSubtitle',   'heroSubtitle');
    w('e-primaryBtn',     'primaryBtnText');
    w('e-secondaryBtn',   'secondaryBtnText');
    w('e-ctaText',        'ctaText');
    w('e-brandsSubtitle', 'brandsSubtitle');
    w('e-featuresLabel',  'featuresSectionLabel');
    w('e-featuresTitle',  'featuresSectionTitle');
    w('e-footerTagline',  'footer.tagline');
    w('e-footerCopy',     'footer.copy');
  }

  // ── SYNC VALUES INTO INPUTS ────────────────────────────────────────
  // Only sets .value, does NOT re-wire.
  function syncValues() {
    function sv(id, val) {
      var el = document.getElementById(id);
      if (el) el.value = val || '';
    }
    sv('e-logoName',       cfg.logoName);
    sv('e-logoUrl',        cfg.logo);
    sv('e-heroTag',        cfg.heroTag);
    sv('e-heroLine1',      cfg.heroTitleLine1);
    sv('e-heroLine2',      cfg.heroTitleLine2);
    sv('e-heroSubtitle',   cfg.heroSubtitle);
    sv('e-primaryBtn',     cfg.primaryBtnText);
    sv('e-secondaryBtn',   cfg.secondaryBtnText);
    sv('e-ctaText',        cfg.ctaText);
    sv('e-brandsSubtitle', cfg.brandsSubtitle);
    sv('e-featuresLabel',  cfg.featuresSectionLabel);
    sv('e-featuresTitle',  cfg.featuresSectionTitle);
    sv('e-footerTagline',  cfg.footer && cfg.footer.tagline);
    sv('e-footerCopy',     cfg.footer && cfg.footer.copy);
  }

  // ── HTML ESCAPE ────────────────────────────────────────────────────
  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // ── RENDER LISTS ───────────────────────────────────────────────────
  // These rebuild dynamic list HTML. They are called after generate
  // and after any add/remove action. Inputs inside fire schedulePreview.

  function renderBrands() {
    var el = document.getElementById('brandsList');
    if (!el || !cfg) return;
    el.innerHTML = (cfg.brands || []).map(function (b, i) {
      return '<div class="list-item"><div class="li-fields"><input type="text" value="' + esc(b) + '" data-bi="' + i + '" placeholder="Brand"></div><button class="btn-rm" data-rb="' + i + '" title="Remove"><i class="fas fa-times"></i></button></div>';
    }).join('');
    el.querySelectorAll('[data-bi]').forEach(function (inp) {
      inp.addEventListener('input', function () { cfg.brands[+inp.dataset.bi] = inp.value; schedulePreview(); });
    });
    el.querySelectorAll('[data-rb]').forEach(function (btn) {
      btn.addEventListener('click', function () { cfg.brands.splice(+btn.dataset.rb, 1); renderBrands(); schedulePreview(); });
    });
  }

  function renderFeatures() {
    var el = document.getElementById('featuresList');
    if (!el || !cfg) return;
    el.innerHTML = (cfg.features || []).map(function (f, i) {
      return '<div class="list-item" style="flex-direction:column;align-items:stretch;gap:4px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;">' +
        '<span style="font-size:10px;color:var(--muted);text-transform:uppercase;">Card ' + (i+1) + '</span>' +
        '<button class="btn-rm" data-rf="' + i + '" title="Remove"><i class="fas fa-times"></i></button></div>' +
        '<input type="text" value="' + esc(f.title) + '" data-ft="' + i + '" placeholder="Title">' +
        '<input type="text" value="' + esc(f.desc) + '" data-fd="' + i + '" placeholder="Description">' +
        '<input type="text" value="' + esc(f.icon) + '" data-fi="' + i + '" placeholder="Icon HTML e.g. &lt;i class=\'fas fa-star\'&gt;&lt;/i&gt;">' +
        '</div>';
    }).join('');
    el.querySelectorAll('[data-ft]').forEach(function (inp) { inp.addEventListener('input', function () { cfg.features[+inp.dataset.ft].title = inp.value; schedulePreview(); }); });
    el.querySelectorAll('[data-fd]').forEach(function (inp) { inp.addEventListener('input', function () { cfg.features[+inp.dataset.fd].desc  = inp.value; schedulePreview(); }); });
    el.querySelectorAll('[data-fi]').forEach(function (inp) { inp.addEventListener('input', function () { cfg.features[+inp.dataset.fi].icon  = inp.value; schedulePreview(); }); });
    el.querySelectorAll('[data-rf]').forEach(function (btn) { btn.addEventListener('click', function () { cfg.features.splice(+btn.dataset.rf, 1); renderFeatures(); schedulePreview(); }); });
  }

  function renderPanels() {
    var el = document.getElementById('panelsList');
    if (!el || !cfg) return;
    el.innerHTML = (cfg.panels || []).map(function (p, i) {
      return '<div class="list-item" style="flex-direction:column;align-items:stretch;gap:4px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;">' +
        '<span style="font-size:10px;color:var(--muted);text-transform:uppercase;">Panel ' + (i+1) + '</span>' +
        '<button class="btn-rm" data-rp="' + i + '" title="Remove"><i class="fas fa-times"></i></button></div>' +
        '<input type="text" value="' + esc(p.tag)   + '" data-ptag="' + i + '" placeholder="Tag">' +
        '<input type="text" value="' + esc(p.title) + '" data-ptit="' + i + '" placeholder="Title">' +
        '<input type="text" value="' + esc(p.desc)  + '" data-pds="'  + i + '" placeholder="Description">' +
        '</div>';
    }).join('');
    el.querySelectorAll('[data-ptag]').forEach(function (inp) { inp.addEventListener('input', function () { cfg.panels[+inp.dataset.ptag].tag   = inp.value; schedulePreview(); }); });
    el.querySelectorAll('[data-ptit]').forEach(function (inp) { inp.addEventListener('input', function () { cfg.panels[+inp.dataset.ptit].title = inp.value; schedulePreview(); }); });
    el.querySelectorAll('[data-pds]').forEach(function  (inp) { inp.addEventListener('input', function () { cfg.panels[+inp.dataset.pds].desc   = inp.value; schedulePreview(); }); });
    el.querySelectorAll('[data-rp]').forEach(function  (btn) { btn.addEventListener('click', function () { cfg.panels.splice(+btn.dataset.rp, 1); renderPanels(); schedulePreview(); }); });
  }

  function renderFooterCols() {
    var el = document.getElementById('footerColumnsList');
    if (!el || !cfg || !cfg.footer) return;
    el.innerHTML = (cfg.footer.columns || []).map(function (col, ci) {
      var linksHtml = (col.links || []).map(function (lnk, li) {
        return '<div class="fcol-link-row">' +
          '<input type="text" value="' + esc(lnk.label) + '" data-fll="' + ci + '-' + li + '" placeholder="Label">' +
          '<input type="text" value="' + esc(lnk.href)  + '" data-flh="' + ci + '-' + li + '" placeholder="URL">' +
          '<button class="btn-rm" data-rfl="' + ci + '-' + li + '" title="Remove link"><i class="fas fa-times"></i></button></div>';
      }).join('');
      return '<div class="list-item" style="flex-direction:column;align-items:stretch;gap:5px;">' +
        '<div style="display:flex;gap:5px;align-items:center;">' +
        '<input type="text" value="' + esc(col.heading) + '" data-fch="' + ci + '" placeholder="Column heading" style="flex:1;">' +
        '<button class="btn-rm" data-rfc="' + ci + '" title="Remove column"><i class="fas fa-times"></i></button></div>' +
        '<div class="fcol-links">' + linksHtml +
        '<button class="btn-add" data-afl="' + ci + '" style="font-size:10px;padding:3px 8px;"><i class="fas fa-plus"></i> link</button>' +
        '</div></div>';
    }).join('');
    el.querySelectorAll('[data-fch]').forEach(function (inp)  { inp.addEventListener('input', function () { cfg.footer.columns[+inp.dataset.fch].heading = inp.value; schedulePreview(); }); });
    el.querySelectorAll('[data-fll]').forEach(function (inp)  { inp.addEventListener('input', function () { var p = inp.dataset.fll.split('-'); cfg.footer.columns[+p[0]].links[+p[1]].label = inp.value; schedulePreview(); }); });
    el.querySelectorAll('[data-flh]').forEach(function (inp)  { inp.addEventListener('input', function () { var p = inp.dataset.flh.split('-'); cfg.footer.columns[+p[0]].links[+p[1]].href  = inp.value; schedulePreview(); }); });
    el.querySelectorAll('[data-rfc]').forEach(function (btn)  { btn.addEventListener('click', function () { cfg.footer.columns.splice(+btn.dataset.rfc, 1); renderFooterCols(); schedulePreview(); }); });
    el.querySelectorAll('[data-rfl]').forEach(function (btn)  { btn.addEventListener('click', function () { var p = btn.dataset.rfl.split('-'); cfg.footer.columns[+p[0]].links.splice(+p[1], 1); renderFooterCols(); schedulePreview(); }); });
    el.querySelectorAll('[data-afl]').forEach(function (btn)  { btn.addEventListener('click', function () { cfg.footer.columns[+btn.dataset.afl].links.push({ label: 'Link', href: '#' }); renderFooterCols(); schedulePreview(); }); });
  }

  function renderSocial() {
    var el = document.getElementById('socialLinksList');
    if (!el || !cfg || !cfg.footer) return;
    el.innerHTML = (cfg.footer.social || []).map(function (s, i) {
      return '<div class="list-item"><div class="li-fields">' +
        '<input type="text" value="' + esc(s.icon)  + '" data-si="'  + i + '" placeholder="fab fa-github" style="flex:.9;">' +
        '<input type="text" value="' + esc(s.href)  + '" data-sh="'  + i + '" placeholder="URL">' +
        '<input type="text" value="' + esc(s.label) + '" data-sl="'  + i + '" placeholder="Label">' +
        '</div><button class="btn-rm" data-rs="' + i + '" title="Remove"><i class="fas fa-times"></i></button></div>';
    }).join('');
    el.querySelectorAll('[data-si]').forEach(function (inp) { inp.addEventListener('input', function () { cfg.footer.social[+inp.dataset.si].icon  = inp.value; schedulePreview(); }); });
    el.querySelectorAll('[data-sh]').forEach(function (inp) { inp.addEventListener('input', function () { cfg.footer.social[+inp.dataset.sh].href  = inp.value; schedulePreview(); }); });
    el.querySelectorAll('[data-sl]').forEach(function (inp) { inp.addEventListener('input', function () { cfg.footer.social[+inp.dataset.sl].label = inp.value; schedulePreview(); }); });
    el.querySelectorAll('[data-rs]').forEach(function (btn) { btn.addEventListener('click', function () { cfg.footer.social.splice(+btn.dataset.rs, 1); renderSocial(); schedulePreview(); }); });
  }

  function renderLegal() {
    var el = document.getElementById('legalLinksList');
    if (!el || !cfg || !cfg.footer) return;
    el.innerHTML = (cfg.footer.legal || []).map(function (l, i) {
      return '<div class="list-item"><div class="li-fields">' +
        '<input type="text" value="' + esc(l.label) + '" data-ll="' + i + '" placeholder="Label">' +
        '<input type="text" value="' + esc(l.href)  + '" data-lh="' + i + '" placeholder="URL">' +
        '</div><button class="btn-rm" data-rl="' + i + '" title="Remove"><i class="fas fa-times"></i></button></div>';
    }).join('');
    el.querySelectorAll('[data-ll]').forEach(function (inp) { inp.addEventListener('input', function () { cfg.footer.legal[+inp.dataset.ll].label = inp.value; schedulePreview(); }); });
    el.querySelectorAll('[data-lh]').forEach(function (inp) { inp.addEventListener('input', function () { cfg.footer.legal[+inp.dataset.lh].href  = inp.value; schedulePreview(); }); });
    el.querySelectorAll('[data-rl]').forEach(function (btn) { btn.addEventListener('click', function () { cfg.footer.legal.splice(+btn.dataset.rl, 1); renderLegal(); schedulePreview(); }); });
  }

  function renderAllLists() {
    renderBrands(); renderFeatures(); renderPanels();
    renderFooterCols(); renderSocial(); renderLegal();
  }

  // ── ADD BUTTONS ────────────────────────────────────────────────────
  document.getElementById('addBrandBtn').addEventListener('click',  function () { if (!cfg) return; cfg.brands.push('New Brand'); renderBrands(); schedulePreview(); });
  document.getElementById('addFeatureBtn').addEventListener('click', function () { if (!cfg) return; cfg.features.push({ title: 'New Feature', desc: 'Description', icon: "<i class='fas fa-star'></i>" }); renderFeatures(); schedulePreview(); });
  document.getElementById('addPanelBtn').addEventListener('click',   function () { if (!cfg) return; cfg.panels.push({ tag: 'New', title: 'Panel', desc: 'Description' }); renderPanels(); schedulePreview(); });
  document.getElementById('addColumnBtn').addEventListener('click',  function () { if (!cfg) return; cfg.footer.columns.push({ heading: 'Column', links: [{ label: 'Link', href: '#' }] }); renderFooterCols(); schedulePreview(); });
  document.getElementById('addSocialBtn').addEventListener('click',  function () { if (!cfg) return; cfg.footer.social.push({ icon: 'fab fa-github', href: '#', label: 'GitHub' }); renderSocial(); schedulePreview(); });
  document.getElementById('addLegalBtn').addEventListener('click',   function () { if (!cfg) return; cfg.footer.legal.push({ label: 'Legal', href: '#' }); renderLegal(); schedulePreview(); });

  // ── OPEN EDITOR (called once after generate) ───────────────────────
  var wired = false;
  function openEditor() {
    sidebarPH.style.display = 'none';
    editorScroll.style.display = 'flex';
    syncValues();
    renderAllLists();
    if (!wired) { wireSimpleInputs(); wired = false; } // wire once
    wired = true;
    doPreview();
  }

  // ── CONFIG GENERATOR ──────────────────────────────────────────────
  function generateConfig(desc, tmpl, ptype) {
    var words = desc.split(/\s+/).filter(function (w) { return w.length > 2; });
    var brand = words.slice(0, 2).join(' ').toUpperCase() || 'STUDIO';
    var short = desc.length > 200 ? desc.slice(0, 200) + '…' : desc;
    var lower = desc.toLowerCase();
    var features, panels, brands, heroTag, heroLine1, heroLine2;

    if (lower.includes('design') || lower.includes('ui') || lower.includes('ux')) {
      heroLine1 = 'Design'; heroLine2 = 'Driven';
      heroTag = 'design · prototype · deliver';
      brands = ['Figma', 'Adobe', 'Sketch', 'InVision', 'Zeplin', 'Miro'];
      features = [
        { title: 'UI/UX Design',   desc: 'Human-centered interfaces that delight.',  icon: "<i class='fas fa-pencil-ruler'></i>" },
        { title: 'Prototyping',    desc: 'Rapid iteration with real user feedback.',  icon: "<i class='fas fa-flask'></i>" },
        { title: 'Design Systems', desc: 'Scalable component libraries.',             icon: "<i class='fas fa-layer-group'></i>" },
        { title: 'Brand Identity', desc: 'Logo, guidelines, visual language.',        icon: "<i class='fas fa-bolt'></i>" },
        { title: 'Accessibility',  desc: 'Inclusive design for all users.',           icon: "<i class='fas fa-universal-access'></i>" },
        { title: 'Motion Design',  desc: 'Micro-interactions that engage.',           icon: "<i class='fas fa-play'></i>" }
      ];
      panels = [
        { tag: 'Process', title: 'Design Sprints',  desc: 'Rapid prototyping and validation.' },
        { tag: 'Tools',   title: 'Figma & Adobe',   desc: 'Industry-standard design tools.' },
        { tag: 'Deliver', title: 'Pixel-Perfect',   desc: 'Handoff ready for development.' }
      ];
    } else if (lower.includes('develop') || lower.includes('code') || lower.includes('software') || lower.includes('fullstack') || lower.includes('fscss') || lower.includes('devtemdesign')) {
      heroLine1 = 'Build'; heroLine2 = 'the Future';
      heroTag = 'code · build · ship';
      brands = ['React', 'Node', 'Python', 'Supabase', 'Netlify', 'AWS'];
      features = [
        { title: 'Web Development', desc: 'Fast, scalable apps with modern stacks.',  icon: "<i class='fas fa-code'></i>" },
        { title: 'Mobile Apps',     desc: 'Cross-platform native experiences.',        icon: "<i class='fas fa-mobile-alt'></i>" },
        { title: 'APIs & Backend',  desc: 'Robust server-side logic and data.',        icon: "<i class='fas fa-server'></i>" },
        { title: 'DevOps',          desc: 'CI/CD, monitoring, cloud infra.',           icon: "<i class='fas fa-cloud'></i>" },
        { title: 'Testing',         desc: 'Automated tests for reliability.',          icon: "<i class='fas fa-check-circle'></i>" },
        { title: 'Performance',     desc: 'Optimized for speed and core web vitals.',  icon: "<i class='fas fa-tachometer-alt'></i>" }
      ];
      panels = [
        { tag: 'Stack',   title: 'Modern Tech',  desc: 'React, Node, Python, Go, AWS.' },
        { tag: 'Method',  title: 'Agile',         desc: 'Iterative delivery with continuous feedback.' },
        { tag: 'Quality', title: 'Code Review',   desc: 'Peer reviews and best practices.' }
      ];
    } else if (lower.includes('market') || lower.includes('brand') || lower.includes('content')) {
      heroLine1 = 'Amplify'; heroLine2 = 'Your Message';
      heroTag = 'market · engage · convert';
      brands = ['Google', 'Meta', 'HubSpot', 'Mailchimp', 'SEMrush', 'Ahrefs'];
      features = [
        { title: 'Content Strategy', desc: 'Engage your audience with compelling stories.', icon: "<i class='fas fa-newspaper'></i>" },
        { title: 'Social Media',     desc: 'Amplify reach across platforms.',               icon: "<i class='fas fa-share-alt'></i>" },
        { title: 'SEO & Analytics',  desc: 'Data-driven optimisation.',                     icon: "<i class='fas fa-chart-line'></i>" },
        { title: 'Brand Identity',   desc: 'Build a memorable brand.',                      icon: "<i class='fas fa-bolt'></i>" },
        { title: 'Email Marketing',  desc: 'Nurture leads and drive conversions.',          icon: "<i class='fas fa-envelope'></i>" },
        { title: 'Paid Ads',         desc: 'Targeted campaigns for ROI.',                   icon: "<i class='fas fa-ad'></i>" }
      ];
      panels = [
        { tag: 'Strategy',  title: 'Omnichannel',        desc: 'Integrated marketing across all touchpoints.' },
        { tag: 'Creative',  title: 'Content Production', desc: 'Video, copy, and design.' },
        { tag: 'Analytics', title: 'Measurement',        desc: 'Track and optimise every campaign.' }
      ];
    } else {
      heroLine1 = 'Shape'; heroLine2 = 'Tomorrow';
      heroTag = 'vision · impact · excellence';
      brands = ['Google', 'Microsoft', 'Amazon', 'Apple', 'Meta', 'Netflix'];
      features = [
        { title: 'Strategy',      desc: 'Define clear goals and roadmaps.',         icon: "<i class='fas fa-chess'></i>" },
        { title: 'Execution',     desc: 'Turn ideas into reality with precision.',   icon: "<i class='fas fa-cogs'></i>" },
        { title: 'Innovation',    desc: 'Stay ahead with creative solutions.',       icon: "<i class='fas fa-lightbulb'></i>" },
        { title: 'Collaboration', desc: 'Work closely with your team.',              icon: "<i class='fas fa-users'></i>" },
        { title: 'Growth',        desc: 'Scale your impact sustainably.',            icon: "<i class='fas fa-arrow-up'></i>" },
        { title: 'Support',       desc: 'Ongoing guidance and partnership.',         icon: "<i class='fas fa-handshake'></i>" }
      ];
      panels = [
        { tag: 'Approach', title: 'Holistic',  desc: 'We consider the whole picture.' },
        { tag: 'Values',   title: 'Integrity', desc: 'Transparent and ethical work.' },
        { tag: 'Vision',   title: 'Long-term', desc: 'Building for lasting success.' }
      ];
    }

    return {
      template: tmpl,
      logo: 'https://fscss.devtem.org/assets/images/fscss.png',
      logoName: brand,
      navLinks: [
        { label: 'Work', href: '#work' }, { label: 'Services', href: '#services' },
        { label: 'About', href: '#about' }, { label: 'Contact', href: '#contact' }
      ],
      ctaText: 'Get started',
      heroTag: heroTag,
      heroTitleLine1: heroLine1,
      heroTitleLine2: heroLine2,
      heroSubtitle: short,
      primaryBtnText: 'Learn more',
      secondaryBtnText: 'Contact us',
      brands: brands,
      brandsSubtitle: 'technologies & platforms I work with daily',
      featuresSectionLabel: 'capabilities',
      featuresSectionTitle: 'What we do',
      features: features,
      panels: panels,
      footer: {
        tagline: 'Built with devtemDesign.',
        copy: '© 2026 ' + brand + '. MIT License.',
        columns: [
          { heading: 'Product',   links: [{ label: 'Features', href: '#' }, { label: 'Pricing', href: '#' }, { label: 'Docs', href: '#' }] },
          { heading: 'Company',   links: [{ label: 'About', href: '#' }, { label: 'Blog', href: '#' }, { label: 'Careers', href: '#' }] },
          { heading: 'Resources', links: [{ label: 'GitHub', href: '#' }, { label: 'DevTemple', href: 'https://devtem.org' }, { label: 'LinkedIn', href: '#' }] }
        ],
        social: [
          { icon: 'fab fa-github',   href: '#', label: 'GitHub' },
          { icon: 'fab fa-twitter',  href: '#', label: 'Twitter' },
          { icon: 'fab fa-linkedin', href: '#', label: 'LinkedIn' }
        ],
        legal: [{ label: 'Privacy', href: '#' }, { label: 'Terms', href: '#' }]
      }
    };
  }

  // ── BUILD HTML ─────────────────────────────────────────────────────
  function buildHTML(c) {
    return '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>' + (c.logoName || 'devtem') + '</title>\n  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/devtemdesign@0.0.2/style.css">\n  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">\n  <script src="https://cdn.jsdelivr.net/npm/devtemdesign@0.0.2/script.js"><\/script>\n</head>\n<body>\n  <div id="app"></div>\n  <script>devtemDesign("app", ' + JSON.stringify(c, null, 2) + ');<\/script>\n</body>\n</html>';
  }

  // ── GENERATE ───────────────────────────────────────────────────────
  generateBtn.addEventListener('click', function () {
    var desc = descEl.value.trim();
    if (!desc) return;
    errorBox.style.display = 'none';
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating…';
    setTimeout(function () {
      try {
        cfg = generateConfig(desc, template, pageType);
        openEditor();
        generateBtn.innerHTML = '<i class="fas fa-rotate"></i> Regenerate';
        generateBtn.disabled = false;
      } catch (err) {
        errorText.textContent = 'Something went wrong. Please try again.';
        errorBox.style.display = 'flex';
        generateBtn.innerHTML = '<i class="fas fa-rocket"></i> Generate page';
        generateBtn.disabled = false;
        console.warn(err);
      }
    }, 400);
  });

  // ── COPY ───────────────────────────────────────────────────────────
  copyBtn.addEventListener('click', function () {
    if (!cfg) return;
    var html = buildHTML(cfg);
    navigator.clipboard.writeText(html).then(function () {
      copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
      copyBtn.classList.add('ok');
      setTimeout(function () { copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy HTML'; copyBtn.classList.remove('ok'); }, 2000);
    }).catch(function () {
      var ta = document.createElement('textarea');
      ta.value = html; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); ta.remove();
    });
  });

  // ── EXPORT ─────────────────────────────────────────────────────────
  exportBtn.addEventListener('click', function () {
    if (!cfg) return;
    var html = buildHTML(cfg);
    var name = (cfg.logoName || 'page').toLowerCase().replace(/\s+/g, '-');
    var blob = new Blob([html], { type: 'text/html' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name + '.html'; a.click();
    URL.revokeObjectURL(a.href);
  });

})();
