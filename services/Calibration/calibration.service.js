import { api } from '@/utils/api'
import { logger } from '@/utils/logger'
import { updateLocale } from 'moment'

export const calibrationService = {
  getCalibrationList: async (filters) => {
    const queryParams = new URLSearchParams(filters).toString()
    const url = api(`/Calibration/calibration?${queryParams}`)
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
      logger.info(`Success: ${url}`, 'Calibration')
      return result
    } catch (error) {
      logger.error(`Error: ${error.message}`, 'Calibration')
      return { status: 'error', message: error.message }
    }
  },

  getCalibrationById: async (id) => {
    const url = api(`/Calibration/calibration/${id}`)
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
      logger.info(`Success: ${url}`, 'Calibration')
      return result
    } catch (error) {
      logger.error(`Error: ${error.message}`, 'Calibration')
      return { status: 'error', message: error.message }
    }
  },

  getCalibrationStatisticOptions: async () => {
    const url = api(`/Calibration/calibration/statistic-options`)
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
      logger.info(`Success: ${url}`, 'Calibration')
      return result
    } catch (error) {
      logger.error(`Error: ${error.message}`, 'Calibration')
      return { status: 'error', message: error.message }
    }
  },

  getStatistics: async (type, eGroup) => {
    const url = api(
      `/Calibration/calibration/statistics?type=${type}&e_group=${eGroup}`
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
      logger.info(`Success: ${url}`, 'Calibration')
      return result
    } catch (error) {
      logger.error(`Error: ${error.message}`, 'Calibration')
      return { status: 'error', message: error.message }
    }
  },

  getHistoryById: async (calibration_id) => {
    const url = api(`/Calibration/calibration/history/${calibration_id}`)
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
      logger.info(`Success: ${url}`, 'Calibration')
      return result
    } catch (error) {
      logger.error(`Error: ${error.message}`, 'Calibration')
      return { status: 'error', message: error.message }
    }
  },

  getSignatureFiles: async (calibration_id) => {
    const url = api(`/Calibration/calibration/signature/${calibration_id}`)
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
      logger.info(`Success: ${url}`, 'Calibration')
      return result
    } catch (error) {
      logger.error(`Error: ${error.message}`, 'Calibration')
      return { status: 'error', message: error.message }
    }
  },

  getCalculationTimeData: async (filter) => {
    const queryParams = new URLSearchParams(filter).toString()
    const url = api(`/Calibration/calibration/calculation-time?${queryParams}`)
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
      logger.info(`Success: ${url}`, 'Calibration')
      return result
    } catch (error) {
      logger.error(`Error: ${error.message}`, 'Calibration')
      return { status: 'error', message: error.message }
    }
  },

  addCalibration: async (calibrationData) => {
    try {
      const url = api(`/Calibration/calibration`)
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(calibrationData),
      })
      if (!response.ok) {
        logger.warn(`Failed: ${url} status=${response.status}`, 'Calibration')
        return { status: 'error', message: `${response.message}` }
      }
      const result = await response.json()
      console.log(result)
      if (result.status === 'error') {
        return { status: 'error', message: `${result.message}` }
      }

      logger.info(`Success: ${url}`, 'Calibration')
      return result
    } catch (error) {
      logger.error(`Error: ${error.message}`, 'Calibration')
      return { status: 'error', message: error.message }
    }
  },

  addLogWithReport: async (logData) => {
    try {
      const { AttachFile, keepFileIds = [], ...payload } = logData

      const files = Array.isArray(AttachFile) ? AttachFile : []

      const realFiles = files
        .map((x) => x?.file)
        .filter((f) => f instanceof File)
      const url = api(`/Calibration/calibration/log`)
      const fd = new FormData()

      fd.append('keep_file_ids', keepFileIds.join(','))

      // 一般欄位（轉成字串）
      Object.entries(payload).forEach(([k, v]) => {
        if (v === undefined || v === null) return
        // 若有 boolean/number 都轉字串
        fd.append(k, String(v))
      })

      // 多檔：同名 key append 多次
      realFiles.forEach((file) => {
        fd.append('AttachFile', file, file.name)
      })

      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        body: fd,
        // ⚠️ 不要手動設 Content-Type，瀏覽器會自動加 boundary
      })

      if (!response.ok) {
        logger.warn(`Failed: ${url} status=${response.status}`, 'Calibration')
        return { status: 'error', message: `${response.message}` }
      }

      const result = await response.json()
      if (result.status === 'error') {
        return { status: 'error', message: `${result.message}` }
      }

      logger.info(`Success: ${url}`, 'Calibration')
      return result
    } catch (error) {
      logger.error(`Error: ${error.message}`, 'Calibration')
      return { status: 'error', message: error.message }
    }
  },

  updateHistoryLog: async (logId, logData) => {
    try {
      const { AttachFile, keepFileIds = [], ...payload } = logData
      const files = Array.isArray(AttachFile) ? AttachFile : []
      const realFiles = files
        .map((x) => x?.file)
        .filter((f) => f instanceof File)
      const url = api(`/Calibration/calibration/log/${logId}`)
      const fd = new FormData()

      Object.entries(payload).forEach(([k, v]) => {
        if (v === undefined || v === null) return
        fd.append(k, String(v))
      })

      fd.append('keep_file_ids', keepFileIds.join(','))
      realFiles.forEach((file) => {
        fd.append('AttachFile', file, file.name)
      })

      const response = await fetch(url, {
        method: 'PUT',
        credentials: 'include',
        body: fd,
      })

      if (!response.ok) {
        const text = await response.text().catch(() => '')
        logger.warn(
          `Failed: ${url} status=${response.status} body=${text}`,
          'Calibration'
        )
        return { status: 'error', message: text || `HTTP ${response.status}` }
      }

      const result = await response.json()
      if (result.status === 'error') {
        return { status: 'error', message: `${result.message}` }
      }

      logger.info(`Success: ${url}`, 'Calibration')
      return result
    } catch (error) {
      logger.error(`Error: ${error.message}`, 'Calibration')
      return { status: 'error', message: error.message }
    }
  },

  updateCalibration: async (id, calibrationData) => {
    try {
      const { AttachFile, keepFileIds = [], ...payload } = calibrationData

      const files = Array.isArray(AttachFile) ? AttachFile : []
      const realFiles = files
        .map((x) => x?.file)
        .filter((f) => f instanceof File)

      const url = api(`/Calibration/calibration/${id}`)
      const fd = new FormData()

      // 一般欄位（轉成字串）
      Object.entries(payload).forEach(([k, v]) => {
        if (v === undefined || v === null) return
        // 若有 boolean/number 都轉字串
        fd.append(k, String(v))
      })

      // 多檔：同名 key append 多次
      realFiles.forEach((file) => {
        fd.append('AttachFile', file, file.name)
      })
      fd.append('keep_file_ids', keepFileIds.join(','))

      const response = await fetch(url, {
        method: 'PUT',
        credentials: 'include',
        body: fd,
        // ⚠️ 不要手動設 Content-Type，瀏覽器會自動加 boundary
      })

      if (!response.ok) {
        const text = await response.text().catch(() => '')
        logger.warn(
          `Failed: ${url} status=${response.status} body=${text}`,
          'Calibration'
        )
        return { status: 'error', message: text || `HTTP ${response.status}` }
      }

      const result = await response.json()
      if (result.status === 'error') {
        return { status: 'error', message: `${result.message}` }
      }
      logger.info(`Success: ${url}`, 'Calibration')
      return result

      // const response = await fetch(url, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   credentials: 'include',
      //   body: JSON.stringify(calibrationData),
      // })

      // // if (!response.ok) {
      // //   return { status: 'error', message: `${response.message}` }
      // // }

      // const result = await response.json()
      // if (result.status === 'error') {
      //   logger.warn(`Failed: ${url} status=${result.status}`, 'Calibration')

      //   return { status: 'error', message: `${result.message}` }
      // }
      // logger.info(`Success: ${url}`, 'Calibration')
      // return result
    } catch (error) {
      logger.error(`Error: ${error.message}`, 'Calibration')
      return { status: 'error', message: error.message }
    }
  },

  approveCalibrationReport: async (log_id, instrument_id) => {
    try {
      const url = api(`/Calibration/calibration/approve/${log_id}`)

      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ instrument_id }),
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
      logger.info(
        `
Success: ${url}`,
        'Calibration'
      )
      return result
    } catch (error) {
      logger.error(`Error: ${error.message}`, 'Calibration')
      return { status: 'error', message: error.message }
    }
  },

  rejectCalibrationReport: async (log_id, instrument_id, reason) => {
    try {
      const url = api(`/Calibration/calibration/reject/${log_id}`)

      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ instrument_id, reason }),
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
      return result
    } catch (error) {
      logger.error(`Error: ${error.message}`, 'Calibration')
      return { status: 'error', message: error.message }
    }
  },

  getOwnerList: async () => {
    const url = api(`/Calibration/calibration/distinct-owner`)

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

  updateAllOwner: async (oldOwner, newOwner, dept) => {
    const url = api(`/Calibration/calibration/update-owners`)
    const payload = { oldOwner, newOwner, dept }
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      logger.warn(`Failed: ${url} status=${response.status}`, 'Calibration')
      return { status: 'error', message: `${response.message}` }
    }
    logger.info(`Success: ${url}`, 'Calibration')
    return { status: 'success' }
  },

  batchChangeStatus: async (ids, status, remark) => {
    const url = api(`/Calibration/calibration/batch-update-status`)

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids, status, remark }),
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

  sendNotice: async (ids) => {
    const url = api(`/Calibration/calibration/notify`)
    try {
      const response = await fetch(url, {
        method: 'POST',
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

  searchLogByFilters: async (filters) => {
    const queryParams = new URLSearchParams(filters).toString()
    const url = api(`/Calibration/calibration/report-search?${queryParams}`)
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
    return { status: 'success', data: result.data }
  },

  deleteCalibrationInstrument: async (id) => {
    const url = api(`/Calibration/calibration/${id}`)
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

  deleteCalibrationLog: async (id) => {
    const url = api(`/Calibration/calibration/log/${id}`)
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
}
