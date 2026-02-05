/**
 * APIクライアント
 * バックエンドAPIとの通信を行う
 */

import Cookies from 'js-cookie'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL 
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1` 
  : 'http://localhost:8000/api/v1';

/**
 * APIリクエストのオプション型
 */
interface RequestOptions extends RequestInit {
  token?: string;
}

/**
 * APIエラー
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * APIリクエストを送信する共通関数
 */
async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  // トークンが指定されていない場合、Cookieから自動取得
  const authToken = token || Cookies.get('access_token');
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    // 401エラーの場合、リフレッシュトークンで再試行
    if (response.status === 401) {
      const refreshToken = Cookies.get('refresh_token');
      
      // リフレッシュトークンがある場合は再試行
      if (refreshToken && !endpoint.includes('/auth/')) {
        try {
          const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });
          
          if (refreshResponse.ok) {
            const { access_token } = await refreshResponse.json();
            Cookies.set('access_token', access_token, { expires: 7 });
            
            // 新しいトークンで再リクエスト
            headers['Authorization'] = `Bearer ${access_token}`;
            const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
              ...fetchOptions,
              headers,
            });
            
            if (retryResponse.ok) {
              const text = await retryResponse.text();
              return text ? JSON.parse(text) : null as T;
            }
          }
        } catch (refreshError) {
          // リフレッシュ失敗時はログアウト処理へ
          console.log('トークンリフレッシュ失敗:', refreshError);
        }
      }
      
      // リフレッシュトークンがないか、リフレッシュ失敗した場合
      Cookies.remove('access_token');
      Cookies.remove('refresh_token');
      
      // ログインページにリダイレクト（ログインページ自体でない場合のみ）
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    const errorData = await response.json().catch(() => ({}));
    
    // 404エラーは静かに処理（未実装機能の可能性）
    if (response.status === 404) {
      console.debug(`API endpoint not found: ${endpoint}`);
      // 404エラーの場合は空の配列またはnullを返す（呼び出し側で適切に処理）
      // ただし、エラーをthrowしないと型エラーになる可能性があるため、特別なエラーをthrow
      throw new ApiError(
        `Endpoint not found: ${endpoint}`,
        response.status,
        errorData
      );
    }
    
    throw new ApiError(
      errorData.detail || `API Error: ${response.status}`,
      response.status,
      errorData
    );
  }

  // 204 No Content の場合は null を返す（レスポンスボディがない）
  if (response.status === 204) {
    return null as T;
  }

  // レスポンスボディが空の場合も考慮
  const text = await response.text();
  if (!text) {
    return null as T;
  }

  return JSON.parse(text);
}

// ========================================
// ユーザーAPI
// ========================================

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
  email: string;
  password: string;
  full_name: string;
  role: string;
}

export const usersApi = {
  getAll: (skip = 0, limit = 100) =>
    request<User[]>(`/users?skip=${skip}&limit=${limit}`),
  getById: (id: number) => request<User>(`/users/${id}`),
  create: (data: UserCreate) =>
    request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<User>) =>
    request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    request<void>(`/users/${id}`, {
      method: 'DELETE',
    }),
};

// ========================================
// 企業API
// ========================================

export interface Company {
  id: number;
  user_id: number;
  company_name: string;  // バックエンドから返されるフィールド名
  office_name: string;
  industry: string;
  plan: string;
  contract_start_date: string;
  contract_end_date?: string;
  usage_count: number;
  representative_name: string;  // バックエンドから返されるフィールド名
  address: string;
  phone: string;
  email: string;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyCreate {
  user_id: number;
  company_name: string;
  address: string;
  phone: string;
  representative_name: string;
  contract_start_date: string;
  contract_end_date?: string;
  usage_status?: string;
  line_id?: string;
  notes?: string;
}

export const companiesApi = {
  getAll: (skip = 0, limit = 100) =>
    request<Company[]>(`/companies?skip=${skip}&limit=${limit}`),
  getById: (id: number) => request<Company>(`/companies/${id}`),
  create: (data: CompanyCreate) =>
    request<Company>('/companies', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<Company>) =>
    request<Company>(`/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    request<void>(`/companies/${id}`, {
      method: 'DELETE',
    }),
};

// ========================================
// スタッフAPI
// ========================================

