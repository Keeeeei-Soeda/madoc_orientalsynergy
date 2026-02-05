'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import PageHeader from '@/components/common/PageHeader'
import { reservationsApi, companiesApi, Company, ReservationCreate } from '@/lib/api'
import TimeSlotEditor from '@/components/reservations/TimeSlotEditor'
import { TimeSlot } from '@/utils/timeSlotValidator'

export default function NewReservationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(false)
  const [isValidSlots, setIsValidSlots] = useState(false)
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  
  // 今日の日付をYYYY-MM-DD形式で取得
  const today = new Date().toISOString().split('T')[0]
  
  const [formData, setFormData] = useState<ReservationCreate>({
    company_id: 0,
    office_name: '',
    office_address: '',
    reservation_date: '',
    start_time: '',
    end_time: '',
    application_deadline: '',  // 募集期限
    max_participants: 1,
    staff_names: '',
    employee_names: '',
    // 時間枠管理フィールド
    service_duration: 30,
    break_duration: 10,
    hourly_rate: 1500,
    slot_count: 1,
    time_slots: [],
    slots_filled: 0,
    status: 'recruiting',  // デフォルトを recruiting に変更
    notes: '',
    requirements: '',
  })
  
  // 企業一覧を取得とURLパラメータから企業IDを取得
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const data = await companiesApi.getAll()
        setCompanies(data)
        
        // URLパラメータから企業IDを取得
        const companyIdParam = searchParams.get('company_id')
        if (companyIdParam) {
          const companyId = parseInt(companyIdParam)
          const selectedCompany = data.find(c => c.id === companyId)
          if (selectedCompany) {
            setFormData(prev => ({
              ...prev,
              company_id: companyId,
              office_name: selectedCompany.office_name || '',
              office_address: selectedCompany.address || '',
            }))
          }
        }
      } catch (err) {
        console.error('企業データ取得エラー:', err)
      }
    }
    
    fetchCompanies()
  }, [searchParams])
  
  // 時間枠エディタからのデータ更新（useCallbackでメモ化して無限ループを防ぐ）
  const handleTimeSlotDataChange = useCallback((data: {
    serviceDuration: number;
    breakDuration: number;
    hourlyRate: number;
    slotCount: number;
    slots: TimeSlot[];
    isValid: boolean;
  }) => {
    setIsValidSlots(data.isValid);
    setTimeSlots(data.slots);
    setFormData(prev => ({
      ...prev,
      service_duration: data.serviceDuration,
      break_duration: data.breakDuration,
      hourly_rate: data.hourlyRate,
      slot_count: data.slotCount,
      time_slots: data.slots.map(slot => ({
        slot: slot.slot,
        start_time: slot.start_time,
        end_time: slot.end_time,
        duration: slot.duration,
        is_filled: false,
      })),
    }));
  }, []); // 依存配列は空（setState関数は安定しているため）

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.company_id) {
      alert('企業を選択してください')
      return
    }
    
    if (!formData.office_name || !formData.reservation_date || !formData.start_time || !formData.end_time) {
      alert('必須項目を入力してください')
      return
    }
    
    // 予約日が今日以降かチェック
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const reservationDate = new Date(formData.reservation_date)
    if (reservationDate < today) {
      alert('予約日は今日以降の日付を選択してください')
      return
    }
    
    // 終了時刻が開始時刻より後かチェック
    if (formData.start_time && formData.end_time) {
      const [startHour, startMin] = formData.start_time.split(':').map(Number)
      const [endHour, endMin] = formData.end_time.split(':').map(Number)
      const startMinutes = startHour * 60 + startMin
      const endMinutes = endHour * 60 + endMin
      
      if (endMinutes <= startMinutes) {
        alert('終了時刻は開始時刻より後に設定してください。\n日を跨ぐ場合は、別の予約として登録してください。')
        return
      }
    }
    
    // 時間枠設定のバリデーション
    if (!isValidSlots) {
      alert('時間設定にエラーがあります。施術時間と休憩時間を確認してください。')
      return
    }
    
    if (!formData.service_duration || formData.service_duration <= 0) {
      alert('施術時間を入力してください')
      return
    }
    
    if (!formData.hourly_rate || formData.hourly_rate <= 0) {
      alert('時給を入力してください')
      return
    }
    
    // 募集人数と予約枠数のバリデーション
    if (formData.max_participants > (formData.slot_count || 1)) {
      alert(`募集人数（${formData.max_participants}名）が予約枠数（${formData.slot_count}枠）を超えています。\n募集人数は予約枠数以下に設定してください。`)
      return
    }
    
    try {
      setLoading(true)
      const created = await reservationsApi.create(formData)
      
      // 成功メッセージを表示
      alert(`予約を作成しました（予約枠: ${formData.slot_count}枠）`)
      
      // 予約一覧画面に遷移
      router.push('/admin/reservations')
    } catch (err) {
      console.error('予約作成エラー:', err)
      alert('作成に失敗しました: ' + (err instanceof Error ? err.message : ''))
      setLoading(false)
    }
  }
  
  // 入力変更ハンドラー
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'company_id' || name === 'max_participants' ? parseInt(value) || 0 : value
    }))
  }
  
  return (
    <>
      <PageHeader 
        title="新規予約作成" 
        breadcrumbs={[
          { label: 'ダッシュボード', href: '/admin/dashboard' },
          { label: '予約管理', href: '/admin/reservations' },
          { label: '新規作成' }
        ]}
      />
      
      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          <div className="col-12 col-lg-8">
            {/* 基本情報 */}
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">基本情報</h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-12">
                    <label htmlFor="company_id" className="form-label">
                      企業 <span className="text-danger">*</span>
                    </label>
                    <select
                      id="company_id"
                      name="company_id"
                      className="form-select"
                      value={formData.company_id}
                      onChange={handleChange}
                      required
                    >
                      <option value="0">選択してください</option>
                      {companies.map(company => (
                        <option key={company.id} value={company.id}>
                          {company.company_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-12 col-md-6">
                    <label htmlFor="office_name" className="form-label">
                      事業所名 <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      id="office_name"
                      name="office_name"
                      className="form-control"
                      value={formData.office_name}
                      onChange={handleChange}
                      placeholder="梅田オフィス"
                      required
                    />
                  </div>
                  
                  <div className="col-12 col-md-6">
                    <label htmlFor="office_address" className="form-label">
                      事業所住所
                    </label>
                    <input
                      type="text"
                      id="office_address"
                      name="office_address"
                      className="form-control"
                      value={formData.office_address}
                      onChange={handleChange}
                      placeholder="大阪府大阪市北区梅田1-1-1"
                    />
                  </div>
                  
                  <div className="col-12 col-md-4">
                    <label htmlFor="reservation_date" className="form-label">
                      予約日 <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      id="reservation_date"
                      name="reservation_date"
                      className="form-control"
                      value={formData.reservation_date}
                      onChange={handleChange}
                      min={today}
                      required
                    />
                    <small className="text-muted">今日以降の日付を選択してください</small>
                  </div>
                  
                  <div className="col-12 col-md-4">
                    <label htmlFor="start_time" className="form-label">
                      開始時刻 <span className="text-danger">*</span>
                    </label>
                    <input
                      type="time"
                      id="start_time"
                      name="start_time"
                      className="form-control"
                      value={formData.start_time}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="col-12 col-md-4">
                    <label htmlFor="end_time" className="form-label">
                      終了時刻 <span className="text-danger">*</span>
                    </label>
                    <input
                      type="time"
                      id="end_time"
                      name="end_time"
                      className="form-control"
                      value={formData.end_time}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="col-12 col-md-6">
                    <label htmlFor="application_deadline" className="form-label">
                      募集期限
                      <small className="text-muted ms-2">(YYYY/MM/DD HH:MM)</small>
                    </label>
                    <input
                      type="text"
                      id="application_deadline"
                      name="application_deadline"
                      className="form-control"
                      value={formData.application_deadline}
                      onChange={handleChange}
                      placeholder="2026/01/20 23:59"
                    />
                    <div className="form-text">
                      例: 2026/01/20 23:59（指定しない場合は募集期限なし）
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 時間枠設定 */}
            {formData.start_time && formData.end_time && (
              <div className="mb-4">
                <TimeSlotEditor
                  startTime={formData.start_time}
                  endTime={formData.end_time}
                  initialServiceDuration={formData.service_duration}
                  initialBreakDuration={formData.break_duration}
                  initialHourlyRate={formData.hourly_rate}
                  hideEarnings={true}
                  onDataChange={handleTimeSlotDataChange}
                />
              </div>
            )}
            
            {!formData.start_time || !formData.end_time && (
              <div className="alert alert-info mb-4">
                <i className="bi bi-info-circle me-2"></i>
                開始時刻と終了時刻を入力すると、予約枠の自動計算が表示されます
              </div>
            )}
            
            {/* 募集情報 */}
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">募集情報</h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label htmlFor="max_participants" className="form-label">
                      募集人数 <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      id="max_participants"
                      name="max_participants"
                      className={`form-control ${formData.max_participants > (formData.slot_count || 1) ? 'is-invalid' : ''}`}
                      value={formData.max_participants}
                      onChange={handleChange}
                      min="1"
                      max="50"
                      required
                    />
                    {formData.max_participants > (formData.slot_count || 1) ? (
                      <div className="invalid-feedback d-block">
                        <i className="bi bi-exclamation-triangle me-1"></i>
                        募集人数（{formData.max_participants}名）が予約枠数（{formData.slot_count || 1}枠）を超えています
                      </div>
                    ) : (
                      <small className="text-muted">マッサージを受ける社員の募集人数を指定してください（予約枠数: {formData.slot_count || 1}枠）</small>
                    )}
                  </div>
                  
                  <div className="col-12 col-md-6">
                    <div className="alert alert-info mb-0">
                      <i className="bi bi-info-circle me-2"></i>
                      <strong>スタッフと社員の指定について</strong>
                      <p className="mb-0 mt-2 small">
                        担当スタッフは予約作成後に管理画面からアサインできます。<br />
                        社員は各自が予約登録画面から登録します。
                      </p>
                    </div>
                  </div>
                  
                  {formData.max_participants > (formData.slot_count || 1) && (
                    <div className="col-12">
                      <div className="alert alert-danger mb-0">
                        <i className="bi bi-exclamation-triangle-fill me-2"></i>
                        <strong>エラー: 募集人数が予約枠数を超えています</strong>
                        <p className="mb-0 mt-2 small">
                          予約枠数（{formData.slot_count}枠）に対して、募集人数（{formData.max_participants}名）が多すぎます。<br />
                          募集人数を{formData.slot_count}名以下に変更するか、予約枠設定で枠数を増やしてください。
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* 備考・要望 */}
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">備考・要望</h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-12">
                    <label htmlFor="requirements" className="form-label">
                      要望
                    </label>
                    <textarea
                      id="requirements"
                      name="requirements"
                      className="form-control"
                      rows={3}
                      value={formData.requirements}
                      onChange={handleChange}
                      placeholder="マッサージチェア使用希望など"
                    />
                  </div>
                  
                  <div className="col-12">
                    <label htmlFor="notes" className="form-label">
                      備考
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      className="form-control"
                      rows={3}
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="内部メモなど"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* サイドバー */}
          <div className="col-12 col-lg-4">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">ステータス</h5>
              </div>
              <div className="card-body">
                <select
                  name="status"
                  className="form-select"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="pending">未確認</option>
                  <option value="confirmed">確定</option>
                  <option value="completed">完了</option>
                  <option value="cancelled">キャンセル</option>
                  <option value="evaluated">評価済み</option>
                </select>
              </div>
            </div>
            
            <div className="card mt-4">
              <div className="card-body">
                <div className="d-grid gap-2">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading || formData.max_participants > (formData.slot_count || 1)}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        作成中...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-2"></i>
                        予約を作成
                      </>
                    )}
                  </button>
                  <button 
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => router.back()}
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </>
  )
}




