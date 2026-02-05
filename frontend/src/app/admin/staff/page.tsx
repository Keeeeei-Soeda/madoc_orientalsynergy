'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import PageHeader from '@/components/common/PageHeader'
import { staffApi, Staff } from '@/lib/api'

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  
  // データ取得
  const fetchStaff = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await staffApi.getAll()
      setStaff(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'スタッフデータの取得に失敗しました')
      console.error('スタッフデータ取得エラー:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStaff()
  }, [])
  
  const filteredStaff = staff.filter(staffMember => {
    const matchesSearch = staffMember.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !statusFilter || 
      (statusFilter === 'active' && staffMember.is_available) ||
      (statusFilter === 'inactive' && !staffMember.is_available)
    return matchesSearch && matchesStatus
  })
  
  // ローディング表示
  if (loading) {
    return (
      <>
        <PageHeader 
          title="スタッフ管理" 
          breadcrumbs={[
            { label: 'ダッシュボード', href: '/admin/dashboard' },
            { label: 'スタッフ管理' }
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
          title="スタッフ管理" 
          breadcrumbs={[
            { label: 'ダッシュボード', href: '/admin/dashboard' },
            { label: 'スタッフ管理' }
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
        title="スタッフ管理" 
        breadcrumbs={[
          { label: 'ダッシュボード', href: '/admin/dashboard' },
          { label: 'スタッフ管理' }
        ]}
        action={
          <div className="d-flex gap-2">
            <button 
              className="btn btn-outline-secondary" 
              onClick={fetchStaff}
              disabled={loading}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              {loading ? '読み込み中...' : '更新'}
            </button>
            <Link href="/admin/staff/search" className="btn btn-outline-primary">
              <i className="bi bi-search me-2"></i>
              詳細検索
            </Link>
            <Link href="/admin/staff/new" className="btn btn-primary">
              <i className="bi bi-plus-circle me-2"></i>
              スタッフを追加
            </Link>
          </div>
        }
      />
      
      {/* 検索・フィルター */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-12 col-md-8">
              <div className="search-bar">
                <i className="bi bi-search search-icon"></i>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="スタッフ名で検索..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-12 col-md-4">
              <select 
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">すべてのステータス</option>
                <option value="active">有効</option>
                <option value="inactive">無効</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* スタッフ一覧 */}
      <div className="row g-4">
        {filteredStaff.map((staffMember) => (
          <div key={staffMember.id} className="col-12 col-md-6 col-xl-4">
            <div className="card h-100">
              <div className="card-body">
                <div className="d-flex align-items-start mb-3">
                  <div className="flex-shrink-0">
                    {staffMember.profile_photo ? (
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000'}${staffMember.profile_photo}`}
                        alt={staffMember.name}
                        className="rounded-circle"
                        style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div 
                        className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: '60px', height: '60px' }}
                      >
                        <i className="bi bi-person fs-3"></i>
                      </div>
                    )}
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <h5 className="mb-1">{staffMember.name}</h5>
                    <p className="text-muted mb-0 small">{staffMember.phone}</p>
                  </div>
                  <span className={`badge bg-${staffMember.is_available ? 'success' : 'secondary'}`}>
                    {staffMember.is_available ? '有効' : '無効'}
                  </span>
                </div>
                
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-muted small">評価</span>
                    <div>
                      <i className="bi bi-star-fill text-warning me-1"></i>
                      <span className="fw-bold">{staffMember.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted small">稼働可能日</span>
                    <span className="fw-bold">{staffMember.available_days}</span>
                  </div>
                </div>
                
                <div className="mb-3">
                  <p className="text-muted small mb-2">資格</p>
                  <div className="d-flex flex-wrap gap-1">
                    {staffMember.qualifications.split(',').map((qual, index) => (
                      <span key={index} className="badge bg-light text-dark">
                        {qual.trim()}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="d-flex gap-2">
                  <Link 
                    href={`/admin/staff/${staffMember.id}`} 
                    className="btn btn-sm btn-outline-primary flex-grow-1"
                  >
                    <i className="bi bi-eye me-1"></i>
                    詳細
                  </Link>
                  <Link 
                    href={`/admin/staff/${staffMember.id}/edit`} 
                    className="btn btn-sm btn-outline-secondary"
                  >
                    <i className="bi bi-pencil"></i>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

