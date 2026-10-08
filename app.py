import os
import re
import uuid
import base64
import csv
import io
from datetime import datetime
from flask import Flask, render_template, request, jsonify, session, send_file, redirect, url_for, send_from_directory
from werkzeug.security import check_password_hash, generate_password_hash
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

from database import get_db, init_db, load_students_from_excel

import jinja2

app = Flask(__name__, static_folder='static', template_folder='.')
app.jinja_loader = jinja2.ChoiceLoader([
    jinja2.FileSystemLoader(os.path.dirname(os.path.abspath(__file__))),
    jinja2.FileSystemLoader(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'templates'))
])
app.secret_key = os.environ.get('SECRET_KEY', 'parent-attendance-portal-secret-key-2026')

UPLOAD_FOLDER = os.path.join(app.static_folder, 'uploads', 'proofs')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Helper: Check if admin is logged in
def is_admin_logged_in():
    return session.get('admin_logged_in') is True

def generate_verification_code():
    today_year = datetime.now().year
    random_hex = uuid.uuid4().hex[:6].upper()
    return f"PMA-{today_year}-{random_hex}"

# Helper: Save base64 photo to file
def save_photo_proof(data_url, student_id):
    if not data_url or not data_url.startswith('data:image'):
        return ''
    try:
        header, encoded = data_url.split(',', 1)
        # determine extension
        ext = 'jpg'
        if 'png' in header:
            ext = 'png'
        elif 'webp' in header:
            ext = 'webp'
            
        file_bytes = base64.b64decode(encoded)
        # limit size to ~10MB max raw before decode
        if len(file_bytes) > 10 * 1024 * 1024:
            return ''
            
        clean_id = re.sub(r'[^a-zA-Z0-9_-]', '_', student_id)
        filename = f"proof_{clean_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:4]}.{ext}"
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        with open(filepath, 'wb') as f:
            f.write(file_bytes)
        return f"/static/uploads/proofs/{filename}"
    except Exception as e:
        print(f"Error saving photo: {e}")
        return ''

def save_signed_form(data_url, student_id):
    if not data_url:
        return ''
    try:
        header = ''
        if ',' in data_url:
            header, encoded = data_url.split(',', 1)
        else:
            encoded = data_url

        ext = 'jpg'
        if 'png' in header:
            ext = 'png'
        elif 'webp' in header:
            ext = 'webp'
        elif 'pdf' in header:
            ext = 'pdf'

        file_bytes = base64.b64decode(encoded)
        if len(file_bytes) > 15 * 1024 * 1024:
            return ''

        clean_id = re.sub(r'[^a-zA-Z0-9_-]', '_', student_id)
        filename = f"signed_form_{clean_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:4]}.{ext}"
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        with open(filepath, 'wb') as f:
            f.write(file_bytes)
        return f"/static/uploads/proofs/{filename}"
    except Exception as e:
        print(f"Error saving signed form: {e}")
        return ''

# ==========================================
# PROTECTED FILE SERVING (SERVER-SIDE ACCESS CONTROL)
# ==========================================
@app.route('/static/uploads/proofs/<path:filename>')
def serve_proof_file(filename):
    # Server-side access control: protect uploaded photos & forms
    if is_admin_logged_in():
        return send_from_directory(UPLOAD_FOLDER, filename)

    allowed = session.get('allowed_proofs', [])
    if filename in allowed:
        return send_from_directory(UPLOAD_FOLDER, filename)

    return jsonify({'error': 'Unauthorized: Access to uploaded attendance documentation is restricted to authorized faculty.'}), 403


YEAR_MAP = {
    'First': ['FY', 'FY-A', 'FY-B'],
    'Second': ['SY-A', 'SY-B', 'SY'],
    'Third': ['TY-A', 'TY-B', 'TY'],
    'Final': ['FINAL YEAR', 'Final Year', 'BE', 'FINAL']
}

def resolve_year_filters(year_params):
    if not year_params:
        return None
    if isinstance(year_params, str):
        tokens = [t.strip() for t in year_params.split(',') if t.strip()]
    else:
        tokens = []
        for item in year_params:
            if isinstance(item, str):
                tokens.extend([t.strip() for t in item.split(',') if t.strip()])

    if not tokens or any(t.lower() == 'all' for t in tokens):
        return None

    resolved_classes = []
    for token in tokens:
        matched = False
        for y_key, classes in YEAR_MAP.items():
            if token.lower() in [y_key.lower(), y_key.lower() + ' year', classes[0].lower()]:
                resolved_classes.extend(classes)
                matched = True
                break
        if not matched:
            resolved_classes.append(token)
    return list(set(resolved_classes)) if resolved_classes else None

# ==========================================
# PUBLIC PAGES & VERIFICATION
# ==========================================
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/admin')
def admin_page():
    return render_template('admin.html')

@app.route('/verify/<code_or_id>')
def verify_pass(code_or_id):
    code_or_id = code_or_id.strip()
    db = get_db()
    record = db.execute('''
        SELECT * FROM attendance
        WHERE verification_code = ? OR UPPER(student_id) = UPPER(?)
        ORDER BY id DESC LIMIT 1
    ''', (code_or_id, code_or_id)).fetchone()
    db.close()
    verified_record = None
    if record:
        allowed = session.get('allowed_proofs', [])
        if record['photo_url']:
            allowed.append(os.path.basename(record['photo_url']))
        if 'signed_form_url' in record.keys() and record['signed_form_url']:
            allowed.append(os.path.basename(record['signed_form_url']))
        session['allowed_proofs'] = allowed
        # Ensure sensitive parent address is protected and not exposed on public verification
        verified_record = dict(record)
        verified_record.pop('parent_address', None)
    return render_template('index.html', verification_target=code_or_id, verified_record=verified_record)

