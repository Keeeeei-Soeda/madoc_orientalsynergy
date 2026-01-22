'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const user = await login(email, password)
      
      // ロールに応じてリダイレクト
      switch (user.role.toUpperCase()) {
        case 'ADMIN':
          router.push('/admin/dashboard')
          break
        case 'COMPANY':
          router.push('/company/dashboard')
          break
        case 'STAFF':
          router.push('/staff/dashboard')
          break
        default:
          router.push('/')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ログインに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-5">
            <div className="card shadow-sm">
              <div className="card-body p-5">
                {/* ロゴ・タイトル */}
                <div className="text-center mb-4">
                  <h1 className="h3 mb-2 fw-bold text-primary">Oriental Synergy</h1>
                  <p className="text-muted">派遣業務管理システム</p>
                </div>

                {/* エラーメッセージ */}
                {error && (
                  <div className="alert alert-danger" role="alert">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                  </div>
                )}

                {/* ログインフォーム */}
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">
                      メールアドレス
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      required
                      autoFocus
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="password" className="form-label">
                      パスワード
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 mb-3"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        ログイン中...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-box-arrow-in-right me-2"></i>
                        ログイン
                      </>
                    )}
                  </button>

                  <div className="text-center">
                    <a href="#" className="text-muted small">
                      パスワードを忘れた場合
                    </a>
                  </div>
                </form>

                {/* デモ用アカウント情報 */}
                <div className="mt-4 p-3 bg-light rounded">
                  <p className="small text-muted mb-2"><strong>デモアカウント:</strong></p>
                  <p className="small text-muted mb-1">管理者: admin@orientalsynergy.com</p>
                  <p className="small text-muted mb-1">企業: company1@example.com</p>
                  <p className="small text-muted mb-1">スタッフ: staff1@example.com</p>
                  <p className="small text-muted mb-0">パスワード: (全て同じパスワード)</p>
                </div>
              </div>
            </div>

            {/* フッター */}
            <div className="text-center mt-3">
              <p className="text-muted small">
                © 2026 Oriental Synergy. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


