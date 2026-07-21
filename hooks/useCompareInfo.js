import { useState, useEffect } from 'react'
import { api } from '@/utils/api'
import { logger } from '@/utils/logger'

const useCompareInfo = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchData = async (url) => {
    setLoading(true)
    setError(null)
    logger.info(`Fetching Data : ${url}`, 'useCompareInfo')
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      const result = await response.json()
      logger.info(`Success: ${url}`, 'useCompareInfo')
      return result
    } catch (err) {
      setError(err)
      logger.error(`Fetch error: ${url}`, 'useCompareInfo', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  const getCompareApply = async (
    applyNo = '',
    activeId = '',
    version = null
  ) => {
    if (!applyNo && !activeId) {
      logger.warn(
        'Missing applyNo and activeId in getCompareApply',
        'useCompareInfo'
      )
      return null
    }
    const url = api(
      `/compare-apply?applyNo=${applyNo}&activeId=${activeId}${
        version ? `&version=${version}` : ''
      }`
    )
    logger.info(`Fetching CompareApply : ${url}`, 'useCompareInfo')
    return await fetchData(url)
  }

  const getCompareData = async (buyerId, status, search, page = 1) => {
    if (!buyerId) {
      logger.warn('Missing buyerId in getCompareData', 'useCompareInfo')
      return null
    }
    const { apply_no, dateStart, dateEnd, partsno, searchUsername } = search

    const params = new URLSearchParams(
      Object.entries({
        apply_no,
        dateStart,
        dateEnd,
        partsno,
        searchUsername,
      }).filter(([_, value]) => value)
    ).toString()

    const url = api(
      `/compare-data?buyer=${buyerId}${
        status ? `&status=${status}` : ''
      }&${params}&page=${page}`
    )
    logger.info(`Fetching CompareData : ${url}`, 'useCompareInfo')

    return await fetchData(url)
  }

  const getCompareDataDraft = async (buyerId) => {
    if (!buyerId) {
      logger.warn('Missing buyerId in getCompareDataDraft', 'useCompareInfo')
      return null
    }

    const url = api(`/compare-data/draft?buyer=${buyerId}&status=draft`)
    logger.info(`Fetching CompareDataDraft : ${url}`, 'useCompareInfo')

    return await fetchData(url)
  }

  const getCompareApplyDraft = async (draftNo = '', activeId = '') => {
    if (!draftNo && !activeId) {
      logger.warn(
        'Missing draftNo and activeId in getCompareApplyDraft',
        'useCompareInfo'
      )
      return null
    }
    const url = api(`/compare-apply/draft?draftNo=${draftNo}`)
    logger.info(`Fetching CompareApplyDraft : ${url}`, 'useCompareInfo')

    return await fetchData(url)
  }

  return {
    getCompareApply,
    getCompareData,
    getCompareDataDraft,
    getCompareApplyDraft,
    loading,
    error,
  }
}

export default useCompareInfo