export interface Staff {
  id: number;
  user_id: number;
  name: string;
  phone: string;
  address: string;
  bank_account: string;
  qualifications: string;
  available_days: string;
  line_id?: string;
  profile_photo?: string;  // プロフィール写真URL
  is_available: boolean;
  rating: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface StaffCreate {
  user_id: number;
  name: string;
  phone: string;
  address: string;
  bank_account: string;
  qualifications: string;
  available_days: string;
  line_id?: string;
  is_available?: boolean;
  rating?: number;
  notes?: string;
}

export interface EarningsDetail {
  reservation_id: number;
  reservation_date: string;
  office_name: string;
  slot_number?: number;
  duration: number;  // 分
  hourly_rate: number;
  earnings: number;  // 円
}

export interface StaffEarnings {
  staff_id: number;
  staff_name: string;
  total_earnings: number;  // 総給与（円）
  total_duration: number;  // 総時間（分）
  assignment_count: number;  // 確定済みアサイン数
  details: EarningsDetail[];  // 明細リスト
}

export const staffApi = {
  getAll: (skip = 0, limit = 100) =>
    request<Staff[]>(`/staff?skip=${skip}&limit=${limit}`),
  getById: (id: number) => request<Staff>(`/staff/${id}`),
  create: (data: StaffCreate) =>
    request<Staff>('/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<Staff>) =>
    request<Staff>(`/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    request<void>(`/staff/${id}`, {
      method: 'DELETE',
    }),
  getEarnings: (staffId: number, month?: number, year?: number) => {
    const params = new URLSearchParams();
    if (month !== undefined) params.append('month', month.toString());
    if (year !== undefined) params.append('year', year.toString());
    const queryString = params.toString();
    return request<StaffEarnings>(`/staff/${staffId}/earnings${queryString ? '?' + queryString : ''}`);
  },
};

// ========================================
// アップロードAPI
// ========================================

export interface UploadResponse {
  success: boolean;
  file_url: string;
  filename: string;
}

export const uploadApi = {
  uploadProfilePhoto: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/upload/profile-photo`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'アップロードに失敗しました');
    }
    
    return response.json();
  },
  deleteProfilePhoto: (fileUrl: string) =>
    request<{ success: boolean; message: string }>(`/upload/profile-photo?file_url=${encodeURIComponent(fileUrl)}`, {
      method: 'DELETE',
    }),
};

// ========================================
// 社員API（企業の従業員）
// ========================================

export interface Employee {
  id: number;
  company_id: number;
  name: string;
  department?: string;
  position?: string;
  email?: string;
  phone?: string;
  line_id?: string;
  line_linked: boolean;
  is_active: boolean;
  notes?: string;
  concerns?: string;  // お悩みなど（企業側には見えない）
  medical_record?: string;  // カルテ（企業側には見えない）
  created_at: string;
  updated_at: string;
}

export interface EmployeeCreate {
  company_id: number;
  name: string;
  department?: string;
  position?: string;
  email?: string;
  phone?: string;
  line_id?: string;
  line_linked?: boolean;
  is_active?: boolean;
  notes?: string;
  concerns?: string;
  medical_record?: string;
}

