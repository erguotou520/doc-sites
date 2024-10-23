export type OpenAPIComponents = {
  schemas: {},
  responses: never,
  // parameters: {},
  // headers: {},
  requestBodies: never
}
export type OpenAPIs = {
  get: {
    '/health': {
      query: never,
      params: never,
      headers: never,
      body: never,
      response: any
    },
    '/info': {
      query: never,
      params: never,
      headers: never,
      body: never,
      response: any
    },
    '/api/user/me': {
      query: never,
      params: never,
      headers: never,
      body: never,
      response: any
    },
    '/api/apps': {
      query: {
        offset?: (string | number),
        limit?: (string | number)
      },
      params: never,
      headers: never,
      body: never,
      response: any
    },
    '/api/apps/participated': {
      query: never,
      params: never,
      headers: never,
      body: never,
      response: any
    },
    '/api/apps/{id}': {
      query: never,
      params: {
        id: string
      },
      headers: never,
      body: never,
      response: any
    },
    '/api/documents/{appId}': {
      query: {
        offset?: (string | number),
        limit?: (string | number)
      },
      params: {
        appId: string
      },
      headers: never,
      body: never,
      response: any
    },
    '/api/documents/invited': {
      query: {
        offset?: (string | number),
        limit?: (string | number)
      },
      params: never,
      headers: never,
      body: never,
      response: any
    },
    '/api/documents/recent': {
      query: {
        offset?: (string | number),
        limit?: (string | number)
      },
      params: never,
      headers: never,
      body: never,
      response: any
    },
    '/api/documents/{appId}/trashed': {
      query: {
        offset?: (string | number),
        limit?: (string | number)
      },
      params: {
        appId: string
      },
      headers: never,
      body: never,
      response: any
    },
    '/api/documents/{appId}/{id}': {
      query: never,
      params: {
        appId: string,
        id: string
      },
      headers: never,
      body: never,
      response: any
    },
    '/api/tags': {
      query: {
        offset?: (string | number),
        limit?: (string | number)
      },
      params: never,
      headers: never,
      body: never,
      response: any
    },
    '/api/templates': {
      query: {
        offset?: (string | number),
        limit?: (string | number)
      },
      params: never,
      headers: never,
      body: never,
      response: any
    },
    '/view/{appName}/{slug}': {
      query: never,
      params: {
        appName: string,
        slug: string
      },
      headers: never,
      body: never,
      response: any
    }
  },
  post: {
    '/register': {
      query: never,
      params: never,
      headers: never,
      body: {
        username: string,
        nickname: (string | any),
        password: string
      },
      response: any
    },
    '/login': {
      query: never,
      params: never,
      headers: never,
      body: {
        username: string,
        password: string
      },
      response: any
    },
    '/api/apps': {
      query: never,
      params: never,
      headers: never,
      body: {
        name: string,
        title: string,
        logo?: string,
        description?: string
      },
      response: any
    },
    '/api/apps/{id}/invite': {
      query: never,
      params: {
        id: string
      },
      headers: never,
      body: {
        userIds: string[]
      },
      response: any
    },
    '/api/documents/{appId}': {
      query: never,
      params: {
        appId: string
      },
      headers: never,
      body: {
        title: string,
        content: string,
        templateId: string,
        slug: string,
        publish: boolean
      },
      response: any
    },
    '/api/documents/{appId}/{id}/invite': {
      query: never,
      params: {
        appId: string,
        id: string
      },
      headers: never,
      body: {
        userIds: string[]
      },
      response: any
    },
    '/api/tags': {
      query: never,
      params: never,
      headers: never,
      body: {
        name: string,
        color?: string,
        category: any,
        remark?: string
      },
      response: any
    },
    '/api/templates': {
      query: never,
      params: never,
      headers: never,
      body: {
        name: string,
        previewImage?: string,
        htmlContent: string
      },
      response: any
    }
  },
  put: {
    '/api/user/me': {
      query: never,
      params: never,
      headers: never,
      body: {
        nickname?: string,
        avatar?: string
      },
      response: any
    },
    '/api/apps/{id}': {
      query: never,
      params: {
        id: string
      },
      headers: never,
      body: {
        logo?: string,
        title: string,
        description?: string
      },
      response: any
    },
    '/api/documents/{appId}/{id}': {
      query: never,
      params: {
        appId: string,
        id: string
      },
      headers: never,
      body: {
        title: string,
        templateId: string,
        slug: string,
        publish?: boolean
      },
      response: any
    },
    '/api/documents/{appId}/{id}/content': {
      query: never,
      params: {
        appId: string,
        id: string
      },
      headers: never,
      body: {
        content: string
      },
      response: any
    },
    '/api/tags/{id}': {
      query: never,
      params: {
        id: string
      },
      headers: never,
      body: {
        name: string,
        color?: string,
        category: any,
        remark?: string
      },
      response: any
    },
    '/api/templates/{id}': {
      query: never,
      params: {
        id: string
      },
      headers: never,
      body: {
        previewImage?: string,
        htmlContent: string
      },
      response: any
    }
  },
  delete: {
    '/api/apps/{id}': {
      query: never,
      params: {
        id: string
      },
      headers: never,
      body: never,
      response: any
    },
    '/api/apps/{id}/removeUsers': {
      query: never,
      params: {
        id: string
      },
      headers: never,
      body: {
        userIds: string[]
      },
      response: any
    },
    '/api/documents/{appId}/{id}': {
      query: never,
      params: {
        appId: string,
        id: string
      },
      headers: never,
      body: never,
      response: any
    },
    '/api/documents/{appId}/{id}/removeUsers': {
      query: never,
      params: {
        appId: string,
        id: string
      },
      headers: never,
      body: {
        userIds: string[]
      },
      response: any
    },
    '/api/tags/{id}': {
      query: never,
      params: {
        id: string
      },
      headers: never,
      body: never,
      response: any
    },
    '/api/templates/{id}': {
      query: never,
      params: {
        id: string
      },
      headers: never,
      body: never,
      response: any
    }
  }
}