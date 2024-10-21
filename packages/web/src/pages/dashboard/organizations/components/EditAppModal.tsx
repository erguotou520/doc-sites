import { createApp, updateApp } from '@/api'
import { useDisclosure } from '@/hooks'
import { AppType } from '@/types'
import { useRequest } from 'ahooks'
import { Form, Input, Modal, Select, message } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

export type EditAppModalActions = {
  openModal: (app?: AppType) => void
}

type EditAppModalProps = {
  actionRef: React.MutableRefObject<EditAppModalActions | undefined>
  onFinish?: () => void
}

const EditAppModal = ({ actionRef, onFinish }: EditAppModalProps) => {
  const params = useParams()
  const orgId = params.id as string
  const [form] = Form.useForm()
  const [app, setApp] = useState<AppType>()
  const isEdit = !!app
  const [opened, { open, close }] = useDisclosure()

  const initialValues = useMemo(() => {
    if (isEdit) {
      return app
    }
    return {
      upstreamRepoType: 'codeup'
    }
  }, [isEdit, app])

  const onCancel = () => {
    close()
    form.resetFields()
  }

  const submitRequest = useRequest(
    async () => {
      const values = await form.validateFields()
      if (!values) {
        return false
      }
      let success = true
      if (isEdit) {
        const { error } = await updateApp(orgId, app.id, values)
        if (!error) {
          message.success('App updated successfully')
          form.resetFields()
        }
        success = !error
      } else {
        const { error } = await createApp(orgId, values)
        if (!error) {
          message.success('App created successfully')
          form.resetFields()
        }
        success = !error
      }
      if (success && onFinish) {
        close()
        onFinish()
      }
      return success
    },
    {
      manual: true
    }
  )

  useEffect(() => {
    if (!actionRef?.current) {
      actionRef.current = {
        openModal: (app?: AppType) => {
          setApp(app)
          form.setFieldsValue(app)
          open()
        }
      }
    }
  }, [form, open])

  return (
    <Modal
      title={isEdit ? 'Edit app' : 'Create app'}
      open={opened}
      width={800}
      onCancel={onCancel}
      okButtonProps={{
        htmlType: 'submit',
        loading: submitRequest.loading
      }}
      onOk={submitRequest.run}
    >
      <Form labelCol={{ span: 8 }} form={form} initialValues={initialValues}>
        <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Please input app name!' }]}>
          <Input placeholder="App name" maxLength={50} />
        </Form.Item>
        <Form.Item label="Upstream Repository Type" name="upstreamRepoType" rules={[{ required: true }]}>
          <Select options={[{ label: 'Aliyun Codeup', value: 'codeup' }]} />
        </Form.Item>
        <Form.Item label="Upstream Repository URL" name="upstreamRepoUrl">
          <Input placeholder="eg: https://codeup.aliyun.com/1234567890/org/repo" />
        </Form.Item>
        <Form.Item label="Upstream Webhook Secret Token" name="upstreamSecretToken">
          <Input placeholder="must same with the token in upstream webhook settings" />
        </Form.Item>
        <Form.Item label="Gitea Repository" name="giteaRepo" rules={[{ required: true, message: 'Please input Gitea repository name!' }]}>
          <Input placeholder="eg: organization/repository" />
        </Form.Item>
        <Form.Item label="Gitea api token" name="giteaToken" tooltip="https://docs.gitea.com/development/api-usage">
          <Input placeholder="Gitea api token" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default EditAppModal
