import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { Provider } from 'react-redux'
import Register from './pages/Register'
import Home from './pages/Home'
import Login from './pages/Login'
import MainLayout from './layouts/MainLayout'
import ProtectedRoute, { GuestOnlyRoute, RegistrationRoute } from './components/ProtectedRoute'
import { store } from './app/store'

const router = createBrowserRouter([
  {
    path: '/',
    Component: MainLayout,
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        ),
      },
      {
        path: 'login',
        element: (
          <GuestOnlyRoute>
            <Login />
          </GuestOnlyRoute>
        ),
      },
      {
        path: 'register',
        element: (
          <RegistrationRoute>
            <Register />
          </RegistrationRoute>
        ),
      },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <RouterProvider router={router} />
  </Provider>
)
