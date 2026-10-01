import { BrowserRouter, Outlet, Route, Routes } from 'react-router'
import { protectedAreas } from './auth/roleAccess'
import ProtectedRoute from './components/ProtectedRoute'
import RoleRoute from './components/RoleRoute'
import AppLayout from './layouts/AppLayout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout>
                <Outlet />
              </AppLayout>
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<HomePage />} />
          {protectedAreas.map((area) => (
            <Route
              key={area.path}
              path={area.path}
              element={
                <RoleRoute allowedRoles={area.allowedRoles}>
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                    {area.title}
                  </h1>
                </RoleRoute>
              }
            />
          ))}
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
