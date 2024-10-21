export type UserClaim = {
  id: string
  nickname: string
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

export type OrganizationType = {
  id: string
  name: string
  giteaUrl: string
  giteaToken?: string
  createdAt: string
  updatedAt?: string
}

export type AppType = {
  id: string
  name: string
  upstreamRepoType: 'codeup'
  upstreamRepoUrl: string
  upstreamSecretToken?: string
  giteaRepo: string
  giteaToken?: string
  generatedWebhookUrl?: string
  organization: OrganizationType
  createdAt: string
  updatedAt?: string
}
