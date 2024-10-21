import { getApps, getOneOrganization, removeApp } from '@/api'
import { useInfo } from '@/store'
import { AppType, OrganizationType } from '@/types'
import { copy } from '@/utils'
import { CopyOutlined, DeleteOutlined, EditOutlined, MessageOutlined, PlusOutlined, SettingOutlined } from '@ant-design/icons'
import { usePagination } from 'ahooks'
import { Breadcrumb, Button, Card, Descriptions, Divider, Drawer, Empty, Modal, Pagination, message as AntMessage } from 'antd'
import { useEffect, useRef } from 'react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import EditAppModal, { EditAppModalActions } from './components/EditAppModal'

const { useModal } = Modal
const PAGE_SIZE = 12

const AppsPage = () => {
  const { info } = useInfo()
  const params = useParams()
  const [organization, setOrganization] = useState<OrganizationType | null>(null)
  const orgId = params.id as string
  const [modal, modalContextHolder] = useModal()
  const [message, messageContextHolder] = AntMessage.useMessage()
  const [viewingApp, setViewingApp] = useState<AppType | null>(null)

  const modalRef = useRef<EditAppModalActions>()

  const request = usePagination<{ list: AppType[]; total: number }, [{ current: number; pageSize: number }]>(
    async ({ current, pageSize }) => {
      const { error, data } = await getApps(orgId, { limit: pageSize, offset: (current - 1) * pageSize })
      return error ? [] : data
    },
    {
      defaultPageSize: PAGE_SIZE
    }
  )

  const confirmDelete = (app: AppType) => {
    modal.confirm({
      title: `Delete app "${app.name}"?`,
      content: 'This operation is irreversible.',
      okButtonProps: { danger: true },
      onOk: async () => {
        const { error } = await removeApp(orgId, app.id)
        if (!error) {
          message.success('App deleted successfully.')
          request.refresh()
        }
      }
    })
  }

  const createApp = () => {
    modalRef.current?.openModal()
  }

  const editApp = (app: AppType) => {
    modalRef.current?.openModal(app)
  }

  const copyUrl = (url: string) => {
    copy(url)
    message.success('Copied to clipboard.')
  }

  useEffect(() => {
    if (orgId) {
      getOneOrganization(orgId).then(resp => {
        setOrganization(resp.error ? null : resp.data)
      })
    }
  }, [orgId])

  const createBtn = (
    <Button type="dashed" className="flex items-center" onClick={() => createApp()}>
      <PlusOutlined /> Create an App
    </Button>
  )

  return (
    <div>
      <Breadcrumb items={[
        { title: organization?.name },
        { title: 'Apps' }
      ]} />
      <Divider />
      {!!request.data?.list.length && createBtn}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {request.data?.list.map(app => (
          <Card
            key={app.id}
            title={app.name}
            actions={[
              <EditOutlined className="cursor-pointer" onClick={() => editApp(app)} />,
              <SettingOutlined className="cursor-pointer" onClick={() => setViewingApp(app)} />,
              <DeleteOutlined className="!hover:text-red-500 cursor-pointer" onClick={() => confirmDelete(app)} />
            ]}
          >
            <div className="text-sm">Gitea: {app.giteaRepo}</div>
          </Card>
        ))}
      </div>
      <Pagination
        hideOnSinglePage
        total={request.data?.total}
        pageSize={request.pagination.pageSize}
        current={request.pagination.current}
        onChange={v => request.run({ current: v, pageSize: PAGE_SIZE })}
      />
      {!request.loading && request.data?.list.length === 0 && (
        <Empty className="my-10 flex flex-col items-center justify-center" description="No apps found.">
          {createBtn}
        </Empty>
      )}
      <Drawer title="App API Key" width={600} open={viewingApp !== null} onClose={() => setViewingApp(null)}>
        <Descriptions column={1}
          contentStyle={{ overflow: 'hidden' }}
          items={[
            { label: 'App name', children: viewingApp?.name },
            { label: 'Upstream Repository Type', children: viewingApp?.upstreamRepoType },
            { label: 'Upstream Repository URL', children: viewingApp?.upstreamRepoUrl },
            { label: 'Upstream Webhook Secret Token', children: viewingApp?.upstreamSecretToken },
            { label: 'Gitea Repository', children: viewingApp?.giteaRepo },
            { label: 'Gitea API Token', children: viewingApp?.giteaToken },
            {
              label: 'Generated Webhook URL', children: (
                <>
                  <div className="truncate">{info.publicUrl}{viewingApp?.generatedWebhookUrl}</div>
                  <CopyOutlined
                    className="ml-2 cursor-pointer hover:text-primary"
                    onClick={() => copyUrl(info.publicUrl + viewingApp!.generatedWebhookUrl)}
                  />
                </>
              )
            }
          ]}>
        </Descriptions>
      </Drawer>
      <EditAppModal actionRef={modalRef} onFinish={() => request.refresh()} />
      {modalContextHolder}
      {messageContextHolder}
    </div>
  )
}

export default AppsPage
