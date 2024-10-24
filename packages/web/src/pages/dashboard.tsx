import { AppRoutes } from '@/constants'
import { useAuth } from '@/store'
import { FileOutlined, SettingOutlined, TagsOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons'
import { Dropdown, Menu, Modal } from 'antd'
import { useEffect } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'

const { useModal } = Modal

const adminMenus = [
  { key: 'tags', label: '标签管理', icon: <TagsOutlined /> },
  { key: 'templates', label: '模板管理', icon: <FileOutlined /> },
  { key: 'users', label: '用户管理', icon: <UserOutlined /> },
  { key: 'apps', label: '应用管理', icon: <TeamOutlined /> },
  { key: 'documents', label: '文档管理', icon: <FileOutlined /> },
  { key: 'settings', label: '系统设置', icon: <SettingOutlined /> }
]

const userMenus = [
  { key: 'recent', label: '最近文档', icon: <FileOutlined /> },
  { key: 'invited', label: '我参与的', icon: <FileOutlined /> }
]

const DashboardLayout = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { user, computed: { role }, logout } = useAuth()
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
      if (role === 'admin') {
        navigate(AppRoutes.DashboardTags, { replace: true })
      } else {
        navigate(AppRoutes.DashboardDocumentsRecent, { replace: true })
      }
    }
  }, [pathname, role, navigate])

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
          items={role === 'admin' ? adminMenus : userMenus}
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
