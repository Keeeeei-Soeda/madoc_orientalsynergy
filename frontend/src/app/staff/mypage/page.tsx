'use client'

import React, { useState, useEffect } from 'react'
import PageHeader from '@/components/common/PageHeader'
import { staffApi, StaffEarnings, Staff } from '@/lib/api'
import { useAuth } from '@/lib/auth/AuthContext'

const evaluationsData = [
  { id: '22333', company: '株式会社A', office: '梅田事業所', startTime: '9:55', scheduledStart: '10:00', endTime: '18:10', scheduledEnd: '18:00', date: '2025/10/30', cleanliness: 5, responsiveness: 5, satisfaction: 5, comment: 'とても丁寧でした' },
  { id: '45566', company: '株式会社A', office: '難波事業所', startTime: '9:55', scheduledStart: '10:00', endTime: '18:10', scheduledEnd: '18:00', date: '2025/10/15', cleanliness: 5, responsiveness: 5, satisfaction: 5, comment: '素晴らしかったです' },
]

export default function StaffMypage() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [selectedComment, setSelectedComment] = useState<string>('')
  const [staffId, setStaffId] = useState<number | null>(null)
  const [staffData, setStaffData] = useState<Staff | null>(null)
  const [earnings, setEarnings] = useState<StaffEarnings | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [loadingEarnings, setLoadingEarnings] = useState(false)
  const [loadingStaff, setLoadingStaff] = useState(true)
  
  // スタッフIDとスタッフ情報を取得
  useEffect(() => {
    const fetchStaffData = async () => {
      if (!user?.id) return
      
      try {
        setLoadingStaff(true)
        const staffList = await staffApi.getAll(0, 100)
        // user_idで検索（nameではなくuser_idで紐付ける）
        const currentStaff = staffList.find(s => s.user_id === user.id)
        if (currentStaff) {
          setStaffId(currentStaff.id)
          setStaffData(currentStaff)
        }
      } catch (err) {
        console.error('スタッフ情報取得エラー:', err)
      } finally {
        setLoadingStaff(false)
      }
    }
    
    fetchStaffData()
  }, [user])
  
  // 給与情報を取得
  useEffect(() => {
    const fetchEarnings = async () => {
      if (!staffId) return
      
      try {
        setLoadingEarnings(true)
        const earningsData = await staffApi.getEarnings(staffId, selectedMonth, selectedYear)
        setEarnings(earningsData)
      } catch (err) {
        console.error('給与情報取得エラー:', err)
      } finally {
        setLoadingEarnings(false)
      }
    }
    
    if (staffId) {
      fetchEarnings()
    }
  }, [staffId, selectedMonth, selectedYear])
  
  return (
    <>
      <PageHeader 
        title="マイページ"
        breadcrumbs={[
          { label: 'ダッシュボード', href: '/staff/dashboard' },
          { label: 'マイページ' }
        ]}
      />
      
      <div className="row g-4">
        {/* 基本情報 */}
        <div className="col-12 col-xl-6">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">基本情報</h5>
              <button 
                className="btn btn-sm btn-primary"
                onClick={() => setIsEditing(!isEditing)}
              >
                <i className="bi bi-pencil me-2"></i>
                {isEditing ? '保存' : '編集'}
              </button>
            </div>
            <div className="card-body">
              {loadingStaff ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">読み込み中...</span>
                  </div>
                </div>
              ) : staffData ? (
                <table className="table table-borderless mb-0">
                  <tbody>
                    <tr>
                      <th style={{ width: '40%' }}>氏名</th>
                      <td>
                        {isEditing ? (
                          <input type="text" className="form-control form-control-sm" defaultValue={staffData.name} />
                        ) : (
                          staffData.name
                        )}
                      </td>
                    </tr>
                    <tr>
                      <th>住所</th>
                      <td>
                        {isEditing ? (
                          <input type="text" className="form-control form-control-sm" defaultValue={staffData.address} />
                        ) : (
                          staffData.address
                        )}
                      </td>
                    </tr>
                    <tr>
                      <th>電話番号</th>
                      <td>
                        {isEditing ? (
                          <input type="tel" className="form-control form-control-sm" defaultValue={staffData.phone} />
                        ) : (
                          staffData.phone
                        )}
                      </td>
                    </tr>
                    <tr>
                      <th>LINE ID</th>
                      <td>
                        <code className="text-success">{staffData.line_id || '-'}</code>
                      </td>
                    </tr>
                    <tr>
                      <th>銀行口座</th>
                      <td>
                        {isEditing ? (
                          <input type="text" className="form-control form-control-sm" defaultValue={staffData.bank_account} />
                        ) : (
                          staffData.bank_account
                        )}
                      </td>
                    </tr>
                    <tr>
                      <th>保有資格</th>
                      <td>
                        {isEditing ? (
                          <input type="text" className="form-control form-control-sm" defaultValue={staffData.qualifications} />
                        ) : (
                          <span className="badge bg-primary">{staffData.qualifications}</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <th>稼働可能曜日</th>
                      <td>
                        {isEditing ? (
                          <input type="text" className="form-control form-control-sm" defaultValue={staffData.available_days} />
                        ) : (
                          staffData.available_days
                        )}
                      </td>
                    </tr>
                    <tr>
                      <th>備考</th>
                      <td>
                        {isEditing ? (
                          <textarea className="form-control form-control-sm" rows={2} defaultValue={staffData.notes || ''}></textarea>
                        ) : (
                          staffData.notes || '-'
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <div className="alert alert-warning">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  スタッフ情報が見つかりませんでした。
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* 評価サマリー */}
        <div className="col-12 col-xl-6">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">評価サマリー</h5>
            </div>
            <div className="card-body">
              <div className="row g-3 text-center">
                <div className="col-4">
                  <div className="border rounded p-3">
                    <div className="fs-2 fw-bold text-success">4.8</div>
                    <div className="text-muted small">総合評価</div>
                    <div className="text-warning">
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-half"></i>
                    </div>
                  </div>
                </div>
                <div className="col-4">
                  <div className="border rounded p-3">
                    <div className="fs-2 fw-bold text-primary">48</div>
                    <div className="text-muted small">完了業務数</div>
                  </div>
                </div>
                <div className="col-4">
                  <div className="border rounded p-3">
                    <div className="fs-2 fw-bold text-info">12</div>
                    <div className="text-muted small">今月の業務</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 給与明細 */}
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bi bi-currency-yen me-2"></i>
                給与明細
              </h5>
              <div className="d-flex gap-2 align-items-center">
                <select 
                  className="form-select form-select-sm" 
                  style={{ width: 'auto' }}
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                    <option key={year} value={year}>{year}年</option>
                  ))}
                </select>
                <select 
                  className="form-select form-select-sm" 
                  style={{ width: 'auto' }}
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <option key={month} value={month}>{month}月</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="card-body">
              {loadingEarnings ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">読み込み中...</span>
                  </div>
                </div>
              ) : earnings && earnings.assignment_count > 0 ? (
                <>
                  {/* サマリー */}
                  <div className="row g-3 mb-4">
                    <div className="col-md-4">
                      <div className="card bg-success bg-opacity-10">
                        <div className="card-body text-center">
                          <div className="text-muted small mb-1">総給与</div>
                          <div className="fs-3 fw-bold text-success">
                            ¥{earnings.total_earnings.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="card bg-info bg-opacity-10">
                        <div className="card-body text-center">
                          <div className="text-muted small mb-1">総勤務時間</div>
                          <div className="fs-4 fw-bold text-info">
                            {Math.floor(earnings.total_duration / 60)}時間{earnings.total_duration % 60}分
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="card bg-primary bg-opacity-10">
                        <div className="card-body text-center">
                          <div className="text-muted small mb-1">確定済みアサイン</div>
                          <div className="fs-4 fw-bold text-primary">
                            {earnings.assignment_count}件
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 明細テーブル */}
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>予約日</th>
                          <th>事業所</th>
                          <th>枠</th>
                          <th>時間</th>
                          <th>時給</th>
                          <th className="text-end">報酬</th>
                        </tr>
                      </thead>
                      <tbody>
                        {earnings.details.map((detail, index) => (
                          <tr key={index}>
                            <td>{detail.reservation_date}</td>
                            <td>{detail.office_name}</td>
                            <td>
                              {detail.slot_number ? (
                                <span className="badge bg-info">枠{detail.slot_number}</span>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>{detail.duration}分</td>
                            <td>¥{detail.hourly_rate.toLocaleString()}</td>
                            <td className="text-end fw-bold text-success">
                              ¥{detail.earnings.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="table-active">
                          <td colSpan={5} className="fw-bold">合計</td>
                          <td className="text-end fw-bold text-success fs-5">
                            ¥{earnings.total_earnings.toLocaleString()}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </>
              ) : (
                <div className="alert alert-info text-center">
                  <i className="bi bi-info-circle me-2"></i>
                  {selectedYear}年{selectedMonth}月の給与データはありません。
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* 評価一覧 */}
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">評価一覧</h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>顧客企業</th>
                      <th>実施事業所</th>
                      <th>出勤時間（予定）</th>
                      <th>退勤時間（打刻）</th>
                      <th>訪問日</th>
                      <th>清潔感</th>
                      <th>対応力</th>
                      <th>満足度</th>
                      <th>コメント</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evaluationsData.map((evaluation) => (
                      <tr key={evaluation.id}>
                        <td className="fw-bold">{evaluation.id}</td>
                        <td>{evaluation.company}</td>
                        <td>{evaluation.office}</td>
                        <td>
                          {evaluation.startTime}
                          <small className="text-muted d-block">({evaluation.scheduledStart})</small>
                        </td>
                        <td>
                          {evaluation.endTime}
                          <small className="text-muted d-block">({evaluation.scheduledEnd})</small>
                        </td>
                        <td>{evaluation.date}</td>
                        <td>
                          <div className="text-warning">
                            {[...Array(evaluation.cleanliness)].map((_, i) => (
                              <i key={i} className="bi bi-star-fill"></i>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div className="text-warning">
                            {[...Array(evaluation.responsiveness)].map((_, i) => (
                              <i key={i} className="bi bi-star-fill"></i>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div className="text-warning">
                            {[...Array(evaluation.satisfaction)].map((_, i) => (
                              <i key={i} className="bi bi-star-fill"></i>
                            ))}
                          </div>
                        </td>
                        <td>
                          <button 
                            className="btn btn-sm btn-outline-success"
                            data-bs-toggle="modal"
                            data-bs-target="#commentModal"
                            onClick={() => setSelectedComment(evaluation.comment)}
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* コメントモーダル */}
      <div className="modal fade" id="commentModal" tabIndex={-1}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">コメント</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              <p>{selectedComment}</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">閉じる</button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

