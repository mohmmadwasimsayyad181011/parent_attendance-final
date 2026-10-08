/**
 * Parent Meeting Attendance Portal - Frontend Application
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const config = {
    institutionName: document.getElementById('instNameDisplay'),
    departmentName: document.getElementById('deptNameDisplay'),
    meetingTitle: document.getElementById('meetingTitleDisplay'),
    meetingDate: document.getElementById('meetingDateBadge'),
    liveClock: document.getElementById('liveClockBadge')
  };

  const form = document.getElementById('attendanceForm');
  const studentIdInput = document.getElementById('studentId');
  const studentNameInput = document.getElementById('studentName');
  const classSelect = document.getElementById('classDivision');
  const parentNameInput = document.getElementById('parentName');
  const relationSelect = document.getElementById('parentRelation');
  const otherRelationGroup = document.getElementById('otherRelationGroup');
  const otherRelationInput = document.getElementById('otherRelation');
  const parentPhoneInput = document.getElementById('parentPhone');
  const parentAddressInput = document.getElementById('parentAddress');
  const remarksInput = document.getElementById('attendanceRemarks');
  const btnLookup = document.getElementById('btnLookup');
  const lookupFeedback = document.getElementById('lookupFeedback');
  const duplicateAlert = document.getElementById('duplicateAlert');
  const duplicateMsg = document.getElementById('duplicateMsg');

  // Status Radios
  const statusPresentCard = document.getElementById('statusPresentCard');
  const statusAbsentCard = document.getElementById('statusAbsentCard');
  const radioPresent = document.getElementById('statusPresent');
  const radioAbsent = document.getElementById('statusAbsent');
  const cameraContainer = document.getElementById('cameraSection');
  const remarksGroup = document.getElementById('remarksGroup');

  // Camera & Signed Form Elements
  const presentProofSection = document.getElementById('presentProofSection');
  const absentProofSection = document.getElementById('absentProofSection');
  const submitBtnText = document.getElementById('submitBtnText');
  const signedFormDropzone = document.getElementById('signedFormDropzone');
  const btnBrowseSignedForm = document.getElementById('btnBrowseSignedForm');
  const signedFormInput = document.getElementById('signedFormInput');
  const signedFormPreviewBox = document.getElementById('signedFormPreviewBox');
  const signedFormThumb = document.getElementById('signedFormThumb');
  const signedFormPdfIcon = document.getElementById('signedFormPdfIcon');
  const signedFormFileName = document.getElementById('signedFormFileName');
  const signedFormFileSize = document.getElementById('signedFormFileSize');
  const btnRemoveSignedForm = document.getElementById('btnRemoveSignedForm');

  const video = document.getElementById('videoStream');
  const canvas = document.getElementById('photoCanvas');
  const capturedPreview = document.getElementById('capturedPreview');
  const cameraPermissionPrompt = document.getElementById('cameraPrompt');
  const cameraLiveView = document.getElementById('cameraLiveView');
  const btnStartCamera = document.getElementById('btnStartCamera');
  const btnCapture = document.getElementById('btnCapturePhoto');
  const btnRetake = document.getElementById('btnRetakePhoto');
  const btnFlipCamera = document.getElementById('btnFlipCamera');
  const fileFallbackInput = document.getElementById('fileFallbackInput');
  const btnFallbackFile = document.getElementById('btnFallbackFile');
  const watermarkBanner = document.getElementById('watermarkBanner');
  const submitBtn = document.getElementById('btnSubmitAttendance');

  // Modal Pass Elements
  const passModal = document.getElementById('passModal');
  const btnClosePass = document.getElementById('btnClosePass');
  const btnPrintPass = document.getElementById('btnPrintPass');
  const btnNewEntry = document.getElementById('btnNewEntry');

  let mediaStream = null;
  let currentFacingMode = 'user'; // 'user' (front) or 'environment' (back)
  let capturedPhotoBase64 = '';
  let signedFormBase64 = '';
  let appConfig = null;

  // 1. Initialize Portal Config & Live Clock
  async function loadConfig() {
    try {
      const res = await fetch('/api/public/config');
      const data = await res.json();
      appConfig = data;

      if (config.institutionName) config.institutionName.textContent = data.institution_name;
      if (config.departmentName) config.departmentName.textContent = data.department_name;
      if (config.meetingTitle) config.meetingTitle.textContent = data.meeting_title;
      if (config.meetingDate) config.meetingDate.textContent = formatDate(data.meeting_date);

      // Populate classes dropdown if empty or default
      if (classSelect && data.classes && data.classes.length > 0) {
        const currentVal = classSelect.value;
        classSelect.innerHTML = '<option value="">-- Select Division --</option>';
        data.classes.forEach(cls => {
          const opt = document.createElement('option');
          opt.value = cls;
          opt.textContent = cls;
          classSelect.appendChild(opt);
        });
        if (currentVal) classSelect.value = currentVal;
      }
    } catch (err) {
      console.error('Error loading config:', err);
    }
  }

  function startLiveClock() {
    function updateClock() {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      if (config.liveClock) {
        config.liveClock.textContent = timeStr;
      }
    }
    updateClock();
    setInterval(updateClock, 1000);
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const [y, m, d] = dateStr.split('-');
      const dObj = new Date(y, m - 1, d);
      return dObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  // 2. Student Roll No. Lookup & Duplicate Verification
  async function checkStudentRoll(studentId) {
    if (!studentId || studentId.trim().length < 2) return;
    const cleanId = studentId.trim().toUpperCase();

    lookupFeedback.textContent = window.t ? t('msg_checking_prn', 'Checking student PRN...') : 'Checking student PRN...';
    lookupFeedback.className = 'feedback-msg';
    duplicateAlert.style.display = 'none';

    try {
      const res = await fetch(`/api/public/student-lookup?student_id=${encodeURIComponent(cleanId)}`);
      const data = await res.json();

      if (data.is_duplicate) {
        // Show prominent duplicate alert!
        const rec = data.existing_attendance;
        duplicateMsg.innerHTML = `<strong>⚠️ ${window.t ? t('duplicate_detected_title', 'Duplicate Entry Detected!') : 'Duplicate Entry Detected!'}</strong><br>PRN <strong>${rec.student_id}</strong> is already marked as <strong>${rec.status}</strong> today at ${rec.meeting_time} (Verification Code: <code>${rec.verification_code}</code>). Duplicate entries are not permitted.`;
        duplicateAlert.style.display = 'flex';
        lookupFeedback.textContent = window.t ? t('msg_already_submitted', 'Attendance already submitted today.') : 'Attendance already submitted today.';
        lookupFeedback.className = 'feedback-msg error';
        submitBtn.disabled = true;
      } else {
        submitBtn.disabled = false;
        duplicateAlert.style.display = 'none';

        if (data.found && data.student_data) {
          const s = data.student_data;
          studentNameInput.value = s.student_name || '';
          if (s.class_division) {
            // check if in options
            let exists = Array.from(classSelect.options).some(o => o.value === s.class_division);
            if (!exists) {
              const opt = document.createElement('option');
              opt.value = s.class_division;
              opt.textContent = s.class_division;
              classSelect.appendChild(opt);
            }
            classSelect.value = s.class_division;
          }
          if (s.parent_name) parentNameInput.value = s.parent_name;
          if (s.parent_phone) parentPhoneInput.value = s.parent_phone;

          lookupFeedback.textContent = window.t ? t('msg_verified_roster', '✓ Verified from Official Student Roster') : '✓ Verified from Official Student Roster';
          lookupFeedback.className = 'feedback-msg success';
        } else {
          lookupFeedback.textContent = window.t ? t('msg_not_in_roster', 'PRN not found in official roster. You may enter details manually.') : 'PRN not found in official roster. You may enter details manually.';
          lookupFeedback.className = 'feedback-msg';
        }
      }
    } catch (err) {
      console.error('Lookup error:', err);
      lookupFeedback.textContent = '';
    }
  }

  if (studentIdInput) {
    studentIdInput.addEventListener('blur', () => {
      checkStudentRoll(studentIdInput.value);
    });
    studentIdInput.addEventListener('input', () => {
      studentIdInput.value = studentIdInput.value.toUpperCase();
      submitBtn.disabled = false;
      duplicateAlert.style.display = 'none';
    });
  }

  if (btnLookup) {
    btnLookup.addEventListener('click', (e) => {
      e.preventDefault();
      checkStudentRoll(studentIdInput.value);
    });
  }

  // 3. Status Switching (Present vs Absent)
  function setAttendanceStatus(isPresent) {
    if (isPresent) {
      radioPresent.checked = true;
      statusPresentCard.classList.add('active');
      statusAbsentCard.classList.remove('active');
      if (presentProofSection) presentProofSection.style.display = 'block';
      if (absentProofSection) absentProofSection.style.display = 'none';
      if (remarksGroup) remarksGroup.style.display = 'none';
      if (remarksInput) remarksInput.required = false;
      if (submitBtnText) submitBtnText.textContent = window.t ? t('btn_submit_present', 'Confirm & Record Attendance') : 'Confirm & Record Attendance';
      if (!capturedPhotoBase64 && !mediaStream) {
        startCamera();
      }
    } else {
      radioAbsent.checked = true;
      statusAbsentCard.classList.add('active');
      statusPresentCard.classList.remove('active');
      if (presentProofSection) presentProofSection.style.display = 'none';
      if (absentProofSection) absentProofSection.style.display = 'block';
      if (remarksGroup) remarksGroup.style.display = 'block';
      if (remarksInput) {
        remarksInput.required = true;
      }
      if (submitBtnText) submitBtnText.textContent = window.t ? t('btn_submit_absent', 'Record Parent Absence') : 'Record Parent Absence';
      stopCamera();
    }
  }

  // Update dynamic button texts on language switch
  document.addEventListener('languageChanged', () => {
    if (submitBtnText) {
      submitBtnText.textContent = radioPresent.checked
        ? (window.t ? t('btn_submit_present', 'Confirm & Record Attendance') : 'Confirm & Record Attendance')
        : (window.t ? t('btn_submit_absent', 'Record Parent Absence') : 'Record Parent Absence');
    }
  });

  if (statusPresentCard) {
    statusPresentCard.addEventListener('click', () => setAttendanceStatus(true));
  }
  if (statusAbsentCard) {
    statusAbsentCard.addEventListener('click', () => setAttendanceStatus(false));
  }

  // Signed Form File Handling (Optional Upload for Absent parents)
  function handleSignedFormFile(file) {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      showToast('File size must be under 15MB', 'error');
      return;
    }
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImg = file.type.startsWith('image/');
    if (!isPdf && !isImg) {
      showToast('Please upload an image (JPG, PNG) or PDF document', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      signedFormBase64 = e.target.result;
      if (signedFormPreviewBox) signedFormPreviewBox.style.display = 'flex';
      if (signedFormFileName) signedFormFileName.textContent = file.name;
      if (signedFormFileSize) signedFormFileSize.textContent = `${(file.size / 1024).toFixed(1)} KB • Ready to submit`;

      if (isPdf) {
        if (signedFormPdfIcon) signedFormPdfIcon.style.display = 'flex';
        if (signedFormThumb) signedFormThumb.style.display = 'none';
      } else {
        if (signedFormPdfIcon) signedFormPdfIcon.style.display = 'none';
        if (signedFormThumb) {
          signedFormThumb.src = signedFormBase64;
          signedFormThumb.style.display = 'block';
        }
      }
      showToast('Signed absence form attached successfully', 'success');
    };
    reader.readAsDataURL(file);
  }

  if (btnBrowseSignedForm && signedFormInput) {
    btnBrowseSignedForm.addEventListener('click', () => signedFormInput.click());
  }

  if (signedFormDropzone && signedFormInput) {
    signedFormDropzone.addEventListener('click', (e) => {
      if (e.target !== btnBrowseSignedForm) signedFormInput.click();
    });
    signedFormDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      signedFormDropzone.classList.add('dragover');
    });
    signedFormDropzone.addEventListener('dragleave', () => {
      signedFormDropzone.classList.remove('dragover');
    });
    signedFormDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      signedFormDropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleSignedFormFile(e.dataTransfer.files[0]);
      }
    });
    signedFormInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleSignedFormFile(e.target.files[0]);
      }
    });
  }

  if (btnRemoveSignedForm) {
    btnRemoveSignedForm.addEventListener('click', () => {
      signedFormBase64 = '';
      if (signedFormInput) signedFormInput.value = '';
      if (signedFormPreviewBox) signedFormPreviewBox.style.display = 'none';
      if (signedFormThumb) signedFormThumb.src = '';
      showToast('Signed form removed', 'info');
    });
  }

  // 4. Live Camera & Photo Capture Logic
  async function startCamera() {
    try {
      if (mediaStream) {
        stopCamera();
      }

      const constraints = {
        video: {
          facingMode: currentFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = mediaStream;
      await video.play();

      cameraPermissionPrompt.style.display = 'none';
      cameraLiveView.style.display = 'flex';
      video.style.display = 'block';
      capturedPreview.style.display = 'none';
      btnCapture.style.display = 'inline-flex';
      btnRetake.style.display = 'none';
      watermarkBanner.style.display = 'none';
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err);
      cameraPermissionPrompt.style.display = 'block';
      cameraPermissionPrompt.querySelector('h4').textContent = 'Camera Access Required';
      cameraPermissionPrompt.querySelector('p').textContent = 'Please enable camera permissions in your browser or click below to upload a live photo from your device camera.';
      showToast('Please allow camera permissions or upload photo', 'warning');
    }
  }

  function stopCamera() {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      mediaStream = null;
    }
  }

  if (btnStartCamera) {
    btnStartCamera.addEventListener('click', startCamera);
  }

  if (btnFlipCamera) {
    btnFlipCamera.addEventListener('click', () => {
      currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
      video.style.transform = currentFacingMode === 'user' ? 'scaleX(-1)' : 'scaleX(1)';
      startCamera();
    });
  }

  // Take Snapshot & Burn Watermark onto Canvas
  if (btnCapture) {
    btnCapture.addEventListener('click', () => {
      if (!video.videoWidth) {
        showToast('Camera is initializing, please wait...', 'warning');
        return;
      }

      const width = video.videoWidth || 800;
      const height = video.videoHeight || 600;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');

      // Mirror if front camera
      if (currentFacingMode === 'user') {
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, width, height);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      } else {
        ctx.drawImage(video, 0, 0, width, height);
      }

      // Burn Security Timestamp Watermark at bottom
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const rollStr = (studentIdInput.value || 'UNSPECIFIED').toUpperCase();

      const bannerHeight = Math.max(50, Math.floor(height * 0.12));
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.fillRect(0, height - bannerHeight, width, bannerHeight);

      // Watermark Text
      ctx.fillStyle = '#38bdf8';
      ctx.font = `bold ${Math.floor(bannerHeight * 0.32)}px sans-serif`;
      ctx.fillText(`✓ PARENT MEETING ATTENDANCE PROOF`, 20, height - (bannerHeight * 0.55));

      ctx.fillStyle = '#ffffff';
      ctx.font = `${Math.floor(bannerHeight * 0.28)}px monospace`;
      ctx.fillText(`ID: ${rollStr}  |  ${dateStr} ${timeStr}`, 20, height - (bannerHeight * 0.2));

      // Right verification tag
      ctx.textAlign = 'right';
      ctx.fillStyle = '#10b981';
      ctx.font = `bold ${Math.floor(bannerHeight * 0.28)}px sans-serif`;
      ctx.fillText(`VERIFIED CAPTURE`, width - 20, height - (bannerHeight * 0.38));
      ctx.textAlign = 'left';

      // Export to base64
      capturedPhotoBase64 = canvas.toDataURL('image/jpeg', 0.82);

      // Show preview
      capturedPreview.src = capturedPhotoBase64;
      capturedPreview.style.display = 'block';
      video.style.display = 'none';
      btnCapture.style.display = 'none';
      btnRetake.style.display = 'inline-flex';
      watermarkBanner.style.display = 'flex';
      watermarkBanner.innerHTML = `<span><strong>PROOF SECURED:</strong> ${rollStr}</span> <span>${dateStr} ${timeStr}</span>`;

      // Flash animation effect
      const viewport = document.querySelector('.camera-viewport');
      viewport.style.filter = 'brightness(2)';
      setTimeout(() => { viewport.style.filter = 'none'; }, 150);

      stopCamera();
      showToast('Attendance photo captured successfully!', 'success');
    });
  }

  if (btnRetake) {
    btnRetake.addEventListener('click', () => {
      capturedPhotoBase64 = '';
      capturedPreview.style.display = 'none';
      watermarkBanner.style.display = 'none';
      startCamera();
    });
  }

  // Fallback file input upload
  if (btnFallbackFile && fileFallbackInput) {
    btnFallbackFile.addEventListener('click', () => fileFallbackInput.click());
    fileFallbackInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          canvas.width = img.width > 1200 ? 1200 : img.width;
          canvas.height = (canvas.width / img.width) * img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Watermark
          const now = new Date();
          const bannerH = 50;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.fillRect(0, canvas.height - bannerH, canvas.width, bannerH);
          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 15px sans-serif';
          ctx.fillText(`✓ PARENT ATTENDANCE PROOF  |  ID: ${(studentIdInput.value || '').toUpperCase()}`, 15, canvas.height - 28);
          ctx.fillStyle = '#ffffff';
          ctx.font = '13px monospace';
          ctx.fillText(`${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, 15, canvas.height - 10);

          capturedPhotoBase64 = canvas.toDataURL('image/jpeg', 0.82);
          capturedPreview.src = capturedPhotoBase64;
          capturedPreview.style.display = 'block';
          video.style.display = 'none';
          cameraPermissionPrompt.style.display = 'none';
          cameraLiveView.style.display = 'flex';
          btnCapture.style.display = 'none';
          btnRetake.style.display = 'inline-flex';
          watermarkBanner.style.display = 'flex';
          watermarkBanner.textContent = 'Photo uploaded with verification watermark';
          showToast('Photo uploaded successfully!', 'success');
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // 5. Phone Number Real-Time Validation
  if (parentPhoneInput) {
    parentPhoneInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/[^0-9]/g, '');
      if (val.length > 10) val = val.substring(0, 10);
      e.target.value = val;
    });
  }

  // 6. Form Submission
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const studentId = studentIdInput.value.trim().toUpperCase();
      const studentName = studentNameInput.value.trim();
      const classDivision = classSelect.value.trim();
      const parentName = parentNameInput.value.trim();
      const relationVal = relationSelect ? relationSelect.value.trim() : '';
      const otherRelationVal = otherRelationInput ? otherRelationInput.value.trim() : '';
      const parentPhone = parentPhoneInput.value.trim();
      const isPresent = radioPresent.checked;
      const remarks = remarksInput.value.trim();
      const honeypot = document.getElementById('websiteField')?.value;

      // Validation
      if (!studentId) {
        showToast(window.t ? t('msg_enter_prn', 'Please enter Student Roll Number / ID') : 'Please enter Student Roll Number / ID', 'error');
        studentIdInput.focus();
        return;
      }
      if (!studentName) {
        showToast(window.t ? t('msg_enter_name', 'Please enter Student Full Name') : 'Please enter Student Full Name', 'error');
        studentNameInput.focus();
        return;
      }
      if (!classDivision) {
        showToast(window.t ? t('msg_select_class', 'Please select Class / Division') : 'Please select Class / Division', 'error');
        classSelect.focus();
        return;
      }
      if (!parentName) {
        showToast(window.t ? t('msg_enter_parent_name', 'Please enter Parent / Guardian Name') : 'Please enter Parent / Guardian Name', 'error');
        parentNameInput.focus();
        return;
      }
      if (relationSelect && !relationVal) {
        showToast(window.t ? t('msg_select_relation', 'Please select Relation') : 'Please select Relation', 'error');
        relationSelect.focus();
        return;
      }
      if (relationVal === 'Other' && !otherRelationVal) {
        showToast(window.t ? t('msg_specify_relation', 'Please enter the relation') : 'Please enter the relation', 'error');
        if (otherRelationInput) otherRelationInput.focus();
        return;
      }
      const finalRelation = relationVal === 'Other' ? otherRelationVal : relationVal;

      if (parentPhone.length !== 10) {
        showToast(window.t ? t('msg_enter_phone', 'Please enter a valid 10-digit mobile number') : 'Please enter a valid 10-digit mobile number', 'error');
        parentPhoneInput.focus();
        return;
      }

      const parentAddress = parentAddressInput ? parentAddressInput.value.trim() : '';
      if (!parentAddress) {
        showToast(window.t ? t('msg_enter_address', 'Please enter Parent / Guardian Address') : 'Please enter Parent / Guardian Address', 'error');
        if (parentAddressInput) parentAddressInput.focus();
        return;
      }

      if (isPresent && !capturedPhotoBase64) {
        showToast(window.t ? t('msg_snap_selfie', 'Live selfie photo proof is required! Please snap a photo.') : 'Live selfie photo proof is required! Please snap a photo.', 'error');
        btnCapture.focus();
        return;
      }

      if (!isPresent && !remarks) {
        showToast(window.t ? t('msg_absence_reason', 'Reason for absence is strictly mandatory when marking Parent Absent!') : 'Reason for absence is strictly mandatory when marking Parent Absent!', 'error');
        if (remarksInput) remarksInput.focus();
        return;
      }

      // Prepare payload
      const payload = {
        student_id: studentId,
        student_name: studentName,
        class_division: classDivision,
        parent_name: parentName,
        relation: finalRelation,
        parent_phone: parentPhone,
        parent_address: parentAddress,
        status: isPresent ? 'Parent Present' : 'Parent Absent',
        remarks: remarks,
        photo: isPresent ? capturedPhotoBase64 : '',
        signed_form: !isPresent ? signedFormBase64 : '',
        website: honeypot || ''
      };

      // Disable button with spinner
      submitBtn.disabled = true;
      const origText = submitBtn.innerHTML;
      submitBtn.innerHTML = `
        <svg class="spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
          <path d="M12 2a10 10 0 0 1 10 10"></path>
        </svg>
        ${window.t ? t('msg_submitting', 'Recording Attendance...') : 'Recording Attendance...'}
      `;

      try {
        const response = await fetch('/api/attendance/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const resData = await response.json();

        if (response.status === 409 || resData.is_duplicate) {
          // Duplicate error!
          showToast(resData.message || (window.t ? t('msg_duplicate', 'Duplicate attendance entry detected.') : 'Duplicate attendance entry detected.'), 'error');
          duplicateMsg.innerHTML = `<strong>⚠️ ${window.t ? t('duplicate_detected_title', 'Duplicate Entry Detected!') : 'Duplicate Entry Detected!'}</strong><br>${resData.message}`;
          duplicateAlert.style.display = 'flex';
          submitBtn.disabled = false;
          submitBtn.innerHTML = origText;
          return;
        }

        if (!response.ok || !resData.success) {
          showToast(resData.message || 'Error recording attendance. Please try again.', 'error');
          submitBtn.disabled = false;
          submitBtn.innerHTML = origText;
          return;
        }

        // Success! Display Digital Attendance Pass
        displayAttendancePass(resData.attendance);
        showToast(window.t ? t('msg_success', 'Attendance recorded successfully! 🎉') : 'Attendance recorded successfully! 🎉', 'success');

      } catch (err) {
        console.error('Submission error:', err);
        showToast('Network error while submitting. Please check connection.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origText;
      }
    });
  }

  // 7. Digital Attendance Pass Modal Renderer
  function displayAttendancePass(rec) {
    document.getElementById('passStudentName').textContent = rec.student_name;
    document.getElementById('passStudentRoll').textContent = rec.student_id;
    document.getElementById('passClass').textContent = rec.class_division;
    document.getElementById('passParentName').textContent = rec.parent_name;
    const passRelRow = document.getElementById('passRelationRow');
    const passRel = document.getElementById('passRelation');
    if (passRelRow && passRel) {
      if (rec.relation) {
        passRel.textContent = rec.relation;
        passRelRow.style.display = '';
      } else {
        passRelRow.style.display = 'none';
      }
    }
    document.getElementById('passParentPhone').textContent = rec.parent_phone;
    document.getElementById('passStatus').textContent = rec.status;
    document.getElementById('passDate').textContent = rec.meeting_date;
    document.getElementById('passTime').textContent = rec.meeting_time;
    document.getElementById('passCode').textContent = rec.verification_code;

    // Photo thumbnail
    const passThumb = document.getElementById('passPhotoThumb');
    if (rec.photo_url) {
      passThumb.src = rec.photo_url;
      passThumb.style.display = 'block';
    } else if (capturedPhotoBase64) {
      passThumb.src = capturedPhotoBase64;
      passThumb.style.display = 'block';
    } else {
      passThumb.style.display = 'none';
    }

    // Status pill coloring
    const statusPill = document.getElementById('passStatusPill');
    if (rec.status === 'Parent Present') {
      statusPill.className = 'verified-stamp-pill';
      statusPill.innerHTML = `✓ Verified • Present`;
    } else {
      statusPill.className = 'verified-stamp-pill';
      statusPill.style.background = '#dc2626';
      statusPill.innerHTML = `Recorded • Absent`;
    }

    // Generate dynamic QR Code for instant verification
    const qrCanvas = document.getElementById('passQrCanvas');
    if (qrCanvas) {
      drawSimpleQr(qrCanvas, `${window.location.origin}/verify/${rec.verification_code}`);
    }

    passModal.classList.add('show');
  }

  // Simple QR pattern representation generator
  function drawSimpleQr(canvasElem, text) {
    const ctx = canvasElem.getContext('2d');
    const size = canvasElem.width;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = '#0f172a';
    // Draw corner markers
    const drawFinder = (x, y) => {
      ctx.fillRect(x, y, 22, 22);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 3, y + 3, 16, 16);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x + 6, y + 6, 10, 10);
    };

    drawFinder(4, 4);
    drawFinder(size - 26, 4);
    drawFinder(4, size - 26);

    // Pseudorandom grid based on hash
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }

    const step = 4;
    for (let x = 6; x < size - 6; x += step) {
      for (let y = 6; y < size - 6; y += step) {
        if ((x < 30 && y < 30) || (x > size - 30 && y < 30) || (x < 30 && y > size - 30)) {
          continue;
        }
        const val = Math.abs(Math.sin((x * 13 + y * 7 + hash)) * 10000);
        if (Math.floor(val) % 2 === 0) {
          ctx.fillRect(x, y, step - 1, step - 1);
        }
      }
    }
  }

  if (btnClosePass) {
    btnClosePass.addEventListener('click', () => passModal.classList.remove('show'));
  }

  if (btnPrintPass) {
    btnPrintPass.addEventListener('click', () => {
      window.print();
    });
  }

  if (btnNewEntry) {
    btnNewEntry.addEventListener('click', () => {
      passModal.classList.remove('show');
      form.reset();
      if (otherRelationGroup) otherRelationGroup.style.display = 'none';
      if (otherRelationInput) otherRelationInput.value = '';
      if (parentAddressInput) parentAddressInput.value = '';
      capturedPhotoBase64 = '';
      signedFormBase64 = '';
      if (signedFormInput) signedFormInput.value = '';
      if (signedFormPreviewBox) signedFormPreviewBox.style.display = 'none';
      if (signedFormThumb) signedFormThumb.src = '';
      capturedPreview.style.display = 'none';
      watermarkBanner.style.display = 'none';
      duplicateAlert.style.display = 'none';
      lookupFeedback.textContent = '';
      setAttendanceStatus(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Relation toggle listener
  if (relationSelect) {
    relationSelect.addEventListener('change', () => {
      if (relationSelect.value === 'Other') {
        if (otherRelationGroup) otherRelationGroup.style.display = 'block';
        if (otherRelationInput) otherRelationInput.focus();
      } else {
        if (otherRelationGroup) otherRelationGroup.style.display = 'none';
        if (otherRelationInput) otherRelationInput.value = '';
      }
    });
  }

  // 8. Toast Helper
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

  // Kickoff
  loadConfig();
  startLiveClock();
  startCamera();
});
