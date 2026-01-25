'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import PageHeader from '@/components/common/PageHeader'
import { Reservation, reservationsApi, assignmentsApi, getAdminStatusLabel, getStatusBadgeClass, companiesApi } from '@/lib/api'

interface ReservationWithDetails extends Reservation {
  available_slots?: number // 空き枠
  assigned_count?: number // アサイン済み人数
  confirmed_count?: number // 確定済み人数
  pending_count?: number // 回答待ち人数
  company_name?: string // 企業名（フロント用）
  employee_filled_count?: number // 従業員が埋まっている枠数
}

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<ReservationWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  
  // データ取得
  const fetchReservations = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 予約と企業データを並行取得
      const [reservationsData, companiesData] = await Promise.all([
        reservationsApi.getAll(),
        companiesApi.getAll()
      ])
      
      // 企業IDから企業名へのマップを作成
      const companyMap = new Map(companiesData.map(c => [c.id, c.company_name]))
      
      // 各予約のアサイン情報と企業名を取得
      const reservationsWithDetails = await Promise.all(
        reservationsData.map(async (reservation) => {
          try {
            const assignments = await assignmentsApi.getReservationAssignments(reservation.id)
            const confirmedCount = assignments.filter(a => a.status === 'confirmed').length
            const pendingCount = assignments.filter(a => a.status === 'pending').length
            const assignedCount = confirmedCount + pendingCount
            const totalSlots = reservation.slot_count || reservation.max_participants || 1
            const availableSlots = totalSlots - assignedCount
            
            // 従業員の埋まり具合を計算
            // employee_id、employee_name、is_filledのいずれかがあれば予約済みと判定
            // （社員マスタから割り当て: employee_idあり、社員が直接登録: employee_nameあり）
            let employeeFilledCount = 0
            if (reservation.time_slots && Array.isArray(reservation.time_slots)) {
              employeeFilledCount = reservation.time_slots.filter((slot: any) => 
                slot.is_filled || slot.employee_name || (slot.employee_id !== null && slot.employee_id !== undefined)
              ).length
            }
            
            return {
              ...reservation,
              available_slots: availableSlots,
              assigned_count: assignedCount,
              confirmed_count: confirmedCount,
              pending_count: pendingCount,
              employee_filled_count: employeeFilledCount,
              company_name: companyMap.get(reservation.company_id) || '不明'
            }
          } catch (err) {
            // アサイン情報取得失敗時は全枠空きとする
            const totalSlots = reservation.slot_count || reservation.max_participants || 1
            
            // 従業員の埋まり具合を計算
            // employee_id、employee_name、is_filledのいずれかがあれば予約済みと判定
            // （社員マスタから割り当て: employee_idあり、社員が直接登録: employee_nameあり）
            let employeeFilledCount = 0
            if (reservation.time_slots && Array.isArray(reservation.time_slots)) {
              employeeFilledCount = reservation.time_slots.filter((slot: any) => 
                slot.is_filled || slot.employee_name || (slot.employee_id !== null && slot.employee_id !== undefined)
              ).length
            }
            
            return {
              ...reservation,
              available_slots: totalSlots,
              assigned_count: 0,
              confirmed_count: 0,
              pending_count: 0,
              employee_filled_count: employeeFilledCount,
              company_name: companyMap.get(reservation.company_id) || '不明'
            }
          }
        })
      )
      
      setReservations(reservationsWithDetails)
    } catch (err) {
      setError(err instanceof Error ? err.message : '予約データの取得に失敗しました')
      console.error('予約データ取得エラー:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReservations()
  }, [])
  
  const filteredReservations = reservations.filter(reservation => {
    const matchesSearch = 
      reservation.office_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || reservation.status === statusFilter
    return matchesSearch && matchesStatus
  })
  
  // ローディング表示
  if (loading) {
    return (
      <>
        <PageHeader 
          title="予約管理" 
          breadcrumbs={[
            { label: 'ダッシュボード', href: '/admin/dashboard' },
            { label: '予約管理' }
          ]}
          action={
            <Link href="/admin/reservations/new" className="btn btn-primary">
              <i className="bi bi-plus-circle me-2"></i>
              新規予約
            </Link>
          }
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
          title="予約管理" 
          breadcrumbs={[
            { label: 'ダッシュボード', href: '/admin/dashboard' },
            { label: '予約管理' }
          ]}
        />
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      </>
    )
  }
  
  return (
    <>
      <PageHeader 
        title="予約管理" 
        breadcrumbs={[
          { label: 'ダッシュボード', href: '/admin/dashboard' },
          { label: '予約管理' }
        ]}
        action={
          <Link href="/admin/reservations/new" className="btn btn-primary">
            <i className="bi bi-plus-circle me-2"></i>
            新規予約
          </Link>
        }
      />
      
      {/* 検索とフィルタ */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <input
                type="text"
                className="form-control"
                placeholder="企業名・事業所名で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">全てのステータス</option>
                <option value="recruiting">募集中</option>
                <option value="assigning">スタッフアサイン中</option>
                <option value="confirmed">確定済み</option>
                <option value="service_completed">施術完了</option>
                <option value="evaluated">評価取得完了</option>
                <option value="closed">終了</option>
                <option value="cancelled">キャンセル</option>
              </select>
            </div>
            <div className="col-md-2">
              <button 
                className="btn btn-outline-secondary w-100"
                onClick={fetchReservations}
              >
                <i className="bi bi-arrow-clockwise me-1"></i>
                更新
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* 予約一覧テーブル */}
      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '60px' }}>ID</th>
                  <th>企業名</th>
                  <th>事業所</th>
                  <th>予約日時</th>
                  <th style={{ width: '100px' }}>時給</th>
                  <th style={{ width: '80px' }}>枠数</th>
                  <th style={{ width: '200px' }}>従業員アサイン</th>
                  <th style={{ width: '220px' }}>スタッフアサイン</th>
                  <th style={{ width: '120px' }}>ステータス</th>
                  <th style={{ width: '150px' }}>アクション</th>
                </tr>
              </thead>
              <tbody>
                {filteredReservations.map((reservation) => {
                  return (
                    <tr key={reservation.id}>
                      <td className="fw-bold">{reservation.id}</td>
                      <td>{reservation.company_name}</td>
                      <td>
                        <div>{reservation.office_name}</div>
                        <small className="text-muted">{reservation.office_address}</small>
                      </td>
                      <td>
                        <div>{reservation.reservation_date}</div>
                        <small className="text-muted">{reservation.start_time}〜{reservation.end_time}</small>
                        {reservation.application_deadline && (
                          <div className="mt-1">
                            <small className="badge bg-warning text-dark">
                              <i className="bi bi-hourglass-split me-1"></i>
                              {reservation.application_deadline}
                            </small>
                          </div>
                        )}
                      </td>
                      <td>
                        {reservation.hourly_rate ? (
                          <span className="text-success fw-bold">¥{reservation.hourly_rate.toLocaleString()}/h</span>
                        ) : (
                          <small className="text-secondary">-</small>
                        )}
                      </td>
                      <td>
                        <div className="text-center">
                          <div className="fw-bold fs-5">
                            {reservation.slot_count || reservation.max_participants || 1}
                          </div>
                          <small className="text-muted">枠</small>
                        </div>
                      </td>
                      <td>
                        {(() => {
                          const totalSlots = reservation.slot_count || reservation.max_participants || 1
                          const employeeFilledCount = reservation.employee_filled_count || 0
                          const employeeFilledPercent = (employeeFilledCount / totalSlots) * 100
                          const isFull = employeeFilledCount >= totalSlots
                          
                          return (
                            <div>
                              {/* プログレスバー */}
                              <div className="progress mb-2" style={{ height: '20px' }}>
                                {employeeFilledCount > 0 && (
                                  <div 
                                    className={`progress-bar ${isFull ? 'bg-success' : 'bg-primary'}`}
                                    style={{ width: `${employeeFilledPercent}%` }}
                                    title={`従業員: ${employeeFilledCount}/${totalSlots}枠`}
                                  >
                                    {employeeFilledCount > 0 && `${employeeFilledCount}/${totalSlots}`}
                                  </div>
                                )}
                              </div>
                              
                              {/* 詳細情報 */}
                              <div className="text-center small">
                                <span className={`badge ${isFull ? 'bg-success' : 'bg-primary'}`}>
                                  {employeeFilledCount}/{totalSlots}枠
                                </span>
                                {isFull && (
                                  <span className="text-success ms-2">
                                    <i className="bi bi-check-circle-fill"></i> 満席
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        })()}
                      </td>
                      <td>
                        {(() => {
                          const totalSlots = reservation.slot_count || reservation.max_participants || 1
                          const confirmedCount = reservation.confirmed_count || 0
                          const pendingCount = reservation.pending_count || 0
                          const confirmedPercent = (confirmedCount / totalSlots) * 100
                          const pendingPercent = (pendingCount / totalSlots) * 100
                          const isOverLimit = confirmedCount > totalSlots
                          
                          return (
                            <div>
                              {/* プログレスバー */}
                              <div className="progress mb-2" style={{ height: '20px' }}>
                                {confirmedCount > 0 && (
                                  <div 
                                    className={`progress-bar ${isOverLimit ? 'bg-danger' : 'bg-success'}`}
                                    style={{ width: `${Math.min(confirmedPercent, 100)}%` }}
                                    title={`確定: ${confirmedCount}人`}
                                  >
                                    {confirmedCount > 0 && confirmedCount}
                                  </div>
                                )}
                                {pendingCount > 0 && (
                                  <div 
                                    className="progress-bar bg-warning" 
                                    style={{ width: `${Math.min(pendingPercent, 100 - confirmedPercent)}%` }}
                                    title={`オファー中: ${pendingCount}人`}
                                  >
                                    {pendingCount > 0 && pendingCount}
                                  </div>
                                )}
                              </div>
                              
                              {/* 詳細情報 */}
                              <div className="small">
                                <div className="d-flex justify-content-between align-items-center">
                                  <span>
                                    {pendingCount > 0 && (
                                      <span className="text-warning me-2">
                                        <i className="bi bi-clock me-1"></i>
                                        オファー中: {pendingCount}人
                                      </span>
                                    )}
                                  </span>
                                </div>
                                <div className={`d-flex justify-content-between align-items-center ${isOverLimit ? 'mt-1' : ''}`}>
                                  <span className={isOverLimit ? 'text-danger fw-bold' : 'text-success'}>
                                    <i className={`bi bi-${isOverLimit ? 'exclamation-triangle-fill' : 'check-circle'} me-1`}></i>
                                    確定数: {confirmedCount}人
                                    {isOverLimit && (
                                      <span className="badge bg-danger ms-2">
                                        <i className="bi bi-exclamation-triangle me-1"></i>
                                        上限超過
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )
                        })()}
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(reservation.status)}`}>
                          {getAdminStatusLabel(reservation.status)}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <Link 
                            href={`/admin/reservations/${reservation.id}`} 
                            className="btn btn-outline-primary"
                            title="詳細"
                          >
                            <i className="bi bi-eye"></i>
                          </Link>
                          <Link 
                            href={`/admin/reservations/${reservation.id}/edit`} 
                            className="btn btn-outline-secondary"
                            title="編集"
                          >
                            <i className="bi bi-pencil"></i>
                          </Link>
                          {reservation.status === 'recruiting' && (
                            <Link 
                              href={`/admin/reservations/${reservation.id}`}
                              className="btn btn-outline-success"
                              title="スタッフをアサイン"
                            >
                              <i className="bi bi-person-plus"></i>
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            
            {filteredReservations.length === 0 && (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                <p>予約が見つかりませんでした</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
