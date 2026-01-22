'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import PageHeader from '@/components/common/PageHeader'
import { reservationsApi, Reservation } from '@/lib/api'
import { useAuth } from '@/lib/auth/AuthContext'

export default function CompanyEvaluationsPage() {
  const { user } = useAuth()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'completed' | 'evaluated' | 'all'>('completed')

  // 完了済みの予約を取得
  const fetchReservations = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await reservationsApi.getAll()
      
      // 完了済みまたは評価済みの予約のみ
      const filteredData = data.filter(r => 
        r.status === 'completed' || r.status === 'evaluated'
      )
      
      setReservations(filteredData)
    } catch (err: any) {
      setError(err.message || '予約データの取得に失敗しました')
      console.error('予約取得エラー:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReservations()
  }, [])

  // フィルター適用
  const filteredReservations = reservations.filter(r => {
    if (filter === 'completed') return r.status === 'completed'
    if (filter === 'evaluated') return r.status === 'evaluated'
    return true
  })

  // ローディング表示
  if (loading) {
    return (
      <>
        <PageHeader
          title="評価入力"
          breadcrumbs={[
            { label: 'ダッシュボード', href: '/company/dashboard' },
            { label: '評価入力' }
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

  return (
    <>
      <PageHeader
        title="評価入力"
        breadcrumbs={[
          { label: 'ダッシュボード', href: '/company/dashboard' },
          { label: '評価入力' }
        ]}
      />

      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      {/* フィルター */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="btn-group" role="group">
            <button
              type="button"
              className={`btn ${filter === 'completed' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilter('completed')}
            >
              <i className="bi bi-clock-history me-2"></i>
              評価待ち ({reservations.filter(r => r.status === 'completed').length})
            </button>
            <button
              type="button"
              className={`btn ${filter === 'evaluated' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilter('evaluated')}
            >
              <i className="bi bi-check-circle me-2"></i>
              評価済み ({reservations.filter(r => r.status === 'evaluated').length})
            </button>
            <button
              type="button"
              className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilter('all')}
            >
              すべて ({reservations.length})
            </button>
          </div>
        </div>
      </div>

      {/* 予約一覧 */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">
            {filter === 'completed' && '評価待ちの予約'}
            {filter === 'evaluated' && '評価済みの予約'}
            {filter === 'all' && '全ての予約'}
            ({filteredReservations.length}件)
          </h5>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>実施事業所</th>
                  <th>実施日時</th>
                  <th>スタッフ</th>
                  <th>社員</th>
                  <th>ステータス</th>
                  <th>アクション</th>
                </tr>
              </thead>
              <tbody>
                {filteredReservations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-5 text-muted">
                      <i className="bi bi-inbox fs-1"></i>
                      <p className="mt-3">
                        {filter === 'completed' && '評価待ちの予約がありません'}
                        {filter === 'evaluated' && '評価済みの予約がありません'}
                        {filter === 'all' && '予約がありません'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredReservations.map((reservation) => (
                    <tr key={reservation.id}>
                      <td className="fw-bold">{reservation.id}</td>
                      <td>
                        <div>{reservation.office_name}</div>
                        <small className="text-muted">{reservation.office_address}</small>
                      </td>
                      <td>
                        <div>{reservation.reservation_date}</div>
                        <small className="text-muted">
                          {reservation.start_time} 〜 {reservation.end_time}
                        </small>
                      </td>
                      <td>{reservation.staff_names || '未定'}</td>
                      <td>{reservation.employee_names || '未定'}</td>
                      <td>
                        {reservation.status === 'completed' ? (
                          <span className="badge bg-warning">
                            <i className="bi bi-clock-history me-1"></i>
                            評価待ち
                          </span>
                        ) : (
                          <span className="badge bg-success">
                            <i className="bi bi-check-circle me-1"></i>
                            評価済み
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          {reservation.status === 'completed' ? (
                            <Link
                              href={`/company/evaluations/${reservation.id}`}
                              className="btn btn-primary"
                            >
                              <i className="bi bi-star me-1"></i>
                              評価入力
                            </Link>
                          ) : (
                            <Link
                              href={`/company/evaluations/${reservation.id}`}
                              className="btn btn-outline-secondary"
                            >
                              <i className="bi bi-eye me-1"></i>
                              評価確認
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}

