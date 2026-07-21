import { api } from '@/utils/api'
import { logger } from '@/utils/logger'
import { updateLocale } from 'moment'

export const toolService = {
  receivedInstrument: async (ids) => {
    const url = api(`/Calibration/calibration/received`)

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(ids),
      })
      if (!response.ok) {
        logger.warn(`Failed: ${url} status=${response.status}`, 'Calibration')
        return { status: 'error', message: `${response.message}` }
      }
      const result = await response.json()

      if (result.status === 'error') {
        logger.warn(`Failed: ${url} status=${result.status}`, 'Calibration')
        return { status: 'error', message: `${result.message}` }
      }
      logger.info(`Success: ${url}`, 'Calibration')
      return { status: 'success' }
    } catch (error) {
      logger.error(`Error: ${error.message}`, 'Calibration')
      return { status: 'error', message: error.message }
    }
  },

  calibrationCostUpdate: async (id, cost) => {
    const url = api(`/Calibration/calibration/cost`)

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, cost }),
      })
      if (!response.ok) {
        logger.warn(`Failed: ${url} status=${response.status}`, 'Calibration')
        return { status: 'error', message: `${response.message}` }
      }
      const result = await response.json()

      if (result.status === 'error') {
        logger.warn(`Failed: ${url} status=${result.status}`, 'Calibration')
        return { status: 'error', message: `${result.message}` }
      }
      logger.info(`Success: ${url}`, 'Calibration')
      return { status: 'success' }
    } catch (error) {
      logger.error(`Error: ${error.message}`, 'Calibration')
      return { status: 'error', message: error.message }
    }
  },

  calibrationCostDelete: async (id) => {
    const url = api(`/Calibration/calibration/cost/${id}`)

    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })
      if (!response.ok) {
        logger.warn(`Failed: ${url} status=${response.status}`, 'Calibration')
        return { status: 'error', message: `${response.message}` }
      }
      const result = await response.json()

      if (result.status === 'error') {
        logger.warn(`Failed: ${url} status=${result.status}`, 'Calibration')
        return { status: 'error', message: `${result.message}` }
      }
      logger.info(`Success: ${url}`, 'Calibration')
      return { status: 'success' }
    } catch (error) {
      logger.error(`Error: ${error.message}`, 'Calibration')
      return { status: 'error', message: error.message }
    }
  },

  propertyNoUpdate: async (id, propertyNo, remark) => {
    const url = api(`/Calibration/calibration/propertyNo/${id}`)

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ propertyNo, remark }),
      })
      if (!response.ok) {
        logger.warn(`Failed: ${url} status=${response.status}`, 'Calibration')
        return {
          status: 'error',
          message: `${response.message || 'Server error'}`,
        }
      }
      const result = await response.json()

      if (result.status === 'error') {
        logger.warn(`Failed: ${url} status=${result.status}`, 'Calibration')
        return {
          status: 'error',
          message: `${result.message || 'Server error'}`,
        }
      }
      logger.info(`Success: ${url}`, 'Calibration')
      return {
        status: 'success',
        message: result.message || 'Success',
        data: result.data || {},
      }
    } catch (error) {
      logger.error(`Error: ${error.message}`, 'Calibration')
      return { status: 'error', message: error.message }
    }
  },

  getPropertyNoChangeHistory: async (type, id) => {
    const url = api(
      `/Calibration/calibration/propertyNoChangeHistory?type=${type}&id=${id}`
    )

    try {
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

      if (result.status === 'error') {
        logger.warn(`Failed: ${url} status=${result.status}`, 'Calibration')
        return { status: 'error', message: `${result.message}` }
      }
      logger.info(`Success: ${url}`, 'Calibration')
      return { status: 'success', data: result.data || [] }
    } catch (error) {
      logger.error(`Error: ${error.message}`, 'Calibration')
      return { status: 'error', message: error.message }
    }
  },
}
