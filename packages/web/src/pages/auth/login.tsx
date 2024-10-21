import { AppRoutes } from '@/constants'
import { useAuth, useInfo } from '@/store'
import { LoginForm } from '@/types'
import { Button, Form, Input } from 'antd'
import { NavLink, useNavigate } from 'react-router-dom'

const LoginPage = () => {
  const { info: { disableRegistration } } = useInfo()
  const navigate = useNavigate()
  const { login } = useAuth()
  const onFinish = async (values: LoginForm) => {
    if (await login(values)) {
      navigate(AppRoutes.Dashboard)
    }
  }

  return (
    <Form<LoginForm> name="login" initialValues={{ remember: true }} onFinish={onFinish}>
      <Form.Item>
        <h2 className="text-center text-2xl font-medium">Login</h2>
      </Form.Item>
      <Form.Item name="username" rules={[{ required: true, message: 'Please input your username!' }]}>
        <Input placeholder="Username" autoComplete='username' />
      </Form.Item>

      <Form.Item name="password" rules={[{ required: true, message: 'Please input your password!' }]}>
        <Input.Password placeholder="Password" autoComplete='current-password' />
      </Form.Item>

      <Form.Item>
        <Button className="w-full" type="primary" htmlType="submit">
          Login
        </Button>
        {!disableRegistration && <div className="mt-4 flex items-center">
          Do not have an account?{' '}
          <NavLink to={AppRoutes.Register} className="ml-1 text-primary">
            Register
          </NavLink>
        </div>}
      </Form.Item>
    </Form>
  )
}

export default LoginPage
