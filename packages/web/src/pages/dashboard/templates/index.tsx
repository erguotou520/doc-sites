import type { ActionType } from '@ant-design/pro-components'
import { ModalForm, ProForm, ProFormText, ProFormUploadButton, ProTable } from '@ant-design/pro-components'
import { Button, Form, Image, Popconfirm, type UploadFile } from 'antd'
import { useMemo, useRef } from 'react'

import { client } from '@/api'
import type { OpenAPIs } from '@/api/schema'
import { msg } from '@/components/GlobalMessage'
import TinyMCE from '@/components/TinyMCE'
import { customRequestWithBase64 } from '@/utils/upload'

type Item = OpenAPIs['post']['/api/templates']['body'] & { id: string }

function formatImage(v: string | UploadFile[]) {
  return typeof v === 'string' ? v : v[0]?.response?.url
}

const TemplatesPage = () => {
  const actionRef = useRef<ActionType>()

  const forms = useMemo(() => {
    return (
      <>
        <ProFormText
          name="name"
          label="名称"
          placeholder="请输入名称"
          rules={[{ required: true, message: '该项不能为空' }]}
        />
        <ProFormUploadButton
          name="previewImage"
          label="预览图"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          fieldProps={{ customRequest: customRequestWithBase64 }}
        />
        {/* <ProFormTextArea
          name="htmlContent"
          help="使用{{content}}作为内容插槽"
          label="html内容"
          placeholder="html内容"
        /> */}
        <ProForm.Item name="htmlContent" label="html内容">
          <TinyMCE />
        </ProForm.Item>
      </>
    )
  }, [])

  return (
    <div>
      <ProTable<Item>
        columns={[
          {
            title: '名称',
            dataIndex: 'name'
          },
          {
            title: '预览图',
            dataIndex: 'previewImage',
            renderText(v) {
              return <Image src={v} />
            }
          },
          {
            title: '操作',
            valueType: 'option',
            key: 'option',
            fixed: 'right',
            width: 120,
            render: (_, record) => [
              <ModalForm<Item>
                title="编辑"
                trigger={<a>编辑</a>}
                key="edit"
                width={800}
                autoFocusFirstInput
                initialValues={record}
                layout="horizontal"
                labelCol={{ span: 4 }}
                modalProps={{ destroyOnClose: true }}
                onFinish={async values => {
                  // @ts-ignore
                  values.previewImage = formatImage(values.previewImage)
                  const { error } = await client.put('/api/templates/{id}', {
                    params: { id: record.id },
                    body: values
                  })
                  if (!error) {
                    msg.success('保存成功')
                    actionRef.current?.reload()
                  }
                  return !error
                }}
              >
                <Form.Item hidden name="id" />
                {forms}
              </ModalForm>,
              <Popconfirm
                key="deletePopConfirm"
                title="确定要删除？"
                onConfirm={async () => {
                  const { error } = await client.delete('/api/templates/{id}', { params: { id: record.id } })
                  if (!error) {
                    msg.success('删除成功')
                    actionRef.current?.reload()
                  }
                }}
                okText="确定"
                cancelText="取消"
              >
                <a>删除</a>
              </Popconfirm>
            ]
          }
        ]}
        rowKey="id"
        actionRef={actionRef}
        scroll={{ x: 'max-content' }}
        headerTitle={
          <ModalForm<Item>
            title="新增"
            trigger={
              <Button key="create" type="primary">
                新增
              </Button>
            }
            width={800}
            autoFocusFirstInput
            layout="horizontal"
            modalProps={{ destroyOnClose: true }}
            initialValues={{ category: 'document' }}
            labelCol={{ span: 4 }}
            onFinish={async values => {
              // @ts-ignore
              values.previewImage = formatImage(values.previewImage)
              const { error } = await client.post('/api/templates', {
                body: values
              })
              if (!error) {
                msg.success('保存成功')
                actionRef.current?.reload()
              }
              return !error
            }}
          >
            {forms}
          </ModalForm>
        }
        search={false}
        // rowSelection={{
        //   selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT]
        // }}
        // tableAlertOptionRender={({ selectedRowKeys, onCleanSelected }) => {
        //   return (
        //     <Button
        //       type="link"
        //       disabled={!selectedRowKeys.length}
        //       onClick={() => {
        //         Modal.confirm({
        //           title: `确认删除所选的${selectedRowKeys.length}项数据？`,
        //           onOk: async () => {
        //             const { error } = await client.mutate({
        //               operationName: 'tag/deleteMany',
        //               input: {
        //                 ids: selectedRowKeys as number[],
        //                 deletedAt: Math.floor(+new Date() / 1000)
        //               }
        //             })
        //             if (!error) {
        //               onCleanSelected()
        //               msg.success('删除成功')
        //               actionRef.current?.reload()
        //             }
        //           }
        //         })
        //       }}
        //     >
        //       批量删除
        //     </Button>
        //   )
        // }}
        request={async ({ current, pageSize, ...params }) => {
          const { error, data } = await client.get('/api/templates', {
            query: {
              offset: (current! - 1) * pageSize!,
              limit: pageSize,
              ...params
            }
          })
          return {
            total: error ? 0 : data!.total,
            data: error ? [] : data!.list,
            success: true
          }
        }}
      />
    </div>
  )
}

export default TemplatesPage
