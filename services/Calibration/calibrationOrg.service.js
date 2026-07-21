import { api } from '@/utils/api'
import { logger } from '@/utils/logger'

export const calibrationOrgService = {
  getCalibrationOrgs: async (query = '', page = 1, limit = 20) => {
    const url = api(
      `/Calibration/calibration-orgs?p=${page}${
        query ? `&query=${encodeURIComponent(query)}` : ''
      }${limit ? `&limit=${limit}` : ''}`
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

  addCalibrationOrg: async (data) => {
    const url = api('/Calibration/calibration-orgs')
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      logger.warn(`Failed: ${url} status=${response.status}`, 'Calibration')
      return { status: 'error', message: `${response.message}` }
    }

    const result = await response.json()
    logger.info(`Success: ${url}`, 'Calibration')
    return result
  },

  updateCalibrationOrg: async (id, data) => {
    const url = api(`/Calibration/calibration-orgs/${id}`)
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      logger.warn(`Failed: ${url} status=${response.status}`, 'Calibration')
      return { status: 'error', message: `${response.message}` }
    }

    const result = await response.json()
    logger.info(`Success: ${url}`, 'Calibration')
    return result
  },

  deleteCalibrationOrg: async (id) => {
    const url = api(`/Calibration/calibration-orgs/${id}`)
    const response = await fetch(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
    if (!response.ok) {
      logger.warn(`Failed: ${url} status=${response.status}`, 'Calibration')
      return { status: 'error', message: `${response.message}` }
    }
    logger.info(`Success: ${url}`, 'Calibration')
    return { status: 'success' }
  },
}
