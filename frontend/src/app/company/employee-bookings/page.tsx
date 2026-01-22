'use client'

import React, { useState, useEffect } from 'react'
import PageHeader from '@/components/common/PageHeader'
import { Reservation, reservationsApi, EmployeeRegistration } from '@/lib/api'

const statusConfig = {
  pending: { label: '募集中', color: 'success' },
  confirmed: { label: '確定済み', color: 'primary' },
  completed: { label: '終了', color: 'secondary' },
  cancelled: { label: 'キャンセル', color: 'danger' },
}

// モックデータ（認証機能実装までの仮データ）
const mockReservations: Reservation[] = [
  {
    id: 1,
    company_id: 1,
    office_name: '本社オフィス',
    office_address: '大阪府大阪市北区梅田1-1-1',
    reservation_date: '2026/01/15',
    start_time: '10:00',
    end_time: '12:00',
    max_participants: 3, // 募集人数: 3名
    staff_names: '山田花子, 佐藤美咲',
    employee_names: '田中部長, 鈴木課長', // 既に2名登録済み（空き1名）
    status: 'pending',
    notes: '定期契約',
    requirements: '',
    created_at: '2026-01-01T00:00:00',
    updated_at: '2026-01-01T00:00:00',
  },
  {
    id: 2,
    company_id: 1,
    office_name: '本社オフィス',
    office_address: '大阪府大阪市北区梅田1-1-1',
    reservation_date: '2026/01/20',
    start_time: '14:00',
    end_time: '16:00',
    max_participants: 1, // 募集人数: 1名（満席）
    staff_names: '',
    employee_names: '佐藤主任', // 1名登録済み（満席）
    status: 'pending',
    notes: '定期契約',
    requirements: '',
    created_at: '2026-01-02T00:00:00',
    updated_at: '2026-01-02T00:00:00',
  },
  {
    id: 3,
    company_id: 1,
    office_name: '梅田営業所',
    office_address: '大阪府大阪市北区梅田2-2-2',
    reservation_date: '2026/01/25',
    start_time: '15:00',
    end_time: '17:00',
    max_participants: 5, // 募集人数: 5名
    staff_names: '',
    employee_names: '', // まだ誰も登録していない（空き5名）
    status: 'pending',
    notes: '新規事業所',
    requirements: '',
    created_at: '2026-01-03T00:00:00',
    updated_at: '2026-01-03T00:00:00',
  },
]

