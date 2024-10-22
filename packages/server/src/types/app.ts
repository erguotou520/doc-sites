import type { server } from '../index'

export type ServerType = typeof server

export type BeforeHandle = NonNullable<Parameters<ServerType['get']>[2]>['beforeHandle']
