import useSWR from 'swr'
import { api } from '@/utils/api'

// SWR 的 fetcher
const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((res) => res.json())

export function useFavorites(username) {
  const key = username ? api(`/favorites?username=${username}`) : null
  const { data, error, isLoading, mutate } = useSWR(key, fetcher)
  // 把後端資料整理成 { function_key: true } 格式
  const favoriteItems =
    data && data.status === 'success'
      ? Object.fromEntries(data.data.map((item) => [item.function_key, true]))
      : {}
  return {
    favoriteItems,
    error,
    loading: isLoading,
    mutate, // 之後做樂觀更新用
  }
}
