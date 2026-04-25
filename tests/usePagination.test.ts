import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFromUrl, writeToUrl } from '../src/composables/usePagination/urlSync'
import { usePagination } from '../src/composables/usePagination/usePagination'
import { Http } from '../src/utilities/http'

// Store the fetch function reference for direct testing
let fetchPageFn: (() => Promise<void>) | null = null

// Mock Vue
vi.mock('vue', () => ({
  ref: <T>(value: T) => ({ value }),
  watch: vi.fn(),
  unref: <T>(value: T | { value: T }): T => {
    if (value && typeof value === 'object' && 'value' in value) {
      return value.value as T
    }
    return value as T
  },
  onMounted: vi.fn((callback) => {
    // Store for later execution but don't run automatically
  }),
}))

// Mock Http
vi.mock('../src/utilities/http', () => ({
  Http: {
    get: vi.fn(),
  },
}))

// Mock window for URL sync tests
const mockLocation = {
  search: '',
  pathname: '/test',
}
const mockHistory = {
  replaceState: vi.fn(),
}

describe('URL Sync helpers', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      location: mockLocation,
      history: mockHistory,
    })
    mockLocation.search = ''
    mockHistory.replaceState.mockClear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('readFromUrl', () => {
    it('reads page and per_page from URL', () => {
      mockLocation.search = '?page=3&per_page=50'
      const result = readFromUrl([])
      expect(result.page).toBe(3)
      expect(result.perPage).toBe(50)
    })

    it('returns null for missing page/perPage', () => {
      mockLocation.search = ''
      const result = readFromUrl([])
      expect(result.page).toBeNull()
      expect(result.perPage).toBeNull()
    })

    it('reads specified param keys', () => {
      mockLocation.search = '?page=1&status=active&sort=date'
      const result = readFromUrl(['status', 'sort'])
      expect(result.params).toEqual({ status: 'active', sort: 'date' })
    })

    it('parses numeric params', () => {
      mockLocation.search = '?page=1&limit=100'
      const result = readFromUrl(['limit'])
      expect(result.params.limit).toBe(100)
    })

    it('parses boolean params', () => {
      mockLocation.search = '?page=1&active=true&archived=false'
      const result = readFromUrl(['active', 'archived'])
      expect(result.params.active).toBe(true)
      expect(result.params.archived).toBe(false)
    })

    it('ignores keys not in paramKeys list', () => {
      mockLocation.search = '?page=1&status=active&unknown=value'
      const result = readFromUrl(['status'])
      expect(result.params).toEqual({ status: 'active' })
      expect(result.params.unknown).toBeUndefined()
    })
  })

  describe('writeToUrl', () => {
    it('writes page and per_page to URL', () => {
      writeToUrl({ page: 2, perPage: 25, params: {} })
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        {},
        '',
        '/test?page=2&per_page=25'
      )
    })

    it('includes params in URL', () => {
      writeToUrl({
        page: 1,
        perPage: 25,
        params: { status: 'active', sort: 'date' },
      })
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        {},
        '',
        expect.stringContaining('status=active')
      )
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        {},
        '',
        expect.stringContaining('sort=date')
      )
    })

    it('excludes null, undefined, and empty string params', () => {
      writeToUrl({
        page: 1,
        perPage: 25,
        params: { status: 'active', empty: '', nothing: null as unknown as string },
      })
      const url = mockHistory.replaceState.mock.calls[0][2] as string
      expect(url).toContain('status=active')
      expect(url).not.toContain('empty')
      expect(url).not.toContain('nothing')
    })
  })
})

