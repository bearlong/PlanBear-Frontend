import { api } from '@/utils/api'
import { logger } from '@/utils/logger'

export const userFactoryService = {
  getFactoryLists: async () => {
    const url = api(`/user-factory`)

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })

    if (!response.ok) {
      logger.warn(`Failed: ${url} status=${response.status}`, 'UserFactory')
      throw new Error(
        `Failed to fetch UserFactory (status: ${response.status})`
      )
    }

    const result = await response.json()
    logger.info(`Success: ${url}`, 'UserFactory')
    return result
  },

  addUserFactory: async (data) => {
    const url = api(`/user-factory/me`)
    console.log(url)
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const result = await response.json()
      if (result.code === 'DUPLICATE') {
        logger.warn(`Duplicate entry: ${url}`, 'UserFactory')
        return {
          status: 'duplicate',
          message: 'UserFactory already exists',
        }
      }
      logger.warn(`Failed: ${url} status=${response.status}`, 'UserFactory')
      return { status: 'error', message: 'Failed to add UserFactory' }
    }
    const result = await response.json()
    logger.info(`Success: ${url}`, 'UserFactory')
    return result
  },
}
