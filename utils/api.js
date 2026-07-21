import { getApiBaseUrl } from '@/lib/config'

export const api = (path) => {
  const base = getApiBaseUrl()
  if (!path || !base) {
    console.warn(
      `[API WARN] 無效 API 路徑或環境變數: API_URL=${base}, path=${path}`
    )
  }
  return `${base || ''}${path || ''}`
}
