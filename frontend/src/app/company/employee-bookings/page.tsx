'use client'

import React, { useState, useEffect } from 'react'
import PageHeader from '@/components/common/PageHeader'
import { Reservation, reservationsApi, EmployeeRegistration } from '@/lib/api'

const statusConfig = {
  pending: { label: '募集中', color: 'success' },
  recruiting: { label: '募集中', color: 'success' },
  confirmed: { label: '確定済み', color: 'primary' },
  completed: { label: '終了', color: 'secondary' },
  cancelled: { label: 'キャンセル', color: 'danger' },
}

export default function EmployeeBookingsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [registrationForm, setRegistrationForm] = useState({
    employee_name: '',
    department: '',
    position: '',
    phone: '',
    email: '',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)

  // データ取得
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setLoading(true)
        // 募集中の予約のみ取得
        const allReservations = await reservationsApi.getAll()
        const recruiting = allReservations.filter(r => r.status === 'recruiting')
        setReservations(recruiting)
      } catch (err) {
        setError(err instanceof Error ? err.message : '予約データの取得に失敗しました')
        console.error('予約データ取得エラー:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchReservations()
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
    
    if (!selectedSlot) {
      alert('時間枠を選択してください')
      return
    }
    
    try {
      setSubmitting(true)
      
      // 枠番号を含む社員データ
      const employeeData: EmployeeRegistration = {
        employee_name: registrationForm.employee_name,
        department: registrationForm.department,
        position: registrationForm.position || undefined,
        phone: registrationForm.phone || undefined,
        email: registrationForm.email || undefined,
        notes: registrationForm.notes || undefined,
        slot_number: selectedSlot, // 選択した枠番号
      }
      
      await reservationsApi.addEmployee(selectedReservation.id, employeeData)
      
      alert(`予約登録が完了しました！\n\n枠番号: ${selectedSlot}\n社員名: ${registrationForm.employee_name}\n部署: ${registrationForm.department}`)
      
      // モーダルを閉じる
      const modalElement = document.getElementById('registrationModal')
      if (modalElement) {
        const modal = (window as any).bootstrap.Modal.getInstance(modalElement)
        modal?.hide()
      }
      
      // データを再取得
      const allReservations = await reservationsApi.getAll()
      const recruiting = allReservations.filter(r => r.status === 'recruiting')
      setReservations(recruiting)
      
      // 選択状態をリセット
      setSelectedSlot(null)
      setSelectedReservation(null)
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
          // slots_filledを優先的に使用（正確な予約済み枠数）
          const registeredCount = reservation.slots_filled !== undefined 
            ? reservation.slots_filled 
            : (reservation.employee_names 
                ? reservation.employee_names.split(',').filter(n => n.trim()).length 
                : 0)
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
                    {!isFull ? (
                      <button
                        className="btn btn-success w-100"
                        onClick={() => handleShowDetail(reservation)}
                      >
                        <i className="bi bi-calendar-check me-2"></i>
                        時間枠を選択して登録する
                      </button>
                    ) : (
                      <button
                        className="btn btn-outline-secondary w-100"
                        onClick={() => handleShowDetail(reservation)}
                      >
                        <i className="bi bi-eye me-2"></i>
                        詳細を見る（満席）
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
        <div className="modal-dialog modal-xl">
          <div className="modal-content">
            <div className="modal-header bg-success bg-opacity-10">
              <h5 className="modal-title">
                <i className="bi bi-calendar-check me-2 text-success"></i>
                予約詳細と時間枠選択
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              {selectedReservation && (
                <>
                  <h6 className="mb-3">
                    <i className="bi bi-info-circle me-2"></i>
                    予約情報
                  </h6>
                  <table className="table table-borderless table-sm mb-4">
                    <tbody>
                      <tr>
                        <th style={{ width: '25%' }}>予約ID</th>
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
                        <th>要望</th>
                        <td>{selectedReservation.requirements || '-'}</td>
                      </tr>
                    </tbody>
                  </table>

                  <hr className="my-4" />

                  {/* 時間枠選択セクション */}
                  <h6 className="mb-3">
                    <i className="bi bi-clock me-2"></i>
                    時間枠を選択してください
                  </h6>
                  
                  {selectedReservation.time_slots && selectedReservation.time_slots.length > 0 ? (
                    <div className="row g-3">
                      {selectedReservation.time_slots.map((slot: any) => {
                        const isFilled = slot.is_filled || false
                        const isSelected = selectedSlot === slot.slot
                        
                        return (
                          <div key={slot.slot} className="col-12 col-md-6 col-lg-4">
                            <div className={`card h-100 ${isFilled ? 'border-secondary bg-light' : isSelected ? 'border-success border-3 bg-success bg-opacity-10' : 'border-success'}`}>
                              <div className="card-body">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <h6 className={`mb-0 ${isFilled ? 'text-secondary' : 'text-success'}`}>
                                    <i className={`bi bi-${isFilled ? 'x-circle' : 'check-circle'} me-2`}></i>
                                    枠{slot.slot}
                                  </h6>
                                  {isSelected && (
                                    <span className="badge bg-success">
                                      <i className="bi bi-check2 me-1"></i>
                                      選択中
                                    </span>
                                  )}
                                </div>
                                
                                <div className="mb-2">
                                  <div className="fw-bold">{slot.start_time}〜{slot.end_time}</div>
                                  <small className="text-muted">施術時間: {slot.duration}分</small>
                                </div>
                                
                                {isFilled ? (
                                  <div className="text-muted small">
                                    <i className="bi bi-person-fill me-1"></i>
                                    予約済み
                                    {slot.employee_name && (
                                      <div className="mt-1">
                                        {slot.employee_name}
                                        {slot.employee_department && ` (${slot.employee_department})`}
                                      </div>
                                    )}
                                    {slot.staff_name && !slot.employee_name && (
                                      <div className="mt-1">
                                        {slot.staff_name}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <button
                                    className={`btn w-100 ${isSelected ? 'btn-success' : 'btn-outline-success'}`}
                                    onClick={() => setSelectedSlot(slot.slot)}
                                  >
                                    {isSelected ? (
                                      <>
                                        <i className="bi bi-check-circle-fill me-2"></i>
                                        選択済み
                                      </>
                                    ) : (
                                      <>
                                        <i className="bi bi-check-circle me-2"></i>
                                        この枠で登録
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="alert alert-warning">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      この予約には時間枠が設定されていません
                    </div>
                  )}

                  <div className="d-flex gap-2 mt-4">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      data-bs-dismiss="modal"
                    >
                      <i className="bi bi-x-circle me-2"></i>
                      キャンセル
                    </button>
                    <button
                      className="btn btn-success flex-grow-1"
                      onClick={() => {
                        if (!selectedSlot) {
                          alert('時間枠を選択してください')
                          return
                        }
                        handleShowRegistration(selectedReservation)
                      }}
                      disabled={!selectedSlot}
                    >
                      <i className="bi bi-arrow-right-circle me-2"></i>
                      選択した枠で登録手続きへ進む
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
            <div className="modal-header bg-success bg-opacity-10">
              <h5 className="modal-title">
                <i className="bi bi-person-plus me-2 text-success"></i>
                予約登録フォーム
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {selectedReservation && selectedSlot && (
                  <div className="alert alert-success mb-3">
                    <h6 className="alert-heading mb-2">
                      <i className="bi bi-check-circle me-2"></i>
                      選択内容
                    </h6>
                    <div className="mb-1">
                      <strong>事業所:</strong> {selectedReservation.office_name}
                    </div>
                    <div className="mb-1">
                      <strong>日時:</strong> {selectedReservation.reservation_date}
                    </div>
                    <div className="mb-1">
                      <strong>選択した時間枠:</strong> 枠{selectedSlot}
                      {selectedReservation.time_slots && selectedReservation.time_slots[selectedSlot - 1] && (
                        <span className="ms-2">
                          ({selectedReservation.time_slots[selectedSlot - 1].start_time}〜{selectedReservation.time_slots[selectedSlot - 1].end_time})
                        </span>
                      )}
                    </div>
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

