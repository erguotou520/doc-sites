import { getOrganizations, removeOrganization } from '@/api'
import { AppRoutes } from '@/constants'
import { OrganizationType } from '@/types'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { useRequest } from 'ahooks'
import { Button, Card, Empty, Modal, message as AntMessage } from 'antd'
import { useRef } from 'react'
import { NavLink } from 'react-router-dom'
import EditOrganizationModal, { EditOrganizationModalActions } from './components/EditOrganizationModal'

const { useModal } = Modal

const OrganizationsPage = () => {
  const [modal, modalContextHolder] = useModal()
  const [message, messageContextHolder] = AntMessage.useMessage()

  const modalRef = useRef<EditOrganizationModalActions>()

  const request = useRequest<OrganizationType[], []>(
    async () => {
      const { error, data } = await getOrganizations()
      return error ? [] : data
    }
  )

  const confirmDelete = (organization: OrganizationType) => {
    modal.confirm({
      title: `Delete organization "${organization.name}"?`,
      content: 'This operation is irreversible.',
      okButtonProps: { danger: true },
      onOk: async () => {
        const { error } = await removeOrganization(organization.id)
        if (!error) {
          message.success('Organization deleted successfully.')
          request.refresh()
        }
      }
    })
  }

  const createOrganization = () => {
    modalRef.current?.openModal()
  }

  const editOrganization = (organization: OrganizationType) => {
    modalRef.current?.openModal(organization)
  }

  const createBtn = (
    <Button type="dashed" className="flex items-center" onClick={() => createOrganization()}>
      <PlusOutlined /> Create an Organization
    </Button>
  )

  return (
    <>
      {!!request.data?.length && createBtn}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {request.data?.map(organization => (
          <Card
            key={organization.id}
            title={<NavLink className="text-foreground" to={`${AppRoutes.Organizations}/${organization.id}`}>{organization.name}</NavLink>}
            actions={[
              <EditOutlined className="cursor-pointer" onClick={() => editOrganization(organization)} />,
              <DeleteOutlined className="!hover:text-red-500 cursor-pointer" onClick={() => confirmDelete(organization)} />
            ]}
          >
            <div className="text-sm">{organization.giteaUrl}</div>
          </Card>
        ))}
      </div>
      {!request.loading && request.data?.length === 0 && (
        <Empty className="my-10 flex flex-col items-center justify-center" description="No organizations found.">
          {createBtn}
        </Empty>
      )}
      <EditOrganizationModal actionRef={modalRef} onFinish={() => request.refresh()} />
      {modalContextHolder}
      {messageContextHolder}
    </>
  )
}

export default OrganizationsPage