# ==========================================
# PUBLIC API: CONFIG & STUDENT LOOKUP
# ==========================================
@app.route('/api/public/config', methods=['GET'])
def get_public_config():
    db = get_db()
    settings = db.execute('SELECT * FROM admin_settings WHERE id = 1').fetchone()
    roster_classes = [r['class_division'] for r in db.execute('SELECT DISTINCT class_division FROM student_roster ORDER BY class_division').fetchall()]
    db.close()
    
    # Defaults if settings not yet initialized
    inst_name = settings['institution_name'] if settings else 'Sanjivani University'
    dept_name = settings['department_name'] if settings else 'Department of Artificial Intelligence & Machine Learning'
    meeting_title = settings['meeting_title'] if settings else 'Parent-Teacher Academic Review 2026'
    meeting_date = settings['meeting_date'] if settings and settings['meeting_date'] else datetime.now().strftime('%Y-%m-%d')
    require_photo = bool(settings['require_live_photo']) if settings else True

    # Required division options
    default_classes = ['FY', 'SY-A', 'SY-B', 'TY-A', 'TY-B', 'FINAL YEAR']
    # Merge preserving default order, adding any distinct roster classes
    classes = default_classes + [c for c in roster_classes if c not in default_classes]

    return jsonify({
        'institution_name': inst_name,
        'department_name': dept_name,
        'meeting_title': meeting_title,
        'meeting_date': meeting_date,
        'current_server_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'require_live_photo': require_photo,
        'classes': classes
    })

@app.route('/api/public/student-lookup', methods=['GET'])
def lookup_student():
    student_id = request.args.get('student_id', '').strip()
    if not student_id:
        return jsonify({'found': False, 'message': 'PRN / Roll No required'}), 400

    db = get_db()
    today_str = datetime.now().strftime('%Y-%m-%d')
    
    # 1. Check if already marked attendance today
    existing = db.execute('''
        SELECT id, student_id, student_name, class_division, parent_name, status, meeting_date, meeting_time, verification_code
        FROM attendance
        WHERE UPPER(student_id) = UPPER(?) AND meeting_date = ?
    ''', (student_id, today_str)).fetchone()

    # 2. Check if student exists in master roster
    roster_entry = db.execute('''
        SELECT student_id, student_name, class_division, parent_name, parent_phone
        FROM student_roster
        WHERE UPPER(student_id) = UPPER(?)
    ''', (student_id,)).fetchone()
    db.close()

    if existing:
        return jsonify({
            'found': True,
            'is_duplicate': True,
            'existing_attendance': dict(existing),
            'student_data': dict(roster_entry) if roster_entry else None,
            'message': f"Attendance already recorded today at {existing['meeting_time']} with status: {existing['status']}"
        })

    if roster_entry:
        return jsonify({
            'found': True,
            'is_duplicate': False,
            'student_data': dict(roster_entry)
        })

    return jsonify({
        'found': False,
        'is_duplicate': False,
        'message': 'PRN not in official student roster. You may enter details manually.'
    })

