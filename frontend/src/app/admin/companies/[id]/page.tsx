'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { use } from 'react'
import PageHeader from '@/components/common/PageHeader'

// IDを6桁のゼロパディングで表示する関数
const formatCompanyId = (id: string): string => {
  return id.padStart(6, '0')
}

// 契約期間が終了しているかチェックする関数
const isContractExpired = (endDate: string): boolean => {
  if (!endDate) return false
  try {
    const [year, month, day] = endDate.split('/').map(Number)
    const contractEndDate = new Date(year, month - 1, day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return contractEndDate < today
  } catch (error) {
    return false
  }
}

// 契約更新後の新しい契約日を計算する関数
const calculateRenewalDates = (currentEndDate: string, plan: string): { startDate: string, endDate: string } => {
  try {
    const [year, month, day] = currentEndDate.split('/').map(Number)
    
    // 現在の契約終了日の翌日が新しい契約開始日
    let newStartDay = day + 1
    let newStartMonth = month
    let newStartYear = year
    
    // 月末を超える場合は次の月の1日に
    const daysInMonth = new Date(year, month, 0).getDate()
    if (newStartDay > daysInMonth) {
      newStartDay = 1
      newStartMonth += 1
      if (newStartMonth > 12) {
        newStartMonth = 1
        newStartYear += 1
      }
    }
    
    const startDate = `${newStartYear}/${String(newStartMonth).padStart(2, '0')}/${String(newStartDay).padStart(2, '0')}`
    
    // 新しい契約開始日の次の月の1日から計算
    let actualStartMonth = newStartMonth + 1
    let actualStartYear = newStartYear
    if (actualStartMonth > 12) {
      actualStartMonth = 1
      actualStartYear += 1
    }
    
    // プランに応じて契約終了日を計算
    let endMonth = actualStartMonth
    let endYear = actualStartYear
    
    if (plan === '6ヶ月') {
      endMonth += 5 // 6ヶ月後の月
    } else if (plan === '1年') {
      endMonth += 11 // 1年後の月
    }
    
    // 年をまたぐ場合の調整
    while (endMonth > 12) {
      endMonth -= 12
      endYear += 1
    }
    
    // その月の末日を取得
    const lastDay = new Date(endYear, endMonth, 0).getDate()
    const endDate = `${endYear}/${String(endMonth).padStart(2, '0')}/${String(lastDay).padStart(2, '0')}`
    
    return { startDate, endDate }
  } catch (error) {
    return { startDate: '', endDate: '' }
  }
}

// モックデータ
const companyData = {
  id: '1',
  name: '株式会社A',
  office_name: '梅田営業所',
  industry: '建設業',
  plan: '6ヶ月',
  contract_start_date: '2025/12/15',
  contract_end_date: '2026/06/30',
  usage_count: 20,
  representative: '田中一郎',
  address: '大阪府大阪市北区梅田1-1-1',
  phone: '06-0000-0001',
  email: 'info@company-a.jp',
  contact_person: '担当 太郎',
  contact_phone: '090-0000-0001',
  contact_email: 'tantou@company-a.jp',
  notes: '定期契約企業',
}


export default function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [showRenewalModal, setShowRenewalModal] = useState(false)
  const [renewalPlan, setRenewalPlan] = useState('6ヶ月')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // 契約が終了しているかチェック
  const contractExpired = isContractExpired(companyData.contract_end_date)
  
  // 契約更新処理
  const handleRenewal = async () => {
    setIsSubmitting(true)
    try {
      const { startDate, endDate } = calculateRenewalDates(companyData.contract_end_date, renewalPlan)
      
      // TODO: API連携実装（認証実装後）
      // await companiesApi.renewContract(id, { plan: renewalPlan, contract_start_date: startDate, contract_end_date: endDate })
      
      // モック実装（成功をシミュレート）
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      alert(`契約を更新しました\n新しい契約期間: ${startDate} 〜 ${endDate}`)
      setShowRenewalModal(false)
      // ページをリロードして最新情報を表示
      window.location.reload()
    } catch (error) {
      console.error('契約更新エラー:', error)
      alert('契約の更新に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <>
      <PageHeader 
        title={companyData.name}
        breadcrumbs={[
          { label: 'ダッシュボード', href: '/admin/dashboard' },
          { label: '企業管理', href: '/admin/companies' },
          { label: companyData.name }
        ]}
        action={
          <div className="d-flex gap-2">
            {/* 契約期間内のみ契約更新ボタンを表示 */}
            {!contractExpired && (
              <button 
                className="btn btn-success"
                onClick={() => setShowRenewalModal(true)}
              >
                <i className="bi bi-arrow-repeat me-2"></i>
                契約更新
              </button>
            )}
            <Link href={`/admin/companies/${id}/edit`} className="btn btn-primary">
              <i className="bi bi-pencil me-2"></i>
              編集
            </Link>
            <button className="btn btn-outline-danger">
              <i className="bi bi-trash me-2"></i>
              削除
            </button>
          </div>
        }
      />
      
      <div className="row g-4">
        {/* 基本情報 */}
        <div className="col-12 col-xl-6">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">基本情報</h5>
            </div>
            <div className="card-body">
              <table className="table table-borderless mb-0">
                <tbody>
                  <tr>
                    <th style={{ width: '40%' }}>ID</th>
                    <td className="font-monospace">{formatCompanyId(companyData.id)}</td>
                  </tr>
                  <tr>
                    <th>企業名</th>
                    <td className="fw-bold">{companyData.name}</td>
                  </tr>
                  <tr>
                    <th>支店・営業所名</th>
                    <td>{companyData.office_name || '-'}</td>
                  </tr>
                  <tr>
                    <th>業種</th>
                    <td>{companyData.industry || '-'}</td>
                  </tr>
                  <tr>
                    <th>代表者</th>
                    <td>{companyData.representative || '-'}</td>
                  </tr>
                  <tr>
                    <th>住所</th>
                    <td>{companyData.address || '-'}</td>
                  </tr>
                  <tr>
                    <th>電話番号</th>
                    <td>{companyData.phone || '-'}</td>
                  </tr>
                  <tr>
                    <th>メールアドレス</th>
                    <td>{companyData.email ? <a href={`mailto:${companyData.email}`}>{companyData.email}</a> : '-'}</td>
                  </tr>
                  <tr>
                    <th>担当者名</th>
                    <td>{companyData.contact_person || '-'}</td>
                  </tr>
                  <tr>
                    <th>担当者電話番号</th>
                    <td>{companyData.contact_phone || '-'}</td>
                  </tr>
                  <tr>
                    <th>担当者メールアドレス</th>
                    <td>{companyData.contact_email ? <a href={`mailto:${companyData.contact_email}`}>{companyData.contact_email}</a> : '-'}</td>
                  </tr>
                  <tr>
                    <th>備考</th>
                    <td>{companyData.notes || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* 契約情報 */}
        <div className="col-12 col-xl-6">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">契約情報</h5>
            </div>
            <div className="card-body">
              <table className="table table-borderless mb-0">
                <tbody>
                  <tr>
                    <th style={{ width: '40%' }}>プラン</th>
                    <td><span className="badge bg-info">{companyData.plan || '-'}</span></td>
                  </tr>
                  <tr>
                    <th>契約開始日</th>
                    <td>{companyData.contract_start_date || '-'}</td>
                  </tr>
                  <tr>
                    <th>契約終了日</th>
                    <td>{companyData.contract_end_date || '-'}</td>
                  </tr>
                  <tr>
                    <th>契約期間</th>
                    <td>
                      {companyData.contract_start_date && companyData.contract_end_date ? (
                        <>
                          {(() => {
                            const [startY, startM] = companyData.contract_start_date.split('/').map(Number)
                            const [endY, endM] = companyData.contract_end_date.split('/').map(Number)
                            const actualStartM = startM === 12 ? 1 : startM + 1
                            const actualStartY = startM === 12 ? startY + 1 : startY
                            return `${actualStartY}/${String(actualStartM).padStart(2, '0')}/01 〜 ${companyData.contract_end_date}`
                          })()}
                        </>
                      ) : '-'}
                    </td>
                  </tr>
                  <tr>
                    <th>利用回数</th>
                    <td className="fw-bold">{companyData.usage_count || 0}回</td>
                  </tr>
                  <tr>
                    <th>備考</th>
                    <td>{companyData.notes}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      {/* 契約更新モーダル */}
      {showRenewalModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-arrow-repeat me-2"></i>
                  契約更新
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowRenewalModal(false)}
                  disabled={isSubmitting}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-info">
                  <i className="bi bi-info-circle me-2"></i>
                  現在の契約終了日の翌日から新しい契約が開始されます
                </div>
                
                <div className="mb-3">
                  <label className="form-label fw-bold">現在の契約情報</label>
                  <div className="bg-light p-3 rounded">
                    <div className="row">
                      <div className="col-6">
                        <small className="text-muted">プラン</small>
                        <div className="fw-bold">{companyData.plan}</div>
                      </div>
                      <div className="col-6">
                        <small className="text-muted">契約終了日</small>
                        <div className="fw-bold">{companyData.contract_end_date}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="renewalPlan" className="form-label fw-bold">
                    新しいプラン <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    id="renewalPlan"
                    value={renewalPlan}
                    onChange={(e) => setRenewalPlan(e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="6ヶ月">6ヶ月</option>
                    <option value="1年">1年</option>
                  </select>
                </div>
                
                <div className="mb-3">
                  <label className="form-label fw-bold">更新後の契約期間（予定）</label>
                  <div className="bg-light p-3 rounded">
                    {(() => {
                      const { startDate, endDate } = calculateRenewalDates(companyData.contract_end_date, renewalPlan)
                      const [startY, startM, startD] = startDate.split('/').map(Number)
                      let actualStartM = startM + 1
                      let actualStartY = startY
                      if (actualStartM > 12) {
                        actualStartM = 1
                        actualStartY += 1
                      }
                      return (
                        <>
                          <div className="mb-2">
                            <small className="text-muted">契約開始日</small>
                            <div className="fw-bold">{startDate}</div>
                          </div>
                          <div className="mb-2">
                            <small className="text-muted">実際の契約期間</small>
                            <div className="fw-bold">
                              {actualStartY}/{String(actualStartM).padStart(2, '0')}/01 〜 {endDate}
                            </div>
                          </div>
                          <div>
                            <small className="text-muted">契約終了日</small>
                            <div className="fw-bold">{endDate}</div>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowRenewalModal(false)}
                  disabled={isSubmitting}
                >
                  キャンセル
                </button>
                <button 
                  type="button" 
                  className="btn btn-success"
                  onClick={handleRenewal}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      更新中...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-2"></i>
                      契約更新
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