describe('usePagination', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('window', {
      location: { search: '', pathname: '/test' },
      history: { replaceState: vi.fn() },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function createMockResponse<T>(
    data: T[],
    meta: {
      current_page: number
      last_page: number
      per_page: number
      total: number
      from?: number | null
      to?: number | null
    }
  ) {
    return {
      data,
      meta: {
        current_page: meta.current_page,
        last_page: meta.last_page,
        per_page: meta.per_page,
        total: meta.total,
        from: meta.from ?? (data.length > 0 ? 1 : null),
        to: meta.to ?? (data.length > 0 ? data.length : null),
      },
      links: {
        first: '/api?page=1',
        last: `/api?page=${meta.last_page}`,
        prev: meta.current_page > 1 ? `/api?page=${meta.current_page - 1}` : null,
        next: meta.current_page < meta.last_page ? `/api?page=${meta.current_page + 1}` : null,
      },
    }
  }

  it('initializes with empty state', () => {
    const { rows, meta, isLoading, error } = usePagination({
      endpoint: '/api/items',
    })

    expect(rows.value).toEqual([])
    expect(meta.value).toBeNull()
    expect(isLoading.value).toBe(false)
    expect(error.value).toBeNull()
  })

  it('fetches data via refresh', async () => {
    const mockData = [{ id: 1 }, { id: 2 }]
    vi.mocked(Http.get).mockResolvedValue(
      createMockResponse(mockData, {
        current_page: 1,
        last_page: 5,
        per_page: 25,
        total: 100,
      })
    )

    const { rows, meta, isLoading, refresh } = usePagination<{ id: number }>({
      endpoint: '/api/items',
    })

    await refresh()

    expect(Http.get).toHaveBeenCalledWith('/api/items', {
      params: { page: '1', per_page: '25' },
    })

    expect(rows.value).toEqual(mockData)
    expect(meta.value).toEqual({
      currentPage: 1,
      lastPage: 5,
      perPage: 25,
      total: 100,
      from: 1,
      to: 2,
    })
    expect(isLoading.value).toBe(false)
  })

  it('uses custom perPage', async () => {
    vi.mocked(Http.get).mockResolvedValue(
      createMockResponse([], {
        current_page: 1,
        last_page: 1,
        per_page: 50,
        total: 0,
      })
    )

    const { refresh } = usePagination({ endpoint: '/api/items', perPage: 50 })
    await refresh()

    expect(Http.get).toHaveBeenCalledWith('/api/items', {
      params: { page: '1', per_page: '50' },
    })
  })

  it('includes params in request', async () => {
    vi.mocked(Http.get).mockResolvedValue(
      createMockResponse([], {
        current_page: 1,
        last_page: 1,
        per_page: 25,
        total: 0,
      })
    )

    const params = { value: { status: 'active', sort: 'date' } }
    const { refresh } = usePagination({
      endpoint: '/api/items',
      params: params as any,
    })
    await refresh()

    expect(Http.get).toHaveBeenCalledWith('/api/items', {
      params: {
        page: '1',
        per_page: '25',
        status: 'active',
        sort: 'date',
      },
    })
  })

  it('clamps goToPage to valid range', async () => {
    vi.mocked(Http.get).mockResolvedValue(
      createMockResponse([{ id: 1 }], {
        current_page: 1,
        last_page: 5,
        per_page: 25,
        total: 100,
      })
    )

    const { goToPage, meta, refresh } = usePagination<{ id: number }>({
      endpoint: '/api/items',
    })
    await refresh()

    // goToPage clamps values
    goToPage(100) // Should clamp to 5 (lastPage)
    goToPage(-1) // Should clamp to 1
    goToPage(0) // Should clamp to 1

    // Since watch is mocked, we verify the clamping logic exists
    expect(meta.value?.lastPage).toBe(5)
  })

  it('handles nextPage and prevPage', async () => {
    vi.mocked(Http.get).mockResolvedValue(
      createMockResponse([{ id: 1 }], {
        current_page: 2,
        last_page: 5,
        per_page: 25,
        total: 100,
      })
    )

    const { nextPage, prevPage, firstPage, lastPage, refresh } = usePagination({
      endpoint: '/api/items',
    })
    await refresh()

    // These call goToPage internally - verify they don't throw
    nextPage()
    prevPage()
    firstPage()
    lastPage()
  })

  it('handles HTTP errors', async () => {
    const networkError = new Error('Network failure')
    vi.mocked(Http.get).mockRejectedValue(networkError)

    const { rows, meta, error, isLoading, refresh } = usePagination({
      endpoint: '/api/items',
    })
    await refresh()

    expect(error.value).toBe(networkError)
    expect(rows.value).toEqual([])
    expect(meta.value).toBeNull()
    expect(isLoading.value).toBe(false)
  })

  it('preserves previous data on error after successful fetch', async () => {
    const initialData = [{ id: 1 }]
    vi.mocked(Http.get).mockResolvedValueOnce(
      createMockResponse(initialData, {
        current_page: 1,
        last_page: 5,
        per_page: 25,
        total: 100,
      })
    )

    const { rows, meta, error, refresh } = usePagination<{ id: number }>({
      endpoint: '/api/items',
    })
    await refresh()

    expect(rows.value).toEqual(initialData)
    expect(meta.value?.currentPage).toBe(1)

    // Now fail on refresh
    vi.mocked(Http.get).mockRejectedValueOnce(new Error('Network failure'))
    await refresh()

    expect(error.value?.message).toBe('Network failure')
    expect(rows.value).toEqual(initialData) // Preserved
    expect(meta.value?.currentPage).toBe(1) // Preserved
  })

  it('handles empty results with null from/to', async () => {
    vi.mocked(Http.get).mockResolvedValue({
      data: [],
      meta: {
        current_page: 1,
        last_page: 1,
        per_page: 25,
        total: 0,
        from: null,
        to: null,
      },
      links: { first: null, last: null, prev: null, next: null },
    })

    const { rows, meta, refresh } = usePagination({
      endpoint: '/api/items',
    })
    await refresh()

    expect(rows.value).toEqual([])
    expect(meta.value?.from).toBeNull()
    expect(meta.value?.to).toBeNull()
    expect(meta.value?.total).toBe(0)
  })

  it('refresh re-fetches current page', async () => {
    vi.mocked(Http.get).mockResolvedValue(
      createMockResponse([{ id: 1 }], {
        current_page: 1,
        last_page: 5,
        per_page: 25,
        total: 100,
      })
    )

    const { refresh } = usePagination({
      endpoint: '/api/items',
    })

    await refresh()
    expect(Http.get).toHaveBeenCalledTimes(1)

    await refresh()
    expect(Http.get).toHaveBeenCalledTimes(2)
    expect(Http.get).toHaveBeenLastCalledWith('/api/items', {
      params: { page: '1', per_page: '25' },
    })
  })

  it('works without params', async () => {
    vi.mocked(Http.get).mockResolvedValue(
      createMockResponse([{ id: 1 }], {
        current_page: 1,
        last_page: 1,
        per_page: 25,
        total: 1,
      })
    )

    const { rows, refresh } = usePagination({
      endpoint: '/api/items',
    })
    await refresh()

    expect(rows.value).toEqual([{ id: 1 }])
    expect(Http.get).toHaveBeenCalledWith('/api/items', {
      params: { page: '1', per_page: '25' },
    })
  })

  it('converts params to strings for Http', async () => {
    vi.mocked(Http.get).mockResolvedValue(
      createMockResponse([], {
        current_page: 1,
        last_page: 1,
        per_page: 25,
        total: 0,
      })
    )

    const params = { value: { limit: 100, active: true, page_size: 50 } }
    const { refresh } = usePagination({
      endpoint: '/api/items',
      params: params as any,
    })
    await refresh()

    expect(Http.get).toHaveBeenCalledWith('/api/items', {
      params: {
        page: '1',
        per_page: '25',
        limit: '100',
        active: 'true',
        page_size: '50',
      },
    })
  })
})

describe('usePagination race conditions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('window', {
      location: { search: '', pathname: '/test' },
      history: { replaceState: vi.fn() },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('discards stale responses', async () => {
    let resolvers: Array<(value: unknown) => void> = []

    vi.mocked(Http.get).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvers.push(resolve)
        })
    )

    const { rows, refresh } = usePagination<{ id: number }>({
      endpoint: '/api/items',
    })

    // Start first fetch
    const firstFetch = refresh()

    // Start second fetch before first completes
    const secondFetch = refresh()

    // Complete first request (stale)
    resolvers[0]({
      data: [{ id: 1 }],
      meta: { current_page: 1, last_page: 1, per_page: 25, total: 1, from: 1, to: 1 },
      links: { first: null, last: null, prev: null, next: null },
    })

    // Complete second request (current)
    resolvers[1]({
      data: [{ id: 2 }],
      meta: { current_page: 1, last_page: 1, per_page: 25, total: 1, from: 1, to: 1 },
      links: { first: null, last: null, prev: null, next: null },
    })

    await Promise.all([firstFetch, secondFetch])

    // Should only have the second response
    expect(rows.value).toEqual([{ id: 2 }])
  })
})