# ==========================================
# PUBLIC API: ATTENDANCE SUBMISSION
# ==========================================
@app.route('/api/attendance/submit', methods=['POST'])
def submit_attendance():
    data = request.get_json() or {}
    
    # Honeypot spam check
    if data.get('website'):
        return jsonify({'success': False, 'message': 'Bot submission detected.'}), 400

    student_id = data.get('student_id', '').strip().upper()
    student_name = data.get('student_name', '').strip()
    class_division = data.get('class_division', '').strip()
    parent_name = data.get('parent_name', '').strip()
    relation = data.get('relation', '').strip()
    parent_phone = data.get('parent_phone', '').strip()
    parent_address = data.get('parent_address', '').strip()
    status = data.get('status', 'Parent Present').strip()
    remarks = data.get('remarks', '').strip()
    photo_data = data.get('photo', '').strip()
    signed_form_data = data.get('signed_form', '').strip()

    # Validation
    if not student_id:
        return jsonify({'success': False, 'message': 'Student PRN is required.'}), 400
    if not student_name:
        return jsonify({'success': False, 'message': 'Student Full Name is required.'}), 400
    if not class_division:
        return jsonify({'success': False, 'message': 'Class / Year is required.'}), 400
    if not parent_name:
        return jsonify({'success': False, 'message': 'Parent / Guardian Name is required.'}), 400
    if not parent_address:
        return jsonify({'success': False, 'message': 'Parent / Guardian Address is required.'}), 400
    
    # Phone number validation (digits only, length 10)
    clean_phone = re.sub(r'[^0-9]', '', parent_phone)
    if len(clean_phone) != 10:
        return jsonify({'success': False, 'message': 'Please enter a valid 10-digit mobile number.'}), 400

    if status not in ['Parent Present', 'Parent Absent', 'Excused']:
        status = 'Parent Present'

    # When Absent, reason is strictly mandatory
    if status == 'Parent Absent' and not remarks:
        return jsonify({'success': False, 'message': 'Reason for absence is mandatory when marking Parent Absent.'}), 400

    db = get_db()
    settings = db.execute('SELECT require_live_photo, meeting_date FROM admin_settings WHERE id = 1').fetchone()
    
    meeting_date = settings['meeting_date'] if settings and settings['meeting_date'] else datetime.now().strftime('%Y-%m-%d')
    require_photo = bool(settings['require_live_photo']) if settings else True

    # Duplicate Prevention Check: check for this student on this meeting date
    existing = db.execute('''
        SELECT id, student_id, student_name, parent_name, meeting_date, meeting_time, status, verification_code
        FROM attendance
        WHERE UPPER(student_id) = UPPER(?) AND meeting_date = ?
    ''', (student_id, meeting_date)).fetchone()

    if existing:
        db.close()
        return jsonify({
            'success': False,
            'is_duplicate': True,
            'existing_record': dict(existing),
            'message': f"Duplicate entry! Attendance for PRN '{student_id}' is already recorded today at {existing['meeting_time']} (Status: {existing['status']})."
        }), 409

    # Photo validation if Present
    photo_url = ''
    signed_form_url = ''
    if status == 'Parent Present':
        if require_photo:
            if not photo_data:
                db.close()
                return jsonify({'success': False, 'message': 'Live selfie photo proof is required when marking Parent Present.'}), 400
            photo_url = save_photo_proof(photo_data, student_id)
            if not photo_url:
                db.close()
                return jsonify({'success': False, 'message': 'Failed to process selfie photo proof. Please retake photo.'}), 400
        elif photo_data:
            photo_url = save_photo_proof(photo_data, student_id)
    else:
        # Status is Parent Absent: handle optional parent-signed form / photo
        if signed_form_data:
            signed_form_url = save_signed_form(signed_form_data, student_id)
        if photo_data and not photo_url:
            photo_url = save_photo_proof(photo_data, student_id)

    # Server Timestamp
    now = datetime.now()
    meeting_time = now.strftime('%H:%M:%S')
    created_at = now.isoformat()
    verification_code = generate_verification_code()
    ip_addr = request.headers.get('X-Forwarded-For', request.remote_addr or '')
    user_agent = request.headers.get('User-Agent', '')[:150]

    cursor = db.cursor()
    cursor.execute('''
        INSERT INTO attendance (
            student_id, student_name, class_division, parent_name, relation, parent_phone,
            parent_address, status, remarks, photo_url, signed_form_url, verification_code, meeting_date,
            meeting_time, created_at, ip_address, user_agent
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        student_id, student_name, class_division, parent_name, relation, clean_phone,
        parent_address, status, remarks, photo_url, signed_form_url, verification_code, meeting_date,
        meeting_time, created_at, ip_addr, user_agent
    ))
    record_id = cursor.lastrowid
    conn_settings = db.execute('SELECT institution_name, department_name, meeting_title FROM admin_settings WHERE id = 1').fetchone()
    db.commit()
    db.close()

    allowed = session.get('allowed_proofs', [])
    if photo_url:
        allowed.append(os.path.basename(photo_url))
    if signed_form_url:
        allowed.append(os.path.basename(signed_form_url))
    session['allowed_proofs'] = allowed

    return jsonify({
        'success': True,
        'message': 'Attendance successfully recorded!',
        'attendance': {
            'id': record_id,
            'student_id': student_id,
            'student_name': student_name,
            'class_division': class_division,
            'parent_name': parent_name,
            'relation': relation,
            'parent_phone': clean_phone,
            'status': status,
            'remarks': remarks,
            'photo_url': photo_url,
            'signed_form_url': signed_form_url,
            'verification_code': verification_code,
            'meeting_date': meeting_date,
            'meeting_time': meeting_time,
            'institution_name': conn_settings['institution_name'] if conn_settings else 'Sanjivani University',
            'department_name': conn_settings['department_name'] if conn_settings else 'Department of Artificial Intelligence & Machine Learning',
            'meeting_title': conn_settings['meeting_title'] if conn_settings else 'Parent Meeting 2026'
        }
    })

# ==========================================
# ADMIN AUTHENTICATION
# ==========================================
@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    if not username or not password:
        return jsonify({'success': False, 'message': 'Username and password/PIN required.'}), 400

    db = get_db()
    settings = db.execute('SELECT * FROM admin_settings WHERE id = 1').fetchone()
    db.close()

    if not settings:
        return jsonify({'success': False, 'message': 'Admin settings not initialized.'}), 500

    # Server-side authentication: verify username and secure password hash
    valid_user = (username.lower() == settings['admin_username'].lower())
    valid_pass = check_password_hash(settings['admin_password_hash'], password)

    if valid_user and valid_pass:
        session['admin_logged_in'] = True
        session['admin_username'] = settings['admin_username']
        return jsonify({
            'success': True,
            'message': 'Login successful.',
            'admin': {
                'username': settings['admin_username'],
                'institution': settings['institution_name']
            }
        })

    return jsonify({'success': False, 'message': 'Invalid admin username or password.'}), 401

@app.route('/api/admin/logout', methods=['POST'])
def admin_logout():
    session.pop('admin_logged_in', None)
    session.pop('admin_username', None)
    return jsonify({'success': True, 'message': 'Logged out.'})

@app.route('/api/admin/me', methods=['GET'])
def admin_me():
    if not is_admin_logged_in():
        return jsonify({'authenticated': False})

    db = get_db()
    settings = db.execute('SELECT * FROM admin_settings WHERE id = 1').fetchone()
    db.close()

    return jsonify({
        'authenticated': True,
        'username': session.get('admin_username', 'HOD'),
        'settings': {
            'institution_name': settings['institution_name'] if settings else '',
            'department_name': settings['department_name'] if settings else '',
            'meeting_title': settings['meeting_title'] if settings else '',
            'meeting_date': settings['meeting_date'] if settings else '',
            'require_live_photo': bool(settings['require_live_photo']) if settings else True
        }
    })

# ==========================================
# ADMIN DASHBOARD APIS (PROTECTED)
# ==========================================
@app.route('/api/admin/stats', methods=['GET'])
def admin_stats():
    if not is_admin_logged_in():
        return jsonify({'error': 'Unauthorized'}), 401

    date_filter = request.args.get('date', '').strip()
    years_param = request.args.getlist('year') or request.args.get('years', '')
    resolved_classes = resolve_year_filters(years_param)

    db = get_db()
    if not date_filter or date_filter == 'today':
        settings = db.execute('SELECT meeting_date FROM admin_settings WHERE id = 1').fetchone()
        date_filter = settings['meeting_date'] if settings and settings['meeting_date'] else datetime.now().strftime('%Y-%m-%d')

    # 1. Total students from official database (matching selected year filter)
    if resolved_classes:
        placeholders = ','.join(['?'] * len(resolved_classes))
        total_students = db.execute(f"SELECT COUNT(*) as count FROM student_roster WHERE class_division IN ({placeholders})", resolved_classes).fetchone()['count']
    else:
        total_students = db.execute("SELECT COUNT(*) as count FROM student_roster").fetchone()['count']

    # 2. Present students on meeting_date (matching selected year filter)
    date_clause = "AND a.meeting_date = ?" if date_filter and date_filter != 'all' else ""
    date_params = [date_filter] if date_filter and date_filter != 'all' else []

    if resolved_classes:
        placeholders = ','.join(['?'] * len(resolved_classes))
        sql_present = f"""
            SELECT COUNT(DISTINCT r.student_id) as count
            FROM student_roster r
            JOIN attendance a ON UPPER(r.student_id) = UPPER(a.student_id)
            WHERE a.status = 'Parent Present' {date_clause} AND r.class_division IN ({placeholders})
        """
        present_count = db.execute(sql_present, date_params + resolved_classes).fetchone()['count']
    else:
        sql_present = f"""
            SELECT COUNT(DISTINCT r.student_id) as count
            FROM student_roster r
            JOIN attendance a ON UPPER(r.student_id) = UPPER(a.student_id)
            WHERE a.status = 'Parent Present' {date_clause}
        """
        present_count = db.execute(sql_present, date_params).fetchone()['count']

    # 3. Absent students = Total students - Present students
    # "Absent = students in the official database without a valid Present attendance record."
    absent_count = max(0, total_students - present_count)

    # 4. Total Logged entries in attendance table
    att_conditions = []
    att_params = []
    if date_filter and date_filter != 'all':
        att_conditions.append("meeting_date = ?")
        att_params.append(date_filter)
    if resolved_classes:
        placeholders = ','.join(['?'] * len(resolved_classes))
        att_conditions.append(f"class_division IN ({placeholders})")
        att_params.extend(resolved_classes)
    att_where = ("WHERE " + " AND ".join(att_conditions)) if att_conditions else ""
    total_logged_entries = db.execute(f"SELECT COUNT(*) as count FROM attendance {att_where}", att_params).fetchone()['count']

    # 5. Class breakdown
    if resolved_classes:
        placeholders = ','.join(['?'] * len(resolved_classes))
        class_stats = db.execute(f'''
            SELECT r.class_division,
                   COUNT(DISTINCT r.student_id) as total_count,
                   COUNT(DISTINCT CASE WHEN a.status = 'Parent Present' {date_clause} THEN r.student_id END) as present_count
            FROM student_roster r
            LEFT JOIN attendance a ON UPPER(r.student_id) = UPPER(a.student_id)
            WHERE r.class_division IN ({placeholders})
            GROUP BY r.class_division
            ORDER BY r.class_division
        ''', date_params + resolved_classes).fetchall()
    else:
        class_stats = db.execute(f'''
            SELECT r.class_division,
                   COUNT(DISTINCT r.student_id) as total_count,
                   COUNT(DISTINCT CASE WHEN a.status = 'Parent Present' {date_clause} THEN r.student_id END) as present_count
            FROM student_roster r
            LEFT JOIN attendance a ON UPPER(r.student_id) = UPPER(a.student_id)
            GROUP BY r.class_division
            ORDER BY r.class_division
        ''', date_params).fetchall()

    # Hourly distribution
    hourly_stats = db.execute(f'''
        SELECT strftime('%H:00', meeting_time) as hour_slot, COUNT(*) as count
        FROM attendance
        {att_where}
        GROUP BY hour_slot
        ORDER BY hour_slot
    ''', att_params).fetchall()

    db.close()

    attendance_rate = round((present_count / total_students * 100), 1) if total_students > 0 else 0
    absent_rate = round((absent_count / total_students * 100), 1) if total_students > 0 else 0

    return jsonify({
        'total_students': total_students,
        'present_count': present_count,
        'absent_count': absent_count,
        'attendance_rate': attendance_rate,
        'absent_rate': absent_rate,
        'total_entries': total_logged_entries,
        'total_roster': total_students,
        'meeting_date': date_filter,
        'class_breakdown': [
            {
                'class_division': r['class_division'],
                'total_count': r['total_count'],
                'present_count': r['present_count'],
                'absent_count': max(0, r['total_count'] - r['present_count'])
            } for r in class_stats
        ],
        'hourly_breakdown': [dict(r) for r in hourly_stats]
    })

@app.route('/api/admin/records', methods=['GET'])
def admin_records():
    if not is_admin_logged_in():
        return jsonify({'error': 'Unauthorized'}), 401

    date_filter = request.args.get('date', '').strip()
    class_filter = request.args.get('class_division', '').strip()
    years_param = request.args.getlist('year') or request.args.get('years', '')
    resolved_classes = resolve_year_filters(years_param)
    status_filter = request.args.get('status', '').strip()
    search = request.args.get('search', '').strip()

    db = get_db()
    conditions = []
    params = []

    if date_filter and date_filter != 'all':
        conditions.append("meeting_date = ?")
        params.append(date_filter)

    if class_filter and class_filter != 'all':
        conditions.append("class_division = ?")
        params.append(class_filter)
    elif resolved_classes:
        placeholders = ','.join(['?'] * len(resolved_classes))
        conditions.append(f"class_division IN ({placeholders})")
        params.extend(resolved_classes)

    if status_filter and status_filter != 'all':
        conditions.append("status = ?")
        params.append(status_filter)

    if search:
        search_pattern = f"%{search}%"
        conditions.append("(student_id LIKE ? OR student_name LIKE ? OR parent_name LIKE ? OR relation LIKE ? OR parent_phone LIKE ? OR parent_address LIKE ? OR verification_code LIKE ? OR remarks LIKE ?)")
        params.extend([search_pattern, search_pattern, search_pattern, search_pattern, search_pattern, search_pattern, search_pattern, search_pattern])

    where_clause = ("WHERE " + " AND ".join(conditions)) if conditions else ""
    sql = f'''
        SELECT id, student_id, student_name, class_division, parent_name, relation, parent_phone, parent_address,
               status, remarks, photo_url, signed_form_url, verification_code, meeting_date, meeting_time, created_at
        FROM attendance
        {where_clause}
        ORDER BY id DESC
    '''
    rows = db.execute(sql, params).fetchall()
    
    # Distinct classes and dates for filter dropdowns
    distinct_classes = [r['class_division'] for r in db.execute('SELECT DISTINCT class_division FROM attendance ORDER BY class_division').fetchall()]
    default_classes = ['FY', 'SY-A', 'SY-B', 'TY-A', 'TY-B', 'FINAL YEAR']
    available_classes = default_classes + [c for c in distinct_classes if c not in default_classes]
    available_dates = [r['meeting_date'] for r in db.execute('SELECT DISTINCT meeting_date FROM attendance ORDER BY meeting_date DESC').fetchall()]

    db.close()

    return jsonify({
        'records': [dict(r) for r in rows],
        'total': len(rows),
        'available_classes': available_classes,
        'available_dates': available_dates
    })

@app.route('/api/admin/absentees', methods=['GET'])
def admin_absentees():
    if not is_admin_logged_in():
        return jsonify({'error': 'Unauthorized'}), 401

    db = get_db()
    settings = db.execute('SELECT meeting_date FROM admin_settings WHERE id = 1').fetchone()
    today_default = settings['meeting_date'] if settings and settings['meeting_date'] else datetime.now().strftime('%Y-%m-%d')
    date_filter = request.args.get('date', '').strip() or today_default
    if date_filter == 'all':
        date_filter = today_default

    years_param = request.args.getlist('year') or request.args.get('years', '')
    resolved_classes = resolve_year_filters(years_param)
    search = request.args.get('search', '').strip()

    conditions = []
    params = [date_filter, date_filter, date_filter]

    if resolved_classes:
        placeholders = ','.join(['?'] * len(resolved_classes))
        conditions.append(f"r.class_division IN ({placeholders})")
        params.extend(resolved_classes)

    if search:
        search_pattern = f"%{search}%"
        conditions.append("(r.student_id LIKE ? OR r.student_name LIKE ? OR a.parent_name LIKE ? OR a.remarks LIKE ?)")
        params.extend([search_pattern, search_pattern, search_pattern, search_pattern])

    where_clause = ("AND " + " AND ".join(conditions)) if conditions else ""

    sql = f'''
        SELECT r.student_id, r.student_name, r.class_division,
               COALESCE(a.parent_name, '') as parent_name,
               COALESCE(a.relation, '') as relation,
               COALESCE(a.parent_phone, '') as parent_phone,
               COALESCE(a.parent_address, '') as parent_address,
               COALESCE(a.status, 'Unregistered') as status,
               COALESCE(a.remarks, 'Parent did not attend') as remarks,
               COALESCE(a.photo_url, '') as photo_url,
               COALESCE(a.signed_form_url, '') as signed_form_url,
               COALESCE(a.meeting_date, ?) as meeting_date,
               COALESCE(a.meeting_time, '') as meeting_time,
               COALESCE(a.verification_code, '') as verification_code
        FROM student_roster r
        LEFT JOIN attendance a ON UPPER(r.student_id) = UPPER(a.student_id) AND a.meeting_date = ?
        WHERE UPPER(r.student_id) NOT IN (
            SELECT UPPER(att.student_id) FROM attendance att
            WHERE att.status = 'Parent Present' AND att.meeting_date = ?
        )
        {where_clause}
        ORDER BY r.class_division, r.student_id
    '''
    absentees = db.execute(sql, params).fetchall()
    db.close()

    return jsonify({
        'absentees': [dict(r) for r in absentees],
        'total_absent': len(absentees),
        'meeting_date': date_filter
    })

@app.route('/api/admin/records/toggle-status', methods=['POST'])
def admin_toggle_status():
    if not is_admin_logged_in():
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json() or {}
    record_id = data.get('record_id')
    new_status = data.get('status', 'Parent Present')
    remarks = data.get('remarks')

    if not record_id:
        return jsonify({'success': False, 'message': 'Record ID required'}), 400

    db = get_db()
    if remarks is not None:
        db.execute('UPDATE attendance SET status = ?, remarks = ? WHERE id = ?', (new_status, remarks, record_id))
    else:
        db.execute('UPDATE attendance SET status = ? WHERE id = ?', (new_status, record_id))
    db.commit()
    db.close()

    return jsonify({'success': True, 'message': f'Status updated to {new_status}'})

@app.route('/api/admin/records/manual-entry', methods=['POST'])
def admin_manual_entry():
    if not is_admin_logged_in():
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json() or {}
    student_id = data.get('student_id', '').strip().upper()
    student_name = data.get('student_name', '').strip()
    class_division = data.get('class_division', '').strip()
    parent_name = data.get('parent_name', '').strip()
    relation = data.get('relation', '').strip()
    parent_phone = data.get('parent_phone', '').strip()
    parent_address = data.get('parent_address', '').strip() or 'Address provided at HOD desk'
    status = data.get('status', 'Parent Present').strip()
    remarks = data.get('remarks', 'Manual Desk Entry by HOD').strip()
    meeting_date = data.get('meeting_date', '').strip() or datetime.now().strftime('%Y-%m-%d')

    if not student_id or not student_name or not class_division or not parent_name:
        return jsonify({'success': False, 'message': 'Student ID, Name, Class and Parent Name are required.'}), 400

    db = get_db()
    # Check duplicate
    existing = db.execute('SELECT id, meeting_time FROM attendance WHERE UPPER(student_id) = UPPER(?) AND meeting_date = ?', (student_id, meeting_date)).fetchone()
    if existing:
        db.close()
        return jsonify({'success': False, 'message': f"Student {student_id} is already recorded on {meeting_date}."}), 409

    now = datetime.now()
    meeting_time = now.strftime('%H:%M:%S')
    vcode = generate_verification_code()

    cursor = db.cursor()
    cursor.execute('''
        INSERT INTO attendance (
            student_id, student_name, class_division, parent_name, relation, parent_phone,
            parent_address, status, remarks, photo_url, verification_code, meeting_date,
            meeting_time, created_at, ip_address, user_agent
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '', ?, ?, ?, ?, 'Admin-Desk', 'HOD Manual Check-in')
    ''', (student_id, student_name, class_division, parent_name, relation, parent_phone, parent_address, status, remarks, vcode, meeting_date, meeting_time, now.isoformat()))
    db.commit()
    db.close()

    return jsonify({'success': True, 'message': f'Manual entry added for {student_id}'})

@app.route('/api/admin/records/<int:record_id>', methods=['DELETE'])
def admin_delete_record(record_id):
    if not is_admin_logged_in():
        return jsonify({'error': 'Unauthorized'}), 401

    db = get_db()
    record = db.execute('SELECT photo_url FROM attendance WHERE id = ?', (record_id,)).fetchone()
    if record and record['photo_url'] and record['photo_url'].startswith('/static/uploads/proofs/'):
        # Clean up file on disk
        fname = os.path.basename(record['photo_url'])
        fpath = os.path.join(UPLOAD_FOLDER, fname)
        if os.path.exists(fpath):
            try:
                os.remove(fpath)
            except Exception:
                pass

    db.execute('DELETE FROM attendance WHERE id = ?', (record_id,))
    db.commit()
    db.close()

    return jsonify({'success': True, 'message': 'Attendance record deleted.'})

@app.route('/api/admin/settings/update', methods=['POST'])
def admin_update_settings():
    if not is_admin_logged_in():
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json() or {}
    inst_name = data.get('institution_name', '').strip()
    dept_name = data.get('department_name', '').strip()
    meeting_title = data.get('meeting_title', '').strip()
    meeting_date = data.get('meeting_date', '').strip()
    require_photo = 1 if data.get('require_live_photo') else 0
    new_password = data.get('new_password', '').strip()

    db = get_db()
    if new_password:
        p_hash = generate_password_hash(new_password)
        db.execute('''
            UPDATE admin_settings
            SET institution_name = ?, department_name = ?, meeting_title = ?, meeting_date = ?, require_live_photo = ?, admin_password_hash = ?
            WHERE id = 1
        ''', (inst_name, dept_name, meeting_title, meeting_date, require_photo, p_hash))
    else:
        db.execute('''
            UPDATE admin_settings
            SET institution_name = ?, department_name = ?, meeting_title = ?, meeting_date = ?, require_live_photo = ?
            WHERE id = 1
        ''', (inst_name, dept_name, meeting_title, meeting_date, require_photo))
    db.commit()
    db.close()

    return jsonify({'success': True, 'message': 'Settings saved successfully.'})

@app.route('/api/admin/roster/sync', methods=['POST'])
def admin_sync_roster():
    if not is_admin_logged_in():
        return jsonify({'error': 'Unauthorized'}), 401
    try:
        count = load_students_from_excel()
        return jsonify({'success': True, 'message': f'Master roster successfully synchronized with {count} students from Excel.', 'count': count})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# ==========================================
# EXPORT TO EXCEL (.xlsx) & CSV
# ==========================================
@app.route('/api/admin/export/excel', methods=['GET'])
def export_excel():
    if not is_admin_logged_in():
        return redirect('/admin')

    date_filter = request.args.get('date', '').strip()
    class_filter = request.args.get('class_division', '').strip()
    years_param = request.args.getlist('year') or request.args.get('years', '')
    resolved_classes = resolve_year_filters(years_param)
    status_filter = request.args.get('status', '').strip()
    search = request.args.get('search', '').strip()

    db = get_db()
    settings = db.execute('SELECT * FROM admin_settings WHERE id = 1').fetchone()

    conditions = []
    params = []

    if date_filter and date_filter != 'all':
        conditions.append("meeting_date = ?")
        params.append(date_filter)
    if class_filter and class_filter != 'all':
        conditions.append("class_division = ?")
        params.append(class_filter)
    elif resolved_classes:
        placeholders = ','.join(['?'] * len(resolved_classes))
        conditions.append(f"class_division IN ({placeholders})")
        params.extend(resolved_classes)

    if status_filter and status_filter != 'all':
        conditions.append("status = ?")
        params.append(status_filter)
    if search:
        search_pattern = f"%{search}%"
        conditions.append("(student_id LIKE ? OR student_name LIKE ? OR parent_name LIKE ? OR parent_phone LIKE ?)")
        params.extend([search_pattern, search_pattern, search_pattern, search_pattern])

    where_clause = ("WHERE " + " AND ".join(conditions)) if conditions else ""
    sql = f'''
        SELECT student_id, student_name, class_division, parent_name, relation, parent_phone, parent_address,
               status, meeting_date, meeting_time, verification_code, remarks, photo_url, signed_form_url
        FROM attendance
        {where_clause}
        ORDER BY class_division, student_id
    '''
    rows = db.execute(sql, params).fetchall()
    db.close()

    # Create OpenPyXL workbook
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Parent Meeting Attendance"

    # Styling colors
    NAVY = "1E3A8A"
    LIGHT_BLUE = "DBEAFE"
    GRAY_HEADER = "F1F5F9"
    GREEN_PRESENT = "D1FAE5"
    RED_ABSENT = "FEE2E2"
    BORDER_COLOR = "CBD5E1"

    thin_border = Border(
        left=Side(style='thin', color=BORDER_COLOR),
        right=Side(style='thin', color=BORDER_COLOR),
        top=Side(style='thin', color=BORDER_COLOR),
        bottom=Side(style='thin', color=BORDER_COLOR)
    )

    # Institution Title Banner
    inst = settings['institution_name'] if settings else 'Sanjivani University'
    dept = settings['department_name'] if settings else 'Department of Artificial Intelligence & Machine Learning'
    title = settings['meeting_title'] if settings else 'Parent Meeting Attendance'

    ws.merge_cells('A1:L1')
    ws['A1'] = inst.upper()
    ws['A1'].font = Font(name='Calibri', size=16, bold=True, color='FFFFFF')
    ws['A1'].fill = PatternFill(start_color=NAVY, end_color=NAVY, fill_type='solid')
    ws['A1'].alignment = Alignment(horizontal='center', vertical='center')
    ws.row_dimensions[1].height = 30

    ws.merge_cells('A2:L2')
    ws['A2'] = f"{dept}  |  {title}"
    ws['A2'].font = Font(name='Calibri', size=11, bold=True, color='1E293B')
    ws['A2'].fill = PatternFill(start_color=LIGHT_BLUE, end_color=LIGHT_BLUE, fill_type='solid')
    ws['A2'].alignment = Alignment(horizontal='center', vertical='center')
    ws.row_dimensions[2].height = 22

    # Meta Info block
    ws.merge_cells('A3:F3')
    current_time_str = datetime.now().strftime('%d-%b-%Y %I:%M %p')
    filter_desc = f"Filter: Date: {date_filter or 'All'} | Class: {class_filter or 'All'} | Status: {status_filter or 'All'}"
    ws['A3'] = f"Generated On: {current_time_str} | {filter_desc}"
    ws['A3'].font = Font(name='Calibri', size=9, italic=True, color='64748B')
    ws['A3'].alignment = Alignment(horizontal='left', vertical='center')

    # Summary Stats
    total_present = sum(1 for r in rows if r['status'] == 'Parent Present')
    total_absent = len(rows) - total_present
    rate = f"{(total_present / len(rows) * 100):.1f}%" if rows else "0%"

    ws.merge_cells('G3:L3')
    ws['G3'] = f"Total Entries: {len(rows)}  |  Present: {total_present}  |  Absent: {total_absent}  |  Rate: {rate}"
    ws['G3'].font = Font(name='Calibri', size=9, bold=True, color='0F172A')
    ws['G3'].alignment = Alignment(horizontal='right', vertical='center')
    ws.row_dimensions[3].height = 20

    # Header Row
    headers = [
        "S.No", "Roll No / Student ID", "Student Name", "Class / Division",
        "Parent / Guardian Name", "Relation", "Parent Contact Phone", "Parent / Guardian Address",
        "Attendance Status", "Date", "Recorded Time", "Verification Pass Code"
    ]

    header_row = 5
    ws.row_dimensions[header_row].height = 26
    for col_idx, header_text in enumerate(headers, 1):
        cell = ws.cell(row=header_row, column=col_idx, value=header_text)
        cell.font = Font(name='Calibri', size=11, bold=True, color='FFFFFF')
        cell.fill = PatternFill(start_color=NAVY, end_color=NAVY, fill_type='solid')
        cell.alignment = Alignment(horizontal='center' if col_idx in [1, 9, 10, 11, 12] else 'left', vertical='center')
        cell.border = thin_border

    # Data Rows
    current_row = header_row + 1
    for idx, row in enumerate(rows, 1):
        ws.row_dimensions[current_row].height = 22
        
        status_val = row['status']
        is_present = (status_val == 'Parent Present')
        rel_val = row['relation'] if ('relation' in row.keys() and row['relation']) else ''
        addr_val = row['parent_address'] if ('parent_address' in row.keys() and row['parent_address']) else ''
        
        row_values = [
            idx,
            row['student_id'],
            row['student_name'],
            row['class_division'],
            row['parent_name'],
            rel_val,
            row['parent_phone'],
            addr_val,
            status_val,
            row['meeting_date'],
            row['meeting_time'],
            row['verification_code']
        ]

        for col_idx, val in enumerate(row_values, 1):
            cell = ws.cell(row=current_row, column=col_idx, value=val)
            cell.font = Font(name='Calibri', size=10)
            cell.border = thin_border
            
            # Alignments
            if col_idx == 1:
                cell.alignment = Alignment(horizontal='center', vertical='center')
            elif col_idx in [10, 11, 12]:
                cell.alignment = Alignment(horizontal='center', vertical='center')
            else:
                cell.alignment = Alignment(horizontal='left', vertical='center')

            # Status cell highlight
            if col_idx == 9:
                cell.alignment = Alignment(horizontal='center', vertical='center')
                if is_present:
                    cell.fill = PatternFill(start_color=GREEN_PRESENT, end_color=GREEN_PRESENT, fill_type='solid')
                    cell.font = Font(name='Calibri', size=10, bold=True, color='065F46')
                else:
                    cell.fill = PatternFill(start_color=RED_ABSENT, end_color=RED_ABSENT, fill_type='solid')
                    cell.font = Font(name='Calibri', size=10, bold=True, color='991B1B')

        current_row += 1

    # Auto-adjust column widths
    for col in ws.columns:
        max_len = 0
        col_letter = get_column_letter(col[0].column)
        for cell in col:
            # Avoid considering merged banner length
            if cell.row < 5:
                continue
            val_str = str(cell.value or '')
            if len(val_str) > max_len:
                max_len = len(val_str)
        ws.column_dimensions[col_letter].width = max(max_len + 4, 12)

    # Set specific comfortable widths
    ws.column_dimensions['A'].width = 8
    ws.column_dimensions['B'].width = 22
    ws.column_dimensions['C'].width = 24
    ws.column_dimensions['D'].width = 22
    ws.column_dimensions['E'].width = 24
    ws.column_dimensions['F'].width = 16
    ws.column_dimensions['G'].width = 18
    ws.column_dimensions['H'].width = 34
    ws.column_dimensions['I'].width = 18
    ws.column_dimensions['J'].width = 14
    ws.column_dimensions['K'].width = 16
    ws.column_dimensions['L'].width = 22

    # Save to memory
    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    filename = f"Parent_Meeting_Attendance_{date_filter or 'All'}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    return send_file(
        output,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        as_attachment=True,
        download_name=filename
    )

@app.route('/api/admin/export/absentees-excel', methods=['GET'])
def export_absentees_excel():
    if not is_admin_logged_in():
        return redirect('/admin')

    db = get_db()
    settings = db.execute('SELECT * FROM admin_settings WHERE id = 1').fetchone()
    today_default = settings['meeting_date'] if settings and settings['meeting_date'] else datetime.now().strftime('%Y-%m-%d')
    date_filter = request.args.get('date', '').strip() or today_default
    if date_filter == 'all':
        date_filter = today_default

    years_param = request.args.getlist('year') or request.args.get('years', '')
    resolved_classes = resolve_year_filters(years_param)
    search = request.args.get('search', '').strip()

    conditions = []
    params = [date_filter, date_filter, date_filter]

    if resolved_classes:
        placeholders = ','.join(['?'] * len(resolved_classes))
        conditions.append(f"r.class_division IN ({placeholders})")
        params.extend(resolved_classes)

    if search:
        search_pattern = f"%{search}%"
        conditions.append("(r.student_id LIKE ? OR r.student_name LIKE ? OR a.parent_name LIKE ? OR a.remarks LIKE ?)")
        params.extend([search_pattern, search_pattern, search_pattern, search_pattern])

    where_clause = ("AND " + " AND ".join(conditions)) if conditions else ""

    sql = f'''
        SELECT r.student_id, r.student_name, r.class_division,
               COALESCE(a.parent_name, '') as parent_name,
               COALESCE(a.relation, '') as relation,
               COALESCE(a.parent_phone, '') as parent_phone,
               COALESCE(a.status, 'Unregistered') as status,
               COALESCE(a.remarks, 'Parent did not attend') as remarks,
               COALESCE(a.photo_url, '') as photo_url,
               COALESCE(a.signed_form_url, '') as signed_form_url,
               COALESCE(a.meeting_date, ?) as meeting_date,
               COALESCE(a.meeting_time, '') as meeting_time
        FROM student_roster r
        LEFT JOIN attendance a ON UPPER(r.student_id) = UPPER(a.student_id) AND a.meeting_date = ?
        WHERE UPPER(r.student_id) NOT IN (
            SELECT UPPER(att.student_id) FROM attendance att
            WHERE att.status = 'Parent Present' AND att.meeting_date = ?
        )
        {where_clause}
        ORDER BY r.class_division, r.student_id
    '''
    rows = db.execute(sql, params).fetchall()

    if resolved_classes:
        placeholders = ','.join(['?'] * len(resolved_classes))
        total_in_filter = db.execute(f"SELECT COUNT(*) as count FROM student_roster WHERE class_division IN ({placeholders})", resolved_classes).fetchone()['count']
    else:
        total_in_filter = db.execute("SELECT COUNT(*) as count FROM student_roster").fetchone()['count']

    db.close()

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Absent Students Report"

    # Styling colors
    NAVY = "1E3A8A"
    LIGHT_ROSE = "FFE4E6"
    ROSE_HEADER = "991B1B"
    RED_ABSENT = "FEE2E2"
    BORDER_COLOR = "CBD5E1"

    thin_border = Border(
        left=Side(style='thin', color=BORDER_COLOR),
        right=Side(style='thin', color=BORDER_COLOR),
        top=Side(style='thin', color=BORDER_COLOR),
        bottom=Side(style='thin', color=BORDER_COLOR)
    )

    inst = settings['institution_name'] if settings else 'Sanjivani University'
    dept = settings['department_name'] if settings else 'Department of Artificial Intelligence & Machine Learning'
    title = settings['meeting_title'] if settings else 'Parent Meeting Attendance'

    # Banner Row 1
    ws.merge_cells('A1:K1')
    ws['A1'] = inst.upper()
    ws['A1'].font = Font(name='Calibri', size=16, bold=True, color='FFFFFF')
    ws['A1'].fill = PatternFill(start_color=NAVY, end_color=NAVY, fill_type='solid')
    ws['A1'].alignment = Alignment(horizontal='center', vertical='center')
    ws.row_dimensions[1].height = 30

    # Banner Row 2
    ws.merge_cells('A2:K2')
    ws['A2'] = f"{dept}  |  OFFICIAL ABSENT STUDENTS REPORT ({title})"
    ws['A2'].font = Font(name='Calibri', size=11, bold=True, color='991B1B')
    ws['A2'].fill = PatternFill(start_color=LIGHT_ROSE, end_color=LIGHT_ROSE, fill_type='solid')
    ws['A2'].alignment = Alignment(horizontal='center', vertical='center')
    ws.row_dimensions[2].height = 22

    # Meta Info Row 3
    current_time_str = datetime.now().strftime('%d-%b-%Y %I:%M %p')
    years_str = years_param if isinstance(years_param, str) else ', '.join(years_param)
    filter_desc = f"Meeting Date: {date_filter} | Year Filter: {years_str or 'All Years'} | Generated: {current_time_str}"
    ws.merge_cells('A3:E3')
    ws['A3'] = filter_desc
    ws['A3'].font = Font(name='Calibri', size=9, italic=True, color='64748B')
    ws['A3'].alignment = Alignment(horizontal='left', vertical='center')

    # Summary Stats Row 3 Right
    absent_count = len(rows)
    absent_rate = f"{(absent_count / total_in_filter * 100):.1f}%" if total_in_filter > 0 else "0%"
    ws.merge_cells('F3:K3')
    ws['F3'] = f"Total Absent: {absent_count} / {total_in_filter} Students  |  Absentee Rate: {absent_rate}"
    ws['F3'].font = Font(name='Calibri', size=9, bold=True, color='991B1B')
    ws['F3'].alignment = Alignment(horizontal='right', vertical='center')
    ws.row_dimensions[3].height = 20

    # Headers Row 5
    headers = [
        "S.No", "PRN / Student ID", "Student Name", "Year / Division",
        "Parent / Guardian Name", "Relation", "Parent Contact Phone", "Attendance Status",
        "Absence Reason / Remarks", "Date / Time Recorded", "Signed Form Attached"
    ]
    header_row = 5
    ws.row_dimensions[header_row].height = 26
    for col_idx, h_text in enumerate(headers, 1):
        cell = ws.cell(row=header_row, column=col_idx, value=h_text)
        cell.font = Font(name='Calibri', size=11, bold=True, color='FFFFFF')
        cell.fill = PatternFill(start_color=ROSE_HEADER, end_color=ROSE_HEADER, fill_type='solid')
        cell.alignment = Alignment(horizontal='center' if col_idx in [1, 8, 10, 11] else 'left', vertical='center')
        cell.border = thin_border

    # Data Rows
    current_row = header_row + 1
    for idx, r in enumerate(rows, 1):
        ws.row_dimensions[current_row].height = 22
        time_display = f"{r['meeting_date']} {r['meeting_time']}".strip() if r['meeting_time'] else 'Not Recorded'
        signed_form_status = "Yes (Uploaded)" if r['signed_form_url'] else "No"

        row_vals = [
            idx,
            r['student_id'],
            r['student_name'],
            r['class_division'],
            r['parent_name'] or 'Not Recorded',
            r['relation'] or '-',
            r['parent_phone'] or 'Not Recorded',
            r['status'],
            r['remarks'],
            time_display,
            signed_form_status
        ]

        for col_idx, val in enumerate(row_vals, 1):
            cell = ws.cell(row=current_row, column=col_idx, value=val)
            cell.font = Font(name='Calibri', size=10)
            cell.border = thin_border

            if col_idx == 1:
                cell.alignment = Alignment(horizontal='center', vertical='center')
            elif col_idx in [8, 10, 11]:
                cell.alignment = Alignment(horizontal='center', vertical='center')
            else:
                cell.alignment = Alignment(horizontal='left', vertical='center')

            if col_idx == 8:
                cell.fill = PatternFill(start_color=RED_ABSENT, end_color=RED_ABSENT, fill_type='solid')
                cell.font = Font(name='Calibri', size=10, bold=True, color='991B1B')

        current_row += 1

    ws.column_dimensions['A'].width = 8
    ws.column_dimensions['B'].width = 22
    ws.column_dimensions['C'].width = 26
    ws.column_dimensions['D'].width = 18
    ws.column_dimensions['E'].width = 24
    ws.column_dimensions['F'].width = 15
    ws.column_dimensions['G'].width = 18
    ws.column_dimensions['H'].width = 18
    ws.column_dimensions['I'].width = 34
    ws.column_dimensions['J'].width = 22
    ws.column_dimensions['K'].width = 20

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    filename = f"Absent_Students_Report_{date_filter}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    return send_file(
        output,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        as_attachment=True,
        download_name=filename
    )

@app.route('/api/admin/export/csv', methods=['GET'])
def export_csv():
    if not is_admin_logged_in():
        return redirect('/admin')

    date_filter = request.args.get('date', '').strip()
    db = get_db()
    params = []
    where = ""
    if date_filter and date_filter != 'all':
        where = "WHERE meeting_date = ?"
        params.append(date_filter)

    rows = db.execute(f'''
        SELECT student_id, student_name, class_division, parent_name, relation, parent_phone, parent_address,
               status, meeting_date, meeting_time, verification_code, remarks
        FROM attendance
        {where}
        ORDER BY class_division, student_id
    ''', params).fetchall()
    db.close()

    si = io.StringIO()
    cw = csv.writer(si)
    cw.writerow(['Student ID', 'Student Name', 'Class/Division', 'Parent Name', 'Relation', 'Parent Phone', 'Parent Address', 'Attendance Status', 'Meeting Date', 'Time', 'Verification Code', 'Remarks'])
    for r in rows:
        rel_val = r['relation'] if ('relation' in r.keys() and r['relation']) else ''
        addr_val = r['parent_address'] if ('parent_address' in r.keys() and r['parent_address']) else ''
        cw.writerow([r['student_id'], r['student_name'], r['class_division'], r['parent_name'], rel_val, r['parent_phone'], addr_val, r['status'], r['meeting_date'], r['meeting_time'], r['verification_code'], r['remarks']])

    output = io.BytesIO()
    output.write(si.getvalue().encode('utf-8'))
    output.seek(0)

    return send_file(
        output,
        mimetype="text/csv",
        as_attachment=True,
        download_name=f"Parent_Attendance_{date_filter or 'All'}.csv"
    )

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)
