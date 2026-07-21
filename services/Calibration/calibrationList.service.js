import { api } from '@/utils/api'
import { logger } from '@/utils/logger'
import { updateLocale } from 'moment'

export const calibrationListService = {
  getCalibrationLists: async (query = '', system = '', page = 1) => {
    const url = api(
      `/Calibration/calibration-list?p=${page}${
        query ? `&query=${encodeURIComponent(query)}` : ''
      }${system ? `&system=${encodeURIComponent(system)}` : ''}`
    )

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })

    if (!response.ok) {
      logger.warn(`Failed: ${url} status=${response.status}`, 'Calibration')
      return { status: 'error', message: `${response.message}` }
    }

    const result = await response.json()
    logger.info(`Success: ${url}`, 'Calibration')
    return result
  },
  addCalibrationList: async (data) => {
    const url = api('/Calibration/calibration-list')
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
  updateCalibrationList: async (id, data) => {
    const url = api(`/Calibration/calibration-list/${id}`)
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
  deleteCalibrationList: async (id) => {
    const url = api(`/Calibration/calibration-list/${id}`)
    const response = await fetch(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
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
