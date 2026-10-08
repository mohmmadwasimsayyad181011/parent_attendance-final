import sqlite3
import os
from datetime import datetime
from werkzeug.security import generate_password_hash

DB_PATH = os.path.join(os.path.dirname(__file__), 'attendance.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db(reset_data=False):
    conn = get_db()
    cursor = conn.cursor()
    
    if reset_data:
        cursor.execute('DROP TABLE IF EXISTS attendance')
        cursor.execute('DROP TABLE IF EXISTS admin_settings')
        cursor.execute('DROP TABLE IF EXISTS student_roster')

    # 1. Attendance Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT NOT NULL,
        student_name TEXT NOT NULL,
        class_division TEXT NOT NULL,
        parent_name TEXT NOT NULL,
        parent_phone TEXT NOT NULL,
        relation TEXT DEFAULT '',
        parent_address TEXT DEFAULT '',
        status TEXT NOT NULL CHECK(status IN ('Parent Present', 'Parent Absent', 'Excused')),
        remarks TEXT DEFAULT '',
        photo_url TEXT DEFAULT '',
        signed_form_url TEXT DEFAULT '',
        verification_code TEXT UNIQUE NOT NULL,
        meeting_date TEXT NOT NULL,
        meeting_time TEXT NOT NULL,
        created_at TEXT NOT NULL,
        ip_address TEXT DEFAULT '',
        user_agent TEXT DEFAULT ''
    )
    ''')

    # Ensure relation, signed_form_url, and parent_address columns exist if table was previously created
    try:
        cursor.execute("ALTER TABLE attendance ADD COLUMN relation TEXT DEFAULT ''")
    except Exception:
        pass

    try:
        cursor.execute("ALTER TABLE attendance ADD COLUMN signed_form_url TEXT DEFAULT ''")
    except Exception:
        pass

    try:
        cursor.execute("ALTER TABLE attendance ADD COLUMN parent_address TEXT DEFAULT ''")
    except Exception:
        pass

    cursor.execute('CREATE INDEX IF NOT EXISTS idx_student_date ON attendance(student_id, meeting_date)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_class ON attendance(class_division)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_status ON attendance(status)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_date ON attendance(meeting_date)')

    # 2. Admin Settings Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS admin_settings (
        id INTEGER PRIMARY KEY,
        admin_username TEXT NOT NULL,
        admin_password_hash TEXT NOT NULL,
        institution_name TEXT NOT NULL,
        department_name TEXT NOT NULL,
        meeting_title TEXT NOT NULL,
        meeting_date TEXT NOT NULL,
        require_live_photo INTEGER DEFAULT 1,
        allow_self_registration INTEGER DEFAULT 1
    )
    ''')

    # 3. Student Master Roster (Enables Absentee tracking & quick lookup)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS student_roster (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT UNIQUE NOT NULL,
        student_name TEXT NOT NULL,
        class_division TEXT NOT NULL,
        parent_name TEXT DEFAULT '',
        parent_phone TEXT DEFAULT ''
    )
    ''')

    # Ensure admin settings is set to Sanjivani University
    cursor.execute('SELECT COUNT(*) as count FROM admin_settings')
    if cursor.fetchone()['count'] == 0:
        default_hash = generate_password_hash('112277')
        today_str = datetime.now().strftime('%Y-%m-%d')
        cursor.execute('''
            INSERT INTO admin_settings (
                id, admin_username, admin_password_hash, institution_name,
                department_name, meeting_title, meeting_date, require_live_photo, allow_self_registration
            ) VALUES (1, ?, ?, ?, ?, ?, ?, 1, 1)
        ''', (
            'HOD_AIML2008',
            default_hash,
            'Sanjivani University',
            'Department of Artificial Intelligence & Machine Learning',
            'Parent-Teacher Academic Review 2026',
            today_str
        ))
    else:
        # Update existing settings if already created
        cursor.execute('''
            UPDATE admin_settings
            SET institution_name = 'Sanjivani University',
                department_name = 'Department of Artificial Intelligence & Machine Learning'
            WHERE id = 1
        ''')

    # Check if student_roster needs population
    cursor.execute('SELECT COUNT(*) as count FROM student_roster')
    roster_count = cursor.fetchone()['count']

    excel_file = os.path.join(os.path.dirname(__file__), 'student_data', 'students.xlsx')
    if reset_data or roster_count == 0:
        if os.path.exists(excel_file):
            print(f"Loading official students from {excel_file}...")
            _import_students_excel(cursor, excel_file)
        else:
            print("student_data/students.xlsx not found, loading sample roster...")
            _seed_sample_roster(cursor)

    # Seed initial attendance records only if reset_data is True and table is empty
    if reset_data:
        cursor.execute('DELETE FROM attendance')
        today_str = datetime.now().strftime('%Y-%m-%d')
        sample_attendance = [
            ('FY-A-01', 'Aarav Sharma', 'FY-A', 'Rajesh Sharma', 'Father', '9823412345', 'Parent Present', 'Discussed first semester academic progress and lab performance', '/static/images/college_crest.jpg', 'PMA-2026-8A19B', today_str, '09:45:12', f'{today_str}T09:45:12', '127.0.0.1', 'Desktop Chrome'),
            ('FY-A-02', 'Diya Patel', 'FY-A', 'Suresh Patel', 'Father', '9876543210', 'Parent Present', 'Parent reviewed midterm exam scores and college attendance', '/static/images/college_crest.jpg', 'PMA-2026-3C72F', today_str, '10:05:40', f'{today_str}T10:05:40', '127.0.0.1', 'Mobile Safari'),
            ('FY-B-01', 'Rohan Verma', 'FY-B', 'Manoj Verma', 'Father', '9123456789', 'Parent Absent', 'Father out of station; informed class mentor over phone', '', 'PMA-2026-9E41A', today_str, '10:22:15', f'{today_str}T10:22:15', '127.0.0.1', 'Desk Entry'),
            ('SY-A-01', 'Karthik Rao', 'SY-A', 'Ramachandra Rao', 'Father', '9741234567', 'Parent Present', 'Discussed technical projects and semester curriculum', '/static/images/college_crest.jpg', 'PMA-2026-4F81C', today_str, '10:48:33', f'{today_str}T10:48:33', '127.0.0.1', 'Desktop Edge'),
            ('TY-A-01', 'Kabir Mehta', 'TY-A', 'Sanjay Mehta', 'Father', '9988776655', 'Parent Present', 'Discussed capstone project and placement readiness', '/static/images/college_crest.jpg', 'PMA-2026-2D99E', today_str, '11:15:02', f'{today_str}T11:15:02', '127.0.0.1', 'Mobile Chrome'),
            ('BE-01', 'Siddharth Sen', 'FINAL YEAR', 'Alok Sen', 'Father', '9830123456', 'Parent Present', 'Reviewed campus placements and major project', '/static/images/college_crest.jpg', 'PMA-2026-7B55D', today_str, '11:32:18', f'{today_str}T11:32:18', '127.0.0.1', 'Mobile Chrome')
        ]
        cursor.executemany('''
            INSERT INTO attendance (
                student_id, student_name, class_division, parent_name, relation, parent_phone,
                status, remarks, photo_url, verification_code, meeting_date,
                meeting_time, created_at, ip_address, user_agent
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', sample_attendance)

    conn.commit()
    conn.close()

def _import_students_excel(cursor, excel_path):
    """Internal helper to parse and insert students from Excel into cursor."""
    import openpyxl
    wb = openpyxl.load_workbook(excel_path, data_only=True)
    sheet = wb.active
    rows = list(sheet.iter_rows(values_only=True))
    if not rows:
        return 0

    header = [str(c).strip().lower() if c else '' for c in rows[0]]
    prn_idx = next((i for i, h in enumerate(header) if 'prn' in h or 'id' in h or 'roll' in h), 0)
    name_idx = next((i for i, h in enumerate(header) if 'name' in h), 1)
    year_idx = next((i for i, h in enumerate(header) if 'year' in h or 'class' in h), 2)

    cursor.execute('DELETE FROM student_roster')

    records = []
    prov_counter = 0
    for r in rows[1:]:
        if not any(r):
            continue
        prn = str(r[prn_idx]).strip() if len(r) > prn_idx and r[prn_idx] is not None else ''
        name = str(r[name_idx]).strip() if len(r) > name_idx and r[name_idx] is not None else ''
        year = str(r[year_idx]).strip() if len(r) > year_idx and r[year_idx] is not None else 'AIML'

        if not prn or prn.lower() in ('none', 'nan', ''):
            prov_counter += 1
            prn = f"PROV-{year.replace(' ', '_')}-{prov_counter:03d}"

        records.append((prn, name, year, '', ''))

    cursor.executemany('''
        INSERT OR REPLACE INTO student_roster (student_id, student_name, class_division, parent_name, parent_phone)
        VALUES (?, ?, ?, ?, ?)
    ''', records)
    print(f"Imported {len(records)} official student records into student_roster.")
    return len(records)

def _seed_sample_roster(cursor):
    """Seed sample students if no official Excel file is present."""
    sample_students = [
        ('FY-A-01', 'Aarav Sharma', 'FY-A', 'Rajesh Sharma', '9823412345'),
        ('FY-A-02', 'Diya Patel', 'FY-A', 'Suresh Patel', '9876543210'),
        ('FY-B-01', 'Rohan Verma', 'FY-B', 'Manoj Verma', '9123456789'),
        ('FY-B-02', 'Ananya Iyer', 'FY-B', 'Venkatesh Iyer', '9845123456'),
        ('SY-A-01', 'Karthik Rao', 'SY-A', 'Ramachandra Rao', '9741234567'),
        ('SY-A-02', 'Sneha Deshmukh', 'SY-A', 'Pramod Deshmukh', '9860123456'),
        ('SY-B-01', 'Gaurav Joshi', 'SY-B', 'Sunil Joshi', '9890567890'),
        ('SY-B-02', 'Neha Kulkarni', 'SY-B', 'Dattatray Kulkarni', '9822334455'),
        ('TY-A-01', 'Kabir Mehta', 'TY-A', 'Sanjay Mehta', '9988776655'),
        ('TY-A-02', 'Zoya Khan', 'TY-A', 'Tariq Khan', '9811223344'),
        ('TY-B-01', 'Aditya Shinde', 'TY-B', 'Prakash Shinde', '9765432109'),
        ('TY-B-02', 'Tanvi More', 'TY-B', 'Hemant More', '9890123456'),
        ('BE-01', 'Siddharth Sen', 'FINAL YEAR', 'Alok Sen', '9830123456'),
        ('BE-02', 'Meera Nambiar', 'FINAL YEAR', 'Radhakrishnan Nambiar', '9744123456')
    ]
    cursor.executemany('''
        INSERT OR REPLACE INTO student_roster (student_id, student_name, class_division, parent_name, parent_phone)
        VALUES (?, ?, ?, ?, ?)
    ''', sample_students)

def load_students_from_excel(excel_path=None):
    """Public helper to import students from Excel file into database."""
    if not excel_path:
        excel_path = os.path.join(os.path.dirname(__file__), 'student_data', 'students.xlsx')

    if not os.path.exists(excel_path):
        raise FileNotFoundError(f"Excel file not found at: {excel_path}")

    conn = get_db()
    cursor = conn.cursor()
    count = _import_students_excel(cursor, excel_path)
    conn.commit()
    conn.close()
    return count

if __name__ == '__main__':
    excel_path = os.path.join(os.path.dirname(__file__), 'student_data', 'students.xlsx')
    if os.path.exists(excel_path):
        init_db(reset_data=False)
        count = load_students_from_excel(excel_path)
        print(f"Database successfully synchronized with {count} students from {excel_path}.")
    else:
        init_db(reset_data=False)
        print("Database initialized.")
