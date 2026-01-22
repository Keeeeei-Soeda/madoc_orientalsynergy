'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import PageHeader from '@/components/common/PageHeader'
import { staffApi, Staff } from '@/lib/api'

export default function StaffSearchPage() {
  const [allStaff, setAllStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchParams, setSearchParams] = useState({
    name: '',
    minRating: '',
    is_available: true,
    sortBy: 'rating'
  })
  
  const [searchResults, setSearchResults] = useState<Staff[]>([])

  // スタッフデータを取得
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setLoading(true)
        const data = await staffApi.getAll()
        setAllStaff(data)
        setSearchResults(data)
      } catch (err: any) {
        setError(err.message || 'スタッフデータの取得に失敗しました')
        console.error('スタッフ取得エラー:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStaff()
  }, [])
  
  const handleSearch = () => {
    let results = [...allStaff]
    
    // 名前フィルター
    if (searchParams.name) {
      results = results.filter(staff => 
        staff.name.toLowerCase().includes(searchParams.name.toLowerCase())
      )
    }
    
    // 評価フィルター
    if (searchParams.minRating) {
      results = results.filter(staff => 
        (staff.rating || 0) >= parseFloat(searchParams.minRating)
      )
    }
    
    // 稼働可能フィルター
    results = results.filter(staff => staff.is_available === searchParams.is_available)
    
    // ソート
    results.sort((a, b) => {
      switch (searchParams.sortBy) {
        case 'rating':
          return (b.rating || 0) - (a.rating || 0)
        case 'name':
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })
    
    setSearchResults(results)
  }
  
  const handleParamChange = (name: string, value: string | boolean) => {
    setSearchParams(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }))
  }
  
  return (
    <>
      <PageHeader 
        title="スタッフ検索" 
        breadcrumbs={[
          { label: 'ダッシュボード', href: '/admin/dashboard' },
          { label: 'スタッフ管理', href: '/admin/staff' },
          { label: 'スタッフ検索' }
        ]}
      />
      
      <div className="row g-4">
        {/* 検索フォーム */}
        <div className="col-12 col-xl-3">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">検索条件</h5>
            </div>
            <div className="card-body">
              {/* 名前 */}
              <div className="mb-4">
                <label className="form-label">スタッフ名</label>
                <input 
                  type="text"
                  className="form-control"
                  placeholder="名前で検索"
                  value={searchParams.name}
                  onChange={(e) => handleParamChange('name', e.target.value)}
                />
              </div>
              
              {/* 評価 */}
              <div className="mb-4">
                <label className="form-label">最低評価</label>
                <select 
                  className="form-select"
                  value={searchParams.minRating}
                  onChange={(e) => handleParamChange('minRating', e.target.value)}
                >
                  <option value="">指定なし</option>
                  <option value="4.5">4.5以上</option>
                  <option value="4.0">4.0以上</option>
                  <option value="3.5">3.5以上</option>
                  <option value="3.0">3.0以上</option>
                </select>
              </div>
              
              {/* 稼働状況 */}
              <div className="mb-4">
                <label className="form-label">稼働状況</label>
                <div className="form-check">
                  <input 
                    type="radio" 
                    id="available-yes"
                    name="is_available"
                    className="form-check-input"
                    checked={searchParams.is_available === true}
                    onChange={() => handleParamChange('is_available', true)}
                  />
                  <label className="form-check-label" htmlFor="available-yes">
                    稼働可能のみ
                  </label>
                </div>
                <div className="form-check">
                  <input 
                    type="radio" 
                    id="available-no"
                    name="is_available"
                    className="form-check-input"
                    checked={searchParams.is_available === false}
                    onChange={() => handleParamChange('is_available', false)}
                  />
                  <label className="form-check-label" htmlFor="available-no">
                    すべて表示
                  </label>
                </div>
              </div>
              
              {/* ソート */}
              <div className="mb-4">
                <label className="form-label">並び順</label>
                <select 
                  className="form-select"
                  value={searchParams.sortBy}
                  onChange={(e) => handleParamChange('sortBy', e.target.value)}
                >
                  <option value="rating">評価が高い順</option>
                  <option value="name">名前順</option>
                </select>
              </div>
              
              <button 
                className="btn btn-primary w-100"
                onClick={handleSearch}
                disabled={loading}
              >
                <i className="bi bi-search me-2"></i>
                {loading ? '読み込み中...' : '検索'}
              </button>
              
              <button 
                className="btn btn-outline-secondary w-100 mt-2"
                onClick={() => {
                  setSearchParams({ name: '', minRating: '', is_available: true, sortBy: 'rating' })
                  setSearchResults(allStaff)
                }}
              >
                <i className="bi bi-arrow-counterclockwise me-2"></i>
                リセット
              </button>
            </div>
          </div>
        </div>
        
        {/* 検索結果 */}
        <div className="col-12 col-xl-9">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">検索結果 ({searchResults.length}件)</h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>スタッフ名</th>
                      <th>電話番号</th>
                      <th>評価</th>
                      <th>資格</th>
                      <th>稼働可能曜日</th>
                      <th>稼働状況</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="text-center py-5">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">読み込み中...</span>
                          </div>
                        </td>
                      </tr>
                    ) : error ? (
                      <tr>
                        <td colSpan={7} className="text-center py-5 text-danger">
                          <i className="bi bi-exclamation-triangle me-2"></i>
                          {error}
                        </td>
                      </tr>
                    ) : searchResults.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-5 text-muted">
                          <i className="bi bi-inbox fs-1"></i>
                          <p className="mt-3">該当するスタッフが見つかりませんでした</p>
                        </td>
                      </tr>
                    ) : (
                      searchResults.map((staff) => (
                        <tr key={staff.id}>
                          <td className="fw-bold">{staff.name}</td>
                          <td>{staff.phone || '-'}</td>
                          <td>
                            {staff.rating ? (
                              <>
                                <i className="bi bi-star-fill text-warning me-1"></i>
                                {staff.rating.toFixed(1)}
                              </>
                            ) : (
                              <span className="text-muted">未評価</span>
                            )}
                          </td>
                          <td>
                            <small className="text-muted">{staff.qualifications || '-'}</small>
                          </td>
                          <td>
                            <small className="text-muted">{staff.available_days || '-'}</small>
                          </td>
                          <td>
                            {staff.is_available ? (
                              <span className="badge bg-success">稼働可能</span>
                            ) : (
                              <span className="badge bg-secondary">稼働不可</span>
                            )}
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <Link href={`/admin/staff/${staff.id}`} className="btn btn-outline-primary">
                                <i className="bi bi-eye"></i>
                              </Link>
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
        </div>
      </div>
    </>
  )
}

