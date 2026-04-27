import { describe, it, expect, beforeAll } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'

const ROOT_DIR = path.resolve(__dirname, '..')
const SCHEMA_FILE = path.join(ROOT_DIR, 'manifest.schema.json')
const MANIFEST_FILE = path.join(ROOT_DIR, 'dist', 'framework-api.json')

describe('Framework API Manifest', () => {
  let schema: object
  let ajv: Ajv

  beforeAll(() => {
    schema = JSON.parse(fs.readFileSync(SCHEMA_FILE, 'utf-8'))
    ajv = new Ajv({ strict: false, allErrors: true })
    addFormats(ajv)
  })

  describe('Schema Validation', () => {
    it('should have a valid JSON schema', () => {
      expect(() => ajv.compile(schema)).not.toThrow()
    })

    it('should reject manifest with missing required fields', () => {
      const validate = ajv.compile(schema)

      // Missing version
      expect(
        validate({
          composables: {},
          utilities: {},
          rules: [],
        })
      ).toBe(false)

      // Missing composables
      expect(
        validate({
          version: '0.2.2',
          utilities: {},
          rules: [],
        })
      ).toBe(false)
    })

    it('should reject invalid version format', () => {
      const validate = ajv.compile(schema)

      expect(
        validate({
          version: 'invalid',
                    composables: {},
          utilities: {},
          rules: [],
        })
      ).toBe(false)
    })

    it('should accept valid semver versions', () => {
      const validate = ajv.compile(schema)

      expect(
        validate({
          version: '1.0.0',
                    composables: {},
          utilities: {},
          rules: [],
        })
      ).toBe(true)

      expect(
        validate({
          version: '0.2.2-beta.1',
                    composables: {},
          utilities: {},
          rules: [],
        })
      ).toBe(true)
    })

    it('should validate composable structure', () => {
      const validate = ajv.compile(schema)

      // Valid composable
      expect(
        validate({
          version: '0.2.2',
                    composables: {
            useForm: {
              summary: 'Form handling composable.',
              options: [
                { name: 'data', type: 'T', required: true },
                { name: 'endpoint', type: 'string', required: false },
              ],
              returns: [
                { name: 'data', type: 'Ref<T>' },
                { name: 'submit', type: '() => Promise<void>' },
              ],
            },
          },
          utilities: {},
          rules: [],
        })
      ).toBe(true)

      // Invalid composable - missing summary
      expect(
        validate({
          version: '0.2.2',
                    composables: {
            useForm: {
              options: [],
              returns: [],
            },
          },
          utilities: {},
          rules: [],
        })
      ).toBe(false)
    })

    it('should validate utility structure', () => {
      const validate = ajv.compile(schema)

      // Valid utility
      expect(
        validate({
          version: '0.2.2',
                    composables: {},
          utilities: {
            Http: {
              summary: 'HTTP client.',
              methods: [
                { name: 'get', signature: '(url: string) => Promise<Response>' },
              ],
              staticMethods: [
                { name: 'create', signature: '() => Http' },
              ],
            },
          },
          rules: [],
        })
      ).toBe(true)

      // Invalid utility - missing methods
      expect(
        validate({
          version: '0.2.2',
                    composables: {},
          utilities: {
            Http: {
              summary: 'HTTP client.',
            },
          },
          rules: [],
        })
      ).toBe(false)
    })

    it('should validate rule factory structure', () => {
      const validate = ajv.compile(schema)

      // Valid rules
      expect(
        validate({
          version: '0.2.2',
                    composables: {},
          utilities: {},
          rules: [
            {
              name: 'required',
              signature: '(message?: string) => Rule',
              description: 'Field must have a value.',
            },
            {
              name: 'email',
              signature: '(message?: string) => Rule',
            },
          ],
        })
      ).toBe(true)

      // Invalid rule - missing name
      expect(
        validate({
          version: '0.2.2',
                    composables: {},
          utilities: {},
          rules: [
            {
              signature: '(message?: string) => Rule',
            },
          ],
        })
      ).toBe(false)
    })
  })

  describe('Generated Manifest', () => {
    let manifest: {
      version: string
      composables: Record<string, unknown>
      utilities: Record<string, unknown>
      rules: unknown[]
    }

    beforeAll(() => {
      if (fs.existsSync(MANIFEST_FILE)) {
        manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf-8'))
      }
    })

    it('should exist in dist directory', () => {
      expect(fs.existsSync(MANIFEST_FILE)).toBe(true)
    })

    it('should pass schema validation', () => {
      const validate = ajv.compile(schema)
      expect(validate(manifest)).toBe(true)
    })

    it('should include expected composables', () => {
      expect(manifest.composables).toHaveProperty('useForm')
      expect(manifest.composables).toHaveProperty('useAuth')
      expect(manifest.composables).toHaveProperty('usePagination')
      expect(manifest.composables).toHaveProperty('useChat')
      expect(manifest.composables).toHaveProperty('useRouter')
    })

    it('should include expected utilities', () => {
      expect(manifest.utilities).toHaveProperty('Http')
      expect(manifest.utilities).toHaveProperty('Collection')
      expect(manifest.utilities).toHaveProperty('Socket')
    })

    it('should include validation rules', () => {
      expect(manifest.rules.length).toBeGreaterThan(0)

      const ruleNames = manifest.rules.map((r: { name: string }) => r.name)
      expect(ruleNames).toContain('required')
      expect(ruleNames).toContain('email')
      expect(ruleNames).toContain('min')
      expect(ruleNames).toContain('max')
    })

    it('should have summaries for composables', () => {
      for (const [name, composable] of Object.entries(manifest.composables)) {
        const c = composable as { summary: string }
        expect(c.summary).toBeTruthy()
        expect(c.summary.length).toBeGreaterThan(0)
      }
    })

    it('should have options and returns for composables', () => {
      const useForm = manifest.composables.useForm as {
        options: unknown[]
        returns: unknown[]
      }
      expect(useForm.options.length).toBeGreaterThan(0)
      expect(useForm.returns.length).toBeGreaterThan(0)
    })

    it('should have methods for utilities', () => {
      const http = manifest.utilities.Http as { methods: unknown[] }
      expect(http.methods.length).toBeGreaterThan(0)
    })

    it('should match package version', () => {
      const pkg = JSON.parse(
        fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf-8')
      )
      expect(manifest.version).toBe(pkg.version)
    })

  })

  describe('Composable Detection', () => {
    let manifest: {
      composables: Record<string, unknown>
    }

    beforeAll(() => {
      if (fs.existsSync(MANIFEST_FILE)) {
        manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf-8'))
      }
    })

    it('should detect all useX exports as composables', () => {
      // All these should be in composables
      const expectedComposables = [
        'useForm',
        'useAuth',
        'usePagination',
        'useInfiniteScroll',
        'useLiveData',
        'useQueryState',
        'useLazyLoad',
        'useChat',
        'useRouter',
        'usePresence',
      ]

      for (const name of expectedComposables) {
        expect(manifest.composables).toHaveProperty(name)
      }
    })

    it('should not include deprecated aliases', () => {
      // These are deprecated and should not be in the manifest
      expect(manifest.composables).not.toHaveProperty('Auth')
      expect(manifest.composables).not.toHaveProperty('Chat')
      expect(manifest.composables).not.toHaveProperty('Router')
    })
  })
})
