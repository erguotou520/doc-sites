import type { UploadProps } from 'antd'

export const customRequestWithBase64: UploadProps['customRequest'] = async options => {
  const image = options.file
  if (!image) return
  const base64 = await new Promise(resolve => {
    const reader = new FileReader()
    reader.readAsDataURL(image as File)
    reader.onload = () => resolve(reader.result)
  })
  options.onSuccess?.({ url: base64 })
}
