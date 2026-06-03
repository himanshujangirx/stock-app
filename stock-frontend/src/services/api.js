const BASE_URL = 'http://localhost:8000'

// Default timeout: 60 seconds (yfinance needs time on first load)
// /stocks/all uses 120 seconds (15 stocks parallel still takes time)
const fetchWithTimeout = async (url, timeout = 60000) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timer)
    return res
  } catch (err) {
    clearTimeout(timer)
    if (err.name === 'AbortError') {
      throw new Error('Request timeout — server slow hai ya band hai')
    }
    throw new Error('FastAPI server nahi chal rahi — localhost:8000 check karo')
  }
}

const handleResponse = async (response, defaultMsg) => {
  if (response.status === 404) {
    throw new Error('Stock data nahi mila — symbol check karo')
  }
  if (response.status === 500) {
    throw new Error('Server error — check terminal for details')
  }
  if (!response.ok) {
    try {
      const body = await response.json()
      throw new Error(body.detail || `${defaultMsg}: ${response.statusText}`)
    } catch {
      throw new Error(`${defaultMsg}: ${response.statusText}`)
    }
  }
  return response.json()
}

export const fetchMarketOverview = async () => {
  const res = await fetchWithTimeout(`${BASE_URL}/market/overview`, 60000)
  return handleResponse(res, 'Market overview nahi aaya')
}

// 2 minutes for /stocks/all — 15 stocks concurrently still takes time on cold start
export const fetchAllStocks = async () => {
  const res = await fetchWithTimeout(`${BASE_URL}/stocks/all`, 120000)
  return handleResponse(res, 'Stock list nahi aaya')
}

export const fetchStockHistory = async (ticker, period = '1y') => {
  const res = await fetchWithTimeout(`${BASE_URL}/stock/${ticker}/history?period=${period}`, 60000)
  return handleResponse(res, 'History nahi aaya')
}

export const fetchStockTech = async (ticker) => {
  const res = await fetchWithTimeout(`${BASE_URL}/stock/${ticker}/technical`, 60000)
  return handleResponse(res, 'Technical data nahi aaya')
}

export const fetchSectorPerformance = async () => {
  const res = await fetchWithTimeout(`${BASE_URL}/sector/performance`, 60000)
  return handleResponse(res, 'Sector performance nahi aaya')
}

export const fetchCompare = async () => {
  const res = await fetchWithTimeout(`${BASE_URL}/compare`, 60000)
  return handleResponse(res, 'Compare data nahi aaya')
}
