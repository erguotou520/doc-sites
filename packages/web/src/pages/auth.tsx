import { Outlet } from 'react-router-dom'

const AuthLayout = () => {
  return (
    <div
      className=""
      style={{
        backgroundImage: 'linear-gradient(to right, rgb(0, 180, 219), rgb(0, 131, 176))'
      }}
    >
      <div className='h-screen container max-w-320 mx-auto flex items-center justify-between pl-15 pr-30'>
        <div className="font-medium text-white mr-5 min-h-40">
          <h1 className="text-5xl">文档站点</h1>
          <p className="mt-5">
            Use <code className="inline-block bg-background rounded-md px-2 py-1 text-xs text-primary">Doc Sites</code> keep your internal Gitea server in sync with your upstream repository.
          </p>
        </div>
        <div className="w-100 bg-background rounded-md px-5 py-4">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
