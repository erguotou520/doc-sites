import { client } from '@/api'
import { create } from 'zustand'

export type InfoState = {
  ready: boolean
  info: { publicUrl: string, disableRegistration: boolean }
  init: () => Promise<void>
}

export const useInfo = create<InfoState>((set, get) => ({
  ready: false,
  info: { publicUrl: location.origin, disableRegistration: false },
  async init() {
    if (get().ready) {
      return
    }
    const { data } = await client.get('/info')
    if ('disableRegistration' in data) {
      set({
        info: data
      })
    }
    set({ ready: true })
  }
}))
