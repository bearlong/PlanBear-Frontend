const isDev = process.env.NODE_ENV === 'development'
console.log(`[LOGGER] Initialized. NODE_ENV=${process.env.NODE_ENV}`)
const now = new Date()
export const logger = {
  info: (msg, context = '') => {
    if (isDev)
      console.log(
        `[INFO] [${now.toLocaleString('zh-TW', {
          timeZone: 'Asia/Taipei',
        })}] [${context}] ${msg}`
      )
  },
  warn: (msg, context = '') => {
    console.warn(
      `[WARN] [${now.toLocaleString('zh-TW', {
        timeZone: 'Asia/Taipei',
      })}] [${context}] ${msg}`
    )
  },
  error: (msg, context = '', error = null) => {
    console.error(
      `[ERROR] [${now.toLocaleString('zh-TW', {
        timeZone: 'Asia/Taipei',
      })}] [${context}] ${msg}`,
      error
    )
  },
}
