'use client'

import React, { useState, useEffect } from 'react'
import PageHeader from '@/components/common/PageHeader'
import { useAuth } from '@/lib/auth/AuthContext'
import { attendanceApi, assignmentsApi, Attendance, Assignment } from '@/lib/api'

export default function StaffAttendancePage() {
  const { user } = useAuth()
  const [todayAssignments, setTodayAssignments] = useState<Assignment[]>([])
  const [attendanceHistory, setAttendanceHistory] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // 完了報告モーダル用
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [selectedAttendanceId, setSelectedAttendanceId] = useState<number | null>(null)
  const [completionReport, setCompletionReport] = useState('')

  // 修正申請モーダル用
  const [showCorrectionModal, setShowCorrectionModal] = useState(false)
  const [correctionAttendanceId, setCorrectionAttendanceId] = useState<number | null>(null)
  const [correctionReason, setCorrectionReason] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return

      try {
        setLoading(true)
        setError(null)

        // 今日の日付を取得
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayString = today.toISOString().split('T')[0]

        // 自分のアサインメントを取得（user_idから自動的にstaff_idを解決）
        const assignments = await assignmentsApi.getMyAssignments()
        
        // 今日の確定済みアサインメントのみをフィルタ
        const todayConfirmed = assignments.filter(a => {
          if (a.status !== 'confirmed') return false
          if (!a.reservation?.reservation_date) return false
          
          const reservationDate = new Date(a.reservation.reservation_date.replace(/\//g, '-'))
          reservationDate.setHours(0, 0, 0, 0)
          
          return reservationDate.getTime() === today.getTime()
        })
        setTodayAssignments(todayConfirmed)

        // アサインメントの最初のスタッフIDを使用して勤怠履歴を取得
        if (assignments.length > 0 && assignments[0].staff_id) {
          const history = await attendanceApi.getStaffAttendance(assignments[0].staff_id)
          setAttendanceHistory(history)
        }

      } catch (err) {
        const errorMessage = err instanceof Error 
          ? err.message 
          : typeof err === 'object' && err !== null 
            ? JSON.stringify(err) 
            : 'データの取得に失敗しました'
        setError(errorMessage)
        console.error('勤怠データ取得エラー:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user?.id])

  // 出勤打刻
  const handleCheckIn = async (assignment: Assignment) => {
    if (!assignment.reservation_id || !assignment.id) {
      alert('予約情報が不足しています')
      return
    }

    try {
      setActionLoading(true)
      await attendanceApi.checkIn({
        assignment_id: assignment.id,
        reservation_id: assignment.reservation_id,
        location: undefined, // 位置情報は今回省略
      })
      alert('出勤打刻が完了しました')
      // データを再取得
      window.location.reload()
    } catch (err) {
      alert('出勤打刻に失敗しました: ' + (err instanceof Error ? err.message : ''))
    } finally {
      setActionLoading(false)
    }
  }

  // 退勤打刻
  const handleCheckOut = async (attendance: Attendance) => {
    try {
      setActionLoading(true)
      await attendanceApi.checkOut({
        attendance_id: attendance.id,
        location: undefined,
      })
      alert('退勤打刻が完了しました')
      // 完了報告モーダルを開く
      setSelectedAttendanceId(attendance.id)
      setShowCompletionModal(true)
      setActionLoading(false)
    } catch (err) {
      alert('退勤打刻に失敗しました: ' + (err instanceof Error ? err.message : ''))
      setActionLoading(false)
    }
  }

  // 完了報告送信
  const handleSubmitCompletion = async () => {
    if (!selectedAttendanceId || !completionReport.trim()) {
      alert('完了報告を入力してください')
      return
    }

    try {
      setActionLoading(true)
      await attendanceApi.complete({
        attendance_id: selectedAttendanceId,
        report: completionReport,
        photos: undefined,
      })
      alert('完了報告を送信しました')
      setShowCompletionModal(false)
      setCompletionReport('')
      window.location.reload()
    } catch (err) {
      alert('完了報告の送信に失敗しました: ' + (err instanceof Error ? err.message : ''))
    } finally {
      setActionLoading(false)
    }
  }

  // 修正申請送信
  const handleSubmitCorrection = async () => {
    if (!correctionAttendanceId || !correctionReason.trim()) {
      alert('修正理由を入力してください')
      return
    }

    try {
      setActionLoading(true)
      await attendanceApi.requestCorrection({
        attendance_id: correctionAttendanceId,
        reason: correctionReason,
      })
      alert('修正申請を送信しました')
      setShowCorrectionModal(false)
      setCorrectionReason('')
      window.location.reload()
    } catch (err) {
      alert('修正申請の送信に失敗しました: ' + (err instanceof Error ? err.message : ''))
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-secondary',
      in_progress: 'bg-primary',
      completed: 'bg-success',
      correction_requested: 'bg-warning',
      corrected: 'bg-info',
    }
    const labels = {
      pending: '未出勤',
      in_progress: '勤務中',
      completed: '完了',
      correction_requested: '修正申請中',
      corrected: '修正済み',
    }
    return <span className={`badge ${badges[status as keyof typeof badges] || 'bg-secondary'}`}>
      {labels[status as keyof typeof labels] || status}
    </span>
  }

  if (loading) {
    return (
      <>
        <PageHeader
          title="勤怠管理"
          breadcrumbs={[
            { label: 'ダッシュボード', href: '/staff/dashboard' },
            { label: '勤怠管理' }
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

  if (error) {
    return (
      <>
        <PageHeader
          title="勤怠管理"
          breadcrumbs={[
            { label: 'ダッシュボード', href: '/staff/dashboard' },
            { label: '勤怠管理' }
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
        title="勤怠管理"
        breadcrumbs={[
          { label: 'ダッシュボード', href: '/staff/dashboard' },
          { label: '勤怠管理' }
        ]}
      />

      {/* 今日の勤務 */}
      <div className="card mb-4">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">
            <i className="bi bi-calendar-check me-2"></i>
            今日の勤務
          </h5>
        </div>
        <div className="card-body">
          {todayAssignments.length > 0 ? (
            <div className="row g-3">
              {todayAssignments.map((assignment) => {
                const attendance = attendanceHistory.find(a => a.assignment_id === assignment.id)
                return (
                  <div key={assignment.id} className="col-12 col-md-6">
                    <div className="card border-primary">
                      <div className="card-body">
                        <h6 className="card-title">{assignment.reservation?.company_name || '不明な企業'}</h6>
                        <div className="mb-2">
                          <small className="text-muted">
                            <i className="bi bi-building me-1"></i>
                            {assignment.reservation?.office_name}
                          </small>
                        </div>
                        <div className="mb-2">
                          <small className="text-muted">
                            <i className="bi bi-clock me-1"></i>
                            {assignment.reservation?.start_time} 〜 {assignment.reservation?.end_time}
                          </small>
                        </div>
                        {assignment.slot_number && (
                          <div className="mb-2">
                            <span className="badge bg-info">枠{assignment.slot_number}</span>
                          </div>
                        )}
                        
                        {!attendance && (
                          <button
                            className="btn btn-success w-100 btn-lg"
                            onClick={() => handleCheckIn(assignment)}
                            disabled={actionLoading}
                          >
                            <i className="bi bi-box-arrow-in-right me-2"></i>
                            出勤打刻
                          </button>
                        )}

                        {attendance && attendance.status === 'in_progress' && !attendance.clock_out_time && (
                          <>
                            <div className="alert alert-info mb-2">
                              <small>
                                <i className="bi bi-clock-history me-1"></i>
                                出勤時刻: {attendance.clock_in_time ? new Date(attendance.clock_in_time).toLocaleTimeString('ja-JP') : '-'}
                              </small>
                            </div>
                            <button
                              className="btn btn-warning w-100 btn-lg"
                              onClick={() => handleCheckOut(attendance)}
                              disabled={actionLoading}
                            >
                              <i className="bi bi-box-arrow-left me-2"></i>
                              退勤打刻
                            </button>
                          </>
                        )}

                        {attendance && attendance.clock_out_time && attendance.status !== 'completed' && (
                          <>
                            <div className="alert alert-warning mb-2">
                              <small>
                                <i className="bi bi-exclamation-triangle me-1"></i>
                                完了報告が未提出です
                              </small>
                            </div>
                            <button
                              className="btn btn-primary w-100"
                              onClick={() => {
                                setSelectedAttendanceId(attendance.id)
                                setShowCompletionModal(true)
                              }}
                            >
                              <i className="bi bi-file-earmark-text me-2"></i>
                              完了報告
                            </button>
                          </>
                        )}

                        {attendance && attendance.status === 'completed' && (
                          <div className="alert alert-success mb-0">
                            <i className="bi bi-check-circle me-1"></i>
                            完了報告済み
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="alert alert-info text-center">
              <i className="bi bi-info-circle me-2"></i>
              今日の勤務予定はありません
            </div>
          )}
        </div>
      </div>

      {/* 勤怠履歴 */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="bi bi-clock-history me-2"></i>
            勤怠履歴
          </h5>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>日付</th>
                  <th>出勤</th>
                  <th>退勤</th>
                  <th>実働時間</th>
                  <th>ステータス</th>
                  <th>アクション</th>
                </tr>
              </thead>
              <tbody>
                {attendanceHistory.length > 0 ? (
                  attendanceHistory.map((attendance) => (
                    <tr key={attendance.id}>
                      <td>{attendance.work_date}</td>
                      <td>
                        {attendance.clock_in_time ? new Date(attendance.clock_in_time).toLocaleTimeString('ja-JP') : '-'}
                      </td>
                      <td>
                        {attendance.clock_out_time ? new Date(attendance.clock_out_time).toLocaleTimeString('ja-JP') : '-'}
                      </td>
                      <td>{attendance.work_hours ? `${attendance.work_hours}分` : '-'}</td>
                      <td>{getStatusBadge(attendance.status)}</td>
                      <td>
                        {attendance.status === 'completed' && !attendance.correction_requested && (
                          <button
                            className="btn btn-sm btn-outline-warning"
                            onClick={() => {
                              setCorrectionAttendanceId(attendance.id)
                              setShowCorrectionModal(true)
                            }}
                          >
                            <i className="bi bi-pencil-square me-1"></i>
                            修正申請
                          </button>
                        )}
                        {attendance.correction_requested && (
                          <span className="text-warning">
                            <i className="bi bi-hourglass-split me-1"></i>
                            申請中
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center text-muted py-4">
                      勤怠履歴がありません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 完了報告モーダル */}
      {showCompletionModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">完了報告</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowCompletionModal(false)
                    setCompletionReport('')
                  }}
                  disabled={actionLoading}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">報告内容 *</label>
                  <textarea
                    className="form-control"
                    rows={5}
                    value={completionReport}
                    onChange={(e) => setCompletionReport(e.target.value)}
                    placeholder="施術内容、気づいた点などを入力してください"
                    disabled={actionLoading}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCompletionModal(false)
                    setCompletionReport('')
                  }}
                  disabled={actionLoading}
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSubmitCompletion}
                  disabled={actionLoading || !completionReport.trim()}
                >
                  {actionLoading ? '送信中...' : '送信'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 修正申請モーダル */}
      {showCorrectionModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">修正申請</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowCorrectionModal(false)
                    setCorrectionReason('')
                  }}
                  disabled={actionLoading}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">修正理由 *</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    value={correctionReason}
                    onChange={(e) => setCorrectionReason(e.target.value)}
                    placeholder="修正が必要な理由を入力してください"
                    disabled={actionLoading}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCorrectionModal(false)
                    setCorrectionReason('')
                  }}
                  disabled={actionLoading}
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  className="btn btn-warning"
                  onClick={handleSubmitCorrection}
                  disabled={actionLoading || !correctionReason.trim()}
                >
                  {actionLoading ? '送信中...' : '申請'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

