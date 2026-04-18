import { useEffect } from "react"
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom"
import { useAuth } from "./hooks/useAuth"
import { BookingFormPage } from "./pages/BookingFormPage"
import { BookingSuccess } from "./pages/BookingSuccess"
import { EventBooking } from "./pages/EventBooking"
import { EventCreate } from "./pages/EventCreate"
import { EventEdit } from "./pages/EventEdit"
import { EventsList } from "./pages/EventsList"
import { PublicEventsList } from "./pages/PublicEventsList"

// Auth initializer for admin routes
function AdminAuthCheck() {
  const { isAuthenticated, promptLogin } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      promptLogin()
    }
  }, [isAuthenticated, promptLogin])

  return isAuthenticated ? <Outlet /> : null
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<PublicEventsList />} />
        <Route path="/e/:slug" element={<EventBooking />} />
        <Route path="/e/:slug/book" element={<BookingFormPage />} />
        <Route
          path="/bookings/:id/success"
          element={<BookingSuccess />}
        />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={<Navigate to="/admin/events" replace />}
        />
        {/* <Route element={<AdminAuthCheck />}> */}
        <Route path="/admin/events" element={<EventsList />} />
        <Route path="/admin/events/new" element={<EventCreate />} />
        <Route
          path="/admin/events/:slug/edit"
          element={<EventEdit />}
        />
        {/* </Route> */}

        {/* 404 fallback */}
        <Route
          path="*"
          element={
            <div style={{ padding: 40, textAlign: "center" }}>
              <h1>404</h1>
              <p>Страница не найдена</p>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
