'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import Cookies from 'js-cookie'

// ユーザー型定義
export interface User {
  id: number
  email: string
  name: string
  role: 'ADMIN' | 'COMPANY' | 'STAFF'
  is_active: boolean
  company_id?: number  // 企業ユーザーの場合のみ
}

// 認証コンテキストの型定義
interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  logout: () => void
  isAuthenticated: boolean
  hasRole: (roles: string[]) => boolean
}

// コンテキスト作成
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL 
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1` 
  : 'http://localhost:8000/api/v1'

// AuthProvider コンポーネント
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // 初期化: トークンがあれば現在のユーザー情報を取得
  useEffect(() => {
    const initAuth = async () => {
      const token = Cookies.get('access_token')
      
      if (token) {
        try {
          const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })

          if (response.ok) {
            const userData = await response.json()
            setUser(userData)
          } else if (response.status === 401) {
            // トークンが無効な場合、リフレッシュトークンで再試行
            const refreshToken = Cookies.get('refresh_token')
            if (refreshToken) {
              try {
                const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ refresh_token: refreshToken }),
                })
                
                if (refreshResponse.ok) {
                  const { access_token } = await refreshResponse.json()
                  Cookies.set('access_token', access_token, { expires: 7 })
                  
                  // 新しいトークンでユーザー情報を再取得
                  const retryResponse = await fetch(`${API_BASE_URL}/auth/me`, {
                    headers: { 'Authorization': `Bearer ${access_token}` },
                  })
                  
                  if (retryResponse.ok) {
                    const userData = await retryResponse.json()
                    setUser(userData)
                    setLoading(false)
                    return
                  }
                }
              } catch (refreshError) {
                console.log('トークンリフレッシュ失敗')
              }
            }
            
            // リフレッシュ失敗時はトークンを削除
            Cookies.remove('access_token')
            Cookies.remove('refresh_token')
          } else {
            // その他のエラーの場合も削除
            Cookies.remove('access_token')
            Cookies.remove('refresh_token')
          }
        } catch (error) {
          console.log('認証初期化エラー:', error)
          Cookies.remove('access_token')
          Cookies.remove('refresh_token')
        }
      }
      
      setLoading(false)
    }

    initAuth()
  }, [])

  // ログイン処理
  const login = async (email: string, password: string): Promise<User> => {
    try {
      // FormDataとして送信（OAuth2の仕様）
      const formData = new URLSearchParams()
      formData.append('username', email)
      formData.append('password', password)

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'ログインに失敗しました')
      }

      const data = await response.json()
      
      // トークンをCookieに保存（7日間有効）
      Cookies.set('access_token', data.access_token, { expires: 7 })
      if (data.refresh_token) {
        Cookies.set('refresh_token', data.refresh_token, { expires: 7 })
      }

      // ユーザー情報を取得
      const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${data.access_token}`,
        },
      })

      if (!userResponse.ok) {
        throw new Error('ユーザー情報の取得に失敗しました')
      }

      const userData = await userResponse.json()
      setUser(userData)
      
      return userData
    } catch (error) {
      console.error('ログインエラー:', error)
      throw error
    }
  }

  // ログアウト処理
  const logout = () => {
    Cookies.remove('access_token')
    Cookies.remove('refresh_token')
    setUser(null)
  }

  // 認証状態の確認
  const isAuthenticated = user !== null

  // ロールの確認
  const hasRole = (roles: string[]): boolean => {
    if (!user) return false
    return roles.includes(user.role)
  }

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
    hasRole,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// カスタムフック
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}


