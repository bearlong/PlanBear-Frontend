import { api } from '@/utils/api'
import { logger } from '@/utils/logger'
import { updateLocale } from 'moment'

export const noticeMemberListService = {
  getNoticeMemberLists: async () => {
    const url = api(`/Calibration/notice-member-list`)

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })

    if (!response.ok) {
      logger.warn(`Failed: ${url} status=${response.status}`, 'Calibration')
      throw new Error(
        `Failed to fetch Instrument Systems (status: ${response.status})`
      )
    }

    const result = await response.json()
    logger.info(`Success: ${url}`, 'Calibration')
    return result
  },

  addNoticeMembers: async (data) => {
    const url = api('/Calibration/notice-member-list')
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const result = await response.json()
      if (result.code === 'DUPLICATE') {
        logger.warn(`Duplicate entry: ${url}`, 'Calibration')
        return {
          status: 'duplicate',
          message: 'Calibration List already exists',
        }
      }
      logger.warn(`Failed: ${url} status=${response.status}`, 'Calibration')

      return { status: 'error', message: 'Failed to add Calibration List' }
    }
    const result = await response.json()
    logger.info(`Success: ${url}`, 'Calibration')
    return result
  },
  updateNoticeMembers: async (id, data) => {
    const url = api(`/Calibration/notice-member-list/${id}`)
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const result = await response.json()
      if (result.code === 'DUPLICATE') {
        logger.warn(`Duplicate entry: ${url}`, 'Calibration')
        return {
          status: 'duplicate',
          message: 'Calibration List already exists',
        }
      }
      logger.warn(`Failed: ${url} status=${response.status}`, 'Calibration')
      return { status: 'error', message: 'Failed to update Calibration List' }
    }
    const result = await response.json()
    logger.info(
      `
Success: ${url}`,
      'Calibration'
    )
    return result
  },
  deleteNoticeMembers: async (ids) => {
    const url = api(`/Calibration/notice-member-list/batch`)

    console.log(ids)
    const response = await fetch(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(ids),
    })
    if (!response.ok) {
      logger.warn(`Failed: ${url} status=${response.status}`, 'Calibration')
      return { status: 'error', message: 'Failed to delete Calibration List' }
    }
    const result = await response.json()
    logger.info(`Success: ${url}`, 'Calibration')
    return result
  },
}
