import type { APIGroupServerType } from '..'

export type BeforeHandle = NonNullable<Parameters<APIGroupServerType['get']>[2]>['beforeHandle']