export default function EmployeeBookingsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [registrationForm, setRegistrationForm] = useState({
    employee_name: '',
    department: '',
    position: '',
    phone: '',
    email: '',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)

  // データ取得（モックデータを使用）
  useEffect(() => {
    // 認証機能実装までは、モックデータを表示
    // statusが'pending'（募集中）の予約のみ表示
    setTimeout(() => {
      setReservations(mockReservations.filter(r => r.status === 'pending'))
      setLoading(false)
    }, 500)

    /* API連携版（認証実装後に使用）
    const fetchReservations = async () => {
      try {
        setLoading(true)
        // 募集中の予約のみ取得
        const data = await reservationsApi.getAll({ status: 'pending' })
        setReservations(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : '予約データの取得に失敗しました')
        console.error('予約データ取得エラー:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchReservations()
    */
  }, [])

  // 予約詳細モーダルを開く
  const handleShowDetail = (reservation: Reservation) => {
    setSelectedReservation(reservation)
    // Bootstrapモーダルを開く
    const modalElement = document.getElementById('bookingDetailModal')
    if (modalElement) {
      const modal = new (window as any).bootstrap.Modal(modalElement)
      modal.show()
    }
  }

  // 登録モーダルを開く
  const handleShowRegistration = (reservation: Reservation) => {
    setSelectedReservation(reservation)
    setRegistrationForm({
      employee_name: '',
      department: '',
      position: '',
      phone: '',
      email: '',
      notes: '',
    })
    // 詳細モーダルを閉じる
    const detailModalElement = document.getElementById('bookingDetailModal')
    if (detailModalElement) {
      const detailModal = (window as any).bootstrap.Modal.getInstance(detailModalElement)
      detailModal?.hide()
    }
    // 登録モーダルを開く
    setTimeout(() => {
      const registrationModalElement = document.getElementById('registrationModal')
      if (registrationModalElement) {
        const registrationModal = new (window as any).bootstrap.Modal(registrationModalElement)
        registrationModal.show()
      }
    }, 300)
  }

  // フォーム変更ハンドラ
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setRegistrationForm(prev => ({ ...prev, [name]: value }))
  }

  // 登録送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedReservation) return
    
    if (!registrationForm.employee_name || !registrationForm.department) {
      alert('社員名と部署は必須です')
      return
    }
    
    try {
      setSubmitting(true)
      
      // API連携版（認証実装後に使用）
      const employeeData: EmployeeRegistration = {
        employee_name: registrationForm.employee_name,
        department: registrationForm.department,
        position: registrationForm.position || undefined,
        phone: registrationForm.phone || undefined,
        email: registrationForm.email || undefined,
        notes: registrationForm.notes || undefined,
      }
      // await reservationsApi.addEmployee(selectedReservation.id, employeeData)
      
      alert(`予約ID ${selectedReservation.id} に登録しました！\n\n社員名: ${registrationForm.employee_name}\n部署: ${registrationForm.department}`)
      
      // モーダルを閉じる
      const modalElement = document.getElementById('registrationModal')
      if (modalElement) {
        const modal = (window as any).bootstrap.Modal.getInstance(modalElement)
        modal?.hide()
      }
      
      // ページをリロード（実際はAPIから再取得）
      // window.location.reload()
    } catch (err) {
      alert('登録に失敗しました: ' + (err instanceof Error ? err.message : '不明なエラー'))
      console.error('登録エラー:', err)
    } finally {
      setSubmitting(false)
    }
  }

  // ローディング表示
  if (loading) {
    return (
      <>
        <PageHeader
          title="予約登録（社員用）"
          breadcrumbs={[
            { label: 'ダッシュボード', href: '/company/dashboard' },
            { label: '予約登録' }
          ]}
        />
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">読み込み中...</span>
          </div>
        </div>
      </>
    )
  }

  // エラー表示
  if (error) {
    return (
      <>
        <PageHeader
          title="予約登録（社員用）"
          breadcrumbs={[
            { label: 'ダッシュボード', href: '/company/dashboard' },
            { label: '予約登録' }
          ]}
        />
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="予約登録（社員用）"
        breadcrumbs={[
          { label: 'ダッシュボード', href: '/company/dashboard' },
          { label: '予約登録' }
        ]}
      />

      {/* 説明カード */}
      <div className="alert alert-info mb-4">
        <h5 className="alert-heading">
          <i className="bi bi-info-circle me-2"></i>
          予約登録について
        </h5>
        <p className="mb-0">
          企業側が登録した訪問日程の中から、あなたがマッサージを受けたい日時を選んで登録してください。
          <br />
          登録後、オリエンタルシナジーのスタッフがアサインされます。
        </p>
      </div>

      {/* 予約カード一覧 */}
      <div className="row g-4">
        {reservations.map((reservation) => {
          const config = statusConfig[reservation.status as keyof typeof statusConfig]
          const registeredCount = reservation.employee_names 
            ? reservation.employee_names.split(',').filter(n => n.trim()).length 
            : 0
          const maxParticipants = reservation.max_participants || 1
          const availableSlots = maxParticipants - registeredCount
          const isFull = availableSlots <= 0
          
          return (
            <div key={reservation.id} className="col-12 col-lg-6">
              <div className={`card h-100 ${isFull ? 'border-secondary' : 'border-success'}`}>
                <div className={`card-header ${isFull ? 'bg-secondary' : 'bg-success'} bg-opacity-10 d-flex justify-content-between align-items-center`}>
                  <div>
                    <h5 className="mb-0">
                      <i className={`bi bi-calendar-check me-2 ${isFull ? 'text-secondary' : 'text-success'}`}></i>
                      {reservation.office_name}
                    </h5>
                    <small className="text-muted">予約ID: {reservation.id}</small>
                  </div>
                  <div className="d-flex gap-2">
                    {isFull ? (
                      <span className="badge bg-secondary">
                        <i className="bi bi-x-circle me-1"></i>
                        満席
                      </span>
                    ) : (
                      <span className="badge bg-success">
                        <i className="bi bi-check-circle me-1"></i>
                        募集中
                      </span>
                    )}
                  </div>
                </div>
                <div className="card-body">
                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <div className="d-flex align-items-center gap-2">
                        <i className="bi bi-calendar3 text-primary"></i>
                        <div>
                          <small className="text-muted d-block">訪問日時</small>
                          <div className="fw-bold">{reservation.reservation_date}</div>
                          <small>{reservation.start_time}〜{reservation.end_time}</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="d-flex align-items-center gap-2">
                        <i className="bi bi-people text-info"></i>
                        <div>
                          <small className="text-muted d-block">募集人数</small>
                          <div className="fw-bold">
                            {registeredCount} / {maxParticipants}名
                            {!isFull && (
                              <span className="text-success ms-2 small">
                                (空き{availableSlots}名)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="d-flex align-items-start gap-2">
                        <i className="bi bi-geo-alt text-danger mt-1"></i>
                        <div>
                          <small className="text-muted d-block">場所</small>
                          <div>{reservation.office_address || '住所情報なし'}</div>
                        </div>
                      </div>
                    </div>
                    {reservation.requirements && (
                      <div className="col-12">
                        <div className="d-flex align-items-start gap-2">
                          <i className="bi bi-info-circle text-warning mt-1"></i>
                          <div>
                            <small className="text-muted d-block">要望</small>
                            <div>{reservation.requirements}</div>
                          </div>
                        </div>
                      </div>
                    )}
                    {registeredCount > 0 && (
                      <div className="col-12">
                        <div className={`alert ${isFull ? 'alert-secondary' : 'alert-success'} mb-0 py-2`}>
                          <small>
                            <i className="bi bi-check-circle me-1"></i>
                            既に登録されている社員: {reservation.employee_names}
                          </small>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-outline-secondary flex-grow-1"
                      onClick={() => handleShowDetail(reservation)}
                    >
                      <i className="bi bi-eye me-2"></i>
                      詳細を見る
                    </button>
                    {!isFull && (
                      <button
                        className="btn btn-success"
                        onClick={() => handleShowRegistration(reservation)}
                      >
                        <i className="bi bi-person-plus me-2"></i>
                        登録する
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {reservations.length === 0 && (
        <div className="card">
          <div className="card-body text-center py-5">
            <i className="bi bi-calendar-x fs-1 text-muted"></i>
            <p className="text-muted mt-3">現在募集中の予約はありません。</p>
          </div>
        </div>
      )}

      {/* 予約詳細モーダル */}
      <div className="modal fade" id="bookingDetailModal" tabIndex={-1}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header bg-success bg-opacity-10">
              <h5 className="modal-title">
                <i className="bi bi-calendar-check me-2 text-success"></i>
                予約詳細
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              {selectedReservation && (
                <>
                  <table className="table table-borderless">
                    <tbody>
                      <tr>
                        <th style={{ width: '30%' }}>予約ID</th>
                        <td>{selectedReservation.id}</td>
                      </tr>
                      <tr>
                        <th>実施事業所</th>
                        <td>{selectedReservation.office_name}</td>
                      </tr>
                      <tr>
                        <th>住所</th>
                        <td>{selectedReservation.office_address || '-'}</td>
                      </tr>
                      <tr>
                        <th>訪問日付</th>
                        <td className="fw-bold text-primary">{selectedReservation.reservation_date}</td>
                      </tr>
                      <tr>
                        <th>訪問時間</th>
                        <td>{selectedReservation.start_time}〜{selectedReservation.end_time}</td>
                      </tr>
                      <tr>
                        <th>派遣スタッフ</th>
                        <td>{selectedReservation.staff_names || '未アサイン'}</td>
                      </tr>
                      <tr>
                        <th>登録済み社員</th>
                        <td>{selectedReservation.employee_names || 'なし'}</td>
                      </tr>
                      <tr>
                        <th>要望</th>
                        <td>{selectedReservation.requirements || '-'}</td>
                      </tr>
                      <tr>
                        <th>備考</th>
                        <td>{selectedReservation.notes || '-'}</td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="d-flex gap-2 mt-4">
                    <button
                      className="btn btn-success w-100"
                      onClick={() => handleShowRegistration(selectedReservation)}
                    >
                      <i className="bi bi-person-plus me-2"></i>
                      この予約に登録する
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 登録フォームモーダル */}
      <div className="modal fade" id="registrationModal" tabIndex={-1}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="bi bi-person-plus me-2"></i>
                予約登録フォーム
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {selectedReservation && (
                  <div className="alert alert-info mb-3">
                    <strong>予約情報:</strong><br />
                    {selectedReservation.office_name} - {selectedReservation.reservation_date} {selectedReservation.start_time}〜{selectedReservation.end_time}
                  </div>
                )}

                <div className="mb-3">
                  <label htmlFor="employee_name" className="form-label">
                    社員名 <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="employee_name"
                    name="employee_name"
                    value={registrationForm.employee_name}
                    onChange={handleFormChange}
                    required
                    placeholder="例: 田中太郎"
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="department" className="form-label">
                    部署 <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="department"
                    name="department"
                    value={registrationForm.department}
                    onChange={handleFormChange}
                    required
                    placeholder="例: 営業部"
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="position" className="form-label">
                    役職
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="position"
                    name="position"
                    value={registrationForm.position}
                    onChange={handleFormChange}
                    placeholder="例: 課長"
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="phone" className="form-label">
                    電話番号
                  </label>
                  <input
                    type="tel"
                    className="form-control"
                    id="phone"
                    name="phone"
                    value={registrationForm.phone}
                    onChange={handleFormChange}
                    placeholder="例: 090-1234-5678"
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    メールアドレス
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    value={registrationForm.email}
                    onChange={handleFormChange}
                    placeholder="例: tanaka@example.com"
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="notes" className="form-label">
                    備考・要望
                  </label>
                  <textarea
                    className="form-control"
                    id="notes"
                    name="notes"
                    rows={3}
                    value={registrationForm.notes}
                    onChange={handleFormChange}
                    placeholder="例: 肩こりがひどいです"
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                  キャンセル
                </button>
                <button type="submit" className="btn btn-success" disabled={submitting}>
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      登録中...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-2"></i>
                      登録する
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