export const employeesApi = {
  getAll: (companyId?: number, skip = 0, limit = 100) => {
    const params = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
    if (companyId) params.append('company_id', companyId.toString());
    return request<Employee[]>(`/employees?${params.toString()}`);
  },
  getById: (id: number) => request<Employee>(`/employees/${id}`),
  create: (data: EmployeeCreate) =>
    request<Employee>('/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<Employee>) =>
    request<Employee>(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    request<void>(`/employees/${id}`, {
      method: 'DELETE',
    }),
};

// ========================================
// 予約API
// ========================================

export type ReservationStatus = 
  | 'recruiting'         // 募集中
  | 'assigning'          // スタッフアサイン中
  | 'confirmed'          // 確定済み
  | 'service_completed'  // 施術完了
  | 'evaluated'          // 評価取得完了
  | 'closed'             // 終了
  | 'cancelled';         // キャンセル

export interface Reservation {
  id: number;
  company_id: number;
  office_name: string;
  office_address?: string;
  reservation_date: string;
  start_time: string;
  end_time: string;
  application_deadline?: string;  // 募集期限
  max_participants: number;
  staff_names?: string;
  employee_names?: string;
  // 時間枠管理フィールド
  total_duration?: number;  // 全体時間（分）
  service_duration?: number;  // 施術時間（分）
  break_duration?: number;  // 休憩時間（分）
  slot_count?: number;  // 予約枠数
  time_slots?: any[];  // 各枠の情報
  slots_filled?: number;  // 予約済み枠数
  hourly_rate?: number;  // 時給（円）
  status: ReservationStatus;
  notes?: string;
  requirements?: string;
  created_at: string;
  updated_at: string;
}

export interface ReservationCreate {
  company_id: number;
  office_name: string;
  office_address?: string;
  reservation_date: string;
  start_time: string;
  end_time: string;
  application_deadline?: string;  // 募集期限
  max_participants: number;
  staff_names?: string;
  employee_names?: string;
  // 時間枠管理フィールド
  total_duration?: number;  // 全体時間（分）
  service_duration?: number;  // 施術時間（分）
  break_duration?: number;  // 休憩時間（分）
  slot_count?: number;  // 予約枠数
  time_slots?: any[];  // 各枠の情報
  slots_filled?: number;  // 予約済み枠数
  hourly_rate?: number;  // 時給（円）
  status?: ReservationStatus;
  notes?: string;
  requirements?: string;
}

export interface EmployeeRegistration {
  employee_name: string;
  department: string;
  position?: string;
  phone?: string;
  email?: string;
  notes?: string;
  slot_number?: number;  // 社員が選択した枠番号（1始まり）
}

export const reservationsApi = {
  getAll: (params?: { skip?: number; limit?: number; status?: ReservationStatus; company_id?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.company_id) queryParams.append('company_id', params.company_id.toString());
    
    const queryString = queryParams.toString();
    return request<Reservation[]>(`/reservations${queryString ? '?' + queryString : ''}`);
  },
  getById: (id: number) => request<Reservation>(`/reservations/${id}`),
  create: (data: ReservationCreate) =>
    request<Reservation>('/reservations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<Reservation>) =>
    request<Reservation>(`/reservations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    request<void>(`/reservations/${id}`, {
      method: 'DELETE',
    }),
  addEmployee: (reservationId: number, data: EmployeeRegistration) =>
    request<Reservation>(`/reservations/${reservationId}/employees`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  // 社員を特定の枠に割り当て
  assignEmployeeToSlot: (reservationId: number, employeeId: number, slotNumber: number) =>
    request<Reservation>(`/reservations/${reservationId}/assign-employee`, {
      method: 'POST',
      body: JSON.stringify({ employee_id: employeeId, slot_number: slotNumber }),
    }),
  // 特定の枠から社員の割り当てを解除
  unassignEmployeeFromSlot: (reservationId: number, slotNumber: number) =>
    request<Reservation>(`/reservations/${reservationId}/slots/${slotNumber}/employee`, {
      method: 'DELETE',
    }),
};

// ========================================
// アサイン管理API
// ========================================

export interface Assignment {
  id: number;
  reservation_id: number;
  staff_id: number;
  staff_name: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled';
  assigned_by: number;
  assigned_at: string;
  slot_number?: number;  // 追加: スタッフが選択した枠番号
  notes?: string;
  reservation?: {
    id: number;
    company_id: number;
    company_name?: string;
    office_name: string;
    office_address?: string;
    reservation_date: string;
    start_time: string;
    end_time: string;
    hourly_rate?: number;
    status: ReservationStatus;
    time_slots?: Array<any>;
    [key: string]: any;
  };
}

export interface AssignmentCreate {
  reservation_id: number;
  staff_id: number;
  assigned_by: number;
  slot_number?: number;  // 追加: 枠番号指定
  notes?: string;
}

export interface AssignmentUpdate {
  status?: 'pending' | 'confirmed' | 'rejected' | 'cancelled';
  slot_number?: number;  // 追加: 枠番号変更
  notes?: string;
}

export const assignmentsApi = {
  getById: (assignmentId: number) =>
    request<Assignment>(`/assignments/${assignmentId}`),
  getReservationAssignments: (reservationId: number) =>
    request<Assignment[]>(`/reservations/${reservationId}/assignments`),
  getStaffAssignments: (staffId: number) =>
    request<Assignment[]>(`/staff/${staffId}/assignments`),
  getMyAssignments: () =>
    request<Assignment[]>(`/assignments/my`),
  assignStaff: (data: AssignmentCreate) =>
    request<Assignment>(`/reservations/${data.reservation_id}/assignments`, {
      method: 'POST',
      body: JSON.stringify({
        reservation_id: data.reservation_id,
        staff_id: data.staff_id,
        assigned_by: data.assigned_by,
        slot_number: data.slot_number || null,
        notes: data.notes || null
      }),
    }),
  updateAssignment: (assignmentId: number, data: AssignmentUpdate) =>
    request<Assignment>(`/assignments/${assignmentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteAssignment: (assignmentId: number) =>
    request<void>(`/assignments/${assignmentId}`, {
      method: 'DELETE',
    }),
  acceptAssignment: (assignmentId: number) =>
    request<{ success: boolean; message: string; assignment_id: number; status: string }>(`/assignments/${assignmentId}/accept`, {
      method: 'POST',
    }),
  rejectAssignment: (assignmentId: number, rejectionReason?: string) =>
    request<{ success: boolean; message: string; assignment_id: number; status: string }>(`/assignments/${assignmentId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejection_reason: rejectionReason || '' }),
    }),
};

// ========================================
// ステータス表示関数（企業側用）
// ========================================

/**
 * 企業側のステータスラベルを取得
 */
export function getCompanyStatusLabel(status: ReservationStatus): string {
  const statusMap: Record<ReservationStatus, string> = {
    recruiting: '募集中',
    assigning: '募集中',        // 企業側では募集中として表示
    confirmed: '予約確定',
    service_completed: '施術完了',
    evaluated: '終了',
    closed: '終了',
    cancelled: 'キャンセル',
  };
  return statusMap[status] || status;
}

/**
 * 管理者側のステータスラベルを取得
 */
export function getAdminStatusLabel(status: ReservationStatus): string {
  const statusMap: Record<ReservationStatus, string> = {
    recruiting: '募集中',
    assigning: 'スタッフアサイン中',
    confirmed: '確定済み',
    service_completed: '施術完了',
    evaluated: '評価取得完了',
    closed: '終了',
    cancelled: 'キャンセル',
  };
  return statusMap[status] || status;
}

/**
 * ステータスに応じたBadgeクラスを取得
 */
export function getStatusBadgeClass(status: ReservationStatus): string {
  const classMap: Record<ReservationStatus, string> = {
    recruiting: 'bg-primary',
    assigning: 'bg-info',
    confirmed: 'bg-success',
    service_completed: 'bg-warning',
    evaluated: 'bg-secondary',
    closed: 'bg-dark',
    cancelled: 'bg-danger',
  };
  return classMap[status] || 'bg-secondary';
}

// ========================================
// 勤怠管理API
// ========================================

export interface Attendance {
  id: number;
  staff_id: number;
  staff_name: string;
  reservation_id?: number;
  assignment_id?: number;
  work_date: string;
  clock_in_time?: string;
  clock_out_time?: string;
  work_hours?: number;
  status: 'pending' | 'in_progress' | 'completed' | 'correction_requested' | 'corrected';
  completion_report?: string;
  correction_requested: boolean;
  correction_reason?: string;
  is_late: boolean;
  is_early_leave: boolean;
  is_approved: boolean;
}

export interface CheckInRequest {
  assignment_id: number;
  reservation_id: number;
  location?: string;
}

export interface CheckOutRequest {
  attendance_id: number;
  location?: string;
}

export interface CompletionReportRequest {
  attendance_id: number;
  report: string;
  photos?: string[];
}

export interface CorrectionRequest {
  attendance_id: number;
  reason: string;
}

export const attendanceApi = {
  checkIn: (data: CheckInRequest) =>
    request<Attendance>('/attendance/check-in', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  checkOut: (data: CheckOutRequest) =>
    request<Attendance>('/attendance/check-out', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  complete: (data: CompletionReportRequest) =>
    request<Attendance>('/attendance/complete', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  requestCorrection: (data: CorrectionRequest) =>
    request<Attendance>('/attendance/correction', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getStaffAttendance: (staffId: number) =>
    request<Attendance[]>(`/attendance/staff/${staffId}`),
  approveCorrection: (attendanceId: number) =>
    request<Attendance>(`/attendance/${attendanceId}/approve`, {
      method: 'PUT',
    }),
};

// ========================================
// 評価API
// ========================================

export interface Rating {
  id: number;
  reservation_id: number;
  company_id: number;
  staff_id: number;
  assignment_id?: number;
  cleanliness: number;
  responsiveness: number;
  satisfaction: number;
  punctuality: number;
  skill: number;
  average_rating: number;
  rating: number;
  comment?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface RatingCreate {
  reservation_id: number;
  company_id: number;
  staff_id: number;
  assignment_id?: number;
  cleanliness: number;
  responsiveness: number;
  satisfaction: number;
  punctuality: number;
  skill: number;
  comment?: string;
  is_public?: boolean;
}

export interface RatingUpdate {
  cleanliness?: number;
  responsiveness?: number;
  satisfaction?: number;
  punctuality?: number;
  skill?: number;
  comment?: string;
  is_public?: boolean;
}

export interface RatingSummary {
  staff_id: number;
  staff_name: string;
  average_rating: number;
  rating_count: number;
  avg_cleanliness: number;
  avg_responsiveness: number;
  avg_satisfaction: number;
  avg_punctuality: number;
  avg_skill: number;
}

export const ratingsApi = {
  getAll: (params?: { company_id?: number; staff_id?: number }) => {
    const query = new URLSearchParams();
    if (params?.company_id) query.append('company_id', params.company_id.toString());
    if (params?.staff_id) query.append('staff_id', params.staff_id.toString());
    return request<Rating[]>(`/ratings?${query.toString()}`);
  },
  getById: (id: number) => request<Rating>(`/ratings/${id}`),
  checkExists: (reservationId: number, staffId: number) =>
    request<{ exists: boolean; rating_id: number | null }>(
      `/ratings/check/${reservationId}/${staffId}`
    ),
  create: (data: RatingCreate) =>
    request<Rating>('/ratings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: RatingUpdate) =>
    request<Rating>(`/ratings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    request<void>(`/ratings/${id}`, {
      method: 'DELETE',
    }),
  getStaffSummary: (staffId: number) =>
    request<RatingSummary>(`/staff/${staffId}/rating-summary`),
};




