'use client'

import React, { useState, useEffect } from 'react'
import PageHeader from '@/components/common/PageHeader'
import { useAuth } from '@/lib/auth/AuthContext'
import { ratingsApi, assignmentsApi, Rating } from '@/lib/api'

export default function StaffEvaluationsPage() {
  const { user } = useAuth()
  const [ratings, setRatings] = useState<Rating[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRating, setSelectedRating] = useState<Rating | null>(null)
  const [showCommentModal, setShowCommentModal] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return

      try {
        setLoading(true)
        setError(null)

        // まず自分のstaff_idを取得
        const assignments = await assignmentsApi.getMyAssignments()
        if (assignments.length === 0 || !assignments[0].staff_id) {
          setRatings([])
          setLoading(false)
          return
        }

        const staffId = assignments[0].staff_id

        // 企業側からの評価を取得
        const ratingsData = await ratingsApi.getAll({ staff_id: staffId })

        setRatings(ratingsData)

      } catch (err) {
        setError(err instanceof Error ? err.message : 'データの取得に失敗しました')
        console.error('評価データ取得エラー:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user?.id])

  const renderStars = (rating: number) => {
    return (
      <div className="d-inline-block">
        {[1, 2, 3, 4, 5].map(star => (
          <i
            key={star}
            className={`bi bi-star${star <= rating ? '-fill text-warning' : ' text-muted'}`}
          ></i>
        ))}
      </div>
    )
  }

  const handleShowComment = (rating: Rating) => {
    setSelectedRating(rating)
    setShowCommentModal(true)
  }

  if (loading) {
    return (
      <>
        <PageHeader
          title="評価一覧"
          breadcrumbs={[
            { label: 'ダッシュボード', href: '/staff/dashboard' },
            { label: '評価一覧' }
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
          title="評価一覧"
          breadcrumbs={[
            { label: 'ダッシュボード', href: '/staff/dashboard' },
            { label: '評価一覧' }
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
        title="評価一覧"
        breadcrumbs={[
          { label: 'ダッシュボード', href: '/staff/dashboard' },
          { label: '評価一覧' }
        ]}
      />

      {/* 評価一覧 */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="bi bi-star me-2"></i>
            評価履歴
          </h5>
        </div>
        <div className="card-body p-0">
          {ratings.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>日付</th>
                    <th>予約ID</th>
                    <th>清潔感</th>
                    <th>対応力</th>
                    <th>満足度</th>
                    <th>時間厳守</th>
                    <th>技術力</th>
                    <th>総合</th>
                    <th>コメント</th>
                  </tr>
                </thead>
                <tbody>
                  {ratings.map((rating) => (
                    <tr key={rating.id}>
                      <td>{new Date(rating.created_at).toLocaleDateString('ja-JP')}</td>
                      <td>#{rating.reservation_id}</td>
                      <td className="text-center">
                        <div className="badge bg-light text-dark">{rating.cleanliness}</div>
                      </td>
                      <td className="text-center">
                        <div className="badge bg-light text-dark">{rating.responsiveness}</div>
                      </td>
                      <td className="text-center">
                        <div className="badge bg-light text-dark">{rating.satisfaction}</div>
                      </td>
                      <td className="text-center">
                        <div className="badge bg-light text-dark">{rating.punctuality}</div>
                      </td>
                      <td className="text-center">
                        <div className="badge bg-light text-dark">{rating.skill}</div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <strong>{rating.average_rating.toFixed(1)}</strong>
                          <div className="text-warning" style={{ fontSize: '0.9rem' }}>
                            {renderStars(Math.round(rating.average_rating))}
                          </div>
                        </div>
                      </td>
                      <td>
                        {rating.comment ? (
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleShowComment(rating)}
                          >
                            <i className="bi bi-eye"></i> 表示
                          </button>
                        ) : (
                          <span className="text-muted">なし</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="alert alert-info m-3 text-center">
              <i className="bi bi-info-circle me-2"></i>
              まだ終了案件について評価を受け取っていません
            </div>
          )}
        </div>
      </div>

      {/* コメントモーダル */}
      {showCommentModal && selectedRating && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-chat-square-text me-2"></i>
                  企業からのコメント
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowCommentModal(false)
                    setSelectedRating(null)
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <strong>予約ID: #{selectedRating.reservation_id}</strong>
                    <span className="badge bg-warning text-dark">
                      {selectedRating.average_rating.toFixed(1)} {renderStars(Math.round(selectedRating.average_rating))}
                    </span>
                  </div>
                  <small className="text-muted">
                    {new Date(selectedRating.created_at).toLocaleString('ja-JP')}
                  </small>
                </div>

                <div className="mb-3">
                  <div className="row g-2">
                    <div className="col-6">
                      <div className="border rounded p-2 text-center">
                        <small className="text-muted d-block">清潔感</small>
                        <strong>{selectedRating.cleanliness}</strong>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="border rounded p-2 text-center">
                        <small className="text-muted d-block">対応力</small>
                        <strong>{selectedRating.responsiveness}</strong>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="border rounded p-2 text-center">
                        <small className="text-muted d-block">満足度</small>
                        <strong>{selectedRating.satisfaction}</strong>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="border rounded p-2 text-center">
                        <small className="text-muted d-block">時間厳守</small>
                        <strong>{selectedRating.punctuality}</strong>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="border rounded p-2 text-center">
                        <small className="text-muted d-block">技術力</small>
                        <strong>{selectedRating.skill}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="alert alert-light">
                  <strong className="d-block mb-2">コメント:</strong>
                  <p className="mb-0">{selectedRating.comment}</p>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCommentModal(false)
                    setSelectedRating(null)
                  }}
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

