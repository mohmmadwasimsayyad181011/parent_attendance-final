/**
 * HOD / Admin Dashboard Management Application
 * Sanjivani University - Parent Meeting Attendance Portal
 */

document.addEventListener('DOMContentLoaded', () => {
  // Authentication Elements
  const authSection = document.getElementById('adminAuthSection');
  const dashboardSection = document.getElementById('adminDashboardSection');
  const loginForm = document.getElementById('adminLoginForm');
  const loginUser = document.getElementById('loginUsername');
  const loginPass = document.getElementById('loginPassword');
  const loginError = document.getElementById('loginError');
  const btnLogout = document.getElementById('btnLogout');

  // Year Pills Filter Elements
  const yearPills = document.querySelectorAll('.year-pill');
  const pillCountAll = document.getElementById('pillCountAll');
  const pillCountFirst = document.getElementById('pillCountFirst');
  const pillCountSecond = document.getElementById('pillCountSecond');
  const pillCountThird = document.getElementById('pillCountThird');
  const pillCountFinal = document.getElementById('pillCountFinal');

  // Dashboard Filters & Search
  const dateFilter = document.getElementById('filterDate');
  const classFilter = document.getElementById('filterClass');
  const statusFilter = document.getElementById('filterStatus');
  const searchInput = document.getElementById('searchQuery');
  const btnResetFilters = document.getElementById('btnResetFilters');

  // KPI Elements
  const kpiTotal = document.getElementById('kpiTotalEntries');
  const kpiPresent = document.getElementById('kpiPresentCount');
  const kpiPresentRate = document.getElementById('kpiPresentRate');
  const kpiAbsent = document.getElementById('kpiAbsentCount');
  const kpiAbsentRate = document.getElementById('kpiAbsentRate');
  const kpiCoverage = document.getElementById('kpiRosterCoverage');
  const classBreakdownContainer = document.getElementById('classBreakdownList');

  // View Tabs
  const tabRegistered = document.getElementById('tabRegistered');
  const tabAbsentees = document.getElementById('tabAbsentees');
  const badgeRegisteredCount = document.getElementById('badgeRegisteredCount');
  const badgeAbsenteeCount = document.getElementById('badgeAbsenteeCount');
  const registeredTableView = document.getElementById('registeredTableView');
  const absenteeTableView = document.getElementById('absenteeTableView');

  // Table Body Elements
  const recordsTableBody = document.getElementById('recordsTableBody');
  const absenteesTableBody = document.getElementById('absenteesTableBody');
  const tableEmptyState = document.getElementById('tableEmptyState');

  // Export Buttons
  const btnExportExcel = document.getElementById('btnExportExcel');
  const btnExportAbsentExcel = document.getElementById('btnExportAbsentExcel');
  const btnExportAbsentTable = document.getElementById('btnExportAbsentTable');
  const btnExportCsv = document.getElementById('btnExportCsv');

  // Modals & Action Buttons
  const btnOpenManualModal = document.getElementById('btnOpenManualModal');
  const btnOpenSettings = document.getElementById('btnOpenSettings');

  // Photo & Document Lightbox Modal
  const photoModal = document.getElementById('photoLightboxModal');
  const photoLightboxImg = document.getElementById('photoLightboxImg');
  const photoLightboxPdf = document.getElementById('photoLightboxPdf');
  const photoLightboxTitle = document.getElementById('photoLightboxTitle');
  const photoLightboxMeta = document.getElementById('photoLightboxMeta');
  const btnClosePhotoModal = document.getElementById('btnClosePhotoModal');

  // Manual Entry Modal
  const manualEntryModal = document.getElementById('manualEntryModal');
  const manualEntryForm = document.getElementById('manualEntryForm');
  const btnCloseManualModal = document.getElementById('btnCloseManualModal');

  // Settings Modal
  const settingsModal = document.getElementById('settingsModal');
  const settingsForm = document.getElementById('settingsForm');
  const btnCloseSettingsModal = document.getElementById('btnCloseSettingsModal');

  // Attendance Details Modal (Protected HOD View)
  const detailsModal = document.getElementById('attendanceDetailsModal');
  const btnCloseDetailsModal = document.getElementById('btnCloseDetailsModal');

  if (btnCloseDetailsModal) {
    btnCloseDetailsModal.addEventListener('click', () => {
      if (detailsModal) detailsModal.classList.remove('show');
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Live Sync Badge
  const liveSyncBadge = document.getElementById('liveSyncBadge');
  const liveSyncText = document.getElementById('liveSyncText');

  // State
  let currentTab = 'registered'; // 'registered' | 'absentees'
  let cachedRecords = [];
  let cachedAbsentees = [];
  let selectedYears = ['All']; // ['All'] or subset of ['First', 'Second', 'Third', 'Final']
  let livePollInterval = null;
  let lastPresentCount = -1;
  let lastTotalEntries = -1;

  // Re-render data when language changes
  document.addEventListener('languageChanged', () => {
    if (cachedRecords && cachedRecords.length > 0) {
      renderRecordsTable(cachedRecords);
    }
    if (cachedAbsentees) {
      renderAbsenteesTable(cachedAbsentees);
    }
    loadStats();
  });

  // ==========================================
  // AUTHENTICATION LOGIC
  // ==========================================
  async function checkAuth() {
    try {
      const res = await fetch('/api/admin/me');
      const data = await res.json();
      if (data.authenticated) {
        showDashboard(data);
      } else {
        showLogin();
      }
    } catch (err) {
      showLogin();
    }
  }

  function showLogin() {
    if (livePollInterval) clearInterval(livePollInterval);
    authSection.style.display = 'flex';
    dashboardSection.style.display = 'none';
  }

  function showDashboard(adminData) {
    authSection.style.display = 'none';
    dashboardSection.style.display = 'block';

    if (adminData && adminData.settings) {
      document.getElementById('dashInstName').textContent = adminData.settings.institution_name;
      document.getElementById('dashMeetingTitle').textContent = adminData.settings.meeting_title;
    }

    loadDashboardData();
    startLiveSync();
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      loginError.style.display = 'none';

      const username = loginUser.value.trim();
      const password = loginPass.value.trim();

      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();

        if (res.ok && data.success) {
          showDashboard(data.admin);
          showToast(window.t ? t('msg_admin_welcome', 'Welcome, Administrator!') : 'Welcome, Administrator!', 'success');
        } else {
          loginError.textContent = data.message || 'Invalid username or password';
          loginError.style.display = 'block';
        }
      } catch (err) {
        loginError.textContent = 'Server connection error. Please try again.';
        loginError.style.display = 'block';
      }
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      try {
        await fetch('/api/admin/logout', { method: 'POST' });
        showLogin();
        showToast(window.t ? t('msg_logged_out', 'Logged out successfully.') : 'Logged out successfully.', 'info');
      } catch (err) {
        showLogin();
      }
    });
  }

  // ==========================================
  // YEAR FILTER PILLS (MULTI-SELECT)
  // ==========================================
  function getYearsQueryParam() {
    if (!selectedYears || selectedYears.length === 0 || selectedYears.includes('All')) {
      return 'All';
    }
    return selectedYears.join(',');
  }

  function updateYearPillsUI() {
    yearPills.forEach(pill => {
      const yearKey = pill.dataset.year;
      if (selectedYears.includes(yearKey)) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });
  }

  yearPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const yearVal = pill.dataset.year;
      if (yearVal === 'All') {
        selectedYears = ['All'];
      } else {
        // Remove 'All' if selecting an individual year
        selectedYears = selectedYears.filter(y => y !== 'All');
        if (selectedYears.includes(yearVal)) {
          selectedYears = selectedYears.filter(y => y !== yearVal);
        } else {
          selectedYears.push(yearVal);
        }

        // If no year left selected, or all 4 specific years selected, default back to 'All'
        const allYears = ['First', 'Second', 'Third', 'Final'];
        if (selectedYears.length === 0 || allYears.every(y => selectedYears.includes(y))) {
          selectedYears = ['All'];
        }
      }

      updateYearPillsUI();
      loadDashboardData();
    });
  });

  // ==========================================
  // DASHBOARD DATA FETCHING & RENDERING
  // ==========================================
  async function loadDashboardData() {
    await Promise.all([
      loadStats(),
      loadRecords(),
      loadAbsentees()
    ]);
  }

  async function loadStats() {
    const dateVal = dateFilter ? dateFilter.value : '';
    const yearsParam = getYearsQueryParam();

    try {
      const res = await fetch(`/api/admin/stats?date=${encodeURIComponent(dateVal)}&years=${encodeURIComponent(yearsParam)}`);
      if (!res.ok) return;
      const data = await res.json();

      const totalStudents = data.total_students || 0;
      const presentCount = data.present_count || 0;
      const absentCount = data.absent_count || Math.max(0, totalStudents - presentCount);

      kpiTotal.textContent = totalStudents;
      kpiPresent.textContent = presentCount;
      kpiPresentRate.textContent = `${data.attendance_rate || 0}% Attendance Rate`;
      kpiAbsent.textContent = absentCount;
      kpiAbsentRate.textContent = `${data.absent_rate || 0}% Absentee Rate`;

      const coverageRate = totalStudents > 0 ? (presentCount / totalStudents * 100).toFixed(1) : '0';
      kpiCoverage.textContent = `Turnout: ${coverageRate}% (${presentCount} of ${totalStudents} students)`;

      // Render Class breakdown chips
      if (classBreakdownContainer && data.class_breakdown) {
        classBreakdownContainer.innerHTML = '';
        data.class_breakdown.forEach(item => {
          const chip = document.createElement('div');
          chip.className = 'class-stat-chip';
          chip.style.cssText = `
            background: white; border: 1px solid var(--border); border-radius: var(--radius-md);
            padding: 0.6rem 0.85rem; font-size: 0.825rem; display: flex; flex-direction: column; gap: 0.2rem;
            min-width: 140px; flex: 1; box-shadow: var(--shadow-sm);
          `;
          chip.innerHTML = `
            <div style="font-weight: 700; color: var(--text-main);">${item.class_division} (${item.total_count})</div>
            <div style="display: flex; justify-content: space-between; font-size: 0.75rem;">
              <span style="color: var(--success); font-weight: 600;">✓ Present: ${item.present_count}</span>
              <span style="color: var(--danger); font-weight: 600;">✕ Absent: ${item.absent_count}</span>
            </div>
          `;
          classBreakdownContainer.appendChild(chip);
        });
      }

      lastPresentCount = presentCount;
      lastTotalEntries = data.total_entries || 0;
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }

  async function loadRecords() {
    const dateVal = dateFilter.value;
    const classVal = classFilter.value;
    const statusVal = statusFilter.value;
    const searchVal = searchInput.value.trim();
    const yearsParam = getYearsQueryParam();

    const query = new URLSearchParams({
      date: dateVal,
      class_division: classVal,
      status: statusVal,
      search: searchVal,
      years: yearsParam
    });

    try {
      const res = await fetch(`/api/admin/records?${query.toString()}`);
      if (!res.ok) return;
      const data = await res.json();

      cachedRecords = data.records || [];
      badgeRegisteredCount.textContent = data.total || 0;

      populateFilterOptions(data.available_dates, data.available_classes);
      renderRecordsTable(cachedRecords);
    } catch (err) {
      console.error('Error loading records:', err);
    }
  }

  function populateFilterOptions(dates, classes) {
    if (dates && dateFilter.options.length <= 2) {
      const currentVal = dateFilter.value;
      dateFilter.innerHTML = '<option value="">Today\'s Date</option><option value="all">All Dates</option>';
      dates.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d;
        opt.textContent = d;
        dateFilter.appendChild(opt);
      });
      if (currentVal) dateFilter.value = currentVal;
    }

    if (classes && classFilter.options.length <= 1) {
      const currentClass = classFilter.value;
      classFilter.innerHTML = '<option value="">All Classes / Divisions</option>';
      classes.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        classFilter.appendChild(opt);
      });
      if (currentClass) classFilter.value = currentClass;
    }
  }

  function renderRecordsTable(records) {
    recordsTableBody.innerHTML = '';

    if (!records || records.length === 0) {
      tableEmptyState.style.display = 'block';
      return;
    }

    tableEmptyState.style.display = 'none';

    records.forEach((r, idx) => {
      const tr = document.createElement('tr');
      const isPresent = (r.status === 'Parent Present');

      let proofCellHtml = '<span style="font-size: 0.75rem; color: var(--text-light); font-style: italic;">None</span>';
      if (r.photo_url) {
        proofCellHtml = `
          <img src="${r.photo_url}" class="photo-cell-thumb" alt="Selfie" title="View live selfie photo proof" data-url="${r.photo_url}" data-title="Live Attendance Selfie Proof" data-meta="${r.student_id} • ${r.student_name} • ${r.meeting_time}">
        `;
      } else if (r.signed_form_url) {
        const isPdf = r.signed_form_url.toLowerCase().endsWith('.pdf');
        proofCellHtml = `
          <button type="button" class="btn-admin outline view-proof-btn" data-url="${r.signed_form_url}" data-title="Parent-Signed Absence Form" data-meta="${r.student_id} • ${r.student_name}" style="padding: 0.25rem 0.55rem; font-size: 0.75rem;">
            📄 ${isPdf ? 'Signed PDF' : 'Signed Form'}
          </button>
        `;
      }

      tr.innerHTML = `
        <td style="font-weight: 600; color: var(--text-muted);">${idx + 1}</td>
        <td style="cursor: pointer;" onclick="window.viewAttendanceDetails(${r.id})" title="Click to view full attendance details">
          <div style="font-weight: 700; color: var(--primary); font-family: var(--font-mono);">${escapeHtml(r.student_id)}</div>
          <div style="font-size: 0.725rem; color: var(--text-muted);">${escapeHtml(r.verification_code || '')}</div>
        </td>
        <td style="cursor: pointer;" onclick="window.viewAttendanceDetails(${r.id})" title="Click to view full attendance details">
          <div style="font-weight: 600;">${escapeHtml(r.student_name)}</div>
        </td>
        <td>
          <span style="background: var(--bg-subtle); padding: 0.2rem 0.5rem; border-radius: var(--radius-sm); font-size: 0.8rem; font-weight: 600;">
            ${escapeHtml(r.class_division)}
          </span>
        </td>
        <td>
          <div style="font-weight: 600;">
            ${escapeHtml(r.parent_name)}${r.relation ? ` <span style="font-size: 0.75rem; font-weight: normal; color: var(--text-muted);">(${escapeHtml(r.relation)})</span>` : ''}
          </div>
          <a href="tel:${r.parent_phone}" style="font-size: 0.75rem; color: var(--primary-light); text-decoration: none;">
            📞 ${escapeHtml(r.parent_phone)}
          </a>
          <div style="font-size: 0.725rem; color: #475569; margin-top: 3px; display: flex; align-items: flex-start; gap: 4px; line-height: 1.3;" title="Parent Residential Address (Protected HOD View)">
            <span style="color: var(--primary); flex-shrink: 0;">📍</span>
            <span>${escapeHtml(r.parent_address || 'Not Recorded')}</span>
          </div>
        </td>
        <td>
          <span class="status-badge ${isPresent ? 'present' : 'absent'}">
            ${isPresent ? (window.t ? t('status_present', '✓ Parent Present') : '✓ Parent Present') : (window.t ? t('status_absent', '✕ Parent Absent') : '✕ Parent Absent')}
          </span>
          ${r.remarks ? `<div style="font-size: 0.725rem; color: var(--text-muted); margin-top: 3px;">💬 ${escapeHtml(r.remarks)}</div>` : ''}
        </td>
        <td>
          <div style="font-size: 0.8rem; font-weight: 600;">${r.meeting_time}</div>
          <div style="font-size: 0.725rem; color: var(--text-muted);">${r.meeting_date}</div>
        </td>
        <td>
          ${proofCellHtml}
        </td>
        <td>
          <div class="actions-cell">
            <button class="btn-icon-action" title="View Full Attendance Details" onclick="window.viewAttendanceDetails(${r.id})">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
            <button class="btn-icon-action" title="Toggle Attendance Status" onclick="window.toggleRecordStatus(${r.id}, '${r.status}')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/>
              </svg>
            </button>
            <button class="btn-icon-action" title="Add / Edit Remark" onclick="window.editRecordRemark(${r.id}, '${encodeURIComponent(r.remarks || '')}')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
            </button>
            <button class="btn-icon-action delete" title="Delete Attendance Entry" onclick="window.deleteRecord(${r.id}, '${r.student_id}')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </td>
      `;

      // Wire up lightbox click for proof
      const thumb = tr.querySelector('.photo-cell-thumb');
      if (thumb) {
        thumb.addEventListener('click', () => {
          openProofLightbox(thumb.dataset.url, thumb.dataset.meta, thumb.dataset.title);
        });
      }
      const proofBtn = tr.querySelector('.view-proof-btn');
      if (proofBtn) {
        proofBtn.addEventListener('click', () => {
          openProofLightbox(proofBtn.dataset.url, proofBtn.dataset.meta, proofBtn.dataset.title);
        });
      }

      recordsTableBody.appendChild(tr);
    });
  }

  // ==========================================
  // ABSENTEES ROSTER COMPARISON
  // ==========================================
  async function loadAbsentees() {
    const dateVal = dateFilter.value;
    const yearsParam = getYearsQueryParam();
    const searchVal = searchInput.value.trim();

    const query = new URLSearchParams({
      date: dateVal,
      years: yearsParam,
      search: searchVal
    });

    try {
      const res = await fetch(`/api/admin/absentees?${query.toString()}`);
      if (!res.ok) return;
      const data = await res.json();

      cachedAbsentees = data.absentees || [];
      badgeAbsenteeCount.textContent = data.total_absent || 0;
      renderAbsenteesTable(cachedAbsentees);
    } catch (err) {
      console.error('Error loading absentees:', err);
    }
  }

  function renderAbsenteesTable(absentees) {
    absenteesTableBody.innerHTML = '';

    if (!absentees || absentees.length === 0) {
      const turnoutText = window.t ? t('turnout_100', '✓ 100% Turnout! Every registered student from the official master roster in the selected year filter is present!') : '✓ 100% Turnout! Every registered student from the official master roster in the selected year filter is present!';
      absenteesTableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 2.5rem; color: var(--success); font-weight: 600;">
            ${turnoutText}
          </td>
        </tr>
      `;
      return;
    }

    const absentBadgeText = window.t ? t('status_absent', '✕ Parent Absent (Reported)') : '✕ Parent Absent (Reported)';
    const pendingBadgeText = window.t ? t('status_pending', '⚠️ Unregistered / Pending') : '⚠️ Unregistered / Pending';
    const checkinBtnText = window.t ? t('btn_checkin_desk', '+ Check-In Desk') : '+ Check-In Desk';
    const reasonBtnText = window.t ? t('btn_record_reason', 'Record Reason') : 'Record Reason';

    absentees.forEach((s, idx) => {
      const tr = document.createElement('tr');
      const isAbsentRecorded = (s.status === 'Parent Absent');

      let proofHtml = '<span style="font-size: 0.75rem; color: var(--text-light);">-</span>';
      if (s.signed_form_url) {
        const isPdf = s.signed_form_url.toLowerCase().endsWith('.pdf');
        proofHtml = `
          <button type="button" class="btn-admin outline view-proof-btn" data-url="${s.signed_form_url}" data-title="Parent-Signed Absence Form" data-meta="${s.student_id} • ${s.student_name}" style="padding: 0.25rem 0.55rem; font-size: 0.75rem;">
            📄 ${isPdf ? 'Signed PDF' : 'View Form'}
          </button>
        `;
      } else if (s.photo_url) {
        proofHtml = `
          <img src="${s.photo_url}" class="photo-cell-thumb" alt="Proof" data-url="${s.photo_url}" data-title="Absence Photo Proof" data-meta="${s.student_id} • ${s.student_name}">
        `;
      }

      tr.innerHTML = `
        <td style="font-weight: 600; color: var(--text-muted);">${idx + 1}</td>
        <td style="font-weight: 700; color: var(--primary); font-family: var(--font-mono);">${s.student_id}</td>
        <td style="font-weight: 600;">${s.student_name}</td>
        <td><span style="background: var(--bg-subtle); padding: 0.2rem 0.5rem; border-radius: var(--radius-sm); font-size: 0.8rem; font-weight: 600;">${s.class_division}</span></td>
        <td>
          <div style="font-weight: 600;">${s.parent_name || 'Not Recorded'}${s.relation ? ` <span style="font-size: 0.75rem; font-weight: normal; color: var(--text-muted);">(${s.relation})</span>` : ''}</div>
          ${s.parent_phone ? `<a href="tel:${s.parent_phone}" style="font-size: 0.75rem; color: var(--primary-light); text-decoration: none;">📞 ${s.parent_phone}</a>` : ''}
        </td>
        <td>
          <span class="status-badge ${isAbsentRecorded ? 'absent' : 'excused'}">
            ${isAbsentRecorded ? absentBadgeText : pendingBadgeText}
          </span>
          <div style="font-size: 0.75rem; color: #475569; margin-top: 3px;">
            ${s.remarks ? `💬 ${s.remarks}` : 'Parent did not attend'}
          </div>
          ${s.meeting_time ? `<div style="font-size: 0.7rem; color: var(--text-muted);">Recorded at ${s.meeting_time}</div>` : ''}
        </td>
        <td>
          ${proofHtml}
        </td>
        <td>
          <div class="actions-cell">
            <button class="btn-admin" style="font-size: 0.75rem; padding: 0.35rem 0.65rem; background: var(--primary-50); color: var(--primary-600);" onclick="window.quickCheckin('${s.student_id}', '${s.student_name}', '${s.class_division}', '${s.parent_name || ''}', '${s.parent_phone || ''}')">
              ${checkinBtnText}
            </button>
            <button class="btn-admin" style="font-size: 0.75rem; padding: 0.35rem 0.65rem; background: var(--danger-light); color: var(--danger-dark);" onclick="window.markAbsentWithReason('${s.student_id}', '${s.student_name}', '${s.class_division}', '${s.parent_name || ''}', '${s.parent_phone || ''}')">
              ${reasonBtnText}
            </button>
          </div>
        </td>
      `;

      // Wire up lightbox click for absentee proof
      const thumb = tr.querySelector('.photo-cell-thumb');
      if (thumb) {
        thumb.addEventListener('click', () => {
          openProofLightbox(thumb.dataset.url, thumb.dataset.meta, thumb.dataset.title);
        });
      }
      const proofBtn = tr.querySelector('.view-proof-btn');
      if (proofBtn) {
        proofBtn.addEventListener('click', () => {
          openProofLightbox(proofBtn.dataset.url, proofBtn.dataset.meta, proofBtn.dataset.title);
        });
      }

      absenteesTableBody.appendChild(tr);
    });
  }

  // ==========================================
  // VIEW TABS SWITCHER
  // ==========================================
  tabRegistered.addEventListener('click', () => {
    currentTab = 'registered';
    tabRegistered.classList.add('active');
    tabAbsentees.classList.remove('active');
    registeredTableView.style.display = 'block';
    absenteeTableView.style.display = 'none';
  });

  tabAbsentees.addEventListener('click', () => {
    currentTab = 'absentees';
    tabAbsentees.classList.add('active');
    tabRegistered.classList.remove('active');
    registeredTableView.style.display = 'none';
    absenteeTableView.style.display = 'block';
  });

  // Filter Listeners
  [dateFilter, classFilter, statusFilter].forEach(el => {
    if (el) el.addEventListener('change', () => {
      loadStats();
      loadRecords();
      loadAbsentees();
    });
  });

  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadRecords();
        loadAbsentees();
      }, 300);
    });
  }

  if (btnResetFilters) {
    btnResetFilters.addEventListener('click', () => {
      dateFilter.value = '';
      classFilter.value = '';
      statusFilter.value = '';
      searchInput.value = '';
      selectedYears = ['All'];
      updateYearPillsUI();
      loadDashboardData();
    });
  }

  // ==========================================
  // EXPORT TO EXCEL (.XLSX) & CSV
  // ==========================================
  if (btnExportExcel) {
    btnExportExcel.addEventListener('click', () => {
      const dateVal = dateFilter.value;
      const classVal = classFilter.value;
      const statusVal = statusFilter.value;
      const searchVal = searchInput.value.trim();
      const yearsParam = getYearsQueryParam();

      const query = new URLSearchParams({
        date: dateVal,
        class_division: classVal,
        status: statusVal,
        search: searchVal,
        years: yearsParam
      });

      window.location.href = `/api/admin/export/excel?${query.toString()}`;
      showToast('Downloading Parent Meeting Attendance (.xlsx)...', 'success');
    });
  }

  function downloadAbsentStudentsExcel() {
    const dateVal = dateFilter.value;
    const searchVal = searchInput.value.trim();
    const yearsParam = getYearsQueryParam();

    const query = new URLSearchParams({
      date: dateVal,
      years: yearsParam,
      search: searchVal
    });

    window.location.href = `/api/admin/export/absentees-excel?${query.toString()}`;
    showToast('Downloading Absent Students Report (.xlsx)...', 'success');
  }

  if (btnExportAbsentExcel) {
    btnExportAbsentExcel.addEventListener('click', downloadAbsentStudentsExcel);
  }
  if (btnExportAbsentTable) {
    btnExportAbsentTable.addEventListener('click', downloadAbsentStudentsExcel);
  }

  if (btnExportCsv) {
    btnExportCsv.addEventListener('click', () => {
      const dateVal = dateFilter.value;
      window.location.href = `/api/admin/export/csv?date=${encodeURIComponent(dateVal)}`;
      showToast('Downloading CSV report...', 'info');
    });
  }

  // ==========================================
  // PROOF & SIGNED FORM LIGHTBOX MODAL
  // ==========================================
  function openProofLightbox(fileUrl, metaText, title) {
    if (!fileUrl) return;

    if (photoLightboxTitle) {
      photoLightboxTitle.textContent = title || 'Verified Attendance Proof';
    }
    if (photoLightboxMeta) {
      photoLightboxMeta.textContent = metaText || 'Official Attendance Record Proof';
    }

    const isPdf = fileUrl.toLowerCase().endsWith('.pdf') || fileUrl.includes('data:application/pdf');

    if (isPdf) {
      if (photoLightboxPdf) {
        photoLightboxPdf.src = fileUrl;
        photoLightboxPdf.style.display = 'block';
      }
      if (photoLightboxImg) photoLightboxImg.style.display = 'none';
    } else {
      if (photoLightboxPdf) {
        photoLightboxPdf.src = '';
        photoLightboxPdf.style.display = 'none';
      }
      if (photoLightboxImg) {
        photoLightboxImg.src = fileUrl;
        photoLightboxImg.style.display = 'block';
      }
    }

    photoModal.classList.add('show');
  }

  if (btnClosePhotoModal) {
    btnClosePhotoModal.addEventListener('click', () => {
      photoModal.classList.remove('show');
      if (photoLightboxPdf) photoLightboxPdf.src = '';
    });
  }

  // ==========================================
  // MANUAL DESK ENTRY MODAL
  // ==========================================
  if (btnOpenManualModal) {
    btnOpenManualModal.addEventListener('click', () => {
      manualEntryForm.reset();
      manualEntryModal.classList.add('show');
    });
  }

  if (btnCloseManualModal) {
    btnCloseManualModal.addEventListener('click', () => manualEntryModal.classList.remove('show'));
  }

  const manualRelation = document.getElementById('manualRelation');
  const manualOtherGroup = document.getElementById('manualOtherRelationGroup');
  const manualOtherInput = document.getElementById('manualOtherRelation');

  if (manualRelation) {
    manualRelation.addEventListener('change', () => {
      if (manualRelation.value === 'Other') {
        if (manualOtherGroup) manualOtherGroup.style.display = 'block';
        if (manualOtherInput) manualOtherInput.focus();
      } else {
        if (manualOtherGroup) manualOtherGroup.style.display = 'none';
        if (manualOtherInput) manualOtherInput.value = '';
      }
    });
  }

  if (manualEntryForm) {
    manualEntryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const relVal = manualRelation ? manualRelation.value : '';
      const otherRelVal = manualOtherInput ? manualOtherInput.value.trim() : '';
      const finalRel = relVal === 'Other' ? otherRelVal : relVal;

      const payload = {
        student_id: document.getElementById('manualRollNo').value.trim().toUpperCase(),
        student_name: document.getElementById('manualStudentName').value.trim(),
        class_division: document.getElementById('manualClass').value.trim(),
        parent_name: document.getElementById('manualParentName').value.trim(),
        relation: finalRel,
        parent_phone: document.getElementById('manualParentPhone').value.trim(),
        parent_address: document.getElementById('manualParentAddress') ? document.getElementById('manualParentAddress').value.trim() : '',
        status: document.getElementById('manualStatus').value,
        remarks: document.getElementById('manualRemarks').value.trim()
      };

      try {
        const res = await fetch('/api/admin/records/manual-entry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast(data.message, 'success');
          manualEntryModal.classList.remove('show');
          loadDashboardData();
        } else {
          showToast(data.message || 'Error creating manual entry', 'error');
        }
      } catch (err) {
        showToast('Network error while creating manual entry', 'error');
      }
    });
  }

  // ==========================================
  // SETTINGS MODAL
  // ==========================================
  if (btnOpenSettings) {
    btnOpenSettings.addEventListener('click', async () => {
      try {
        const res = await fetch('/api/admin/me');
        const data = await res.json();
        if (data.settings) {
          document.getElementById('setInstName').value = data.settings.institution_name;
          document.getElementById('setDeptName').value = data.settings.department_name;
          document.getElementById('setMeetingTitle').value = data.settings.meeting_title;
          document.getElementById('setMeetingDate').value = data.settings.meeting_date;
          document.getElementById('setRequirePhoto').checked = data.settings.require_live_photo;
        }
        settingsModal.classList.add('show');
      } catch (err) {
        showToast('Could not load settings', 'error');
      }
    });
  }

  if (btnCloseSettingsModal) {
    btnCloseSettingsModal.addEventListener('click', () => settingsModal.classList.remove('show'));
  }

  if (settingsForm) {
    settingsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        institution_name: document.getElementById('setInstName').value.trim(),
        department_name: document.getElementById('setDeptName').value.trim(),
        meeting_title: document.getElementById('setMeetingTitle').value.trim(),
        meeting_date: document.getElementById('setMeetingDate').value.trim(),
        require_live_photo: document.getElementById('setRequirePhoto').checked,
        new_password: document.getElementById('setNewPassword').value.trim()
      };

      try {
        const res = await fetch('/api/admin/settings/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast(window.t ? t('msg_settings_saved', 'Settings updated successfully!') : 'Settings updated successfully!', 'success');
          settingsModal.classList.remove('show');
          checkAuth();
        } else {
          showToast(data.message || 'Failed to update settings', 'error');
        }
      } catch (err) {
        showToast('Error updating settings', 'error');
      }
    });
  }

  // ==========================================
  // GLOBAL WINDOW ACTIONS (DETAILS, TOGGLE, REMARK, DELETE)
  // ==========================================
  window.viewAttendanceDetails = (recordId) => {
    const rec = cachedRecords.find(item => item.id === recordId);
    if (!rec) {
      showToast('Record details not found in cache', 'error');
      return;
    }

    const isPresent = (rec.status === 'Parent Present');

    const nameElem = document.getElementById('detStudentName');
    if (nameElem) nameElem.textContent = `${rec.student_name} (${rec.class_division})`;

    const prnSub = document.getElementById('detStudentPrn');
    if (prnSub) prnSub.textContent = `PRN: ${rec.student_id}`;

    const badge = document.getElementById('detStatusBadge');
    if (badge) {
      badge.textContent = rec.status;
      badge.className = `status-badge ${isPresent ? 'present' : 'absent'}`;
    }

    const prnVal = document.getElementById('detPrnVal');
    if (prnVal) prnVal.textContent = rec.student_id;

    const nameVal = document.getElementById('detNameVal');
    if (nameVal) nameVal.textContent = rec.student_name;

    const classVal = document.getElementById('detClassVal');
    if (classVal) classVal.textContent = rec.class_division;

    const parentNameVal = document.getElementById('detParentNameVal');
    if (parentNameVal) parentNameVal.textContent = rec.parent_name || 'Not Recorded';

    const relVal = document.getElementById('detRelationVal');
    if (relVal) relVal.textContent = rec.relation || '-';

    const phoneLink = document.getElementById('detPhoneLink');
    if (phoneLink) {
      if (rec.parent_phone) {
        phoneLink.href = `tel:${rec.parent_phone}`;
        phoneLink.textContent = `📞 ${rec.parent_phone}`;
      } else {
        phoneLink.href = '#';
        phoneLink.textContent = 'Not Recorded';
      }
    }

    // Protected Parent Residential Address
    const addressVal = document.getElementById('detAddressVal');
    if (addressVal) {
      if (rec.parent_address && rec.parent_address.trim()) {
        addressVal.innerHTML = escapeHtml(rec.parent_address);
        addressVal.style.color = '#0f172a';
      } else {
        addressVal.innerHTML = '<span style="color: var(--text-muted); font-style: italic;">No residential address recorded for this entry</span>';
      }
    }

    const dateTimeVal = document.getElementById('detDateTimeVal');
    if (dateTimeVal) dateTimeVal.textContent = `${rec.meeting_date} at ${rec.meeting_time}`;

    const codeVal = document.getElementById('detCodeVal');
    if (codeVal) codeVal.textContent = rec.verification_code || '-';

    const remarksVal = document.getElementById('detRemarksVal');
    if (remarksVal) remarksVal.textContent = rec.remarks || 'No remarks recorded.';

    // Proof preview in details modal
    const proofContainer = document.getElementById('detProofContainer');
    const proofThumb = document.getElementById('detProofThumb');
    const proofLabel = document.getElementById('detProofLabel');
    const btnViewProof = document.getElementById('detBtnViewProof');

    if (rec.photo_url || rec.signed_form_url) {
      const proofUrl = rec.photo_url || rec.signed_form_url;
      const isPdf = proofUrl.toLowerCase().endsWith('.pdf');
      if (proofContainer) proofContainer.style.display = 'flex';
      if (proofThumb) {
        if (isPdf) {
          proofThumb.src = '/static/images/college_crest.jpg';
        } else {
          proofThumb.src = proofUrl;
        }
      }
      if (proofLabel) {
        proofLabel.textContent = rec.photo_url ? 'Live Attendance Selfie Proof' : 'Parent-Signed Document';
      }
      if (btnViewProof) {
        btnViewProof.onclick = () => {
          openProofLightbox(proofUrl, `${rec.student_id} • ${rec.student_name}`, rec.photo_url ? 'Live Attendance Selfie Proof' : 'Parent-Signed Absence Form');
        };
      }
    } else {
      if (proofContainer) proofContainer.style.display = 'none';
    }

    if (detailsModal) detailsModal.classList.add('show');
  };

  window.toggleRecordStatus = async (recordId, currentStatus) => {
    const newStatus = (currentStatus === 'Parent Present') ? 'Parent Absent' : 'Parent Present';
    if (!confirm(`Switch attendance status from "${currentStatus}" to "${newStatus}"?`)) return;

    try {
      const res = await fetch('/api/admin/records/toggle-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ record_id: recordId, status: newStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Status changed to ${newStatus}`, 'success');
        loadDashboardData();
      } else {
        showToast(data.message || 'Update failed', 'error');
      }
    } catch (err) {
      showToast('Network error', 'error');
    }
  };

  window.editRecordRemark = async (recordId, currentEncodedRemark) => {
    const currentRemark = decodeURIComponent(currentEncodedRemark || '');
    const newRemark = prompt('Enter notes or remarks for this attendance record:', currentRemark);
    if (newRemark === null) return;

    try {
      const res = await fetch('/api/admin/records/toggle-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ record_id: recordId, remarks: newRemark })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Remark updated', 'success');
        loadRecords();
      } else {
        showToast(data.message || 'Could not update remark', 'error');
      }
    } catch (err) {
      showToast('Could not save remark', 'error');
    }
  };

  window.deleteRecord = async (recordId, rollNo) => {
    if (!confirm(`Are you sure you want to delete attendance record for Roll No: ${rollNo}? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/records/${recordId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Record deleted.', 'info');
        loadDashboardData();
      } else {
        showToast(data.message || 'Failed to delete record', 'error');
      }
    } catch (err) {
      showToast('Error deleting record', 'error');
    }
  };

  window.quickCheckin = (roll, name, cls, parent, phone) => {
    document.getElementById('manualRollNo').value = roll;
    document.getElementById('manualStudentName').value = name;
    document.getElementById('manualClass').value = cls;
    document.getElementById('manualParentName').value = parent || '';
    document.getElementById('manualParentPhone').value = phone || '';
    if (document.getElementById('manualParentAddress')) {
      document.getElementById('manualParentAddress').value = '';
    }
    document.getElementById('manualStatus').value = 'Parent Present';
    document.getElementById('manualRemarks').value = 'Faculty Desk Check-in';
    manualEntryModal.classList.add('show');
  };

  window.markAbsentWithReason = (roll, name, cls, parent, phone) => {
    const reason = prompt(`Enter mandatory absence reason for ${name} (${roll}):`, 'Parent unable to attend / Informed over phone');
    if (!reason || !reason.trim()) {
      showToast('Absence reason is required to record absence.', 'warning');
      return;
    }

    fetch('/api/admin/records/manual-entry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: roll,
        student_name: name,
        class_division: cls,
        parent_name: parent || 'Parent / Guardian',
        parent_phone: phone || '',
        status: 'Parent Absent',
        remarks: reason.trim()
      })
    }).then(r => r.json()).then(data => {
      if (data.success) {
        showToast(`Absence recorded for ${roll}`, 'info');
        loadDashboardData();
      } else {
        showToast(data.message || 'Error recording absence', 'error');
      }
    }).catch(() => {
      showToast('Network error recording absence', 'error');
    });
  };

  // ==========================================
  // LIVE POLLING (EVERY 5 SECONDS)
  // ==========================================
  function startLiveSync() {
    if (livePollInterval) clearInterval(livePollInterval);

    livePollInterval = setInterval(async () => {
      if (dashboardSection.style.display === 'none') return;

      const dateVal = dateFilter ? dateFilter.value : '';
      const yearsParam = getYearsQueryParam();

      try {
        const res = await fetch(`/api/admin/stats?date=${encodeURIComponent(dateVal)}&years=${encodeURIComponent(yearsParam)}`);
        if (!res.ok) return;
        const data = await res.json();

        // Update live time display
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        if (liveSyncText) {
          liveSyncText.textContent = `LIVE (${timeStr})`;
        }

        // Check if new entries registered
        const newTotal = data.total_entries || 0;
        const newPresent = data.present_count || 0;

        if (lastTotalEntries !== -1 && (newTotal !== lastTotalEntries || newPresent !== lastPresentCount)) {
          showToast('Live Sync: New attendance record registered! 🔄', 'info');
          loadDashboardData();
        } else {
          // Keep numbers updated
          kpiTotal.textContent = data.total_students || 0;
          kpiPresent.textContent = newPresent;
          kpiAbsent.textContent = data.absent_count || 0;
          kpiPresentRate.textContent = `${data.attendance_rate || 0}% Attendance Rate`;
          kpiAbsentRate.textContent = `${data.absent_rate || 0}% Absentee Rate`;
        }

        lastTotalEntries = newTotal;
        lastPresentCount = newPresent;
      } catch (err) {
        // Silent catch on background poll
      }
    }, 5000);
  }

  // ==========================================
  // TOAST NOTIFICATIONS
  // ==========================================
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
      <span>${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // Kickoff Auth Check
  checkAuth();
});
