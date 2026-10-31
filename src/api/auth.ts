import { api } from './client'
import type { CampusMeta, LoginResponse, Session } from '@/types'

export const authApi = {
  meta: () => api.get<CampusMeta>('/meta').then((r) => r.data),

  login: (payload: { login: string; password: string; remember: boolean }) =>
    api.post<LoginResponse>('/auth/login', payload).then((r) => r.data),

  me: () => api.get<Session>('/auth/me').then((r) => r.data),

  logout: () => api.post('/auth/logout'),

  forgotPassword: (login: string) =>
    api.post<{ message: string }>('/auth/forgot-password', { login }).then((r) => r.data),

  updateProfile: (payload: { phone: string | null }) => api.put<Session>('/auth/profile', payload).then((r) => r.data),

  changePassword: (payload: { current_password: string; password: string; password_confirmation: string }) =>
    api.put<{ message: string }>('/auth/password', payload).then((r) => r.data),
}
