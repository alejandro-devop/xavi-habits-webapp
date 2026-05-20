import { useQuery } from '@tanstack/react-query'

async function fetchExampleMessage(): Promise<{ message: string }> {
  await new Promise((resolve) => setTimeout(resolve, 100))
  return { message: 'Hello from React Query' }
}

export function useExampleQuery() {
  return useQuery({
    queryKey: ['example', 'message'],
    queryFn: fetchExampleMessage,
    staleTime: 1000 * 60 * 5,
  })
}
