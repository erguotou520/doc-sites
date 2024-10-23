import { AppRoutes } from '@/constants'
import { useAuth } from '@/store'
import { FileOutlined, TagsOutlined } from '@ant-design/icons'
import { Dropdown, Menu, Modal } from 'antd'
import { useEffect } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'

const { useModal } = Modal

const DashboardLayout = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const [modal, modalContextHolder] = useModal()

  const confirmLogout = () => {
    modal.confirm({
      title: 'Confirm logout',
      content: 'Are you sure you want to logout?',
      okButtonProps: { danger: true },
      onOk: () => {
        logout()
      }
    })
  }

  useEffect(() => {
    if (pathname === AppRoutes.Dashboard) {
      // navigate(AppRoutes.Organizations, { replace: true })
    }
  }, [pathname, navigate])

  return (
    <div>
      <header className="h-15 flex items-center shadow">
        <div className="container max-w-240 px-2 mx-auto flex justify-between items-center">
          <NavLink to={AppRoutes.Dashboard} className="text-2xl font-bold text-primary">Doc sites</NavLink>
          <Dropdown
            menu={{
              items: [{ key: 'logout', label: 'Logout', onClick: confirmLogout }]
            }}
          >
            <a className="cursor-pointer">{user?.nickname}</a>
          </Dropdown>
        </div>
      </header>
      <main className="container max-w-240 mx-auto mt-10 px-2 flex">
        <Menu
          className="w-40 mr-4"
          mode="vertical"
          selectedKeys={[pathname.replace('/dashboard/', '')]}
          items={[
            { key: 'tags', label: '标签管理', icon: <TagsOutlined /> },
            { key: 'templates', label: '模板管理', icon: <FileOutlined /> }
          ]}
          onClick={({ key }) => {
            navigate(`/dashboard/${key}`)
          }}
        />
        <div className="flex-1">
          <Outlet />
        </div>
      </main>
      {modalContextHolder}
    </div>
  )
}

export default DashboardLayout
