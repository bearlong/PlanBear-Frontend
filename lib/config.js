const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return (
      window.__RUNTIME_CONFIG__?.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      ''
    )
  }

  return process.env.API_URL || ''
}

module.exports = { getApiBaseUrl }
