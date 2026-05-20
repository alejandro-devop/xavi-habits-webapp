export const env = {
  appName: import.meta.env.VITE_APP_NAME,
  appVersion: import.meta.env.VITE_APP_VERSION,
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
} as const
