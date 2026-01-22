-- ============================================================================
-- オリエンタルシナジー 派遣業務管理システム
-- データベーススキーマ定義
-- 
-- Database: PostgreSQL 15+
-- Encoding: UTF-8
-- Timezone: Asia/Tokyo
-- ============================================================================

-- 拡張機能の有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. ユーザーアカウント
-- ============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'company', 'staff')),
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

COMMENT ON TABLE users IS 'ユーザーアカウント（管理者・企業・スタッフ共通）';
COMMENT ON COLUMN users.role IS 'ユーザーロール: admin=管理者, company=企業, staff=スタッフ';

-- ============================================================================
-- 2. 企業情報
-- ============================================================================

CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    name_kana VARCHAR(255),
    industry VARCHAR(100),
    representative_name VARCHAR(100),
    postal_code VARCHAR(10),
    address TEXT,
    phone VARCHAR(20),
    fax VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    contract_plan VARCHAR(50),
    contract_start_date DATE,
    contract_end_date DATE,
    total_usage_count INTEGER DEFAULT 0,
    total_amount DECIMAL(12, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_companies_user_id ON companies(user_id);
CREATE INDEX idx_companies_name ON companies(name);

COMMENT ON TABLE companies IS '企業情報';
COMMENT ON COLUMN companies.contract_plan IS '契約プラン（Aプラン、Bプランなど）';

-- ============================================================================
-- 3. 事業所情報
-- ============================================================================

CREATE TABLE company_offices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    postal_code VARCHAR(10),
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    phone VARCHAR(20),
    fax VARCHAR(20),
    email VARCHAR(255),
    manager_name VARCHAR(100),
    manager_phone VARCHAR(20),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_company_offices_company_id ON company_offices(company_id);
CREATE INDEX idx_company_offices_is_active ON company_offices(is_active);

COMMENT ON TABLE company_offices IS '企業の事業所情報';

-- ============================================================================
-- 4. 企業の社員情報
-- ============================================================================

CREATE TABLE company_employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    first_name_kana VARCHAR(100),
    last_name_kana VARCHAR(100),
    department VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    line_user_id VARCHAR(255),
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    date_of_birth DATE,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_company_employees_company_id ON company_employees(company_id);
CREATE INDEX idx_company_employees_line_user_id ON company_employees(line_user_id);
CREATE INDEX idx_company_employees_is_active ON company_employees(is_active);

COMMENT ON TABLE company_employees IS '企業の社員情報（施術を受ける人）';

-- ============================================================================
-- 5. スタッフ情報
-- ============================================================================

CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    first_name_kana VARCHAR(100),
    last_name_kana VARCHAR(100),
    phone VARCHAR(20),
    line_user_id VARCHAR(255),
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    postal_code VARCHAR(10),
    address TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(50),
    profile_photo VARCHAR(255),
    bio TEXT,
    average_rating DECIMAL(3, 2) DEFAULT 0,
    total_jobs INTEGER DEFAULT 0,
    total_evaluations INTEGER DEFAULT 0,
    bank_name VARCHAR(100),
    bank_branch VARCHAR(100),
    bank_account_type VARCHAR(20),
    bank_account_number VARCHAR(20),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_average_rating CHECK (average_rating >= 0 AND average_rating <= 5)
);

CREATE INDEX idx_staff_user_id ON staff(user_id);
CREATE INDEX idx_staff_line_user_id ON staff(line_user_id);
CREATE INDEX idx_staff_average_rating ON staff(average_rating);
CREATE INDEX idx_staff_is_active ON staff(is_active);

COMMENT ON TABLE staff IS '派遣スタッフ情報';
COMMENT ON COLUMN staff.average_rating IS '平均評価（0.00〜5.00）';

-- ============================================================================
-- 6. スタッフのスキル・資格
-- ============================================================================

CREATE TABLE staff_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    experience_years INTEGER DEFAULT 0,
    certificate_name VARCHAR(255),
    certificate_number VARCHAR(100),
    certificate_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_staff_skills_staff_id ON staff_skills(staff_id);
CREATE INDEX idx_staff_skills_skill_name ON staff_skills(skill_name);

COMMENT ON TABLE staff_skills IS 'スタッフのスキル・資格情報';

-- ============================================================================
-- 7. 予約情報
-- ============================================================================

CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    office_id UUID NOT NULL REFERENCES company_offices(id) ON DELETE CASCADE,
    reservation_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration INTEGER DEFAULT 30,
    total_slots INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
    company_notes TEXT,
    admin_notes TEXT,
    created_by UUID REFERENCES users(id),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reservations_company_id ON reservations(company_id);
