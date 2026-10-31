import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import axios from 'axios'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/context/AuthContext'
import { AppRouter } from '@/routes/AppRouter'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: true,
      // Don't retry permission / validation errors; retry once for network hiccups.
      retry: (failureCount, error) => {
        const status = axios.isAxiosError(error) ? error.response?.status : undefined
        if (status && status >= 400 && status < 500) return false
        return failureCount < 1
      },
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
      <Toaster position="top-center" richColors closeButton />
    </QueryClientProvider>
  )
}
