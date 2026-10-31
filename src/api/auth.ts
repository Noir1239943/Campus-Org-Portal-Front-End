import { api } from './client'
import type { CampusMeta, LoginResponse, Session } from '@/types'

export interface RegisterPayload {
  id_number: string
  first_name: string
  last_name: string
  email: string
  program: string
  year_level: number
  section: string
  password: string
  password_confirmation: string
}

export const authApi = {
  meta: () => api.get<CampusMeta>('/meta').then((r) => r.data),

  login: (payload: { login: string; password: string; remember: boolean }) =>
    api.post<LoginResponse>('/auth/login', payload).then((r) => r.data),

  register: (payload: RegisterPayload) => api.post<{ message: string }>('/auth/register', payload).then((r) => r.data),

  me: () => api.get<Session>('/auth/me').then((r) => r.data),

  logout: () => api.post('/auth/logout'),

  forgotPassword: (login: string) =>
    api.post<{ message: string }>('/auth/forgot-password', { login }).then((r) => r.data),

  updateProfile: (payload: { phone: string | null }) => api.put<Session>('/auth/profile', payload).then((r) => r.data),

  changePassword: (payload: { current_password: string; password: string; password_confirmation: string }) =>
    api.put<{ message: string }>('/auth/password', payload).then((r) => r.data),
}