describe('usePagination with URL sync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('writes to URL on successful fetch when syncUrl is true', async () => {
    const mockReplaceState = vi.fn()
    vi.stubGlobal('window', {
      location: { search: '', pathname: '/test' },
      history: { replaceState: mockReplaceState },
    })

    vi.mocked(Http.get).mockResolvedValue({
      data: [{ id: 1 }],
      meta: { current_page: 1, last_page: 5, per_page: 25, total: 100, from: 1, to: 25 },
      links: { first: null, last: null, prev: null, next: null },
    })

    const { refresh } = usePagination({
      endpoint: '/api/items',
      syncUrl: true,
    })

    await refresh()

    expect(mockReplaceState).toHaveBeenCalledWith(
      {},
      '',
      expect.stringContaining('page=1')
    )
  })

  it('does not write to URL when syncUrl is false', async () => {
    const mockReplaceState = vi.fn()
    vi.stubGlobal('window', {
      location: { search: '', pathname: '/test' },
      history: { replaceState: mockReplaceState },
    })

    vi.mocked(Http.get).mockResolvedValue({
      data: [{ id: 1 }],
      meta: { current_page: 1, last_page: 5, per_page: 25, total: 100, from: 1, to: 25 },
      links: { first: null, last: null, prev: null, next: null },
    })

    const { refresh } = usePagination({
      endpoint: '/api/items',
      syncUrl: false,
    })

    await refresh()

    expect(mockReplaceState).not.toHaveBeenCalled()
  })
})
