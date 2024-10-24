import type { ActionType } from '@ant-design/pro-components'
import { ProTable } from '@ant-design/pro-components'
import { useRef } from 'react'

import { client } from '@/api'
import type { OpenAPIs } from '@/api/schema'

type Item = OpenAPIs['post']['/api/users']['body'] & { id: string }

const UsersPage = () => {
  const actionRef = useRef<ActionType>()

  return (
    <div>
      <ProTable<Item>
        columns={[
          {
            title: '用户名',
            dataIndex: 'username'
          },
          {
            title: '昵称',
            dataIndex: 'nickname'
          },
          {
            title: '头像',
            dataIndex: 'avatar',
            valueType: 'image'
          }
        ]}
        rowKey="id"
        actionRef={actionRef}
        scroll={{ x: 'max-content' }}
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

export default UsersPage
