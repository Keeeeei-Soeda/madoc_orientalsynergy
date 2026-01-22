'use client'

import React from 'react'
import PageHeader from '@/components/common/PageHeader'
import StatCard from '@/components/common/StatCard'
import Link from 'next/link'

// モックデータ
const statsData = [
  { title: '今月の予約数', value: 12, icon: 'bi-calendar-check', iconColor: 'primary', change: '+3 先月比', changeType: 'positive' as const },
  { title: '利用回数（累計）', value: 48, icon: 'bi-graph-up', iconColor: 'success' },
  { title: '今月の利用金額', value: '¥240,000', icon: 'bi-currency-yen', iconColor: 'info' },
  { title: '登録社員数', value: 25, icon: 'bi-people', iconColor: 'warning' },
]

const upcomingReservations = [
  { id: '22333', office: '梅田営業所', date: '2025/01/05', time: '15:00～17:00', staff: '山田花子', status: 'confirmed' },
  { id: '45566', office: '難波営業所', date: '2025/01/08', time: '10:00～12:00', staff: '佐藤美咲', status: 'confirmed' },
  { id: '63366', office: '梅田営業所', date: '2025/01/10', time: '14:00～16:00', staff: '未アサイン', status: 'pending' },
]

const recentEvaluations = [
  { staff: '山田花子', date: '2024-12-20', rating: 5, comment: 'とても丁寧な対応でした' },
  { staff: '佐藤美咲', date: '2024-12-18', rating: 5, comment: '素晴らしいサービスでした' },
]

export default function CompanyDashboardPage() {
  return (
    <>
      <PageHeader title="ダッシュボード" />
      
      {/* 統計カード */}
      <div className="row g-3 mb-4">
        {statsData.map((stat, index) => (
          <div key={index} className="col-12 col-sm-6 col-xl-3">
            <StatCard {...stat} />
          </div>
        ))}
      </div>
      
      <div className="row g-4">
        {/* 今後の予約 */}
        <div className="col-12 col-xl-8">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">今後の予約</h5>
              <Link href="/company/reservations" className="btn btn-sm btn-outline-primary">
                すべて表示
              </Link>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>事業所</th>
                      <th>日時</th>
                      <th>スタッフ</th>
                      <th>ステータス</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingReservations.map((reservation) => (
                      <tr key={reservation.id}>
                        <td className="fw-bold">#{reservation.id}</td>
                        <td>{reservation.office}</td>
                        <td>
                          <div>{reservation.date}</div>
                          <small className="text-muted">{reservation.time}</small>
                        </td>
                        <td>{reservation.staff}</td>
                        <td>
                          <span className={`badge bg-${reservation.status === 'pending' ? 'warning' : 'success'}`}>
                            {reservation.status === 'pending' ? '未確認' : '確定'}
                          </span>
                        </td>
                        <td>
                          <Link href={`/company/reservations/${reservation.id}`} className="btn btn-sm btn-outline-primary">
                            詳細
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        
        {/* 最近の評価 */}
        <div className="col-12 col-xl-4">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">最近の評価</h5>
              <Link href="/company/evaluations" className="btn btn-sm btn-outline-primary">
                すべて表示
              </Link>
            </div>
            <div className="card-body">
              <div className="d-flex flex-column gap-3">
                {recentEvaluations.map((evaluation, index) => (
                  <div key={index} className="border-bottom pb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="fw-bold">{evaluation.staff}</div>
                      <div>
                        {[...Array(evaluation.rating)].map((_, i) => (
                          <i key={i} className="bi bi-star-fill text-warning"></i>
                        ))}
                      </div>
                    </div>
                    <p className="text-muted small mb-1">{evaluation.comment}</p>
                    <small className="text-muted">{evaluation.date}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* クイックアクション */}
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">クイックアクション</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-6 col-md-6">
                  <Link href="/company/employees" className="btn btn-outline-success w-100">
                    <i className="bi bi-people me-2"></i>
                    社員管理
                  </Link>
                </div>
                <div className="col-6 col-md-6">
                  <Link href="/company/profile" className="btn btn-outline-secondary w-100">
                    <i className="bi bi-building me-2"></i>
                    企業情報
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

