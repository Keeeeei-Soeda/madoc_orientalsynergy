'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import PageHeader from '@/components/common/PageHeader'
import { employeesApi, Employee } from '@/lib/api'
import { useAuth } from '@/lib/auth/AuthContext'

export default function CompanyEmployeesPage() {
  const { user } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: '',
    department: '',
    position: '',
    line_id: '',
  })

  // 社員データを取得
  const fetchEmployees = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await employeesApi.getAll()
      setEmployees(data)
    } catch (err: any) {
      setError(err.message || '社員データの取得に失敗しました')
      console.error('社員取得エラー:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmployees()
  }, [])
  
  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (employee.department && employee.department.toLowerCase().includes(searchTerm.toLowerCase()))
  )
  
  // 詳細モーダルを開く
  const handleViewDetail = (employee: Employee) => {
    setSelectedEmployee(employee)
    setIsEditMode(false)
  }
  
  // 編集モーダルを開く
  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee)
    setEditFormData({
      name: employee.name,
      department: employee.department || '',
      position: employee.position || '',
      line_id: employee.line_id || '',
    })
    setIsEditMode(true)
  }
  
  // 詳細モーダルから編集モードに切り替え
  const switchToEditMode = () => {
    if (selectedEmployee) {
      setEditFormData({
        name: selectedEmployee.name,
        department: selectedEmployee.department || '',
        position: selectedEmployee.position || '',
        line_id: selectedEmployee.line_id || '',
      })
      setIsEditMode(true)
    }
  }
  
  // フォーム入力変更
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  // 保存処理
  const handleSave = async () => {
    if (!selectedEmployee) return

    try {
      await employeesApi.update(selectedEmployee.id, editFormData)
      alert('社員情報を更新しました')
      
      // モーダルを閉じる
      const modalElement = document.getElementById('employeeModal')
      if (modalElement) {
        const modal = (window as any).bootstrap?.Modal?.getInstance(modalElement)
        modal?.hide()
      }
      
      setIsEditMode(false)
      setSelectedEmployee(null)
      
      // 一覧を再取得
      await fetchEmployees()
    } catch (err: any) {
      alert('更新に失敗しました: ' + (err.message || ''))
      console.error('社員更新エラー:', err)
    }
  }
  
  return (
    <>
      <PageHeader 
        title="社員管理（LINE連動）"
        breadcrumbs={[
          { label: 'ダッシュボード', href: '/company/dashboard' },
          { label: '社員管理' }
        ]}
        action={
          <div className="d-flex gap-2">
            <button 
              className="btn btn-outline-secondary" 
              onClick={fetchEmployees}
              disabled={loading}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              {loading ? '読み込み中...' : '更新'}
            </button>
            <Link href="/company/employees/new" className="btn btn-primary">
              <i className="bi bi-plus-circle me-2"></i>
              社員を追加
            </Link>
          </div>
        }
      />
      
      {/* 検索 */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="search-bar">
            <i className="bi bi-search search-icon"></i>
            <input 
              type="text" 
              className="form-control" 
              placeholder="社員名または部署で検索..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      {/* 社員一覧 */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">社員一覧 ({filteredEmployees.length}件)</h5>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>社員名</th>
                  <th>部署</th>
                  <th>役職</th>
                  <th>LINE ID</th>
                  <th>LINE連携状況</th>
                  <th>アクション</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">読み込み中...</span>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5 text-danger">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      {error}
                    </td>
                  </tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5 text-muted">
                      <i className="bi bi-inbox fs-1"></i>
                      <p className="mt-3">社員が登録されていません</p>
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((employee) => (
                    <tr key={employee.id}>
                      <td className="fw-bold">
                        <i className="bi bi-person-circle me-2 text-primary"></i>
                        {employee.name}
                      </td>
                      <td>{employee.department || '-'}</td>
                      <td>{employee.position || '-'}</td>
                      <td>
                        {employee.line_id ? (
                          <code className="text-success">{employee.line_id}</code>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        {employee.line_linked ? (
                          <span className="badge bg-success">
                            <i className="bi bi-check-circle me-1"></i>
                            連携済
                          </span>
                        ) : (
                          <span className="badge bg-warning">
                            <i className="bi bi-exclamation-circle me-1"></i>
                            未連携
                          </span>
                        )}
                      </td>
                    <td>
                      <div className="d-flex gap-2 align-items-center">
                        <button 
                          className="btn btn-outline-primary btn-sm"
                          data-bs-toggle="modal" 
                          data-bs-target="#employeeModal"
                          onClick={() => handleViewDetail(employee)}
                          title="詳細を見る"
                        >
                          <i className="bi bi-eye me-1"></i>
                          詳細
                        </button>
                        <button 
                          className="btn btn-outline-secondary btn-sm"
                          data-bs-toggle="modal"
                          data-bs-target="#employeeModal"
                          onClick={() => handleEdit(employee)}
                          title="編集"
                        >
                          <i className="bi bi-pencil me-1"></i>
                          編集
                        </button>
                        {!employee.line_linked && (
                          <button 
                            className="btn btn-success btn-sm"
                            title="LINE招待を送る"
                          >
                            <i className="bi bi-line me-1"></i>
                            LINE招待
                          </button>
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
      
      {/* 社員詳細・編集モーダル */}
      <div className="modal fade" id="employeeModal" tabIndex={-1}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {isEditMode ? '社員情報編集' : '社員情報'}
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              {selectedEmployee && !isEditMode && (
                <table className="table table-borderless">
                  <tbody>
                    <tr>
                      <th style={{ width: '40%' }}>社員名</th>
                      <td>{selectedEmployee.name}</td>
                    </tr>
                    <tr>
                      <th>部署</th>
                      <td>{selectedEmployee.department}</td>
                    </tr>
                    <tr>
                      <th>役職</th>
                      <td>{selectedEmployee.position}</td>
                    </tr>
                    <tr>
                      <th>LINE ID</th>
                      <td>
                        {selectedEmployee.line_id ? (
                          <code className="text-success">{selectedEmployee.line_id}</code>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <th>LINE連携状況</th>
                      <td>
                        <span className={`badge bg-${selectedEmployee.line_linked ? 'success' : 'warning'}`}>
                          {selectedEmployee.line_linked ? '連携済' : '未連携'}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
              
              {selectedEmployee && isEditMode && (
                <form>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label htmlFor="edit_name" className="form-label">
                        社員名 <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="edit_name"
                        name="name"
                        value={editFormData.name}
                        onChange={handleFormChange}
                        required
                      />
                    </div>
                    
                    <div className="col-md-6">
                      <label htmlFor="edit_department" className="form-label">
                        部署 <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        id="edit_department"
                        name="department"
                        value={editFormData.department}
                        onChange={handleFormChange}
                        required
                      >
                        <option value="">選択してください</option>
                        <option value="総務部">総務部</option>
                        <option value="人事部">人事部</option>
                        <option value="営業部">営業部</option>
                        <option value="経理部">経理部</option>
                        <option value="製造部">製造部</option>
                        <option value="技術部">技術部</option>
                        <option value="その他">その他</option>
                      </select>
                    </div>
                    
                    <div className="col-md-6">
                      <label htmlFor="edit_position" className="form-label">
                        役職
                      </label>
                      <select
                        className="form-select"
                        id="edit_position"
                        name="position"
                        value={editFormData.position}
                        onChange={handleFormChange}
                      >
                        <option value="">選択してください</option>
                        <option value="部長">部長</option>
                        <option value="課長">課長</option>
                        <option value="主任">主任</option>
                        <option value="一般">一般</option>
                      </select>
                    </div>
                    
                    <div className="col-md-6">
                      <label htmlFor="edit_lineId" className="form-label">
                        LINE ID
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="edit_lineId"
                        name="lineId"
                        value={editFormData.line_id}
                        onChange={handleFormChange}
                        placeholder="例: tanaka_line"
                      />
                    </div>
                  </div>
                </form>
              )}
            </div>
            <div className="modal-footer">
              {!isEditMode ? (
                <>
                  <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                    閉じる
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={switchToEditMode}
                  >
                    <i className="bi bi-pencil me-2"></i>
                    編集
                  </button>
                </>
              ) : (
                <>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setIsEditMode(false)}
                  >
                    キャンセル
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={handleSave}
                  >
                    <i className="bi bi-check-circle me-2"></i>
                    保存
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

