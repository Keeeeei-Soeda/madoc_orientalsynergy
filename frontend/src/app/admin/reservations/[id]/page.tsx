'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/common/PageHeader'
import TimeSlotDisplay, { TimeSlotWithEmployee } from '@/components/reservations/TimeSlotDisplay'
import {
  reservationsApi,
  staffApi,
  assignmentsApi,
  Reservation,
  Staff,
  Assignment,
  getAdminStatusLabel,
  getStatusBadgeClass
} from '@/lib/api'
import { useAuth } from '@/lib/auth/AuthContext'

export default function AdminReservationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const reservationId = parseInt(params.id as string)

  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [allStaff, setAllStaff] = useState<Staff[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showStaffModal, setShowStaffModal] = useState(false)
  const [showSlotModal, setShowSlotModal] = useState(false)
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null)
  const [selectedSlotNumbers, setSelectedSlotNumbers] = useState<number[]>([])
  const [sendingOffer, setSendingOffer] = useState(false)

  // データ取得
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return

      try {
        setLoading(true)
        setError(null)

        // 予約データ、全スタッフ、アサイン情報を並行取得
        const [reservationData, staffData, assignmentsData] = await Promise.all([
          reservationsApi.getById(reservationId),
          staffApi.getAll(),
          assignmentsApi.getReservationAssignments(reservationId)
        ])

        setReservation(reservationData)
        setAllStaff(staffData)
        setAssignments(assignmentsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : '予約データの取得に失敗しました')
        console.error('予約データ取得エラー:', err)
      } finally {
        setLoading(false)
      }
    }

    if (reservationId && user?.id) {
      fetchData()
    }
  }, [reservationId, user?.id])

  // ステップ1: スタッフを選択
  const handleSelectStaff = (staffId: number) => {
    setSelectedStaffId(staffId)
    setSelectedSlotNumbers([])
    setShowStaffModal(false)
    setShowSlotModal(true)
  }

  // 枠の選択/選択解除をトグル
  const handleToggleSlotSelection = (slotNumber: number) => {
    setSelectedSlotNumbers(prev => {
      if (prev.includes(slotNumber)) {
        return prev.filter(n => n !== slotNumber)
      } else {
        return [...prev, slotNumber]
      }
    })
  }

  // ステップ2: 選択した枠にオファー送信
  const handleSendOfferWithSlots = async () => {
    if (!reservation || !user?.id || !selectedStaffId || selectedSlotNumbers.length === 0) return

    const slotText = selectedSlotNumbers.length === 1
      ? `枠${selectedSlotNumbers[0]}`
      : `${selectedSlotNumbers.length}個の枠（${selectedSlotNumbers.sort((a, b) => a - b).join(', ')}）`

    if (!confirm(`${slotText}にオファーを送信しますか？`)) return

    try {
      setSendingOffer(true)
      let successCount = 0
      let failCount = 0

      // 各枠に順次オファーを送信
      for (const slotNumber of selectedSlotNumbers) {
        try {
          await assignmentsApi.assignStaff({
            reservation_id: reservation.id,
            staff_id: selectedStaffId,
            assigned_by: user.id,
            slot_number: slotNumber,
            notes: `枠${slotNumber}へのオファー`
          })
          successCount++
        } catch (err) {
          console.error(`枠${slotNumber}へのオファー送信失敗:`, err)
          failCount++
        }
      }

      // アサイン情報を再取得
      const updatedAssignments = await assignmentsApi.getReservationAssignments(reservationId)
      setAssignments(updatedAssignments)

      // 結果を表示
      if (failCount === 0) {
        alert(`${successCount}個の枠にオファーを送信しました`)
      } else {
        alert(`${successCount}個成功、${failCount}個失敗しました`)
      }

      setShowSlotModal(false)
      setSelectedStaffId(null)
      setSelectedSlotNumbers([])
    } catch (err) {
      alert('オファー送信に失敗しました: ' + (err instanceof Error ? err.message : ''))
    } finally {
      setSendingOffer(false)
    }
  }

  // 枠がオファー送信可能かチェック
  const isSlotAvailableForOffer = (slotNumber: number): boolean => {
    // この枠にpendingまたはconfirmedのオファーが存在するかチェック
    const existingOffer = assignments.find(a =>
      a.slot_number === slotNumber &&
      (a.status === 'pending' || a.status === 'confirmed')
    )
    return !existingOffer
  }

  // アサイン承認（スタッフがYESと回答した後、管理者が最終確定）
  const handleConfirmAssignment = async (assignmentId: number) => {
    if (!confirm('このアサインを確定してもよろしいですか？')) return

    try {
      await assignmentsApi.updateAssignment(assignmentId, { status: 'confirmed' })

      // アサイン情報を再取得
      const updatedAssignments = await assignmentsApi.getReservationAssignments(reservationId)
      setAssignments(updatedAssignments)

      alert('アサインを確定しました')
    } catch (err) {
      alert('確定に失敗しました: ' + (err instanceof Error ? err.message : ''))
    }
  }

  // アサイン削除
  const handleDeleteAssignment = async (assignmentId: number) => {
    if (!confirm('このアサインを削除してもよろしいですか？')) return

    try {
      await assignmentsApi.deleteAssignment(assignmentId)

      // アサイン情報を再取得
      const updatedAssignments = await assignmentsApi.getReservationAssignments(reservationId)
      setAssignments(updatedAssignments)

      alert('アサインを削除しました')
    } catch (err) {
      alert('削除に失敗しました: ' + (err instanceof Error ? err.message : ''))
    }
  }

  // 削除処理
  const handleDelete = async () => {
    if (!confirm('この予約を削除してもよろしいですか？')) {
      return
    }

    try {
      await reservationsApi.delete(reservationId)
      alert('予約を削除しました')
      router.push('/admin/reservations')
    } catch (err) {
      alert('削除に失敗しました: ' + (err instanceof Error ? err.message : ''))
    }
  }

  // ローディング表示
  if (loading) {
    return (
      <>
        <PageHeader
          title="予約詳細"
          breadcrumbs={[
            { label: 'ダッシュボード', href: '/admin/dashboard' },
            { label: '予約管理', href: '/admin/reservations' },
            { label: '予約詳細' }
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
  if (error || !reservation) {
    return (
      <>
        <PageHeader
          title="予約詳細"
          breadcrumbs={[
            { label: 'ダッシュボード', href: '/admin/dashboard' },
            { label: '予約管理', href: '/admin/reservations' },
            { label: '予約詳細' }
          ]}
        />
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error || '予約が見つかりませんでした'}
        </div>
      </>
    )
  }

  const statusLabel = getAdminStatusLabel(reservation.status)
  const badgeClass = getStatusBadgeClass(reservation.status)
  const timeSlots = (reservation.time_slots || []) as TimeSlotWithEmployee[]

  // アサインステータス別の分類
  const pendingAssignments = assignments.filter(a => a.status === 'pending')
  const confirmedAssignments = assignments.filter(a => a.status === 'confirmed')
  const rejectedAssignments = assignments.filter(a => a.status === 'rejected')

  return (
    <>
      <PageHeader
        title={`予約詳細 #${reservation.id}`}
        breadcrumbs={[
          { label: 'ダッシュボード', href: '/admin/dashboard' },
          { label: '予約管理', href: '/admin/reservations' },
          { label: `予約 #${reservation.id}` }
        ]}
        action={
          <div className="d-flex gap-2">
            <Link
              href={`/admin/reservations/${reservation.id}/edit`}
              className="btn btn-primary"
            >
              <i className="bi bi-pencil me-2"></i>
              編集
            </Link>
            <button
              onClick={handleDelete}
              className="btn btn-danger"
            >
              <i className="bi bi-trash me-2"></i>
              削除
            </button>
          </div>
        }
      />

      <div className="row g-4">
        {/* 基本情報 */}
        <div className="col-12">
          <div className="card mb-4">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">予約情報</h5>
                <span className={`badge ${badgeClass}`}>
                  {statusLabel}
                </span>
              </div>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-12">
                  <h4>{reservation.office_name}</h4>
                  {reservation.office_address && (
                    <p className="text-muted mb-0">
                      <i className="bi bi-geo-alt me-2"></i>
                      {reservation.office_address}
                    </p>
                  )}
                </div>

                <div className="col-12 col-md-3">
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-calendar3 text-primary fs-4"></i>
                    <div>
                      <small className="text-muted d-block">予約日</small>
                      <span className="fw-bold">{reservation.reservation_date}</span>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-md-3">
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-clock text-success fs-4"></i>
                    <div>
                      <small className="text-muted d-block">時間</small>
                      <span className="fw-bold">
                        {reservation.start_time} 〜 {reservation.end_time}
                      </span>
                    </div>
                  </div>
                </div>

                {reservation.application_deadline && (
                  <div className="col-12 col-md-3">
                    <div className="d-flex align-items-center gap-2">
                      <i className="bi bi-hourglass-split text-warning fs-4"></i>
                      <div>
                        <small className="text-muted d-block">募集期限</small>
                        <span className="fw-bold">{reservation.application_deadline}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="col-12 col-md-3">
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-people text-info fs-4"></i>
                    <div>
                      <small className="text-muted d-block">希望スタッフ数</small>
                      <span className="fw-bold">
                        {reservation.max_participants || 1} 名
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* アサイン状況 */}
        <div className="col-12">
          <div className="card mb-4">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="bi bi-person-badge me-2"></i>
                  アサイン状況
                </h5>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => setShowStaffModal(true)}
                >
                  <i className="bi bi-person-plus me-2"></i>
                  スタッフにオファー送信
                </button>
              </div>
            </div>
            <div className="card-body">
              {/* 募集人数と確定数の状況 */}
              <div className="mb-3 p-3 bg-light rounded">
                <div className="row align-items-center">
                  <div className="col-md-3">
                    <small className="text-muted d-block">募集人数</small>
                    <span className="fs-5 fw-bold">{reservation.max_participants || 1} 名</span>
                  </div>
                  <div className="col-md-3">
                    <small className="text-muted d-block">確定数（社員）</small>
                    {/* 社員の予約数（slots_filled）を表示 */}
                    {(() => {
                      const employeeCount = reservation.slots_filled || 0
                      const maxParticipants = reservation.max_participants || 1
                      return (
                        <span className={`fs-5 fw-bold ${employeeCount > maxParticipants ? 'text-danger' : 'text-success'}`}>
                          {employeeCount} 名
                        </span>
                      )
                    })()}
                  </div>
                  <div className="col-md-3">
                    <small className="text-muted d-block">確定数（スタッフ）</small>
                    {/* スタッフの確定数（confirmedAssignments）を表示 */}
                    {(() => {
                      const staffCount = confirmedAssignments.length
                      const maxParticipants = reservation.max_participants || 1
                      return (
                        <span className={`fs-5 fw-bold ${staffCount > maxParticipants ? 'text-danger' : 'text-success'}`}>
                          {staffCount} 名
                        </span>
                      )
                    })()}
                  </div>
                  <div className="col-md-3">
                    <small className="text-muted d-block">オファー中</small>
                    <span className="fs-5 fw-bold text-warning">{pendingAssignments.length} 名</span>
                  </div>
                </div>
                {(() => {
                  const employeeCount = reservation.slots_filled || 0
                  const staffCount = confirmedAssignments.length
                  const totalAssigned = employeeCount + staffCount
                  const maxParticipants = reservation.max_participants || 1

                  if (totalAssigned > maxParticipants) {
                    return (
                      <div className="alert alert-danger mt-3 mb-0">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        <strong>募集人数を超過しています！</strong>
                        <p className="mb-0 mt-1 small">
                          確定数が募集人数を{totalAssigned - maxParticipants}名超過しています。
                          （社員: {employeeCount}名 + スタッフ: {staffCount}名 = {totalAssigned}名 / 募集: {maxParticipants}名）
                        </p>
                      </div>
                    )
                  }
                  return null
                })()}
              </div>
              {/* 回答待ち */}
              {pendingAssignments.length > 0 && (
                <div className="mb-4">
                  <h6 className="text-warning">
                    <i className="bi bi-hourglass-split me-2"></i>
                    回答待ち ({pendingAssignments.length}件)
                  </h6>
                  <div className="list-group">
                    {pendingAssignments.map(assignment => (
                      <div key={assignment.id} className="list-group-item">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <strong>{assignment.staff_name}</strong>
                            {assignment.slot_number && (
                              <span className="badge bg-info ms-2">枠{assignment.slot_number}</span>
                            )}
                            <br />
                            <small className="text-muted">
                              オファー送信: {new Date(assignment.assigned_at).toLocaleString('ja-JP')}
                            </small>
                          </div>
                          <button
                            onClick={() => handleDeleteAssignment(assignment.id)}
                            className="btn btn-sm btn-outline-danger"
                          >
                            <i className="bi bi-x"></i> 取り消し
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 確定済み */}
              {confirmedAssignments.length > 0 && (
                <div className="mb-4">
                  <h6 className="text-success">
                    <i className="bi bi-check-circle me-2"></i>
                    確定済み ({confirmedAssignments.length}件)
                  </h6>
                  <div className="list-group">
                    {confirmedAssignments.map(assignment => (
                      <div key={assignment.id} className="list-group-item list-group-item-success">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <strong>{assignment.staff_name}</strong>
                            {assignment.slot_number && (
                              <span className="badge bg-success ms-2">枠{assignment.slot_number}</span>
                            )}
                            <br />
                            <small className="text-muted">
                              確定日時: {new Date(assignment.assigned_at).toLocaleString('ja-JP')}
                            </small>
                          </div>
                          <button
                            onClick={() => handleDeleteAssignment(assignment.id)}
                            className="btn btn-sm btn-outline-danger"
                          >
                            <i className="bi bi-x"></i> 削除
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 辞退 */}
              {rejectedAssignments.length > 0 && (
                <div className="mb-4">
                  <h6 className="text-danger">
                    <i className="bi bi-x-circle me-2"></i>
                    辞退 ({rejectedAssignments.length}件)
                  </h6>
                  <div className="list-group">
                    {rejectedAssignments.map(assignment => (
                      <div key={assignment.id} className="list-group-item list-group-item-danger">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <strong>{assignment.staff_name}</strong>
                            {assignment.slot_number && (
                              <span className="badge bg-secondary ms-2">枠{assignment.slot_number}</span>
                            )}
                            <br />
                            <small className="text-muted">
                              辞退日時: {new Date(assignment.assigned_at).toLocaleString('ja-JP')}
                            </small>
                          </div>
                          <button
                            onClick={() => handleDeleteAssignment(assignment.id)}
                            className="btn btn-sm btn-outline-secondary"
                          >
                            <i className="bi bi-trash"></i> 削除
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {assignments.length === 0 && (
                <div className="alert alert-info">
                  <i className="bi bi-info-circle me-2"></i>
                  まだスタッフにオファーを送信していません。
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 時間枠情報 */}
        {timeSlots.length > 0 && (
          <div className="col-12">
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="bi bi-calendar-check me-2"></i>
                  時間枠情報
                </h5>
              </div>
              <div className="card-body">
                <TimeSlotDisplay
                  slots={timeSlots}
                  hourlyRate={reservation.hourly_rate}
                  readOnly={true}
                  hideEmployeeInfo={true}
                />
              </div>
            </div>
          </div>
        )}

        {/* 要望・備考 */}
        {(reservation.requirements || reservation.notes) && (
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">要望・備考</h5>
              </div>
              <div className="card-body">
                {reservation.requirements && (
                  <div className="mb-3">
                    <label className="form-label fw-bold">要望</label>
                    <p className="mb-0">{reservation.requirements}</p>
                  </div>
                )}
                {reservation.notes && (
                  <div>
                    <label className="form-label fw-bold">備考</label>
                    <p className="mb-0">{reservation.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ステップ1: スタッフ選択モーダル */}
      {showStaffModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-person-plus me-2"></i>
                  ステップ1: スタッフを選択
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowStaffModal(false)
                    setSelectedStaffId(null)
                  }}
                ></button>
              </div>
              <div className="modal-body">
                {allStaff.length === 0 ? (
                  <div className="alert alert-warning">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    スタッフが登録されていません。
                  </div>
                ) : (
                  <div className="list-group">
                    {allStaff
                      .filter(staff => staff.is_available)
                      .map(staff => (
                        <button
                          key={staff.id}
                          className="list-group-item list-group-item-action"
                          onClick={() => handleSelectStaff(staff.id)}
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <div className="fw-bold">{staff.name}</div>
                              <small className="text-muted">
                                {staff.qualifications || '資格: 未設定'}
                              </small>
                            </div>
                            <i className="bi bi-chevron-right"></i>
                          </div>
                        </button>
                      ))}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowStaffModal(false)
                    setSelectedStaffId(null)
                  }}
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ステップ2: 枠選択モーダル */}
      {showSlotModal && selectedStaffId && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-clock me-2"></i>
                  ステップ2: 依頼する枠を選択
                  {selectedSlotNumbers.length > 0 && (
                    <span className="badge bg-primary ms-2">{selectedSlotNumbers.length}個選択中</span>
                  )}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowSlotModal(false)
                    setSelectedStaffId(null)
                    setSelectedSlotNumbers([])
                  }}
                  disabled={sendingOffer}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-info mb-4">
                  <i className="bi bi-info-circle me-2"></i>
                  <strong>{allStaff.find(s => s.id === selectedStaffId)?.name}</strong> に依頼する枠を選択してください（複数選択可能）
                </div>

                {timeSlots.length === 0 ? (
                  <div className="alert alert-warning">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    時間枠が設定されていません。
                  </div>
                ) : (
                  <div className="list-group">
                    {timeSlots.map((slot) => {
                      const isAvailable = isSlotAvailableForOffer(slot.slot)
                      const isSelected = selectedSlotNumbers.includes(slot.slot)
                      const assignedStaff = !isAvailable ? assignments.find(a =>
                        a.slot_number === slot.slot &&
                        (a.status === 'pending' || a.status === 'confirmed')
                      ) : null

                      return (
                        <div
                          key={slot.slot}
                          className={`list-group-item ${!isAvailable ? 'list-group-item-secondary' : isSelected ? 'list-group-item-primary' : ''}`}
                        >
                          <div className="d-flex align-items-center">
                            <div className="form-check me-3">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={`slot-${slot.slot}`}
                                checked={isSelected}
                                onChange={() => handleToggleSlotSelection(slot.slot)}
                                disabled={!isAvailable || sendingOffer}
                              />
                            </div>
                            <label
                              className="flex-grow-1 w-100"
                              htmlFor={`slot-${slot.slot}`}
                              style={{ cursor: isAvailable ? 'pointer' : 'not-allowed' }}
                            >
                              <div className="d-flex justify-content-between align-items-center">
                                <div>
                                  <div className="fw-bold">
                                    枠 {slot.slot}: {slot.start_time} 〜 {slot.end_time}
                                    <span className="badge bg-secondary ms-2">{slot.duration}分</span>
                                  </div>
                                  {!isAvailable && assignedStaff && (
                                    <small className="text-danger">
                                      <i className="bi bi-x-circle me-1"></i>
                                      {assignedStaff.staff_name} に依頼中
                                    </small>
                                  )}
                                </div>
                                {isAvailable ? (
                                  <span className="badge bg-success">依頼可能</span>
                                ) : (
                                  <span className="badge bg-danger">依頼不可</span>
                                )}
                              </div>
                            </label>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowSlotModal(false)
                    setSelectedSlotNumbers([])
                    setShowStaffModal(true)
                  }}
                  disabled={sendingOffer}
                >
                  <i className="bi bi-arrow-left me-2"></i>
                  戻る
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setShowSlotModal(false)
                    setSelectedStaffId(null)
                    setSelectedSlotNumbers([])
                  }}
                  disabled={sendingOffer}
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSendOfferWithSlots}
                  disabled={sendingOffer || selectedSlotNumbers.length === 0}
                >
                  {sendingOffer ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      送信中...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-send me-2"></i>
                      選択した枠にオファー送信 ({selectedSlotNumbers.length}個)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
