import { api } from '@/utils/api'
import { logger } from '@/utils/logger'

export const instrumentRepairService = {
  getRepairList: async (searchParams) => {
    const query = new URLSearchParams(searchParams).toString()
    const url = api(`/Calibration/repair?${query}`)
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error(`Error fetching repair list: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.log(error)
      logger.error(error)
      throw error
    }
  },

  getRepairDetails: async (applyNo) => {
    const url = api(`/Calibration/repair/${applyNo}`)
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error(`Error fetching repair details: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.log(error)
      logger.error(error)
      throw error
    }
  },
  submitRepairApplication: async (data) => {
    const addStatusData = {
      ...data,
      header: {
        ...data.header,
        status: 'repairing',
      },
    }
    const url = api('/Calibration/repair')
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(addStatusData),
      })
      if (!response.ok) {
        throw new Error(
          `Error submitting repair application: ${response.statusText}`
        )
      }
      return await response.json()
    } catch (error) {
      logger.error(error)
      throw error
    }
  },

  updateRepairStatus: async (data) => {
    const { gauge_instrument_repair_item = [], ...payload } = data

    // 把 item 的純文字資料整理出來，不把 AttachFile 直接塞進 JSON
    const itemsPayload = gauge_instrument_repair_item.map((item) => {
      const { AttachFile, ...rest } = item
      return rest
    })

    // 收集所有檔案，並記住每個檔案屬於哪個 item.id
    const uploadFiles = gauge_instrument_repair_item.flatMap((item) => {
      const files = Array.isArray(item.AttachFile) ? item.AttachFile : []

      return files
        .map((x) => x?.file)
        .filter((f) => f instanceof File)
        .map((file) => ({
          itemId: item.id,
          file,
        }))
    })

    const url = api(`/Calibration/repair`)
    const fd = new FormData()
    Object.entries(payload).forEach(([k, v]) => {
      if (v === undefined || v === null) return

      if (Array.isArray(v) || typeof v === 'object') {
        fd.append(k, JSON.stringify(v))
      } else {
        fd.append(k, String(v))
      }
    })
    fd.append('gauge_instrument_repair_item', JSON.stringify(itemsPayload))

    uploadFiles.forEach(({ itemId, file }) => {
      fd.append('AttachFile', file, file.name)
      fd.append('AttachFile_item_id', String(itemId))
    })

    const response = await fetch(url, {
      method: 'PUT',
      credentials: 'include',
      body: fd,
    })
    if (!response.ok) {
      const text = await response.text()
      logger.warn(`Failed: ${url} status=${response.status}`, 'Calibration')
      return { status: 'error', message: text || `HTTP ${response.status}` }
    }
    const result = await response.json()
    if (result.status === 'error') {
      return { status: 'error', message: `${result.message}` }
    }
    logger.info(`Success: ${url}`, 'Calibration')
    return result
  },
}
