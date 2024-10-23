export type UserClaim = {
  id: string
  nickname: string
  role: 'admin' | 'user'
}

export type LoginForm = {
  username: string
  password: string
}

export type RegisterForm = LoginForm & {
  nickname: string
}

export type CommonPagination = {
  limit?: number
  offset?: number
}
