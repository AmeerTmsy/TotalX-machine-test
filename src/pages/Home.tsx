import Logo from '../assets/logo.png'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { logout, selectUser } from '../app/features/auth/authSlice'

export default function Home() {
  const dispatch = useAppDispatch()
  const user = useAppSelector(selectUser)

  const handleLogout = () => {
    dispatch(logout())
  }

  return (
    <div className="relative min-h-screen bg-white">
      <div className="absolute top-10 right-10">
        <img
          src={Logo}
          alt="TotalX"
          className="h-24 w-24 object-contain"
        />
      </div>

      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-xl text-center">
          <h1 className="mb-10 text-4xl font-semibold tracking-tight text-gray-900">
            {user.mobileNumber}
          </h1>
          <button
            onClick={handleLogout}
            className="h-14 w-full rounded bg-indigo-600 text-lg font-semibold text-white transition hover:bg-indigo-700"
          >
            Log Out
          </button>

          <div className="mt-14 flex items-center gap-4">
            <div className="h-px flex-1 bg-gray-200" />
            <div className="h-px flex-1 bg-gray-200" />
          </div>
        </div>
      </div>
    </div>
  )
}
