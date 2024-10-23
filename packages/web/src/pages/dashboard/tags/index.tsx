import type { ActionType } from '@ant-design/pro-components'
import {
  ModalForm,
  ProFormColorPicker,
  ProFormRadio,
  ProFormText,
  ProFormTextArea,
  ProTable
} from '@ant-design/pro-components'
import { Button, Form, Popconfirm } from 'antd'
import { useMemo, useRef } from 'react'

import { client } from '@/api'
import type { OpenAPIs } from '@/api/schema'
import { msg } from '@/components/GlobalMessage'
import type { Color } from 'antd/es/color-picker'

type Item = OpenAPIs['post']['/api/tags']['body'] & { id: string }

function formatColor(v: string | Color | undefined) {
  return typeof v === 'string' ? v : v?.toHexString()
}

const TagsPage = () => {
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
        <ProFormColorPicker name="color" label="颜色" />
        <ProFormRadio.Group
          name="category"
          label="分类"
          options={[{ label: '文档', value: 'document' }]}
          rules={[{ required: true, message: '该项不能为空' }]}
        />
        <ProFormTextArea name="remark" label="备注" placeholder="请输入备注" />
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
            title: '颜色',
            dataIndex: 'color',
            renderText(v) {
              return <div className="w-12 h-6 rounded" style={{ background: v }} />
            }
          },
          {
            title: '分类',
            dataIndex: 'category',
            valueEnum: {
              document: '文档'
            }
          },
          {
            title: '备注',
            dataIndex: 'remark',
            ellipsis: true
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
                width={640}
                autoFocusFirstInput
                initialValues={record}
                layout="horizontal"
                labelCol={{ span: 4 }}
                modalProps={{ destroyOnClose: true }}
                onFinish={async values => {
                  values.color = formatColor(values.color)
                  const { error } = await client.put('/api/tags/{id}', {
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
                  const { error } = await client.delete('/api/tags/{id}', { params: { id: record.id } })
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
            width={640}
            autoFocusFirstInput
            layout="horizontal"
            modalProps={{ destroyOnClose: true }}
            initialValues={{ category: 'document' }}
            labelCol={{ span: 4 }}
            onFinish={async values => {
              values.color = formatColor(values.color)
              const { error } = await client.post('/api/tags', {
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
          const { error, data } = await client.get('/api/tags', {
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

export default TagsPage
