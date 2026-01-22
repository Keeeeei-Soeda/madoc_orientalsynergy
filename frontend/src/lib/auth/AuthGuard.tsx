'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from './AuthContext'

interface AuthGuardProps {
  children: React.ReactNode
  allowedRoles?: string[]
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { user, loading, isAuthenticated } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // ローディング中は何もしない
    if (loading) return

    // 未認証の場合、ログインページにリダイレクト
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
      return
    }

    // ロール制限がある場合、権限をチェック
    if (allowedRoles && allowedRoles.length > 0) {
      if (!user || !allowedRoles.includes(user.role.toUpperCase())) {
        // 権限がない場合、適切なページにリダイレクト
        switch (user?.role.toUpperCase()) {
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
      }
    }
  }, [user, loading, isAuthenticated, allowedRoles, router, pathname])

  // ローディング中の表示
  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">読み込み中...</span>
          </div>
          <p className="mt-3 text-muted">認証確認中...</p>
        </div>
      </div>
    )
  }

  // 未認証または権限不足の場合は何も表示しない（リダイレクト処理が実行される）
  if (!isAuthenticated) {
    return null
  }

  if (allowedRoles && allowedRoles.length > 0 && user && !allowedRoles.includes(user.role.toUpperCase())) {
    return null
  }

  // 認証OKの場合、子要素を表示
  return <>{children}</>
}


