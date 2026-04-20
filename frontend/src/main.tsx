import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { MantineProvider } from "@mantine/core"
import { Notifications } from "@mantine/notifications"
import { DatesProvider } from "@mantine/dates"
import "dayjs/locale/ru"

// Import Mantine styles
import "@mantine/core/styles.css"
import "@mantine/notifications/styles.css"
import "@mantine/dates/styles.css"

import App from "./App"

// Initialize MSW in development
async function initMocks() {
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser')
    await worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: {
        url: '/mockServiceWorker.js',
        options: {
          scope: '/',
        },
      },
    })
    console.log('[MSW] Mock Service Worker started')
  }
}

const theme = {
  primaryColor: "blue",
  defaultRadius: "md",
  fontFamily:
    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

// Initialize mocks and then render
initMocks().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <MantineProvider theme={theme}>
        <DatesProvider settings={{ locale: "ru" }}>
          <Notifications />
          <App />
        </DatesProvider>
      </MantineProvider>
    </StrictMode>,
  )
})
