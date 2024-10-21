import { removeToken } from '@/api'
import { globalNavigate } from '@/components/GlobalHistory'
import { AppRoutes } from '@/constants'

export function onExpired() {
  removeToken()
  globalNavigate(AppRoutes.Login, { replace: true })
}

export function copy(text: string) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text)
  } else {
    const input = document.createElement('input')
    input.value = text
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
  }
}
