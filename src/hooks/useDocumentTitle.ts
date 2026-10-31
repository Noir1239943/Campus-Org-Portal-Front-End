import { useEffect } from 'react'

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · CPC Campus Organizations` : 'CPC Campus Organizations'
  }, [title])
}