CREATE INDEX idx_reservations_office_id ON reservations(office_id);
CREATE INDEX idx_reservations_date ON reservations(reservation_date);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_date_status ON reservations(reservation_date, status);

COMMENT ON TABLE reservations IS '予約情報';
COMMENT ON COLUMN reservations.status IS 'pending=未確認, confirmed=確定, in_progress=実施中, completed=完了, cancelled=キャンセル';
COMMENT ON COLUMN reservations.slot_duration IS '1枠の時間（分）デフォルト30分';

-- ============================================================================
-- 8. 予約枠（社員ごとの時間枠）
-- ============================================================================

CREATE TABLE reservation_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES company_employees(id) ON DELETE SET NULL,
    slot_order INTEGER NOT NULL,
    slot_start_time TIME NOT NULL,
    slot_end_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'available' 
        CHECK (status IN ('available', 'booked', 'completed', 'cancelled')),
    employee_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(reservation_id, slot_order)
);

CREATE INDEX idx_reservation_slots_reservation_id ON reservation_slots(reservation_id);
CREATE INDEX idx_reservation_slots_employee_id ON reservation_slots(employee_id);

COMMENT ON TABLE reservation_slots IS '予約の時間枠情報';
COMMENT ON COLUMN reservation_slots.employee_notes IS '社員からの要望・相談内容';

-- ============================================================================
-- 9. スタッフアサイン情報
-- ============================================================================

CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'offered'
        CHECK (status IN ('offered', 'accepted', 'rejected', 'completed', 'cancelled')),
    offered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    assigned_by UUID NOT NULL REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_assignments_reservation_id ON assignments(reservation_id);
CREATE INDEX idx_assignments_staff_id ON assignments(staff_id);
CREATE INDEX idx_assignments_status ON assignments(status);
CREATE INDEX idx_assignments_staff_status ON assignments(staff_id, status);

COMMENT ON TABLE assignments IS 'スタッフへの業務割り当て';
COMMENT ON COLUMN assignments.status IS 'offered=オファー中, accepted=受諾済み, rejected=辞退, completed=完了, cancelled=キャンセル';

-- ============================================================================
-- 10. 勤怠記録
-- ============================================================================

CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    clock_in_time TIMESTAMP WITH TIME ZONE NOT NULL,
    clock_in_photo VARCHAR(255),
    clock_in_method VARCHAR(10) DEFAULT 'web' CHECK (clock_in_method IN ('web', 'line')),
    clock_in_location_lat DECIMAL(10, 8),
    clock_in_location_lng DECIMAL(11, 8),
    clock_out_time TIMESTAMP WITH TIME ZONE,
    clock_out_photo VARCHAR(255),
    clock_out_method VARCHAR(10) CHECK (clock_out_method IN ('web', 'line')),
    clock_out_location_lat DECIMAL(10, 8),
    clock_out_location_lng DECIMAL(11, 8),
    break_minutes INTEGER DEFAULT 0,
    work_count INTEGER,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'clocked_in' 
        CHECK (status IN ('clocked_in', 'completed', 'verified')),
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attendance_assignment_id ON attendance(assignment_id);
CREATE INDEX idx_attendance_clock_in_time ON attendance(clock_in_time);
CREATE INDEX idx_attendance_status ON attendance(status);

COMMENT ON TABLE attendance IS '勤怠記録';
COMMENT ON COLUMN attendance.clock_in_method IS '打刻方法: web=Webブラウザ, line=LINE';
COMMENT ON COLUMN attendance.work_count IS '作業数（施術人数など）';
COMMENT ON COLUMN attendance.status IS 'clocked_in=出勤済み, completed=退勤済み, verified=確認済み';

-- ============================================================================
-- 11. 評価情報
-- ============================================================================

CREATE TABLE evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
    comment TEXT,
    want_again BOOLEAN DEFAULT false,
    evaluated_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assignment_id)
);

CREATE INDEX idx_evaluations_assignment_id ON evaluations(assignment_id);
CREATE INDEX idx_evaluations_overall_rating ON evaluations(overall_rating);

COMMENT ON TABLE evaluations IS '評価情報';
COMMENT ON COLUMN evaluations.overall_rating IS '総合評価（1〜5）';
COMMENT ON COLUMN evaluations.want_again IS '再依頼希望';

-- ============================================================================
-- 12. 通知情報
-- ============================================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'job_offer',
        'shift_approved',
        'shift_rejected',
        'job_reminder',
        'evaluation_received',
        'system_announcement'
    )),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link_url VARCHAR(255),
    related_id UUID,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    sent_via_email BOOLEAN DEFAULT false,
    email_sent_at TIMESTAMP WITH TIME ZONE,
    sent_via_line BOOLEAN DEFAULT false,
    line_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);

