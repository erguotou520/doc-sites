import { useAuth } from '@/store'
import { CommonPagination, LoginForm, RegisterForm } from '@/types'
import { message } from 'antd'

const TOKEN_KEY = 'user.access_token'

let token: string | null = null

export function setToken(newToken: string) {
  token = newToken
  localStorage.setItem(TOKEN_KEY, token)
}

export function getToken() {
  if (token) {
    return token
  }
  token = localStorage.getItem(TOKEN_KEY)
  return token
}

export function removeToken() {
  token = null
  localStorage.removeItem(TOKEN_KEY)
}

export default async function request(url: string, init?: RequestInit) {
  const resp = await fetch(url, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'application/json'
    },
    ...init
  })
  if (resp.status === 401) {
    useAuth.getState().logout()
    message.error('Token expired!')
    return { error: true, message: 'Token expired', data: null }
  }
  if (resp.ok) {
    const data = await resp.json()
    return { error: false, message: null, data }
  }
  const messageText = (await resp.text()) || resp.statusText
  message.error(messageText)
  return { error: true, message: messageText, data: null }
}

function appendParams(url: string, params: Record<string, string | number>) {
  const queryParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    queryParams.append(key, String(value))
  }
  return `${url}?${queryParams.toString()}`
}

export function getInfo() {
  return request('/info')
}

export function getMyInfo() {
  return request('/api/user/me')
}

export function postLogin(data: LoginForm) {
  return request('/login', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export function postRegister(data: RegisterForm) {
  return request('/register', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export function getOrganizations() {
  return request('/api/organizations')
}

export function getOneOrganization(id: string) {
  return request(`/api/organizations/${id}`)
}

export function createOrganization(data: any) {
  return request('/api/organizations', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export function updateOrganization(id: string, data: any) {
  return request(`/api/organizations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

export function removeOrganization(id: string) {
  return request(`/api/organizations/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({})
  })
}

export function getApps(organizationId: string, args: CommonPagination) {
  return request(appendParams(`/api/apps/${organizationId}`, args))
}

export function createApp(organizationId: string,data: any) {
  return request(`/api/apps/${organizationId}`, {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export function updateApp(organizationId: string,id: string, data: any) {
  return request(`/api/apps/${organizationId}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

export function removeApp(organizationId: string,id: string) {
  return request(`/api/apps/${organizationId}/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({})
  })
}
