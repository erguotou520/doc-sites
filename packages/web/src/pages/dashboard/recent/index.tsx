import type { ActionType } from '@ant-design/pro-components'
import { ProTable } from '@ant-design/pro-components'
import { useRef } from 'react'

import { client } from '@/api'
import { NavLink } from 'react-router-dom'

const MyRecentDocumentsPage = () => {
  const actionRef = useRef<ActionType>()

  return (
    <div>
      <ProTable
        columns={[
          {
            title: '标题',
            dataIndex: 'name'
          },
          {
            title: '应用名',
            dataIndex: ['app', 'name']
          },
          {
            title: '创建人',
            dataIndex: 'creator'
          },
          {
            title: '操作',
            valueType: 'option',
            key: 'option',
            fixed: 'right',
            width: 120,
            render: (_, record) => [
              <NavLink key="edit" to={`/dashboard/documents/${record.id}`}>
                开始编辑
              </NavLink>
            ]
          }
        ]}
        rowKey="id"
        actionRef={actionRef}
        scroll={{ x: 'max-content' }}
        search={false}
        request={async ({ current, pageSize, ...params }) => {
          const { error, data } = await client.get('/api/documents/recent', {
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

export default MyRecentDocumentsPage