COMMENT ON TABLE notifications IS '通知情報';
COMMENT ON COLUMN notifications.type IS 'job_offer=業務オファー, shift_approved=シフト承認, shift_rejected=シフト却下, job_reminder=業務リマインダー, evaluation_received=評価受信, system_announcement=システムからのお知らせ';

-- ============================================================================
-- 13. LINE連携情報
-- ============================================================================

CREATE TABLE line_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    line_user_id VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    picture_url VARCHAR(255),
    status_message TEXT,
    linked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_interaction_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_line_users_user_id ON line_users(user_id);
CREATE INDEX idx_line_users_line_user_id ON line_users(line_user_id);

COMMENT ON TABLE line_users IS 'LINE連携情報';

-- ============================================================================
-- 14. LINEリッチメニュー
-- ============================================================================

CREATE TABLE rich_menus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    line_rich_menu_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    target_role VARCHAR(20) CHECK (target_role IN ('staff', 'company_employee', 'all')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rich_menus_is_active ON rich_menus(is_active);

COMMENT ON TABLE rich_menus IS 'LINEリッチメニュー情報';
COMMENT ON COLUMN rich_menus.target_role IS 'staff=スタッフ用, company_employee=社員用, all=全員';

-- ============================================================================
-- トリガー: updated_at 自動更新
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 各テーブルにトリガーを設定
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_offices_updated_at BEFORE UPDATE ON company_offices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_employees_updated_at BEFORE UPDATE ON company_employees 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservation_slots_updated_at BEFORE UPDATE ON reservation_slots 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evaluations_updated_at BEFORE UPDATE ON evaluations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_line_users_updated_at BEFORE UPDATE ON line_users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rich_menus_updated_at BEFORE UPDATE ON rich_menus 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ビュー: スタッフ検索用（よく使う複雑なクエリを簡略化）
-- ============================================================================

CREATE OR REPLACE VIEW v_staff_search AS
SELECT 
    s.id,
    s.user_id,
    s.first_name,
    s.last_name,
    s.first_name_kana,
    s.last_name_kana,
    s.phone,
    s.average_rating,
    s.total_jobs,
    s.total_evaluations,
    s.is_active,
    u.email,
    ARRAY_AGG(DISTINCT ss.skill_name) FILTER (WHERE ss.skill_name IS NOT NULL) AS skills
FROM staff s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN staff_skills ss ON s.id = ss.staff_id
GROUP BY s.id, s.user_id, s.first_name, s.last_name, s.first_name_kana, 
         s.last_name_kana, s.phone, s.average_rating, s.total_jobs, 
         s.total_evaluations, s.is_active, u.email;

COMMENT ON VIEW v_staff_search IS 'スタッフ検索用ビュー（スキル情報を含む）';

-- ============================================================================
-- ビュー: 予約サマリー
-- ============================================================================

CREATE OR REPLACE VIEW v_reservation_summary AS
SELECT 
    r.id AS reservation_id,
    r.reservation_date,
    r.start_time,
    r.end_time,
    r.status,
    c.name AS company_name,
    co.name AS office_name,
    co.address AS office_address,
    COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'accepted') AS assigned_staff_count,
    COUNT(DISTINCT rs.id) AS total_slots,
    COUNT(DISTINCT rs.id) FILTER (WHERE rs.employee_id IS NOT NULL) AS booked_slots
FROM reservations r
    JOIN companies c ON r.company_id = c.id
    JOIN company_offices co ON r.office_id = co.id
    LEFT JOIN assignments a ON r.id = a.reservation_id
    LEFT JOIN reservation_slots rs ON r.id = rs.reservation_id
GROUP BY r.id, r.reservation_date, r.start_time, r.end_time, r.status,
         c.name, co.name, co.address;

COMMENT ON VIEW v_reservation_summary IS '予約サマリービュー（スタッフアサイン状況を含む）';

-- ============================================================================
-- 初期データ: 管理者アカウント
-- ============================================================================

-- パスワード: admin123 (実際のアプリケーションで bcrypt でハッシュ化されたものに置き換える)
-- ここでは仮のハッシュを使用
INSERT INTO users (email, hashed_password, role, is_active)
VALUES ('admin@orientalsynergy.com', '$2b$12$placeholder_hash_here', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- スキーマバージョン管理
-- ============================================================================

CREATE TABLE schema_version (
    version VARCHAR(50) PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

INSERT INTO schema_version (version, description)
VALUES ('1.0.0', '初期スキーマ作成');

-- ============================================================================
-- 完了
-- ============================================================================

COMMENT ON DATABASE CURRENT_DATABASE() IS 'オリエンタルシナジー 派遣業務管理システム';

