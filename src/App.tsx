import { BrowserRouter, Outlet, Route, Routes } from 'react-router'
import { protectedFeatures } from './auth/roleAccess'
import ProtectedRoute from './components/ProtectedRoute'
import RoleRoute from './components/RoleRoute'
import AppLayout from './layouts/AppLayout'
import ApprovedPermitsPage from './pages/ApprovedPermitsPage'
import EmployeesPage from './pages/EmployeesPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import PendingPermitsPage from './pages/PendingPermitsPage'
import PersonalPermitPage from './pages/PersonalPermitPage'

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
          {protectedFeatures.map((feature) => (
            <Route
              key={feature.path}
              path={feature.path}
              element={
                <RoleRoute allowedRoles={feature.allowedRoles}>
                  {feature.path === '/employees' ? (
                    <EmployeesPage />
                  ) : feature.path === '/permits/create' ? (
                    <PersonalPermitPage />
                  ) : feature.path === '/permits/pending' ? (
                    <PendingPermitsPage />
                  ) : feature.path === '/permits/approved' ? (
                    <ApprovedPermitsPage />
                  ) : (
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                      {feature.label}
                    </h1>
                  )}
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
