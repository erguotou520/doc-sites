export type SyncRecord = {
  time: Date,
  success: boolean,
  requestUrl: string,
  responseStatusCode: number,
  responseData: any,
}

export async function syncGiteaRepo(giteaUrl: string, giteaRepo: string, giteaToken: string): Promise<SyncRecord> {
  const apiUrl = `${giteaUrl}/api/v1/repos/${giteaRepo}/mirror-sync`
  const time = new Date()
  try {
    const resp = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `token ${giteaToken}`,
        'Content-Type': 'application/json'
      },
    })
    return {
      time,
      success: resp.ok,
      requestUrl: apiUrl,
      responseStatusCode: resp.status,
      responseData: JSON.stringify(await resp.json())
    }

  } catch (error) {
    console.error(error)
    let errorMessage = ''
    if (error instanceof Error) {
      errorMessage = error.message
    } else {
      try {
        errorMessage = JSON.stringify(error)
      } catch (error) {
        try {
          // @ts-ignore
          errorMessage = error.toString()
        } catch (error) {
          //
        }
      }
    }
    return {
      time,
      success: false,
      requestUrl: apiUrl,
      responseStatusCode: 0,
      responseData: errorMessage
    }
  }
}
