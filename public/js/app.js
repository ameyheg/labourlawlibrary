// India Labour Law Library - Core Client Application

(function () {
  'use strict';

  // Application State
  const state = {
    currentUser: API.getUser(),
    currentView: 'home',
    searchParams: {
      q: '',
      jurisdiction: '',
      state: '',
      subject: '',
      legal_status: '',
      document_type: '',
    },
    documents: [],
    currentDocument: null,
    stats: null,
  };

  // DOM Elements Cache
  const el = {
    // Nav & Header
    navHome: document.getElementById('navHomeBtn'),
    navStats: document.getElementById('navStatsBtn'),
    navSubscription: document.getElementById('navSubscriptionBtn'),
    navAdmin: document.getElementById('navAdminBtn'),
    authGroup: document.getElementById('headerAuthGroup'),
    brandHomeLink: document.getElementById('brandHomeLink'),
    dismissBannerBtn: document.getElementById('dismissBannerBtn'),
    announcementBanner: document.getElementById('announcementBanner'),

    // Views
    homeView: document.getElementById('homeView'),
    documentReaderView: document.getElementById('documentReaderView'),
    statsView: document.getElementById('statsView'),
    subscriptionView: document.getElementById('subscriptionView'),
    adminView: document.getElementById('adminView'),

    // Search & Filter
    mainSearchInput: document.getElementById('mainSearchInput'),
    searchClearBtn: document.getElementById('searchClearBtn'),
    executeSearchBtn: document.getElementById('executeSearchBtn'),
    filterJurisdiction: document.getElementById('filterJurisdiction'),
    filterState: document.getElementById('filterState'),
    filterSubject: document.getElementById('filterSubject'),
    filterStatus: document.getElementById('filterStatus'),
    filterType: document.getElementById('filterType'),
    resetFiltersBtn: document.getElementById('resetFiltersBtn'),
    quickPresets: document.getElementById('quickPresets'),
    resultsCount: document.getElementById('resultsCount'),
    documentsGrid: document.getElementById('documentsGrid'),
    noResultsState: document.getElementById('noResultsState'),
    resetSearchFromEmptyBtn: document.getElementById('resetSearchFromEmptyBtn'),

    // Reader View
    backToLibraryBtn: document.getElementById('backToLibraryBtn'),
    breadSubject: document.getElementById('breadSubject'),
    breadDocTitle: document.getElementById('breadDocTitle'),
    documentReaderContent: document.getElementById('documentReaderContent'),

    // Stats View
    statsContainer: document.getElementById('statsContainer'),

    // Admin View
    adminContainer: document.getElementById('adminContainer'),

    // Subscription buttons
    selectFreeTierBtn: document.getElementById('selectFreeTierBtn'),
    selectProTierBtn: document.getElementById('selectProTierBtn'),
    selectEnterpriseTierBtn: document.getElementById('selectEnterpriseTierBtn'),

    // Modals
    authModal: document.getElementById('authModal'),
    closeAuthModalBtn: document.getElementById('closeAuthModalBtn'),
    authTabLogin: document.getElementById('authTabLogin'),
    authTabRegister: document.getElementById('authTabRegister'),
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    loginError: document.getElementById('loginError'),
    registerError: document.getElementById('registerError'),
    toastContainer: document.getElementById('toastContainer'),

    // Doc Editor Modal
    docEditorModal: document.getElementById('docEditorModal'),
    closeDocEditorModalBtn: document.getElementById('closeDocEditorModalBtn'),
    cancelDocEditorBtn: document.getElementById('cancelDocEditorBtn'),
    documentForm: document.getElementById('documentForm'),
    formSupersededBy: document.getElementById('formSupersededBy'),
    docEditorError: document.getElementById('docEditorError'),

    // Demo Profile Buttons
    demoAdminBtn: document.getElementById('demoAdminBtn'),
    demoEditorBtn: document.getElementById('demoEditorBtn'),
    demoProBtn: document.getElementById('demoProBtn'),
    demoFreeBtn: document.getElementById('demoFreeBtn'),
  };

  // Toast Notification System
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? '✓' : type === 'error' ? '⚠' : 'ℹ';
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    el.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // View Navigation
  function switchView(viewName) {
    state.currentView = viewName;
    const views = [
      { name: 'home', elem: el.homeView, nav: el.navHome },
      { name: 'reader', elem: el.documentReaderView, nav: null },
      { name: 'stats', elem: el.statsView, nav: el.navStats },
      { name: 'subscription', elem: el.subscriptionView, nav: el.navSubscription },
      { name: 'admin', elem: el.adminView, nav: el.navAdmin },
    ];

    for (const v of views) {
      if (v.elem) {
        if (v.name === viewName) {
          v.elem.style.display = 'block';
          v.elem.classList.add('active');
        } else {
          v.elem.style.display = 'none';
          v.elem.classList.remove('active');
        }
      }
      if (v.nav) {
        if (v.name === viewName) {
          v.nav.classList.add('active');
        } else {
          v.nav.classList.remove('active');
        }
      }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (viewName === 'stats') {
      loadStats();
    } else if (viewName === 'admin') {
      renderAdminDashboard();
    } else if (viewName === 'subscription') {
      updatePricingUI();
    }
  }

  // Auth & User Profile Management
  function updateAuthUI() {
    const user = state.currentUser;
    if (user) {
      const isStaff = user.role === 'admin' || user.role === 'editor';
      el.navAdmin.style.display = isStaff ? 'block' : 'none';

      el.authGroup.innerHTML = `
        <div class="user-profile-badge" id="userProfileBtn" title="Current session: ${user.email}">
          <span class="role-pill">${user.role.toUpperCase()}</span>
          <span class="tier-pill tier-${user.subscription_tier}">${user.subscription_tier.toUpperCase()} TIER</span>
          <span style="font-size:0.85rem; font-weight:600; color:#fff;">${user.full_name.split(' ')[0]}</span>
        </div>
        <button id="logoutBtn" class="btn-secondary" style="padding:6px 12px; font-size:0.8rem;">Sign Out</button>
      `;

      document.getElementById('logoutBtn').addEventListener('click', () => {
        API.logout();
        state.currentUser = null;
        updateAuthUI();
        showToast('Signed out successfully.', 'info');
        if (state.currentView === 'admin') switchView('home');
      });
    } else {
      el.navAdmin.style.display = 'none';
      el.authGroup.innerHTML = `
        <button id="headerSignInBtn" class="btn-primary" style="padding:7px 16px; font-size:0.85rem;">
          Sign In / Demo Access
        </button>
      `;
      document.getElementById('headerSignInBtn').addEventListener('click', () => {
        openAuthModal();
      });
    }
    updatePricingUI();
  }

  function openAuthModal(defaultTab = 'login') {
    el.authModal.style.display = 'flex';
    if (defaultTab === 'register') {
      el.authTabRegister.click();
    } else {
      el.authTabLogin.click();
    }
  }

  function closeAuthModal() {
    el.authModal.style.display = 'none';
    el.loginError.style.display = 'none';
    el.registerError.style.display = 'none';
  }

  // Load and Render Documents
  async function loadDocuments() {
    el.resultsCount.textContent = 'Searching legislative catalog...';
    try {
      const data = await API.getDocuments(state.searchParams);
      state.documents = data.documents;
      renderDocumentGrid(data.documents);
      el.resultsCount.textContent = `Showing ${data.documents.length} Enactment${data.documents.length === 1 ? '' : 's'}`;
    } catch (err) {
      el.resultsCount.textContent = 'Error loading enactments';
      showToast(err.message || 'Failed to fetch documents', 'error');
    }
  }

  function renderDocumentGrid(documents) {
    if (!documents || documents.length === 0) {
      el.documentsGrid.innerHTML = '';
      el.noResultsState.style.display = 'block';
      return;
    }

    el.noResultsState.style.display = 'none';
    el.documentsGrid.innerHTML = documents.map(doc => {
      const statusClass = doc.legal_status;
      const statusLabels = {
        verified: 'Verified Active Law',
        draft: 'Draft Formulation',
        pending_verification: 'Pending Gazette Verification',
        superseded: 'Superseded Enactment',
        archived: 'Archived Historical',
      };
      const statusLabel = statusLabels[doc.legal_status] || doc.legal_status;

      let supersessionHtml = '';
      if (doc.legal_status === 'superseded') {
        const targetTitle = doc.superseded_by_title || 'New Central Labour Code';
        const targetSlug = doc.superseded_by_slug;
        supersessionHtml = `
          <div class="superseded-card-callout">
            <span>⚠️ Superseded by:</span>
            ${targetSlug ? `<a href="#doc/${targetSlug}" data-slug="${targetSlug}" class="doc-link">${targetTitle}</a>` : `<span>${targetTitle}</span>`}
          </div>
        `;
      }

      let missingHtml = '';
      if (doc.has_missing_info) {
        const missingCount = doc.missing_fields?.length || (doc.verification_status === 'unverified' ? 1 : 0);
        missingHtml = `
          <div class="missing-info-card-callout">
            <span>ℹ️ <strong>Pending Information:</strong> ${missingCount} item(s) unverified or pending notification.</span>
          </div>
        `;
      }

      return `
        <article class="doc-card" data-slug="${doc.slug}" id="card-${doc.slug}">
          <div class="doc-card-header">
            <div class="doc-badge-group">
              <span class="badge-status ${statusClass}">${statusLabel}</span>
              <span class="badge-type">${doc.document_type}</span>
              <span class="badge-jurisdiction">${doc.state}</span>
            </div>
          </div>

          <h3 class="doc-card-title doc-link" data-slug="${doc.slug}">${doc.title}</h3>
          <div class="doc-card-number">${doc.document_number || 'Enactment Number Unrecorded'} • ${doc.issuing_authority}</div>

          <p class="doc-card-summary">${doc.summary}</p>

          ${supersessionHtml}
          ${missingHtml}

          <div class="doc-card-meta">
            <div class="meta-item">
              <span>Published:</span> <strong>${doc.publication_date}</strong>
            </div>
            <div class="meta-item">
              <span>Effective:</span> <strong>${doc.effective_date || 'Pending Notification'}</strong>
            </div>
            <div class="meta-item">
              <span>Citation:</span> <strong>${doc.official_citation.slice(0, 32)}...</strong>
            </div>
            <div class="meta-item">
              <span>Verification:</span> <strong>${doc.verification_status.toUpperCase()}</strong>
            </div>
          </div>

          <div class="doc-card-actions">
            <button class="btn-read-doc doc-link" data-slug="${doc.slug}">
              Read Full Document &rsaquo;
            </button>
            <a href="${doc.official_source_url}" target="_blank" rel="noopener noreferrer" class="btn-source-link" title="Open Official Gazette Source">
              Official Source ↗
            </a>
          </div>
        </article>
      `;
    }).join('');

    // Attach click listeners to title & read buttons
    el.documentsGrid.querySelectorAll('.doc-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const slug = link.dataset.slug;
        openDocumentReader(slug);
      });
    });
  }

  // Open Dedicated Document Reader Page
  async function openDocumentReader(slugOrId) {
    el.documentReaderContent.innerHTML = `
      <div style="text-align:center; padding:60px 20px;">
        <div class="pulse-dot" style="margin:0 auto 16px;"></div>
        <p style="color:var(--text-muted);">Loading official legal document and verified provisions...</p>
      </div>
    `;
    switchView('reader');

    try {
      const data = await API.getDocument(slugOrId);
      state.currentDocument = data.document;
      renderDocumentReader(data.document);
    } catch (err) {
      el.documentReaderContent.innerHTML = `
        <div class="empty-state">
          <h3>Error loading document</h3>
          <p>${err.message}</p>
          <button class="btn-primary" onclick="window.history.back()">Go Back</button>
        </div>
      `;
    }
  }

  function renderDocumentReader(doc) {
    el.breadSubject.textContent = doc.subject_category;
    el.breadDocTitle.textContent = doc.short_title || doc.title;

    const statusLabels = {
      verified: 'Verified Active Law',
      draft: 'Draft Formulation',
      pending_verification: 'Pending Gazette Verification',
      superseded: 'Superseded Enactment',
      archived: 'Archived Historical',
    };

    let supersededAlertHtml = '';
    if (doc.legal_status === 'superseded' && doc.superseded_by_title) {
      supersededAlertHtml = `
        <div class="reader-alert-banner alert-superseded">
          <div class="alert-icon">⚠️</div>
          <div class="alert-body">
            <h4>Superseded Statutory Status</h4>
            <p>
              This enactment has been consolidated and will be superseded by 
              <strong><a href="#doc/${doc.superseded_by_slug}" id="successorLink">${doc.superseded_by_title}</a></strong> 
              upon comprehensive notification of central/state enforcement rules.
            </p>
          </div>
        </div>
      `;
    }

    let consolidatingAlertHtml = '';
    if (doc.superseded_acts && doc.superseded_acts.length > 0) {
      const actsList = doc.superseded_acts.map(a => `<li><a href="#doc/${a.slug}" class="reader-sub-link" data-slug="${a.slug}">${a.title}</a> (${a.document_number || 'Act'})</li>`).join('');
      consolidatingAlertHtml = `
        <div class="reader-alert-banner" style="background:rgba(14, 165, 233, 0.1); border:1px solid rgba(14, 165, 233, 0.3); color:#e0f2fe;">
          <div class="alert-icon">📚</div>
          <div class="alert-body">
            <h4>Legislative Consolidation</h4>
            <p>This Code consolidates and replaces the following erstwhile labour enactments:</p>
            <ul>${actsList}</ul>
          </div>
        </div>
      `;
    }

    let missingFieldsHtml = '';
    if (doc.missing_fields && doc.missing_fields.length > 0) {
      const items = doc.missing_fields.map(m => `<li>${m}</li>`).join('');
      missingFieldsHtml = `
        <div class="reader-alert-banner alert-missing">
          <div class="alert-icon">ℹ️</div>
          <div class="alert-body">
            <h4>Verification & Missing Information Notes</h4>
            <p>The legal editorial board notes the following pending items for this document:</p>
            <ul>${items}</ul>
          </div>
        </div>
      `;
    }

    // Sections HTML
    let sectionsHtml = '';
    if (doc.sections && doc.sections.length > 0) {
      sectionsHtml = `
        <div class="sections-list">
          ${doc.sections.map(sec => `
            <div class="section-item-card" id="sec-${sec.id}">
              <div class="section-item-header">
                <span class="section-number-pill">${sec.section_number}</span>
                <span style="font-size:0.75rem; color:var(--text-dim);">Section Order #${sec.order_index}</span>
              </div>
              <h4 class="section-title">${sec.title}</h4>
              <div class="section-content">${sec.content}</div>
            </div>
          `).join('')}
        </div>
      `;
    } else {
      sectionsHtml = `
        <div style="background:rgba(255,255,255,0.03); padding:20px; border-radius:var(--radius-md); text-align:center; color:var(--text-muted);">
          Key section breakdown is being codified for this document. Full statutory text available below.
        </div>
      `;
    }

    // Amendments HTML
    let amendmentsHtml = '';
    if (doc.amendments && doc.amendments.length > 0) {
      amendmentsHtml = `
        <div class="sections-list">
          ${doc.amendments.map(amd => `
            <div class="section-item-card">
              <div class="section-item-header">
                <span class="section-number-pill" style="background:rgba(245, 158, 11, 0.2); color:#fbbf24;">${amd.notification_number || 'Amendment'}</span>
                <span style="font-size:0.8rem; color:var(--text-muted);">Enacted: ${amd.amendment_date}</span>
              </div>
              <h4 class="section-title">${amd.amending_act_title}</h4>
              <p style="color:#cbd5e1; font-size:0.95rem; margin-bottom:8px;">${amd.description}</p>
              ${amd.source_url ? `<a href="${amd.source_url}" target="_blank" rel="noopener noreferrer" style="font-size:0.8rem;">View Amendment Notification ↗</a>` : ''}
            </div>
          `).join('')}
        </div>
      `;
    } else {
      amendmentsHtml = `<p style="color:var(--text-muted); padding:20px 0;">No subsequent statutory amendments registered for this enactment.</p>`;
    }

    // Audit logs HTML
    let auditHtml = '';
    if (doc.audit_logs && doc.audit_logs.length > 0) {
      auditHtml = `
        <table class="admin-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action</th>
              <th>Status Transition</th>
              <th>Verified By</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${doc.audit_logs.map(log => `
              <tr>
                <td>${log.created_at.slice(0, 16).replace('T', ' ')}</td>
                <td><span class="badge-type">${log.action}</span></td>
                <td>${log.previous_status || 'initial'} &rarr; <strong>${log.new_status}</strong></td>
                <td>${log.author_name || 'System Registrar'}</td>
                <td>${log.notes || '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else {
      auditHtml = `<p style="color:var(--text-muted); padding:20px 0;">No verification audit logs recorded.</p>`;
    }

    el.documentReaderContent.innerHTML = `
      <div class="doc-header-card">
        <div class="doc-header-top">
          <div>
            <div class="doc-badge-group" style="margin-bottom:12px;">
              <span class="badge-status ${doc.legal_status}">${statusLabels[doc.legal_status] || doc.legal_status}</span>
              <span class="badge-type">${doc.document_type.toUpperCase()}</span>
              <span class="badge-jurisdiction">${doc.state}</span>
              <span class="badge-status ${doc.verification_status === 'verified' ? 'verified' : 'draft'}">
                ${doc.verification_status === 'verified' ? '✓ Verified Gazette Source' : '⚠ Unverified Draft'}
              </span>
            </div>
            <h1 class="doc-title-h1">${doc.title}</h1>
            <div class="doc-official-citation">Official Citation: ${doc.official_citation}</div>
          </div>
        </div>

        <div class="doc-header-meta-grid">
          <div class="doc-meta-cell">
            <span class="doc-meta-label">Issuing Authority</span>
            <span class="doc-meta-val">${doc.issuing_authority}</span>
          </div>
          <div class="doc-meta-cell">
            <span class="doc-meta-label">Publication Date</span>
            <span class="doc-meta-val">${doc.publication_date}</span>
          </div>
          <div class="doc-meta-cell">
            <span class="doc-meta-label">Effective Enforcement</span>
            <span class="doc-meta-val">${doc.effective_date || 'Pending Official Gazette Notification'}</span>
          </div>
          <div class="doc-meta-cell">
            <span class="doc-meta-label">Last Verification Date</span>
            <span class="doc-meta-val">${doc.last_verified_date || 'Pending Editorial Verification'}</span>
          </div>
        </div>

        <div class="reader-actions-bar">
          <a href="${doc.official_source_url}" target="_blank" rel="noopener noreferrer" class="btn-primary" style="font-size:0.88rem;">
            Official Gazette Source ↗
          </a>
          <button id="downloadTextBtn" class="btn-secondary" style="font-size:0.88rem;">
            📥 Download Statutory Text (.txt)
          </button>
          ${state.currentUser?.role === 'admin' || state.currentUser?.role === 'editor' ? `
            <button id="readerEditBtn" class="btn-secondary" style="font-size:0.88rem; color:#f59e0b; border-color:rgba(245, 158, 11, 0.4);">
              ✏️ Edit in Registry
            </button>
          ` : ''}
        </div>
      </div>

      ${supersededAlertHtml}
      ${consolidatingAlertHtml}
      ${missingFieldsHtml}

      <div class="reader-tabs">
        <button class="reader-tab active" data-tab="statutoryText">Full Statutory Text</button>
        <button class="reader-tab" data-tab="codifiedSections">Key Codified Provisions (${doc.sections?.length || 0})</button>
        <button class="reader-tab" data-tab="amendments">Amendments & Notifications (${doc.amendments?.length || 0})</button>
        <button class="reader-tab" data-tab="auditTrail">Verification Audit Trail (${doc.audit_logs?.length || 0})</button>
      </div>

      <div id="tabContentStatutoryText" class="tab-pane active">
        <div class="statutory-text-container">
          <div style="font-family:var(--font-display); font-size:1.1rem; font-weight:700; color:#38bdf8; margin-bottom:14px;">
            Statutory Executive Summary
          </div>
          <p style="margin-bottom:24px; color:#cbd5e1;">${doc.summary}</p>
          <hr style="border:none; border-top:1px solid var(--border-subtle); margin-bottom:24px;">
          <div style="font-family:var(--font-display); font-size:1.1rem; font-weight:700; color:#fff; margin-bottom:14px;">
            Codified Enactment Text
          </div>
          <pre>${doc.full_text}</pre>
        </div>
      </div>

      <div id="tabContentCodifiedSections" class="tab-pane" style="display:none;">
        ${sectionsHtml}
      </div>

      <div id="tabContentAmendments" class="tab-pane" style="display:none;">
        ${amendmentsHtml}
      </div>

      <div id="tabContentAuditTrail" class="tab-pane" style="display:none;">
        <div class="admin-queue-card" style="padding:16px;">
          ${auditHtml}
        </div>
      </div>
    `;

    // Tab switcher logic
    const tabs = el.documentReaderContent.querySelectorAll('.reader-tab');
    const panes = {
      statutoryText: el.documentReaderContent.querySelector('#tabContentStatutoryText'),
      codifiedSections: el.documentReaderContent.querySelector('#tabContentCodifiedSections'),
      amendments: el.documentReaderContent.querySelector('#tabContentAmendments'),
      auditTrail: el.documentReaderContent.querySelector('#tabContentAuditTrail'),
    };

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const tabKey = tab.dataset.tab;
        for (const [key, pane] of Object.entries(panes)) {
          if (pane) {
            pane.style.display = key === tabKey ? 'block' : 'none';
          }
        }
      });
    });

    // Download button handler
    const dlBtn = document.getElementById('downloadTextBtn');
    if (dlBtn) {
      dlBtn.addEventListener('click', () => {
        window.location.href = `/api/documents/${doc.slug}/download`;
        showToast(`Downloading compilation for '${doc.short_title}'`, 'success');
      });
    }

    // Successor link handler
    const successorLink = document.getElementById('successorLink');
    if (successorLink) {
      successorLink.addEventListener('click', (e) => {
        e.preventDefault();
        openDocumentReader(doc.superseded_by_slug);
      });
    }

    // Sub links for consolidated acts
    el.documentReaderContent.querySelectorAll('.reader-sub-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        openDocumentReader(link.dataset.slug);
      });
    });

    // Reader edit button
    const editBtn = document.getElementById('readerEditBtn');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        openDocEditor(doc);
      });
    }
  }

  // Catalog & Verification Stats View
  async function loadStats() {
    el.statsContainer.innerHTML = `
      <div style="text-align:center; padding:60px 20px;">
        <div class="pulse-dot" style="margin:0 auto 16px;"></div>
        <p style="color:var(--text-muted);">Auditing document inventory & verification metrics...</p>
      </div>
    `;

    try {
      const data = await API.getStats();
      state.stats = data;
      renderStats(data);
    } catch (err) {
      el.statsContainer.innerHTML = `<p class="form-error">Failed to load statistics: ${err.message}</p>`;
    }
  }

  function renderStats(data) {
    const m = data.metrics;
    const cb = data.coverage_breakdown;

    el.statsContainer.innerHTML = `
      <div class="stats-hero">
        <span class="hero-badge">Verified Inventory Transparency</span>
        <h2>Catalog Coverage & Verification Audit</h2>
        <p>${data.inventory_disclaimer.statement}</p>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-val">${m.total_documents}</div>
          <div class="kpi-label">Total Indexed Statutes</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val" style="color:var(--status-verified-text);">${m.verified_documents}</div>
          <div class="kpi-label">Gazette Verified Enactments</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val" style="color:var(--status-draft-text);">${m.unverified_documents}</div>
          <div class="kpi-label">Draft / Pending Verification</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val" style="color:#a78bfa;">${m.verification_percentage}%</div>
          <div class="kpi-label">Library Verification Ratio</div>
        </div>
      </div>

      <div class="breakdown-sections-grid">
        <div class="breakdown-card">
          <h3>Statutes by Legal Status</h3>
          <table class="breakdown-table">
            <thead>
              <tr>
                <th>Legal Status</th>
                <th style="text-align:right;">Document Count</th>
              </tr>
            </thead>
            <tbody>
              ${cb.by_status.map(s => `
                <tr>
                  <td><span class="badge-status ${s.legal_status}">${s.legal_status.toUpperCase()}</span></td>
                  <td style="text-align:right; font-weight:700;">${s.count}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="breakdown-card">
          <h3>Jurisdictional Distribution</h3>
          <table class="breakdown-table">
            <thead>
              <tr>
                <th>Jurisdiction / State</th>
                <th style="text-align:right;">Enactments</th>
              </tr>
            </thead>
            <tbody>
              ${cb.by_state.map(s => `
                <tr>
                  <td><strong>${s.state}</strong></td>
                  <td style="text-align:right; font-weight:700;">${s.count}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="breakdown-card">
          <h3>Subject Category Coverage</h3>
          <table class="breakdown-table">
            <thead>
              <tr>
                <th>Subject Area</th>
                <th style="text-align:right;">Enactments</th>
              </tr>
            </thead>
            <tbody>
              ${cb.by_subject.map(s => `
                <tr>
                  <td>${s.subject_category}</td>
                  <td style="text-align:right; font-weight:700;">${s.count}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="breakdown-card">
          <h3>Enactment Types</h3>
          <table class="breakdown-table">
            <thead>
              <tr>
                <th>Document Classification</th>
                <th style="text-align:right;">Total Records</th>
              </tr>
            </thead>
            <tbody>
              ${cb.by_type.map(s => `
                <tr>
                  <td><span class="badge-type">${s.document_type.toUpperCase()}</span></td>
                  <td style="text-align:right; font-weight:700;">${s.count}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="pricing-guarantee" style="text-align:left;">
        <strong>Legal Accuracy Policy:</strong> The India Labour Law Library strictly refuses to claim complete nationwide coverage until subordinate state rules are fully verified against state gazettes. All draft or unverified laws remain flagged to avoid misleading compliance teams.
      </div>
    `;
  }

  // Administrator Dashboard & Verification Queue
  async function renderAdminDashboard() {
    if (!state.currentUser || (state.currentUser.role !== 'admin' && state.currentUser.role !== 'editor')) {
      el.adminContainer.innerHTML = `
        <div class="empty-state">
          <h3>Restricted Access</h3>
          <p>You must be signed in with an Administrator or Senior Editor account to access the registry console.</p>
          <button class="btn-primary" onclick="window.appOpenAuthModal()">Sign In as Staff</button>
        </div>
      `;
      return;
    }

    el.adminContainer.innerHTML = `
      <div class="admin-header">
        <div>
          <h2>Legislative Registry & Editorial Administration</h2>
          <p style="color:var(--text-muted);">Manage statutory inventory, verify gazette notifications, and execute database backups.</p>
        </div>
        <div class="admin-actions">
          <button id="adminNewDocBtn" class="btn-primary">
            + Register New Enactment
          </button>
          ${state.currentUser.role === 'admin' ? `
            <button id="adminBackupBtn" class="btn-secondary" title="Execute immediate SQLite WAL snapshot">
              💾 Trigger Database Backup
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Verification Queue -->
      <div class="admin-queue-card">
        <h3>Pending Verification & Draft Queue</h3>
        <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:16px;">
          The following enactments require gazette cross-referencing and verification approval before being classified as verified law.
        </p>
        <div id="adminQueueContent">Loading review items...</div>
      </div>

      <!-- Full Catalog Admin Table -->
      <div class="admin-queue-card">
        <h3>All Registered Enactments</h3>
        <div id="adminAllDocsContent">Loading complete catalog...</div>
      </div>
    `;

    document.getElementById('adminNewDocBtn').addEventListener('click', () => {
      openDocEditor();
    });

    const backupBtn = document.getElementById('adminBackupBtn');
    if (backupBtn) {
      backupBtn.addEventListener('click', async () => {
        try {
          backupBtn.textContent = 'Creating Backup Snapshot...';
          const res = await API.triggerBackup();
          showToast(`Backup created: ${res.backup.filename} (${Math.round(res.backup.sizeBytes / 1024)} KB) - Integrity: OK`, 'success');
        } catch (err) {
          showToast(`Backup failed: ${err.message}`, 'error');
        } finally {
          backupBtn.textContent = '💾 Trigger Database Backup';
        }
      });
    }

    loadAdminTables();
  }

  async function loadAdminTables() {
    try {
      const data = await API.getDocuments({});
      const docs = data.documents;

      // Pending queue
      const queueDocs = docs.filter(d => d.legal_status === 'draft' || d.legal_status === 'pending_verification' || d.verification_status === 'unverified');
      const queueContainer = document.getElementById('adminQueueContent');

      if (queueDocs.length === 0) {
        queueContainer.innerHTML = `<p style="color:#10b981; font-weight:500;">✓ Verification queue is clear. All current documents have verified status.</p>`;
      } else {
        queueContainer.innerHTML = `
          <table class="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Jurisdiction</th>
                <th>Status</th>
                <th>Verification</th>
                <th style="text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${queueDocs.map(d => `
                <tr>
                  <td><strong>${d.title}</strong></td>
                  <td><span class="badge-type">${d.document_type}</span></td>
                  <td>${d.state}</td>
                  <td><span class="badge-status ${d.legal_status}">${d.legal_status}</span></td>
                  <td><span class="badge-status ${d.verification_status === 'verified' ? 'verified' : 'draft'}">${d.verification_status}</span></td>
                  <td style="text-align:right;">
                    <button class="btn-primary btn-admin-verify" data-id="${d.id}" style="padding:4px 10px; font-size:0.75rem;">
                      ✓ Verify & Publish
                    </button>
                    <button class="btn-secondary btn-admin-edit" data-id="${d.id}" style="padding:4px 8px; font-size:0.75rem;">
                      Edit
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;

        queueContainer.querySelectorAll('.btn-admin-verify').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            try {
              await API.verifyDocument(id, 'verified', 'Verified by staff editorial review against official gazette copy.');
              showToast('Document verified and published!', 'success');
              loadAdminTables();
              loadDocuments();
            } catch (err) {
              showToast(err.message, 'error');
            }
          });
        });

        queueContainer.querySelectorAll('.btn-admin-edit').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const doc = docs.find(d => d.id === id);
            if (doc) openDocEditor(doc);
          });
        });
      }

      // All documents table
      const allContainer = document.getElementById('adminAllDocsContent');
      allContainer.innerHTML = `
        <table class="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Document Number</th>
              <th>Subject</th>
              <th>Status</th>
              <th>Published</th>
              <th style="text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${docs.map(d => `
              <tr>
                <td><strong>${d.title}</strong></td>
                <td>${d.document_number || '—'}</td>
                <td>${d.subject_category}</td>
                <td><span class="badge-status ${d.legal_status}">${d.legal_status}</span></td>
                <td>${d.publication_date}</td>
                <td style="text-align:right;">
                  <button class="btn-secondary btn-admin-edit" data-id="${d.id}" style="padding:4px 8px; font-size:0.75rem;">
                    Edit
                  </button>
                  ${state.currentUser.role === 'admin' ? `
                    <button class="btn-secondary btn-admin-delete" data-id="${d.id}" data-title="${d.title}" style="padding:4px 8px; font-size:0.75rem; color:#ef4444; border-color:rgba(239, 68, 68, 0.4);">
                      Delete
                    </button>
                  ` : ''}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      allContainer.querySelectorAll('.btn-admin-edit').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          const doc = docs.find(d => d.id === id);
          if (doc) openDocEditor(doc);
        });
      });

      allContainer.querySelectorAll('.btn-admin-delete').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          const title = btn.dataset.title;
          if (confirm(`Are you sure you want to delete '${title}'? This action is permanent.`)) {
            try {
              await API.deleteDocument(id);
              showToast(`Deleted '${title}'`, 'info');
              loadAdminTables();
              loadDocuments();
            } catch (err) {
              showToast(err.message, 'error');
            }
          }
        });
      });
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // Document Editor Modal (Add / Edit)
  function openDocEditor(doc = null) {
    el.docEditorError.style.display = 'none';
    el.docEditorModal.style.display = 'flex';

    // Populate superseded options
    el.formSupersededBy.innerHTML = '<option value="">None (Active primary law)</option>' +
      state.documents
        .filter(d => !doc || d.id !== doc.id)
        .map(d => `<option value="${d.id}">${d.title}</option>`)
        .join('');

    if (doc) {
      document.getElementById('docEditorModalTitle').textContent = `Edit Enactment: ${doc.short_title || doc.title}`;
      document.getElementById('editDocId').value = doc.id;
      document.getElementById('formTitle').value = doc.title;
      document.getElementById('formShortTitle').value = doc.short_title || '';
      document.getElementById('formDocNumber').value = doc.document_number || '';
      document.getElementById('formDocType').value = doc.document_type;
      document.getElementById('formJurisdiction').value = doc.jurisdiction;
      document.getElementById('formState').value = doc.state;
      document.getElementById('formIssuingAuthority').value = doc.issuing_authority;
      document.getElementById('formSubject').value = doc.subject_category;
      document.getElementById('formPubDate').value = doc.publication_date;
      document.getElementById('formEffDate').value = doc.effective_date || '';
      document.getElementById('formLegalStatus').value = doc.legal_status;
      document.getElementById('formVerificationStatus').value = doc.verification_status;
      document.getElementById('formCitation').value = doc.official_citation;
      document.getElementById('formSourceUrl').value = doc.official_source_url;
      document.getElementById('formSupersededBy').value = doc.superseded_by_id || '';
      document.getElementById('formSummary').value = doc.summary;
      document.getElementById('formFullText').value = doc.full_text;
    } else {
      document.getElementById('docEditorModalTitle').textContent = 'Register New Legal Enactment';
      el.documentForm.reset();
      document.getElementById('editDocId').value = '';
      document.getElementById('formPubDate').value = new Date().toISOString().slice(0, 10);
      document.getElementById('formState').value = 'Central (All India)';
      document.getElementById('formVerificationStatus').value = 'verified';
      document.getElementById('formLegalStatus').value = 'verified';
    }
  }

  function closeDocEditor() {
    el.docEditorModal.style.display = 'none';
    el.docEditorError.style.display = 'none';
  }

  // Pricing & Subscription Updates
  function updatePricingUI() {
    const user = state.currentUser;
    const tier = user?.subscription_tier || 'free';

    const freeBtn = el.selectFreeTierBtn;
    const proBtn = el.selectProTierBtn;
    const entBtn = el.selectEnterpriseTierBtn;

    if (!user) {
      freeBtn.textContent = 'Sign In to Select';
      proBtn.textContent = 'Sign In to Upgrade';
      entBtn.textContent = 'Sign In to Upgrade';
    } else {
      freeBtn.textContent = tier === 'free' ? 'Current Plan' : 'Switch to Free';
      proBtn.textContent = tier === 'pro' ? 'Current Plan' : 'Switch to Pro';
      entBtn.textContent = tier === 'enterprise' ? 'Current Plan' : 'Switch to Enterprise';

      freeBtn.disabled = tier === 'free';
      proBtn.disabled = tier === 'pro';
      entBtn.disabled = tier === 'enterprise';
    }
  }

  async function handleSubscriptionChange(targetTier) {
    if (!state.currentUser) {
      openAuthModal();
      return;
    }
    try {
      const updatedUser = await API.updateSubscription(targetTier, 'active');
      state.currentUser = updatedUser;
      updateAuthUI();
      showToast(`Subscription updated to ${targetTier.toUpperCase()} plan!`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // Event Listeners Setup
  function setupEventListeners() {
    // Navigation
    el.navHome.addEventListener('click', () => switchView('home'));
    el.navStats.addEventListener('click', () => switchView('stats'));
    el.navSubscription.addEventListener('click', () => switchView('subscription'));
    el.navAdmin.addEventListener('click', () => switchView('admin'));
    el.brandHomeLink.addEventListener('click', () => switchView('home'));
    el.backToLibraryBtn.addEventListener('click', () => switchView('home'));

    if (el.dismissBannerBtn) {
      el.dismissBannerBtn.addEventListener('click', () => {
        el.announcementBanner.style.display = 'none';
      });
    }

    // Search input & controls
    let debounceTimer = null;
    el.mainSearchInput.addEventListener('input', () => {
      const val = el.mainSearchInput.value.trim();
      el.searchClearBtn.style.display = val ? 'block' : 'none';
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        state.searchParams.q = val;
        loadDocuments();
      }, 300);
    });

    el.mainSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        clearTimeout(debounceTimer);
        state.searchParams.q = el.mainSearchInput.value.trim();
        loadDocuments();
      }
    });

    el.executeSearchBtn.addEventListener('click', () => {
      clearTimeout(debounceTimer);
      state.searchParams.q = el.mainSearchInput.value.trim();
      loadDocuments();
    });

    el.searchClearBtn.addEventListener('click', () => {
      el.mainSearchInput.value = '';
      el.searchClearBtn.style.display = 'none';
      state.searchParams.q = '';
      loadDocuments();
    });

    // Preset chips
    el.quickPresets.querySelectorAll('.preset-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const query = chip.dataset.query;
        const status = chip.dataset.status;

        if (query) {
          el.mainSearchInput.value = query;
          el.searchClearBtn.style.display = 'block';
          state.searchParams.q = query;
          state.searchParams.legal_status = '';
          el.filterStatus.value = '';
        } else if (status) {
          el.filterStatus.value = status;
          state.searchParams.legal_status = status;
          el.mainSearchInput.value = '';
          state.searchParams.q = '';
        }
        loadDocuments();
      });
    });

    // Filter Selects
    el.filterJurisdiction.addEventListener('change', () => {
      state.searchParams.jurisdiction = el.filterJurisdiction.value;
      loadDocuments();
    });

    el.filterState.addEventListener('change', () => {
      state.searchParams.state = el.filterState.value;
      loadDocuments();
    });

    el.filterSubject.addEventListener('change', () => {
      state.searchParams.subject = el.filterSubject.value;
      loadDocuments();
    });

    el.filterStatus.addEventListener('change', () => {
      state.searchParams.legal_status = el.filterStatus.value;
      loadDocuments();
    });

    el.filterType.addEventListener('change', () => {
      state.searchParams.document_type = el.filterType.value;
      loadDocuments();
    });

    const resetFilters = () => {
      state.searchParams = {
        q: '',
        jurisdiction: '',
        state: '',
        subject: '',
        legal_status: '',
        document_type: '',
      };
      el.mainSearchInput.value = '';
      el.searchClearBtn.style.display = 'none';
      el.filterJurisdiction.value = '';
      el.filterState.value = '';
      el.filterSubject.value = '';
      el.filterStatus.value = '';
      el.filterType.value = '';
      loadDocuments();
    };

    el.resetFiltersBtn.addEventListener('click', resetFilters);
    el.resetSearchFromEmptyBtn.addEventListener('click', resetFilters);

    // Subscription buttons
    el.selectFreeTierBtn.addEventListener('click', () => handleSubscriptionChange('free'));
    el.selectProTierBtn.addEventListener('click', () => handleSubscriptionChange('pro'));
    el.selectEnterpriseTierBtn.addEventListener('click', () => handleSubscriptionChange('enterprise'));

    // Auth Modal tab switching
    el.authTabLogin.addEventListener('click', () => {
      el.authTabLogin.classList.add('active');
      el.authTabRegister.classList.remove('active');
      el.loginForm.style.display = 'block';
      el.registerForm.style.display = 'none';
      document.getElementById('authModalTitle').textContent = 'Sign In to Labour Law Library';
    });

    el.authTabRegister.addEventListener('click', () => {
      el.authTabRegister.classList.add('active');
      el.authTabLogin.classList.remove('active');
      el.registerForm.style.display = 'block';
      el.loginForm.style.display = 'none';
      document.getElementById('authModalTitle').textContent = 'Create Subscriber Account';
    });

    el.closeAuthModalBtn.addEventListener('click', closeAuthModal);
    el.authModal.addEventListener('click', (e) => {
      if (e.target === el.authModal) closeAuthModal();
    });

    // Login Form Submit
    el.loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      el.loginError.style.display = 'none';
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;

      try {
        const res = await API.login(email, password);
        state.currentUser = res.user;
        updateAuthUI();
        closeAuthModal();
        showToast(`Welcome back, ${res.user.full_name}!`, 'success');
        if (state.currentView === 'admin') renderAdminDashboard();
      } catch (err) {
        el.loginError.textContent = err.message || 'Invalid credentials';
        el.loginError.style.display = 'block';
      }
    });

    // Register Form Submit
    el.registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      el.registerError.style.display = 'none';
      const fullName = document.getElementById('regFullName').value;
      const email = document.getElementById('regEmail').value;
      const password = document.getElementById('regPassword').value;
      const tier = document.getElementById('regTier').value;

      try {
        const res = await API.register(email, password, fullName, tier);
        state.currentUser = res.user;
        updateAuthUI();
        closeAuthModal();
        showToast(`Account registered successfully on ${tier.toUpperCase()} tier!`, 'success');
      } catch (err) {
        el.registerError.textContent = err.message || 'Registration failed';
        el.registerError.style.display = 'block';
      }
    });

    // Quick Test Profile Demo Buttons
    const demoProfiles = [
      { btn: el.demoAdminBtn, email: 'admin@labourlaws.in', pass: 'Admin@12345!' },
      { btn: el.demoEditorBtn, email: 'editor@labourlaws.in', pass: 'Editor@12345!' },
      { btn: el.demoProBtn, email: 'pro@subscriber.in', pass: 'Subscriber@12345!' },
      { btn: el.demoFreeBtn, email: 'free@subscriber.in', pass: 'FreeUser@12345!' },
    ];

    demoProfiles.forEach(p => {
      p.btn.addEventListener('click', async () => {
        document.getElementById('loginEmail').value = p.email;
        document.getElementById('loginPassword').value = p.pass;
        try {
          const res = await API.login(p.email, p.pass);
          state.currentUser = res.user;
          updateAuthUI();
          closeAuthModal();
          showToast(`Logged in as ${res.user.full_name} (${res.user.role.toUpperCase()})`, 'success');
          if (res.user.role === 'admin' || res.user.role === 'editor') {
            switchView('admin');
          }
        } catch (err) {
          el.loginError.textContent = err.message;
          el.loginError.style.display = 'block';
        }
      });
    });

    // Doc Editor Modal events
    el.closeDocEditorModalBtn.addEventListener('click', closeDocEditor);
    el.cancelDocEditorBtn.addEventListener('click', closeDocEditor);
    el.docEditorModal.addEventListener('click', (e) => {
      if (e.target === el.docEditorModal) closeDocEditor();
    });

    // Doc Editor Form Submit
    el.documentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      el.docEditorError.style.display = 'none';

      const docId = document.getElementById('editDocId').value;
      const docData = {
        title: document.getElementById('formTitle').value,
        short_title: document.getElementById('formShortTitle').value,
        document_number: document.getElementById('formDocNumber').value,
        document_type: document.getElementById('formDocType').value,
        jurisdiction: document.getElementById('formJurisdiction').value,
        state: document.getElementById('formState').value,
        issuing_authority: document.getElementById('formIssuingAuthority').value,
        subject_category: document.getElementById('formSubject').value,
        publication_date: document.getElementById('formPubDate').value,
        effective_date: document.getElementById('formEffDate').value || null,
        legal_status: document.getElementById('formLegalStatus').value,
        verification_status: document.getElementById('formVerificationStatus').value,
        official_citation: document.getElementById('formCitation').value,
        official_source_url: document.getElementById('formSourceUrl').value,
        superseded_by_id: document.getElementById('formSupersededBy').value || null,
        summary: document.getElementById('formSummary').value,
        full_text: document.getElementById('formFullText').value,
      };

      try {
        if (docId) {
          await API.updateDocument(docId, docData);
          showToast('Enactment updated successfully', 'success');
        } else {
          await API.createDocument(docData);
          showToast('New enactment created and registered', 'success');
        }
        closeDocEditor();
        loadDocuments();
        if (state.currentView === 'admin') renderAdminDashboard();
      } catch (err) {
        el.docEditorError.textContent = err.message;
        el.docEditorError.style.display = 'block';
      }
    });

    // Footer doc links
    document.querySelectorAll('.footer-doc-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const slug = link.dataset.slug;
        openDocumentReader(slug);
      });
    });

    // Browser URL Hash Routing support (#doc/:slug)
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash;
      if (hash.startsWith('#doc/')) {
        const slug = hash.replace('#doc/', '');
        openDocumentReader(slug);
      } else if (hash === '#stats') {
        switchView('stats');
      } else if (hash === '#subscription') {
        switchView('subscription');
      } else if (hash === '#admin') {
        switchView('admin');
      } else if (hash === '#home' || !hash) {
        switchView('home');
      }
    });

    // Check initial hash on page load
    const initialHash = window.location.hash;
    if (initialHash.startsWith('#doc/')) {
      const slug = initialHash.replace('#doc/', '');
      openDocumentReader(slug);
    }
  }

  // Global helper for inline template buttons
  window.appOpenAuthModal = openAuthModal;

  // Initialize Application
  async function init() {
    updateAuthUI();
    setupEventListeners();

    // Verify session with server if token exists
    if (API.getToken()) {
      try {
        const user = await API.getMe();
        state.currentUser = user;
        updateAuthUI();
      } catch {
        // Token expired or invalid
        API.logout();
        state.currentUser = null;
        updateAuthUI();
      }
    }

    // Load initial document catalog
    await loadDocuments();
  }

  // Kickstart on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
