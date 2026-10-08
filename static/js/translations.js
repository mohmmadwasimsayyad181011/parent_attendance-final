/**
 * Multi-Language Internationalization (i18n) Module
 * Supports: English (en - default), Hindi (hi), Marathi (mr)
 * Sanjivani University - Parent Meeting Attendance Portal
 */

const TRANSLATIONS = {
  en: {
    // Header & Brand
    inst_name: "Sanjivani University",
    dept_name: "Department of Artificial Intelligence & Machine Learning",
    live_portal: "Live Portal",
    nav_hod_portal: "HOD Portal",
    nav_public_form: "← Back to Public Attendance Form",
    lang_select_title: "Select Language",

    // Hero Section
    hero_badge: "Official Student-Parent Attendance",
    hero_title: "Annual Parent-Teacher Academic Review 2026",
    hero_desc: "Welcome parents and students. Please complete the quick verification below. Attendance requires entering your student roll number and taking a live selfie photo together with the student as proof of participation.",
    step_1: "1. Enter Student PRN",
    step_2: "2. Fill Parent Details",
    step_3: "3. Take Live Selfie Together",
    step_4: "4. Get Digital Verified Slip",

    // Form Left Column
    card_title_details: "Student & Parent Details",
    badge_all_required: "All fields required",
    duplicate_detected_title: "Attendance already recorded!",
    label_prn: "Student PRN (University ID)",
    btn_autofill: "Auto-Fill",
    prn_placeholder: "e.g. 2125UMLM1128 or 2124UMLF2002",
    prn_hint: "Enter student PRN to auto-fill official name & year",
    label_student_name: "Student Full Name",
    ph_student_name: "Full name of student",
    label_class: "Academic Year / Division",
    opt_select_class: "-- Select Year / Division --",
    label_parent_name: "Parent / Guardian Full Name",
    ph_parent_name: "Full name of attending parent/guardian",
    label_relation: "Relation",
    opt_select_relation: "-- Select Relation --",
    rel_father: "Father",
    rel_mother: "Mother",
    rel_brother: "Brother",
    rel_sister: "Sister",
    rel_uncle: "Uncle",
    rel_other: "Other",
    label_specify_relation: "Specify Relation",
    ph_specify_relation: "Enter relation (e.g. Guardian, Grandfather)",
    label_phone: "Parent Contact Phone Number",
    ph_phone: "10-digit mobile number",
    phone_hint: "We will record this for attendance verification and official notices.",
    label_address: "Parent / Guardian Address",
    ph_address: "Complete residential address (House/Flat No., Street/Area, City/Town, Pincode)",
    address_hint: "Required for official records and correspondence.",
    label_status: "Attendance Status",
    status_present: "Parent Present",
    status_present_sub: "Selfie proof required",
    status_absent: "Parent Absent",
    status_absent_sub: "Student / Desk note",
    label_absence_reason: "Reason for Absence",
    absence_mandatory_tag: "* (Mandatory)",
    ph_absence_reason: "Please specify the mandatory reason why the parent/guardian cannot attend in person (e.g. Out of town for emergency, medical appointment, prior official commitment)...",
    absence_reason_hint: "Reason is mandatory when marking Parent Absent.",

    // Form Right Column (Camera / Proof)
    card_title_camera: "Live Attendance Proof Photo",
    badge_live_selfie: "Live Selfie",
    camera_instruction: "Parent and student must frame their faces together in the box below and click Capture Photo. A secure tamper-proof timestamp and student ID will be watermarked directly on the image.",
    camera_live_feed: "● LIVE CAMERA FEED",
    face_guide_active: "Face Guide Active",
    overlay_guide: "Position Student & Parent Inside Box",
    cam_access_req: "Camera Access Required",
    cam_access_desc: "Please grant browser camera access to snap the required live attendance selfie.",
    btn_enable_camera: "Enable Camera",
    btn_capture_photo: "Capture Photo",
    btn_retake_photo: "Retake Photo",
    trouble_camera: "Trouble with live camera?",
    btn_fallback_upload: "Upload photo from device camera",
    absent_proof_title: "Parent-Signed Absence Form",
    badge_optional: "Optional",
    absent_proof_desc: "If the parent or guardian has provided a signed letter, absence application slip, or consent document, you can upload a photo or PDF copy below.",
    dropzone_text: "Click or Drag & Drop Signed Form Here",
    dropzone_formats: "Supported formats: JPG, PNG, WEBP, PDF (Max 15MB)",
    btn_browse_doc: "Browse Document",
    btn_remove_doc: "Remove",
    btn_submit_present: "Confirm & Record Attendance",
    btn_submit_absent: "Record Parent Absence",
    terms_note: "By submitting, you certify that the student and parent attendance information is accurate. All submissions are timestamped and protected against duplicate entries.",
    footer_credit: "Designed & Developed by Mohammad Wasim Nasir Sayyad",

    // Digital Attendance Pass Modal
    pass_slip_title: "✓ Official Attendance Slip",
    pass_parent_name: "Parent Name",
    pass_relation: "Relation",
    pass_parent_mobile: "Parent Mobile",
    pass_status: "Attendance Status",
    pass_meeting_date: "Meeting Date",
    pass_recorded_time: "Recorded Time",
    pass_verification_code: "Verification Code",
    pass_tamper_proof: "Tamper-Proof Recorded",
    btn_print_pass: "Print / Save Pass",
    btn_submit_another: "Submit Another",

    // Toast / Feedback Messages
    msg_enter_prn: "Please enter Student Roll Number / ID",
    msg_enter_name: "Please enter Student Full Name",
    msg_select_class: "Please select Class / Division",
    msg_enter_parent_name: "Please enter Parent / Guardian Name",
    msg_select_relation: "Please select Relation",
    msg_specify_relation: "Please enter the relation",
    msg_enter_phone: "Please enter a valid 10-digit mobile number",
    msg_enter_address: "Please enter Parent / Guardian Address",
    msg_snap_selfie: "Live selfie photo proof is required! Please snap a photo.",
    msg_absence_reason: "Reason for absence is strictly mandatory when marking Parent Absent!",
    msg_submitting: "Recording Attendance...",
    msg_success: "Attendance recorded successfully! 🎉",
    msg_duplicate: "Duplicate attendance entry detected.",
    msg_verified_roster: "✓ Verified from Official Student Roster",
    msg_not_in_roster: "PRN not in official student roster. You may enter details manually.",
    msg_checking_prn: "Checking student PRN...",
    msg_already_submitted: "Attendance already submitted today.",
    status_pending: "⚠️ Unregistered / Pending",
    btn_checkin_desk: "+ Check-In Desk",
    btn_record_reason: "Record Reason",

    // HOD Admin Portal
    admin_login_title: "HOD / Faculty Portal",
    admin_login_subtitle: "Parent Meeting Attendance Administration",
    admin_cred_badge: "🔑 HOD Access Credentials:",
    admin_label_username: "Admin Username",
    admin_label_password: "Password or 6-Digit PIN",
    btn_admin_login: "Secure Admin Login",
    admin_role_pill: "HOD ACCESS",
    live_sync_text: "LIVE SYNC",
    btn_download_absent_excel: "Download Absent Students (.xlsx)",
    btn_export_excel: "Export to Excel (.xlsx)",
    btn_export_csv: "CSV",
    btn_manual_entry: "+ Manual Entry",
    btn_settings: "⚙ Settings",
    btn_open_form: "Open Form ↗",
    btn_logout: "Logout",
    kpi_total_entries: "Total Logged Entries",
    kpi_parents_present: "Parents Present",
    kpi_parents_absent: "Parents Absent / Excused",
    class_breakdown_label: "Class-wise Attendance Breakdown:",
    filter_by_year: "Filter by Year:",
    pill_all_years: "All Years",
    pill_first_year: "First Year",
    pill_second_year: "Second Year",
    pill_third_year: "Third Year",
    pill_final_year: "Final Year",
    search_placeholder: "Search Roll No, Student Name, Parent, Phone, Address, Code...",
    label_filter_date: "Date:",
    opt_today_date: "Today's Date",
    opt_all_dates: "All Dates",
    label_filter_class: "Class:",
    opt_all_classes: "All Classes / Divisions",
    label_filter_status: "Status:",
    opt_all_statuses: "All Statuses",
    btn_reset_filters: "Reset Filters",
    tab_registered: "Registered Attendance Records",
    tab_absentees: "Absent Students (Official Roster)",
    th_sr_no: "#",
    th_roll_no: "Roll No / PRN",
    th_student_name: "Student Name",
    th_year_div: "Year / Division",
    th_parent_contact: "Parent / Guardian, Phone & Address",
    th_status_remarks: "Status & Remarks",
    th_date_time: "Date & Time",
    th_proof: "Proof / Signed Form",
    th_actions: "Actions",
    no_records_match: "No attendance records match your filter criteria",
    no_records_hint: "Try adjusting your search query, class, or date filters.",
    official_absentee_title: "⚠️ Official Absentee List",
    official_absentee_sub: "(Master roster students without valid Present record)",
    absentee_note: "Updates dynamically in real time as parents submit attendance.",
    turnout_100: "✓ 100% Turnout! Every registered student from the official master roster in the selected year filter is present!",

    // Attendance Details Modal
    det_modal_title: "Student Attendance Details",
    det_protected_notice: "Protected Faculty Record: Parent contact and residential address visible only to authorized HOD/admin accounts.",
    det_profile_label: "Student Profile",
    det_parent_info_label: "Parent / Guardian Information",
    det_auth_badge: "Authorized HOD Access",
    det_address_label: "📍 Parent / Guardian Residential Address:",
    det_audit_label: "Verification & Audit Trail",
    det_proof_label: "Proof Document Attached",
    btn_close_details: "Close Details",

    // Manual Entry & Settings Modals
    manual_modal_title: "Manual Desk Attendance Check-In",
    label_desk_remarks: "Desk Remarks",
    btn_record_entry: "Record Entry",
    btn_cancel: "Cancel",
    settings_modal_title: "Portal & Security Settings",
    label_institution_name: "College / Institution Name",
    label_department_name: "Department Name",
    label_meeting_title: "Meeting Title",
    label_meeting_date: "Active Meeting Date",
    label_require_photo: "Require Live Selfie Photo Proof for \"Parent Present\"",
    label_change_password: "Change Admin Password / PIN (optional)",
    btn_save_settings: "Save Settings",
    btn_close: "Close",
    photo_modal_title: "Verified Attendance Proof / Signed Form",
    det_proof_hint: "Click to open full lightbox preview",
    det_btn_view_doc: "View Full Document",
    manual_ph_roll: "e.g. CS2026-003",
    manual_ph_name: "Full name",
    status_excused: "Excused",
    msg_admin_welcome: "Welcome, Administrator!",
    msg_logged_out: "Logged out successfully.",
    msg_settings_saved: "Settings updated successfully!"
  },

  hi: {
    // Header & Brand
    inst_name: "संजीवनी विश्वविद्यालय",
    dept_name: "कृत्रिम बुद्धिमत्ता और मशीन लर्निंग विभाग",
    live_portal: "लाइव पोर्टल",
    nav_hod_portal: "एचओडी पोर्टल",
    nav_public_form: "← सार्वजनिक उपस्थिति फॉर्म पर वापस जाएं",
    lang_select_title: "भाषा चुनें",

    // Hero Section
    hero_badge: "आधिकारिक छात्र-अभिभावक उपस्थिति",
    hero_title: "वार्षिक पालक-शिक्षक शैक्षणिक समीक्षा २०२६",
    hero_desc: "माता-पिता और छात्रों का स्वागत है। कृपया नीचे दिया गया त्वरित सत्यापन पूरा करें। उपस्थिति दर्ज करने के लिए छात्र का रोल नंबर दर्ज करना और सहभागिता के प्रमाण के रूप में छात्र के साथ एक लाइव सेल्फी फोटो लेना आवश्यक है।",
    step_1: "१. छात्र पीआरएन दर्ज करें",
    step_2: "२. अभिभावक विवरण भरें",
    step_3: "३. एक साथ लाइव सेल्फी लें",
    step_4: "४. डिजिटल सत्यापित पर्ची प्राप्त करें",

    // Form Left Column
    card_title_details: "छात्र एवं अभिभावक विवरण",
    badge_all_required: "सभी फ़ील्ड अनिवार्य हैं",
    duplicate_detected_title: "उपस्थिति पहले ही दर्ज हो चुकी है!",
    label_prn: "छात्र पीआरएन (विश्वविद्यालय आईडी)",
    btn_autofill: "स्वतः भरें",
    prn_placeholder: "उदा. 2125UMLM1128 अथवा 2124UMLF2002",
    prn_hint: "आधिकारिक नाम और वर्ष स्वतः भरने के लिए छात्र पीआरएन दर्ज करें",
    label_student_name: "छात्र का पूरा नाम",
    ph_student_name: "छात्र का पूरा नाम दर्ज करें",
    label_class: "शैक्षणिक वर्ष / विभाग",
    opt_select_class: "-- वर्ष / विभाग चुनें --",
    label_parent_name: "अभिभावक / पालक का पूरा नाम",
    ph_parent_name: "उपस्थित अभिभावक का पूरा नाम दर्ज करें",
    label_relation: "संबंध / नाता",
    opt_select_relation: "-- संबंध चुनें --",
    rel_father: "पिता (Father)",
    rel_mother: "माता (Mother)",
    rel_brother: "भाई (Brother)",
    rel_sister: "बहन (Sister)",
    rel_uncle: "चाचा / मामा (Uncle)",
    rel_other: "अन्य (Other)",
    label_specify_relation: "संबंध निर्दिष्ट करें",
    ph_specify_relation: "संबंध दर्ज करें (उदा. अभिभावक, दादाजी)",
    label_phone: "अभिभावक संपर्क मोबाइल नंबर",
    ph_phone: "१० अंकों का मोबाइल नंबर",
    phone_hint: "हम इसे उपस्थिति सत्यापन और आधिकारिक सूचनाओं के लिए दर्ज करेंगे।",
    label_address: "अभिभावक / पालक का पता",
    ph_address: "पूर्ण आवासीय पता (मकान/फ्लैट नं., सड़क/क्षेत्र, शहर/कस्बा, पिनकोड)",
    address_hint: "आधिकारिक रिकॉर्ड और पत्राचार के लिए आवश्यक।",
    label_status: "उपस्थिति स्थिति",
    status_present: "अभिभावक उपस्थित",
    status_present_sub: "सेल्फी प्रमाण आवश्यक",
    status_absent: "अभिभावक अनुपस्थित",
    status_absent_sub: "छात्र / डेस्क नोट",
    label_absence_reason: "अनुपस्थिति का कारण",
    absence_mandatory_tag: "* (अनिवार्य)",
    ph_absence_reason: "कृपया अनिवार्य कारण बताएं कि अभिभावक व्यक्तिगत रूप से उपस्थित क्यों नहीं हो सकते (उदा. आपात स्थिति, चिकित्सीय परामर्श, पूर्व आधिकारिक कार्य)...",
    absence_reason_hint: "अभिभावक को अनुपस्थित चिह्नित करते समय कारण अनिवार्य है।",

    // Form Right Column (Camera / Proof)
    card_title_camera: "लाइव उपस्थिति प्रमाण फोटो",
    badge_live_selfie: "लाइव सेल्फी",
    camera_instruction: "माता-पिता और छात्र को अपने चेहरों को नीचे दिए गए बॉक्स में एक साथ लाना होगा और फोटो खींचें पर क्लिक करना होगा। छवि पर सीधे एक सुरक्षित टाइमस्टैम्प और छात्र आईडी वॉटरमार्क किया जाएगा।",
    camera_live_feed: "● लाइव कैमरा फीड",
    face_guide_active: "फेस गाइड सक्रिय",
    overlay_guide: "छात्र और अभिभावक को बॉक्स के अंदर रखें",
    cam_access_req: "कैमरा एक्सेस आवश्यक है",
    cam_access_desc: "कृपया आवश्यक लाइव उपस्थिति सेल्फी लेने के लिए ब्राउज़र कैमरा अनुमति दें।",
    btn_enable_camera: "कैमरा सक्षम करें",
    btn_capture_photo: "फोटो खींचें",
    btn_retake_photo: "फिर से फोटो लें",
    trouble_camera: "लाइव कैमरे में समस्या है?",
    btn_fallback_upload: "डिवाइस कैमरे से फोटो अपलोड करें",
    absent_proof_title: "अभिभावक-हस्ताक्षरित अनुपस्थिति प्रपत्र",
    badge_optional: "वैकल्पिक",
    absent_proof_desc: "यदि अभिभावक ने हस्ताक्षरित पत्र, अनुपस्थिति आवेदन पर्ची या सहमति दस्तावेज दिया है, तो आप नीचे फोटो या पीडीएफ अपलोड कर सकते हैं।",
    dropzone_text: "हस्ताक्षरित प्रपत्र यहाँ क्लिक करें या ड्रैग करें",
    dropzone_formats: "समर्थित प्रारूप: JPG, PNG, WEBP, PDF (अधिकतम 15MB)",
    btn_browse_doc: "दस्तावेज़ चुनें",
    btn_remove_doc: "हटाएं",
    btn_submit_present: "उपस्थिति की पुष्टि करें और दर्ज करें",
    btn_submit_absent: "अभिभावक अनुपस्थिति दर्ज करें",
    terms_note: "सबमिट करके, आप प्रमाणित करते हैं कि छात्र और अभिभावक की उपस्थिति की जानकारी सटीक है। सभी सबमिशन टाइमस्टैम्प्ड हैं और डुप्लिकेट प्रविष्टियों से सुरक्षित हैं।",
    footer_credit: "डिज़ाइन एवं विकसित: मोहम्मद वसीम नासिर सय्यद",

    // Digital Attendance Pass Modal
    pass_slip_title: "✓ आधिकारिक उपस्थिति पर्ची",
    pass_parent_name: "अभिभावक का नाम",
    pass_relation: "संबंध",
    pass_parent_mobile: "अभिभावक मोबाइल",
    pass_status: "उपस्थिति स्थिति",
    pass_meeting_date: "बैठक की तिथि",
    pass_recorded_time: "दर्ज समय",
    pass_verification_code: "सत्यापन कोड",
    pass_tamper_proof: "छेड़छाड़-मुक्त दर्ज",
    btn_print_pass: "पर्ची प्रिंट / सेव करें",
    btn_submit_another: "अन्य दर्ज करें",

    // Toast / Feedback Messages
    msg_enter_prn: "कृपया छात्र रोल नंबर / पीआरएन दर्ज करें",
    msg_enter_name: "कृपया छात्र का पूरा नाम दर्ज करें",
    msg_select_class: "कृपया कक्षा / विभाग चुनें",
    msg_enter_parent_name: "कृपया अभिभावक का नाम दर्ज करें",
    msg_select_relation: "कृपया संबंध चुनें",
    msg_specify_relation: "कृपया संबंध दर्ज करें",
    msg_enter_phone: "कृपया मान्य १० अंकों का मोबाइल नंबर दर्ज करें",
    msg_enter_address: "कृपया अभिभावक का आवासीय पता दर्ज करें",
    msg_snap_selfie: "लाइव सेल्फी फोटो प्रमाण आवश्यक है! कृपया फोटो खींचें।",
    msg_absence_reason: "अभिभावक को अनुपस्थित चिह्नित करते समय कारण अनिवार्य है!",
    msg_submitting: "उपस्थिति दर्ज की जा रही है...",
    msg_success: "उपस्थिति सफलतापूर्वक दर्ज की गई! 🎉",
    msg_duplicate: "डुप्लिकेट उपस्थिति प्रविष्टि का पता चला।",
    msg_verified_roster: "✓ आधिकारिक छात्र रोस्टर से सत्यापित",
    msg_not_in_roster: "पीआरएन आधिकारिक रोस्टर में नहीं है। आप विवरण मैन्युअल रूप से दर्ज कर सकते हैं।",
    msg_checking_prn: "छात्र पीआरएन की जाँच की जा रही है...",
    msg_already_submitted: "आज उपस्थिति पहले ही दर्ज हो चुकी है।",
    status_pending: "⚠️ अपंजीकृत / प्रलंबित",
    btn_checkin_desk: "+ डेस्क चेक-इन",
    btn_record_reason: "कारण दर्ज करें",

    // HOD Admin Portal
    admin_login_title: "एचओडी / संकाय पोर्टल",
    admin_login_subtitle: "पालक-शिक्षक बैठक उपस्थिति प्रशासन",
    admin_cred_badge: "🔑 एचओडी लॉगिन क्रेडेंशियल्स:",
    admin_label_username: "व्यवस्थापक यूज़रनेम",
    admin_label_password: "पासवर्ड अथवा ६-अंकी पिन",
    btn_admin_login: "सुरक्षित व्यवस्थापक लॉगिन",
    admin_role_pill: "एचओडी एक्सेस",
    live_sync_text: "लाइव सिंक",
    btn_download_absent_excel: "अनुपस्थित छात्र डाउनलोड करें (.xlsx)",
    btn_export_excel: "एक्सेल में निर्यात करें (.xlsx)",
    btn_export_csv: "सीएसवी (CSV)",
    btn_manual_entry: "+ मैन्युअल प्रविष्टि",
    btn_settings: "⚙ सेटिंग्स",
    btn_open_form: "फॉर्म खोलें ↗",
    btn_logout: "लॉग आउट",
    kpi_total_entries: "कुल दर्ज प्रविष्टियां",
    kpi_parents_present: "उपस्थित अभिभावक",
    kpi_parents_absent: "अनुपस्थित / छूट प्राप्त अभिभावक",
    class_breakdown_label: "कक्षावार उपस्थिति विवरण:",
    filter_by_year: "वर्ष अनुसार फ़िल्टर:",
    pill_all_years: "सभी वर्ष",
    pill_first_year: "प्रथम वर्ष",
    pill_second_year: "द्वितीय वर्ष",
    pill_third_year: "तृतीय वर्ष",
    pill_final_year: "अंतिम वर्ष",
    search_placeholder: "रोल नं, छात्र का नाम, अभिभावक, फोन, पता, कोड खोजें...",
    label_filter_date: "दिनांक:",
    opt_today_date: "आज की तारीख",
    opt_all_dates: "सभी तारीखें",
    label_filter_class: "कक्षा:",
    opt_all_classes: "सभी कक्षाएं / विभाग",
    label_filter_status: "स्थिति:",
    opt_all_statuses: "सभी स्थितियां",
    btn_reset_filters: "फ़िल्टर रीसेट करें",
    tab_registered: "पंजीकृत उपस्थिति रिकॉर्ड",
    tab_absentees: "अनुपस्थित छात्र (आधिकारिक रोस्टर)",
    th_sr_no: "क्र.",
    th_roll_no: "रोल नं / पीआरएन",
    th_student_name: "छात्र का नाम",
    th_year_div: "वर्ष / विभाग",
    th_parent_contact: "अभिभावक, फोन एवं पता",
    th_status_remarks: "स्थिति एवं टिप्पणी",
    th_date_time: "दिनांक एवं समय",
    th_proof: "प्रमाण / प्रपत्र",
    th_actions: "कार्यवाही",
    no_records_match: "आपके फ़िल्टर से कोई उपस्थिति रिकॉर्ड मेल नहीं खाता",
    no_records_hint: "अपनी खोज, कक्षा अथवा तिथि फ़िल्टर बदलें।",
    official_absentee_title: "⚠️ आधिकारिक अनुपस्थित सूची",
    official_absentee_sub: "(मास्टर रोस्टर छात्र जिनका उपस्थिति रिकॉर्ड नहीं है)",
    absentee_note: "माता-पिता द्वारा उपस्थिति दर्ज करने पर यह वास्तविक समय में अपडेट होता है।",
    turnout_100: "✓ १००% उपस्थिति! चयनित वर्ष फ़िल्टर में रोस्टर का प्रत्येक छात्र उपस्थित है!",

    // Attendance Details Modal
    det_modal_title: "छात्र उपस्थिति विवरण",
    det_protected_notice: "सुरक्षित संकाय रिकॉर्ड: अभिभावक का संपर्क और आवासीय पता केवल अधिकृत एचओडी/प्रशासक खातों को दिखाई देता है।",
    det_profile_label: "छात्र प्रोफ़ाइल",
    det_parent_info_label: "अभिभावक / पालक विवरण",
    det_auth_badge: "अधिकृत एचओडी पहुंच",
    det_address_label: "📍 अभिभावक / पालक का आवासीय पता:",
    det_audit_label: "सत्यापन एवं ऑडिट ट्रेल",
    det_proof_label: "प्रमाण दस्तावेज़ संलग्न",
    btn_close_details: "विवरण बंद करें",

    // Manual Entry & Settings Modals
    manual_modal_title: "डेस्क मैन्युअल उपस्थिति चेक-इन",
    label_desk_remarks: "डेस्क टिप्पणी",
    btn_record_entry: "प्रविष्टि दर्ज करें",
    btn_cancel: "रद्द करें",
    settings_modal_title: "पोर्टल एवं सुरक्षा सेटिंग्स",
    label_institution_name: "कॉलेज / संस्थान का नाम",
    label_department_name: "विभाग का नाम",
    label_meeting_title: "बैठक का शीर्षक",
    label_meeting_date: "सक्रिय बैठक तिथि",
    label_require_photo: "\"अभिभावक उपस्थित\" के लिए लाइव सेल्फी फोटो प्रमाण अनिवार्य करें",
    label_change_password: "व्यवस्थापक पासवर्ड / पिन बदलें (वैकल्पिक)",
    btn_save_settings: "सेटिंग्स सहेजें",
    btn_close: "बंद करें",
    photo_modal_title: "सत्यापित उपस्थिति प्रमाण / प्रपत्र",
    det_proof_hint: "पूर्ण पूर्वावलोकन खोलने के लिए क्लिक करें",
    det_btn_view_doc: "पूर्ण दस्तावेज़ देखें",
    manual_ph_roll: "उदा. CS2026-003",
    manual_ph_name: "छात्र का पूरा नाम",
    status_excused: "छूट प्राप्त",
    msg_admin_welcome: "स्वागत है, प्रशासक!",
    msg_logged_out: "सफलतापूर्वक लॉग आउट किया गया।",
    msg_settings_saved: "सेटिंग्स सफलतापूर्वक अपडेट की गईं!"
  },

  mr: {
    // Header & Brand
    inst_name: "संजीवनी विद्यापीठ",
    dept_name: "कृत्रिम बुद्धिमत्ता आणि मशीन लर्निंग विभाग",
    live_portal: "थेट पोर्टल",
    nav_hod_portal: "एचओडी पोर्टल",
    nav_public_form: "← सार्वजनिक उपस्थिती फॉर्मवर परत जा",
    lang_select_title: "भाषा निवडा",

    // Hero Section
    hero_badge: "अधिकृत विद्यार्थी-पालक उपस्थिती",
    hero_title: "वार्षिक पालक-शिक्षक शैक्षणिक आढावा २०२६",
    hero_desc: "पालक आणि विद्यार्थ्यांचे स्वागत आहे. कृपया खालील जलद पडताळणी पूर्ण करा. उपस्थितीसाठी विद्यार्थ्याचा रोल नंबर प्रविष्ट करणे आणि सहभागाचा पुरावा म्हणून विद्यार्थ्यासोबत थेट सेल्फी फोटो काढणे आवश्यक आहे.",
    step_1: "१. विद्यार्थी पीआरएन प्रविष्ट करा",
    step_2: "२. पालक तपशील भरा",
    step_3: "३. एकत्र थेट सेल्फी काढा",
    step_4: "४. डिजिटल पडताळणी पावती मिळवा",

    // Form Left Column
    card_title_details: "विद्यार्थी आणि पालक तपशील",
    badge_all_required: "सर्व माहिती भरणे अनिवार्य आहे",
    duplicate_detected_title: "उपस्थिती आधीच नोंदवली गेली आहे!",
    label_prn: "विद्यार्थी पीआरएन (विद्यापीठ आयडी)",
    btn_autofill: "स्वयं भरा",
    prn_placeholder: "उदा. 2125UMLM1128 किंवा 2124UMLF2002",
    prn_hint: "अधिकृत नाव आणि वर्ष स्वयं भरण्यासाठी विद्यार्थी पीआरएन प्रविष्ट करा",
    label_student_name: "विद्यार्थ्याचे पूर्ण नाव",
    ph_student_name: "विद्यार्थ्याचे पूर्ण नाव प्रविष्ट करा",
    label_class: "शैक्षणिक वर्ष / विभाग",
    opt_select_class: "-- वर्ष / विभाग निवडा --",
    label_parent_name: "पालकांचे पूर्ण नाव",
    ph_parent_name: "उपस्थित पालकांचे पूर्ण नाव प्रविष्ट करा",
    label_relation: "नाते",
    opt_select_relation: "-- नाते निवडा --",
    rel_father: "वडील (Father)",
    rel_mother: "आई (Mother)",
    rel_brother: "भाऊ (Brother)",
    rel_sister: "बहीण (Sister)",
    rel_uncle: "काका / मामा (Uncle)",
    rel_other: "इतर (Other)",
    label_specify_relation: "नाते स्पष्ट करा",
    ph_specify_relation: "नाते प्रविष्ट करा (उदा. पालक, आजोबा)",
    label_phone: "पालक संपर्क मोबाइल नंबर",
    ph_phone: "१० अंकी मोबाइल नंबर",
    phone_hint: "आम्ही हे उपस्थिती पडताळणी आणि अधिकृत सूचनांसाठी नोंदवू.",
    label_address: "पालकांचा निवासी पत्ता",
    ph_address: "पूर्ण निवासी पत्ता (घर/फ्लॅट क्र., रस्ता/परिसर, शहर/गाव, पिनकोड)",
    address_hint: "अधिकृत नोंदी आणि पत्रव्यवहारासाठी आवश्यक.",
    label_status: "उपस्थिती स्थिती",
    status_present: "पालक उपस्थित",
    status_present_sub: "सेल्फी पुरावा आवश्यक",
    status_absent: "पालक अनुपस्थित",
    status_absent_sub: "विद्यार्थी / डेस्क नोंद",
    label_absence_reason: "अनुपस्थितीचे कारण",
    absence_mandatory_tag: "* (अनिवार्य)",
    ph_absence_reason: "कृपया पालक प्रत्यक्ष उपस्थित राहू शकत नसल्याचे अनिवार्य कारण स्पष्ट करा (उदा. आणीबाणी, वैद्यकीय उपचार, पूर्व अधिकृत काम)...",
    absence_reason_hint: "पालक अनुपस्थित दर्शवताना कारण अनिवार्य आहे.",

    // Form Right Column (Camera / Proof)
    card_title_camera: "थेट उपस्थिती पुरावा फोटो",
    badge_live_selfie: "थेट सेल्फी",
    camera_instruction: "पालक आणि विद्यार्थ्याने खालील बॉक्समध्ये एकत्र चेहरे आणून फोटो काढा वर क्लिक करावे. प्रतिमेवर थेट सुरक्षित टाइमस्टॅम्प आणि विद्यार्थी आयडी वॉटरमार्क केला जाईल.",
    camera_live_feed: "● थेट कॅमेरा फीड",
    face_guide_active: "फेस गाईड सक्रिय",
    overlay_guide: "विद्यार्थी आणि पालकांना बॉक्सच्या आत ठेवा",
    cam_access_req: "कॅमेरा प्रवेश आवश्यक आहे",
    cam_access_desc: "कृपया आवश्यक थेट उपस्थिती सेल्फी काढण्यासाठी ब्राउझर कॅमेरा परवानगी द्या.",
    btn_enable_camera: "कॅमेरा सुरू करा",
    btn_capture_photo: "फोटो काढा",
    btn_retake_photo: "पुन्हा फोटो काढा",
    trouble_camera: "थेट कॅमेऱ्यात अडचण येत आहे?",
    btn_fallback_upload: "डिव्हाइस कॅमेऱ्यातून फोटो अपलोड करा",
    absent_proof_title: "पालकांची स्वाक्षरी असलेले अनुपस्थिती पत्र",
    badge_optional: "ऐच्छिक",
    absent_proof_desc: "जर पालकांनी स्वाक्षरी केलेले पत्र, अनुपस्थिती अर्ज किंवा संमती दस्तऐवज दिले असेल, तर आपण खाली फोटो किंवा पीडीएफ प्रत अपलोड करू शकता.",
    dropzone_text: "स्वाक्षरी केलेले पत्र येथे क्लिक करा किंवा ड्रॅग करा",
    dropzone_formats: "समर्थित फॉरमॅट: JPG, PNG, WEBP, PDF (कमाल 15MB)",
    btn_browse_doc: "दस्तऐवज निवडा",
    btn_remove_doc: "काढून टाका",
    btn_submit_present: "उपस्थितीची पुष्टी करा आणि नोंदवा",
    btn_submit_absent: "पालक अनुपस्थिती नोंदवा",
    terms_note: "सबमिट करून, आपण प्रमाणित करता की विद्यार्थी आणि पालकांची उपस्थिती माहिती अचूक आहे. सर्व नोंदी टाइमस्टॅम्प केलेल्या आहेत आणि डुप्लिकेट नोंदींपासून सुरक्षित आहेत.",
    footer_credit: "रचना व विकास: मोहम्मद वसीम नासिर सय्यद",

    // Digital Attendance Pass Modal
    pass_slip_title: "✓ अधिकृत उपस्थिती पावती",
    pass_parent_name: "पालकांचे नाव",
    pass_relation: "नाते",
    pass_parent_mobile: "पालक मोबाइल",
    pass_status: "उपस्थिती स्थिती",
    pass_meeting_date: "सभेची तारीख",
    pass_recorded_time: "नोंदवलेली वेळ",
    pass_verification_code: "पडताळणी कोड",
    pass_tamper_proof: "छेडछाड-मुक्त नोंदणी",
    btn_print_pass: "पावती प्रिंट / सेव्ह करा",
    btn_submit_another: "दुसरी नोंदणी करा",

    // Toast / Feedback Messages
    msg_enter_prn: "कृपया विद्यार्थी रोल नंबर / पीआरएन प्रविष्ट करा",
    msg_enter_name: "कृपया विद्यार्थ्याचे पूर्ण नाव प्रविष्ट करा",
    msg_select_class: "कृपया वर्ग / तुकडी निवडा",
    msg_enter_parent_name: "कृपया पालकांचे नाव प्रविष्ट करा",
    msg_select_relation: "कृपया नाते निवडा",
    msg_specify_relation: "कृपया नाते प्रविष्ट करा",
    msg_enter_phone: "कृपया वैध १० अंकी मोबाइल नंबर प्रविष्ट करा",
    msg_enter_address: "कृपया पालकांचा निवासी पत्ता प्रविष्ट करा",
    msg_snap_selfie: "थेट सेल्फी फोटो पुरावा आवश्यक आहे! कृपया फोटो काढा.",
    msg_absence_reason: "पालक अनुपस्थित दर्शवताना अनुपस्थितीचे कारण अनिवार्य आहे!",
    msg_submitting: "उपस्थिती नोंदवली जात आहे...",
    msg_success: "उपस्थिती यशस्वीरित्या नोंदवली गेली! 🎉",
    msg_duplicate: "उपस्थितीची दुबार नोंद आढळली.",
    msg_verified_roster: "✓ अधिकृत विद्यार्थी यादीतून पडताळणी पूर्ण",
    msg_not_in_roster: "पीआरएन अधिकृत यादीत नाही. आपण माहिती मॅन्युअली प्रविष्ट करू शकता.",
    msg_checking_prn: "विद्यार्थी पीआरएन तपासत आहे...",
    msg_already_submitted: "आज उपस्थिती आधीच नोंदवली गेली आहे.",
    status_pending: "⚠️ नोंदणी नसलेले / प्रलंबित",
    btn_checkin_desk: "+ डेस्क नोंदणी",
    btn_record_reason: "कारण नोंदवा",

    // HOD Admin Portal
    admin_login_title: "एचओडी / प्राध्यापक पोर्टल",
    admin_login_subtitle: "पालक सभा उपस्थिती प्रशासन",
    admin_cred_badge: "🔑 एचओडी प्रवेश तपशील:",
    admin_label_username: "प्रशासक वापरकर्तानाव",
    admin_label_password: "पासवर्ड किंवा ६-अंकी पिन",
    btn_admin_login: "सुरक्षित व्यवस्थापक लॉगिन",
    admin_role_pill: "एचओडी प्रवेश",
    live_sync_text: "थेट सिंक",
    btn_download_absent_excel: "अनुपस्थित विद्यार्थी डाउनलोड करा (.xlsx)",
    btn_export_excel: "एक्सेलमध्ये निर्यात करा (.xlsx)",
    btn_export_csv: "सीएसव्ही (CSV)",
    btn_manual_entry: "+ मॅन्युअल नोंदणी",
    btn_settings: "⚙ सेटिंग्ज",
    btn_open_form: "फॉर्म उघडा ↗",
    btn_logout: "लॉग आउट",
    kpi_total_entries: "एकूण नोंदवलेल्या नोंदी",
    kpi_parents_present: "उपस्थित पालक",
    kpi_parents_absent: "अनुपस्थित / सवलत मिळालेले पालक",
    class_breakdown_label: "वर्गानिहाय उपस्थिती तपशील:",
    filter_by_year: "वर्षानुसार फिल्टर:",
    pill_all_years: "सर्व वर्षे",
    pill_first_year: "प्रथम वर्ष",
    pill_second_year: "द्वितीय वर्ष",
    pill_third_year: "तृतीय वर्ष",
    pill_final_year: "अंतिम वर्ष",
    search_placeholder: "रोल क्र, विद्यार्थ्याचे नाव, पालक, फोन, पत्ता, कोड शोधा...",
    label_filter_date: "दिनांक:",
    opt_today_date: "आजची तारीख",
    opt_all_dates: "सर्व तारखा",
    label_filter_class: "वर्ग:",
    opt_all_classes: "सर्व वर्ग / तुकड्या",
    label_filter_status: "स्थिती:",
    opt_all_statuses: "सर्व स्थिती",
    btn_reset_filters: "फिल्टर रीसेट करा",
    tab_registered: "नोंदणीकृत उपस्थिती नोंदी",
    tab_absentees: "अनुपस्थित विद्यार्थी (अधिकृत यादी)",
    th_sr_no: "क्र.",
    th_roll_no: "रोल क्र / पीआरएन",
    th_student_name: "विद्यार्थ्याचे नाव",
    th_year_div: "वर्ष / तुकडी",
    th_parent_contact: "पालक, फोन आणि पत्ता",
    th_status_remarks: "स्थिती आणि शेरा",
    th_date_time: "दिनांक आणि वेळ",
    th_proof: "पुरावा / स्वाक्षरी केलेले पत्र",
    th_actions: "कृती",
    no_records_match: "तुमच्या फिल्टर निकषांशी जुळणारे कोणतेही उपस्थिती रेकॉर्ड आढळले नाही",
    no_records_hint: "तुमची शोध क्वेरी, वर्ग किंवा तारीख फिल्टर बदलून पहा.",
    official_absentee_title: "⚠️ अधिकृत अनुपस्थित यादी",
    official_absentee_sub: "(उपस्थिती नोंद नसलेले अधिकृत रोस्टरमधील विद्यार्थी)",
    absentee_note: "पालकांनी उपस्थिती नोंदवल्यास हे रिअल-टाइममध्ये आपोआप अपडेट होते.",
    turnout_100: "✓ १००% उपस्थिती! निवडलेल्या वर्ष फिल्टरमधील रोस्टरमधील प्रत्येक विद्यार्थी उपस्थित आहे!",

    // Attendance Details Modal
    det_modal_title: "विद्यार्थी उपस्थिती तपशील",
    det_protected_notice: "संरक्षित प्राध्यापक रेकॉर्ड: पालकांचा संपर्क आणि निवासी पत्ता केवळ अधिकृत एचओडी/प्रशासक खात्यांनाच दिसतो.",
    det_profile_label: "विद्यार्थी प्रोफाइल",
    det_parent_info_label: "पालक तपशील",
    det_auth_badge: "अधिकृत एचओडी प्रवेश",
    det_address_label: "📍 पालकांचा निवासी पत्ता:",
    det_audit_label: "पडताळणी आणि ऑडिट नोंद",
    det_proof_label: "पुरावा दस्तऐवज जोडला",
    btn_close_details: "तपशील बंद करा",

    // Manual Entry & Settings Modals
    manual_modal_title: "डेस्क मॅन्युअल उपस्थिती नोंदणी",
    label_desk_remarks: "डेस्क शेरा",
    btn_record_entry: "नोंद करा",
    btn_cancel: "रद्द करा",
    settings_modal_title: "पोर्टल व सुरक्षा सेटिंग्ज",
    label_institution_name: "महाविद्यालय / संस्था नाव",
    label_department_name: "विभागाचे नाव",
    label_meeting_title: "सभेचे नाव / शीर्षक",
    label_meeting_date: "सक्रिय सभा तारीख",
    label_require_photo: "\"पालक उपस्थित\" साठी थेट सेल्फी फोटो पुरावा सक्तीचा करा",
    label_change_password: "अ‍ॅडमिन पासवर्ड / पिन बदला (ऐच्छिक)",
    btn_save_settings: "सेटिंग्ज जतन करा",
    btn_close: "बंद करा",
    photo_modal_title: "पडताळणी उपस्थिती पुरावा / स्वाक्षरी केलेले पत्र",
    det_proof_hint: "पूर्ण पूर्वावलोकन पाहण्यासाठी क्लिक करा",
    det_btn_view_doc: "पूर्ण दस्तऐवज पहा",
    manual_ph_roll: "उदा. CS2026-003",
    manual_ph_name: "विद्यार्थ्याचे पूर्ण नाव",
    status_excused: "सवलत दिली",
    msg_admin_welcome: "स्वागत आहे, प्रशासक!",
    msg_logged_out: "यशस्वीरित्या लॉग आउट केले.",
    msg_settings_saved: "सेटिंग्ज यशस्वीरित्या अद्यतनित केल्या!"
  }
};

