import { createOrganization, updateOrganization } from '@/api'
import { useDisclosure } from '@/hooks'
import { OrganizationType } from '@/types'
import { useRequest } from 'ahooks'
import { Form, Input, InputNumber, Modal, Switch, message } from 'antd'
import { useEffect, useMemo, useState } from 'react'

export type EditOrganizationModalActions = {
  openModal: (organization?: OrganizationType) => void
}

type EditOrganizationModalProps = {
  actionRef: React.MutableRefObject<EditOrganizationModalActions | undefined>
  onFinish?: () => void
}

const EditOrganizationModal = ({ actionRef, onFinish }: EditOrganizationModalProps) => {
  const [form] = Form.useForm()
  const [organization, setOrganization] = useState<OrganizationType>()
  const isEdit = !!organization
  const [opened, { open, close }] = useDisclosure()

  const initialValues = useMemo(() => {
    if (isEdit) {
      return organization
    }
    return {
      rateLimitEnabled: false,
      rateLimitCount: 1,
      rateLimitDuration: 60
    }
  }, [isEdit, organization])

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
        const { error } = await updateOrganization(organization.id, values)
        if (!error) {
          message.success('Organization updated successfully')
          form.resetFields()
        }
        success = !error
      } else {
        const { error } = await createOrganization(values)
        if (!error) {
          message.success('Organization created successfully')
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
        openModal: (organization?: OrganizationType) => {
          setOrganization(organization)
          form.setFieldsValue(organization)
          open()
        }
      }
    }
  }, [form, open])

  return (
    <Modal
      title={isEdit ? 'Edit organization' : 'Create organization'}
      open={opened}
      onCancel={onCancel}
      okButtonProps={{
        htmlType: 'submit',
        loading: submitRequest.loading
      }}
      onOk={submitRequest.run}
    >
      <Form labelCol={{ span: 5 }} form={form} initialValues={initialValues}>
        <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Please input organization name!' }]}>
          <Input placeholder="Organization name" maxLength={12} />
        </Form.Item>
          <Form.Item label="Gitea URL" name="giteaUrl" rules={[{ required: true, message: 'Please input organization name!' }]}>
            <Input placeholder="eg: https://gitea.com" />
          </Form.Item>
          <Form.Item label="Gitea api token" name="giteaToken" tooltip="https://docs.gitea.com/development/api-usage">
            <Input placeholder="Gitea api token" />
          </Form.Item>
      </Form>
    </Modal>
  )
}

export default EditOrganizationModal
