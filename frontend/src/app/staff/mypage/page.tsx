'use client'

import React, { useState, useEffect, useRef } from 'react'
import PageHeader from '@/components/common/PageHeader'
import { staffApi, Staff, uploadApi } from '@/lib/api'
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
  const [loadingStaff, setLoadingStaff] = useState(true)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // 顔写真アップロードハンドラー
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !staffId) return

    // ファイルサイズチェック（10MB）
    if (file.size > 10 * 1024 * 1024) {
      alert('ファイルサイズが大きすぎます。10MB以下のファイルを選択してください。')
      return
    }

    // ファイル形式チェック
    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください。')
      return
    }

    try {
      setUploadingPhoto(true)
      // 画像をアップロード
      const uploadResult = await uploadApi.uploadProfilePhoto(file)

      // スタッフ情報を更新
      const updatedStaff = await staffApi.update(staffId, {
        profile_photo: uploadResult.file_url
      })

      setStaffData(updatedStaff)
      alert('顔写真を登録しました！')
    } catch (err) {
      console.error('写真アップロードエラー:', err)
      alert('写真のアップロードに失敗しました。')
    } finally {
      setUploadingPhoto(false)
      // ファイル選択をリセット
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // 顔写真削除ハンドラー
  const handlePhotoDelete = async () => {
    if (!staffId || !staffData?.profile_photo) return

    if (!confirm('顔写真を削除しますか？')) return

    try {
      setUploadingPhoto(true)
      // 画像を削除
      await uploadApi.deleteProfilePhoto(staffData.profile_photo)

      // スタッフ情報を更新
      const updatedStaff = await staffApi.update(staffId, {
        profile_photo: undefined
      })

      setStaffData(updatedStaff)
      alert('顔写真を削除しました。')
    } catch (err) {
      console.error('写真削除エラー:', err)
      alert('写真の削除に失敗しました。')
    } finally {
      setUploadingPhoto(false)
    }
  }


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
        {/* プロフィール写真 */}
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">プロフィール写真</h5>
            </div>
            <div className="card-body text-center">
              {loadingStaff ? (
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">読み込み中...</span>
                </div>
              ) : (
                <>
                  <div className="mb-3">
                    {staffData?.profile_photo ? (
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000'}${staffData.profile_photo}`}
                        alt="プロフィール写真"
                        className="rounded-circle"
                        style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        className="bg-secondary bg-opacity-10 text-secondary rounded-circle d-inline-flex align-items-center justify-content-center"
                        style={{ width: '150px', height: '150px' }}
                      >
                        <i className="bi bi-person fs-1"></i>
                      </div>
                    )}
                  </div>
                  <div className="d-flex justify-content-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="d-none"
                      disabled={uploadingPhoto}
                    />
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhoto}
                    >
                      <i className="bi bi-camera me-2"></i>
                      {uploadingPhoto ? 'アップロード中...' : staffData?.profile_photo ? '写真を変更' : '写真を登録'}
                    </button>
                    {staffData?.profile_photo && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={handlePhotoDelete}
                        disabled={uploadingPhoto}
                      >
                        <i className="bi bi-trash me-2"></i>
                        削除
                      </button>
                    )}
                  </div>
                  <small className="text-muted d-block mt-2">
                    JPG、PNG、GIF形式（最大10MB）
                  </small>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 基本情報 */}
        <div className="col-12">
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

        {/* 評価一覧 */}
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">評価一覧</h5>
            </div>
            <div className="card-body p-0">
              {/* PC表示: テーブル形式 */}
              <div className="table-responsive d-none d-md-block">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>訪問日</th>
                      <th>顧客企業</th>
                      <th>実施事業所</th>
                      <th>出勤時間（予定）</th>
                      <th>退勤時間（打刻）</th>
                      <th>清潔感</th>
                      <th>対応力</th>
                      <th>満足度</th>
                      <th>コメント</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evaluationsData.map((evaluation) => (
                      <tr key={evaluation.id}>
                        <td className="fw-bold">{evaluation.date}</td>
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

              {/* スマホ表示: カード形式 */}
              <div className="d-md-none">
                <div className="p-3">
                  {evaluationsData.length > 0 ? (
                    <div className="row g-3">
                      {evaluationsData.map((evaluation) => (
                        <div key={evaluation.id} className="col-12">
                          <div className="card border">
                            <div className="card-body">
                              <div className="row g-2">
                                {/* 訪問日 - 一番上 */}
                                <div className="col-12">
                                  <div className="mb-2">
                                    <div className="text-muted small">訪問日</div>
                                    <div className="fw-bold fs-6">{evaluation.date}</div>
                                  </div>
                                </div>

                                {/* 顧客企業・実施事業所（横並び） */}
                                <div className="col-6">
                                  <div className="mb-2">
                                    <div className="text-muted small">顧客企業</div>
                                    <div className="fw-bold">{evaluation.company}</div>
                                  </div>
                                </div>
                                <div className="col-6">
                                  <div className="mb-2">
                                    <div className="text-muted small">実施事業所</div>
                                    <div>{evaluation.office}</div>
                                  </div>
                                </div>

                                {/* 出勤時間・退勤時間（横並び） */}
                                <div className="col-6">
                                  <div className="mb-2">
                                    <div className="text-muted small">出勤時間</div>
                                    <div>{evaluation.startTime}</div>
                                    <small className="text-muted">({evaluation.scheduledStart})</small>
                                  </div>
                                </div>
                                <div className="col-6">
                                  <div className="mb-2">
                                    <div className="text-muted small">退勤時間</div>
                                    <div>{evaluation.endTime}</div>
                                    <small className="text-muted">({evaluation.scheduledEnd})</small>
                                  </div>
                                </div>

                                {/* 評価項目 */}
                                <div className="col-12">
                                  <div className="row g-2">
                                    <div className="col-4">
                                      <div className="text-center">
                                        <div className="text-muted small mb-1">清潔感</div>
                                        <div className="text-warning">
                                          {[...Array(evaluation.cleanliness)].map((_, i) => (
                                            <i key={i} className="bi bi-star-fill"></i>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="col-4">
                                      <div className="text-center">
                                        <div className="text-muted small mb-1">対応力</div>
                                        <div className="text-warning">
                                          {[...Array(evaluation.responsiveness)].map((_, i) => (
                                            <i key={i} className="bi bi-star-fill"></i>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="col-4">
                                      <div className="text-center">
                                        <div className="text-muted small mb-1">満足度</div>
                                        <div className="text-warning">
                                          {[...Array(evaluation.satisfaction)].map((_, i) => (
                                            <i key={i} className="bi bi-star-fill"></i>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* コメントボタン */}
                                <div className="col-12 text-center mt-2">
                                  <button
                                    className="btn btn-sm btn-outline-success w-100"
                                    data-bs-toggle="modal"
                                    data-bs-target="#commentModal"
                                    onClick={() => setSelectedComment(evaluation.comment)}
                                  >
                                    <i className="bi bi-eye me-1"></i>
                                    コメントを見る
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="alert alert-info mb-0">
                      <i className="bi bi-info-circle me-2"></i>
                      評価データがありません。
                    </div>
                  )}
                </div>
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