/**
 * Get translation for key
 */
function t(key, defaultVal = '') {
  const currentLang = window.currentLanguage || 'en';
  if (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang][key] !== undefined) {
    return TRANSLATIONS[currentLang][key];
  }
  if (TRANSLATIONS.en && TRANSLATIONS.en[key] !== undefined) {
    return TRANSLATIONS.en[key];
  }
  return defaultVal;
}

/**
 * Apply language translations to entire DOM
 */
function applyLanguage(lang) {
  if (!TRANSLATIONS[lang]) lang = 'en';
  window.currentLanguage = lang;
  localStorage.setItem('portal_language', lang);

  // 1. Text / innerHTML translations
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (TRANSLATIONS[lang][key] !== undefined) {
      el.textContent = TRANSLATIONS[lang][key];
    }
  });

  // 2. Placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (TRANSLATIONS[lang][key] !== undefined) {
      el.setAttribute('placeholder', TRANSLATIONS[lang][key]);
    }
  });

  // 3. Titles / Tooltips
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    if (TRANSLATIONS[lang][key] !== undefined) {
      el.setAttribute('title', TRANSLATIONS[lang][key]);
    }
  });

  // 4. Update dropdown options if labeled
  document.querySelectorAll('option[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (TRANSLATIONS[lang][key] !== undefined) {
      el.textContent = TRANSLATIONS[lang][key];
    }
  });

  // 5. Synchronize all language selectors on page
  document.querySelectorAll('.lang-select, #languageSelect, #adminLangSelect').forEach(sel => {
    if (sel.value !== lang) {
      sel.value = lang;
    }
  });

  // 6. Dispatch custom event for dynamic components (camera status, buttons, pass slips)
  document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
}

// Auto initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const savedLang = localStorage.getItem('portal_language') || 'en';
  
  // Wire up change listener on any language select elements
  document.querySelectorAll('.lang-select, #languageSelect, #adminLangSelect').forEach(sel => {
    sel.value = savedLang;
    sel.addEventListener('change', (e) => {
      applyLanguage(e.target.value);
    });
  });

  applyLanguage(savedLang);
});

window.t = t;
window.applyLanguage = applyLanguage;
