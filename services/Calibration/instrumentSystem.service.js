import { api } from '@/utils/api'
import { logger } from '@/utils/logger'

export const instrumentSystemService = {
  getInstrumentSystems: async () => {
    const url = api('/Calibration/instrument-systems')

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
  addInstrumentSystem: async (data) => {
    const url = api('/Calibration/instrument-systems')

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      logger.warn(`Failed: ${url} status=${response.status}`, 'Calibration')
      throw new Error(
        `Failed to add Instrument System (status: ${response.status})`
      )
    }

    const result = await response.json()
    logger.info(`Success: ${url}`, 'Calibration')
    return result
  },
}
