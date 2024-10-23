export const TOKEN_STORE_KEY = 'user_token'

let _accessToken = localStorage.getItem(TOKEN_STORE_KEY)

export function setAccessToken(accessToken: string) {
  _accessToken = accessToken
  localStorage.setItem(TOKEN_STORE_KEY, accessToken)
}

export function clearToken() {
  _accessToken = null
  localStorage.removeItem(TOKEN_STORE_KEY)
}

export function getAccessToken() {
  return _accessToken
}
