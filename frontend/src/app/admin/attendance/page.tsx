'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import PageHeader from '@/components/common/PageHeader'
import { attendanceApi, staffApi, Attendance, Staff } from '@/lib/api'

export default function AdminAttendancePage() {
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStaffId, setSelectedStaffId] = useState<number>(0)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // 全スタッフを取得
        const staffData = await staffApi.getAll()
        setStaff(staffData)

        // デフォルトで全員の勤怠を表示（または最初のスタッフ）
        if (staffData.length > 0 && selectedStaffId === 0) {
          // 全スタッフの勤怠を取得するには、各スタッフごとにAPIを呼ぶ必要がある
          // 今回は簡易的に最初のスタッフのみ
          const attendanceData = await attendanceApi.getStaffAttendance(staffData[0].id)
          setAttendances(attendanceData)
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'データの取得に失敗しました')
        console.error('勤怠データ取得エラー:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // スタッフ選択時
  useEffect(() => {
    if (selectedStaffId > 0) {
      const fetchStaffAttendance = async () => {
        try {
          setLoading(true)
          const attendanceData = await attendanceApi.getStaffAttendance(selectedStaffId)
          setAttendances(attendanceData)
        } catch (err) {
          setError(err instanceof Error ? err.message : '勤怠データの取得に失敗しました')
        } finally {
          setLoading(false)
        }
      }
      fetchStaffAttendance()
    }
  }, [selectedStaffId])

  const handleApproveCorrection = async (attendanceId: number) => {
    if (!confirm('この修正申請を承認しますか？')) {
      return
    }

    try {
      await attendanceApi.approveCorrection(attendanceId)
      alert('修正申請を承認しました')
      // データを再取得
      if (selectedStaffId > 0) {
        const attendanceData = await attendanceApi.getStaffAttendance(selectedStaffId)
        setAttendances(attendanceData)
      }
    } catch (err) {
      alert('承認に失敗しました: ' + (err instanceof Error ? err.message : ''))
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

  const filteredAttendances = attendances.filter(a => {
    if (statusFilter === 'all') return true
    return a.status === statusFilter
  })

  if (loading && attendances.length === 0) {
    return (
      <>
        <PageHeader
          title="勤怠管理"
          breadcrumbs={[
            { label: 'ダッシュボード', href: '/admin/dashboard' },
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
            { label: 'ダッシュボード', href: '/admin/dashboard' },
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
          { label: 'ダッシュボード', href: '/admin/dashboard' },
          { label: '勤怠管理' }
        ]}
      />

      {/* フィルター */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-center">
            <div className="col-md-6">
              <label className="form-label">スタッフ選択</label>
              <select
                className="form-select"
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(parseInt(e.target.value))}
              >
                <option value={0}>スタッフを選択...</option>
                {staff.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">ステータス</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">すべて</option>
                <option value="pending">未出勤</option>
                <option value="in_progress">勤務中</option>
                <option value="completed">完了</option>
                <option value="correction_requested">修正申請中</option>
                <option value="corrected">修正済み</option>
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">&nbsp;</label>
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => {
                  if (selectedStaffId > 0) {
                    attendanceApi.getStaffAttendance(selectedStaffId).then(setAttendances)
                  }
                }}
              >
                <i className="bi bi-arrow-clockwise me-1"></i>
                更新
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 修正申請一覧 */}
      {attendances.filter(a => a.correction_requested && a.status === 'correction_requested').length > 0 && (
        <div className="card mb-4 border-warning">
          <div className="card-header bg-warning text-dark">
            <h5 className="mb-0">
              <i className="bi bi-exclamation-triangle me-2"></i>
              修正申請 ({attendances.filter(a => a.correction_requested && a.status === 'correction_requested').length}件)
            </h5>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>日付</th>
                    <th>スタッフ</th>
                    <th>出勤</th>
                    <th>退勤</th>
                    <th>実働時間</th>
                    <th>修正理由</th>
                    <th>アクション</th>
                  </tr>
                </thead>
                <tbody>
                  {attendances
                    .filter(a => a.correction_requested && a.status === 'correction_requested')
                    .map((attendance) => (
                      <tr key={attendance.id}>
                        <td>{attendance.work_date}</td>
                        <td>{attendance.staff_name}</td>
                        <td>
                          {attendance.clock_in_time ? new Date(attendance.clock_in_time).toLocaleTimeString('ja-JP') : '-'}
                        </td>
                        <td>
                          {attendance.clock_out_time ? new Date(attendance.clock_out_time).toLocaleTimeString('ja-JP') : '-'}
                        </td>
                        <td>{attendance.work_hours ? `${attendance.work_hours}分` : '-'}</td>
                        <td>
                          <small>{attendance.correction_reason}</small>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleApproveCorrection(attendance.id)}
                          >
                            <i className="bi bi-check-circle me-1"></i>
                            承認
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 勤怠一覧 */}
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
                  <th>スタッフ</th>
                  <th>出勤</th>
                  <th>退勤</th>
                  <th>実働時間</th>
                  <th>ステータス</th>
                  <th>完了報告</th>
                  <th>遅刻/早退</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendances.length > 0 ? (
                  filteredAttendances.map((attendance) => (
                    <tr key={attendance.id}>
                      <td>{attendance.work_date}</td>
                      <td>{attendance.staff_name}</td>
                      <td>
                        {attendance.clock_in_time ? new Date(attendance.clock_in_time).toLocaleTimeString('ja-JP') : '-'}
                      </td>
                      <td>
                        {attendance.clock_out_time ? new Date(attendance.clock_out_time).toLocaleTimeString('ja-JP') : '-'}
                      </td>
                      <td>{attendance.work_hours ? `${attendance.work_hours}分` : '-'}</td>
                      <td>{getStatusBadge(attendance.status)}</td>
                      <td>
                        {attendance.completion_report ? (
                          <span className="text-success">
                            <i className="bi bi-check-circle"></i> あり
                          </span>
                        ) : (
                          <span className="text-muted">なし</span>
                        )}
                      </td>
                      <td>
                        {attendance.is_late && <span className="badge bg-warning me-1">遅刻</span>}
                        {attendance.is_early_leave && <span className="badge bg-info">早退</span>}
                        {!attendance.is_late && !attendance.is_early_leave && (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center text-muted py-4">
                      {selectedStaffId === 0 ? 'スタッフを選択してください' : '勤怠データがありません'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
