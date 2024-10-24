import { client } from '@/api'
import type { LoginForm, RegisterForm, UserClaim } from '@/types'
import { onExpired } from '@/utils'
import { create } from 'zustand'
import { getAccessToken, setAccessToken } from './token'

export type AuthState = {
  user: UserClaim | null
  ready: boolean
  loading: boolean
  computed: {
    logged: boolean
    role: 'admin' | 'user'
  }
  init: () => Promise<void>
  register: (args: RegisterForm) => Promise<boolean>
  login: (args: LoginForm) => Promise<boolean>
  logout: () => void
  refreshMe: () => Promise<UserClaim | null>
}

async function fetchMe() {
  const { error, data } = await client.get('/api/user/me')
  return { user: data, error: error }
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  ready: false,
  loading: false,
  computed: {
    get logged() {
      return !!get().user
    },
    get role() {
      return get().user?.role ?? 'user'
    }
  },
  async init() {
    if (get().loading) return
    set({ loading: true })
    const accessToken = getAccessToken()
    if (accessToken) {
      const { user } = await fetchMe()
      set({ user })
    }
    set({ loading: false, ready: true })
  },
  async register(args) {
    const { error, data } = await client.post('/register', { body: args })
    if (!error) {
      setAccessToken(data.token)
      const { user } = await fetchMe()
      set({ user })
      return !!user
    }
    return false
  },
  async login(args) {
    const { error, data } = await client.post('/login', { body: args })
    if (!error) {
      setAccessToken(data.token)
      const { user } = await fetchMe()
      set({ user })
      return !!user
    }
    return false
  },
  async refreshMe() {
    const { user } = await fetchMe()
    set({ user })
    if (!user) {
      onExpired()
    }
    return user
  },
  logout() {
    set({ user: null })
    onExpired()
  }
}))
