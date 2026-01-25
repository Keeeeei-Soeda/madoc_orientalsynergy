'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import PageHeader from '@/components/common/PageHeader'
import { Reservation, reservationsApi, assignmentsApi, getCompanyStatusLabel, getStatusBadgeClass } from '@/lib/api'
import { useAuth } from '@/lib/auth/AuthContext'

interface ReservationWithAvailability extends Reservation {
  available_slots?: number // 空き枠
  assigned_count?: number // アサイン済み人数
}

export default function CompanyReservationsPage() {
  const { user } = useAuth()
  const [reservations, setReservations] = useState<ReservationWithAvailability[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  // データ取得
  const fetchReservations = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await reservationsApi.getAll()
      
      // 各予約の空き枠を計算（slots_filledとmax_participantsを使用）
      const reservationsWithAvailability = data.map((reservation) => {
        // slots_filledから予約済み枠数を取得
        const filledSlots = reservation.slots_filled || 0
        // max_participantsが募集人数（slot_countは時間枠の総数なので使用しない）
        const totalSlots = reservation.max_participants || 1
        const availableSlots = totalSlots - filledSlots
        
        return {
          ...reservation,
          available_slots: availableSlots,
          assigned_count: filledSlots
        }
      })
      
      setReservations(reservationsWithAvailability)
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
  
  const filteredReservations = reservations.filter(reservation =>
    reservation.office_name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  // ローディング表示
  if (loading) {
    return (
      <>
        <PageHeader 
          title="予約管理" 
          breadcrumbs={[
            { label: 'ダッシュボード', href: '/company/dashboard' },
            { label: '予約管理' }
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
          title="予約管理" 
          breadcrumbs={[
            { label: 'ダッシュボード', href: '/company/dashboard' },
            { label: '予約管理' }
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
        title="予約管理" 
        breadcrumbs={[
          { label: 'ダッシュボード', href: '/company/dashboard' },
          { label: '予約管理' }
        ]}
      />
      
      {/* 検索 */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="search-bar">
            <i className="bi bi-search search-icon"></i>
            <input 
              type="text" 
              className="form-control" 
              placeholder="事業所名で検索..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      {/* 予約一覧 */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">予約一覧 ({filteredReservations.length}件)</h5>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>実施事業所</th>
                  <th>事業所住所</th>
                  <th>訪問日付</th>
                  <th>募集人数/空き枠</th>
                  <th>社員</th>
                  <th>ステータス</th>
                  <th>アクション</th>
                </tr>
              </thead>
              <tbody>
                {filteredReservations.map((reservation) => {
                  return (
                    <tr key={reservation.id}>
                      <td className="fw-bold">{reservation.id}</td>
                      <td>{reservation.office_name}</td>
                      <td>
                        <small className="text-muted">{reservation.office_address}</small>
                      </td>
                      <td>
                        <div>{reservation.reservation_date}</div>
                        <small className="text-muted">{reservation.start_time}〜{reservation.end_time}</small>
                      </td>
                      <td>
                        <div>
                          <span className="fw-bold">{reservation.max_participants || 1}名</span>
                          {reservation.available_slots !== undefined && (
                            <>
                              <br />
                              <small className={`text-${reservation.available_slots > 0 ? 'success' : 'danger'}`}>
                                <i className={`bi bi-${reservation.available_slots > 0 ? 'check-circle' : 'x-circle'} me-1`}></i>
                                空き{reservation.available_slots}枠
                              </small>
                            </>
                          )}
                        </div>
                      </td>
                      <td>{reservation.employee_names || '未定'}</td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(reservation.status)}`}>
                          {getCompanyStatusLabel(reservation.status)}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          {(reservation.status === 'recruiting' || reservation.status === 'assigning') && (
                            <button className="btn btn-primary">
                              <i className="bi bi-megaphone me-1"></i>
                              募集
                            </button>
                          )}
                          <Link href={`/company/reservations/${reservation.id}`} className="btn btn-outline-success">
                            <i className="bi bi-eye me-1"></i>
                            確認
                          </Link>
                          {reservation.status === 'service_completed' && (
                            <Link href={`/company/evaluations/${reservation.id}`} className="btn btn-danger">
                              <i className="bi bi-star me-1"></i>
                              評価入力
                            </Link>
                          )}
                          {(reservation.status === 'evaluated' || reservation.status === 'closed') && (
                            <button className="btn btn-secondary" disabled>
                              <i className="bi bi-check-circle me-1"></i>
                              評価済み
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}

