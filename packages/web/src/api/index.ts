import { msg } from '@/components/GlobalMessage'
import { getAccessToken } from '@/store/token'
import { createFetchClient } from '@doremijs/o2t/client'
import type { OpenAPIs } from './schema'

export const client = createFetchClient<OpenAPIs>({
  requestTimeoutMs: 10000,
  // ... other options
  // requestInterceptor and responseInterceptor are optional
  requestInterceptor(request) {
    const token = getAccessToken()
    if (!['/login', '/register'].includes(request.url) && token) {
      request.init.headers.Authorization = `Bearer ${token}`
    }
    return request
  },
  // responseInterceptor(request, response,e) {
  //   // Handle response here
  //   return response
  // },
  async errorHandler(request, response, error) {
    if (error) {
      msg.error(error.message)
    } else {
      try {
        const contentType = response?.headers.get('content-type')
        if (contentType?.includes('application/json')) {
          const resp = await response?.clone().json()
          msg.error(resp?.message || '服务器错误')
        } else {
          msg.error(await response?.text() || '服务器错误')
        }
      } catch (e) {
        msg.error('服务器错误')
      }
    }
    console.error(request, response, error)
  }
})
