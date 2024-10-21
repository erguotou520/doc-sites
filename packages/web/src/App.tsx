import { ConfigProvider, theme as antdTheme } from 'antd'
import { Suspense, useEffect, useState } from 'react'
import { HashRouter as Router, useLocation, useNavigate, useRoutes } from 'react-router-dom'
import routes from '~react-pages'
import { GlobalHistory } from './components/GlobalHistory'
import { AppRoutes } from './constants'
import { useTheme } from './hooks/theme'
import { useAuth, useInfo } from './store'

function App() {
  const { init: initAuth } = useAuth()
  const { init: initInfo } = useInfo()
  const [ready, setReady] = useState(false)
  const theme = useTheme()

  useEffect(() => {
    Promise.all([initAuth(),
    initInfo()]).catch(() => { }).then(() => {
      setReady(true)
    })
  }, [])

  return (
    <Router>
      <GlobalHistory />
      <ConfigProvider theme={{
        token: {
          colorPrimary: '#18181b',
        },
        algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm
      }}>
        {ready ? <_App /> : <></>}
      </ConfigProvider>
    </Router>
  )
}

function _App() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const {
    ready,
    computed: { logged }
  } = useAuth()

  useEffect(() => {
    if (ready) {
      if (!logged) {
        if (pathname !== AppRoutes.Login && pathname !== AppRoutes.Register && pathname !== AppRoutes.PublicMessages) {
          navigate(AppRoutes.Login, { replace: true })
        }
      }
    }
  }, [ready, logged, pathname, navigate])

  useEffect(() => { }, [])

  return <Suspense fallback={null}>{useRoutes(routes)}</Suspense>
}

export default App
