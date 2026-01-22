'use client'

import React from 'react'
import PageHeader from '@/components/common/PageHeader'
import StatCard from '@/components/common/StatCard'

// モックデータ
const statsData = [
  { title: '企業数', value: 45, icon: 'bi-building', iconColor: 'primary', change: '+3 今月', changeType: 'positive' as const },
  { title: 'スタッフ数', value: 128, icon: 'bi-people', iconColor: 'success', change: '+12 今月', changeType: 'positive' as const },
  { title: '今月の予約数', value: 89, icon: 'bi-calendar-check', iconColor: 'info', change: '+15%', changeType: 'positive' as const },
  { title: '未確認予約', value: 7, icon: 'bi-exclamation-circle', iconColor: 'warning' },
]

const recentReservations = [
  { id: '22333', company: '株式会社サンプル', office: '梅田事業所', date: '2025/01/05', time: '15:00～17:00', status: 'pending', statusLabel: '未確認' },
  { id: '45566', company: 'ABC株式会社', office: '難波事業所', date: '2025/01/08', time: '10:00～12:00', status: 'confirmed', statusLabel: '確定' },
  { id: '63366', company: 'XYZ商事', office: '本社', date: '2025/01/10', time: '14:00～16:00', status: 'pending', statusLabel: '未確認' },
]

const recentActivities = [
  { user: '山田花子スタッフ', action: '出勤打刻', target: '株式会社サンプル - 梅田事業所', time: '10分前' },
  { user: '田中太郎管理者', action: 'スタッフアサイン', target: '予約 #45566', time: '30分前' },
  { user: '佐藤次郎企業', action: '予約作成', target: '難波事業所', time: '1時間前' },
  { user: '鈴木三郎スタッフ', action: '退勤打刻', target: 'ABC株式会社 - 本社', time: '2時間前' },
]

export default function DashboardPage() {
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
        {/* 今日の予約 */}
        <div className="col-12 col-xl-8">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">最近の予約</h5>
              <a href="/admin/reservations" className="btn btn-sm btn-outline-primary">
                すべて表示
              </a>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>企業</th>
                      <th>事業所</th>
                      <th>日時</th>
                      <th>ステータス</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentReservations.map((reservation) => (
                      <tr key={reservation.id}>
                        <td className="fw-bold">#{reservation.id}</td>
                        <td>{reservation.company}</td>
                        <td>{reservation.office}</td>
                        <td>
                          <div>{reservation.date}</div>
                          <small className="text-muted">{reservation.time}</small>
                        </td>
                        <td>
                          <span className={`badge bg-${reservation.status === 'pending' ? 'warning' : 'success'}`}>
                            {reservation.statusLabel}
                          </span>
                        </td>
                        <td>
                          <a href={`/admin/reservations/${reservation.id}`} className="btn btn-sm btn-outline-primary">
                            詳細
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        
        {/* 最近のアクティビティ */}
        <div className="col-12 col-xl-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">最近のアクティビティ</h5>
            </div>
            <div className="card-body">
              <div className="d-flex flex-column gap-3">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="d-flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                        <i className="bi bi-person"></i>
                      </div>
                    </div>
                    <div className="flex-grow-1">
                      <div className="fw-bold">{activity.user}</div>
                      <div className="small text-muted">
                        {activity.action} - {activity.target}
                      </div>
                      <div className="small text-muted">{activity.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

