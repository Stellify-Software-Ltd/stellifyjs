/**
 * Manifest Generator Script
 *
 * Walks StellifyJS public exports using the TypeScript Compiler API
 * and generates dist/framework-api.json manifest.
 *
 * Usage: npx tsx scripts/generate-manifest.ts
 */

import * as ts from 'typescript'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Types for manifest structure
interface OptionField {
  name: string
  type: string
  required: boolean
  description?: string
}

interface ReturnField {
  name: string
  type: string
  description?: string
}

interface Method {
  name: string
  signature: string
  description?: string
}

interface ComposableEntry {
  summary: string
  options: OptionField[]
  returns: ReturnField[]
}

interface UtilityEntry {
  summary: string
  methods: Method[]
  staticMethods?: Method[]
}

interface RuleFactory {
  name: string
  signature: string
  description?: string
}

interface Manifest {
  version: string
  generatedAt: string
  composables: Record<string, ComposableEntry>
  utilities: Record<string, UtilityEntry>
  rules: RuleFactory[]
}

// Paths
const ROOT_DIR = path.resolve(__dirname, '..')
const SRC_DIR = path.join(ROOT_DIR, 'src')
const DIST_DIR = path.join(ROOT_DIR, 'dist')
const INDEX_FILE = path.join(SRC_DIR, 'index.ts')
const SCHEMA_FILE = path.join(ROOT_DIR, 'manifest.schema.json')
const OUTPUT_FILE = path.join(DIST_DIR, 'framework-api.json')
const PACKAGE_JSON = path.join(ROOT_DIR, 'package.json')

// Read package version
function getPackageVersion(): string {
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf-8'))
  return pkg.version
}

// Extract first sentence from JSDoc comment using TypeScript API
function extractSummary(node: ts.Node, _sourceFile: ts.SourceFile): string {
  // Use TypeScript's JSDoc API to get the comment for this specific node
  const jsDocs = ts.getJSDocCommentsAndTags(node)

  for (const jsDoc of jsDocs) {
    if (ts.isJSDoc(jsDoc) && jsDoc.comment) {
      const comment =
        typeof jsDoc.comment === 'string'
          ? jsDoc.comment
          : jsDoc.comment.map(c => ('text' in c ? c.text : '')).join('')

      if (comment.trim()) {
        // Extract first sentence (up to first period followed by space/newline or end)
        const firstSentence = comment.match(/^[^@]*?\.(?:\s|$|\n)/)
        if (firstSentence) {
          return firstSentence[0].trim()
        }

        // If no period, take text up to first @tag or end
        const upToTag = comment.match(/^[^@]*/)
        if (upToTag) {
          return upToTag[0].trim()
        }
      }
    }
  }

  return ''
}

// Extract JSDoc description for a property/method
function extractPropertyDescription(
  node: ts.Node,
  sourceFile: ts.SourceFile
): string | undefined {
  const jsDocs = ts.getJSDocCommentsAndTags(node)

  for (const jsDoc of jsDocs) {
    if (ts.isJSDoc(jsDoc) && jsDoc.comment) {
      const comment =
        typeof jsDoc.comment === 'string'
          ? jsDoc.comment
          : jsDoc.comment.map(c => ('text' in c ? c.text : '')).join('')
      if (comment.trim()) {
        return comment.trim()
      }
    }
  }

  return undefined
}

// Convert a TypeScript type to a string representation
function typeToString(
  type: ts.Type,
  checker: ts.TypeChecker,
  depth: number = 0
): string {
  if (depth > 3) {
    return 'unknown'
  }

  // Use the type checker's built-in method for most cases
  const typeString = checker.typeToString(
    type,
    undefined,
    ts.TypeFormatFlags.NoTruncation
  )

  // Clean up some common patterns for readability
  return typeString
    .replace(/import\([^)]+\)\./g, '') // Remove import(...). prefixes
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}

// Get function signature as a string
function getFunctionSignature(
  signature: ts.Signature,
  checker: ts.TypeChecker
): string {
  const params = signature.parameters.map(param => {
    const paramType = checker.getTypeOfSymbolAtLocation(
      param,
      param.valueDeclaration!
    )
    const isOptional =
      param.valueDeclaration &&
      ts.isParameter(param.valueDeclaration) &&
      !!param.valueDeclaration.questionToken
    const paramTypeStr = typeToString(paramType, checker)
    return `${param.name}${isOptional ? '?' : ''}: ${paramTypeStr}`
  })

  const returnType = signature.getReturnType()
  const returnTypeStr = typeToString(returnType, checker)

  return `(${params.join(', ')}) => ${returnTypeStr}`
}

// Check if a property is declared in user code (not a built-in type)
function isUserDeclaredProperty(prop: ts.Symbol): boolean {
  const decl = prop.valueDeclaration
  if (!decl) return false

  const sourceFile = decl.getSourceFile()
  if (!sourceFile) return false

  // Skip properties from node_modules or lib files
  const fileName = sourceFile.fileName
  if (
    fileName.includes('node_modules') ||
    fileName.includes('/lib.') ||
    fileName.includes('\\lib.')
  ) {
    return false
  }

  return true
}

// Extract options from a composable's Options interface
function extractComposableOptions(
  optionsType: ts.Type,
  checker: ts.TypeChecker,
  _sourceFile: ts.SourceFile
): OptionField[] {
  const options: OptionField[] = []
  const properties = optionsType.getProperties()

  for (const prop of properties) {
    // Skip built-in properties (like String.prototype methods)
    if (!isUserDeclaredProperty(prop)) {
      continue
    }

    const propType = checker.getTypeOfSymbolAtLocation(
      prop,
      prop.valueDeclaration!
    )
    const typeStr = typeToString(propType, checker)

    // Check if property is optional
    const isRequired = !(prop.flags & ts.SymbolFlags.Optional)

    const field: OptionField = {
      name: prop.name,
      type: typeStr,
      required: isRequired,
    }

    // Try to get description from JSDoc
    if (prop.valueDeclaration) {
      const declSourceFile = prop.valueDeclaration.getSourceFile()
      const desc = extractPropertyDescription(prop.valueDeclaration, declSourceFile)
      if (desc) {
        field.description = desc
      }
    }

    options.push(field)
  }

  return options
}

// Extract return fields from a composable's Return interface
function extractComposableReturns(
  returnType: ts.Type,
  checker: ts.TypeChecker,
  _sourceFile: ts.SourceFile
): ReturnField[] {
  const returns: ReturnField[] = []
  const properties = returnType.getProperties()

  for (const prop of properties) {
    // Skip built-in properties
    if (!isUserDeclaredProperty(prop)) {
      continue
    }

    const propType = checker.getTypeOfSymbolAtLocation(
      prop,
      prop.valueDeclaration!
    )
    const typeStr = typeToString(propType, checker)

    const field: ReturnField = {
      name: prop.name,
      type: typeStr,
    }

    // Try to get description from JSDoc
    if (prop.valueDeclaration) {
      const declSourceFile = prop.valueDeclaration.getSourceFile()
      const desc = extractPropertyDescription(prop.valueDeclaration, declSourceFile)
      if (desc) {
        field.description = desc
      }
    }

    returns.push(field)
  }

  return returns
}

// Extract methods from a class
function extractClassMethods(
  classType: ts.Type,
  checker: ts.TypeChecker,
  sourceFile: ts.SourceFile
): { methods: Method[]; staticMethods: Method[] } {
  const methods: Method[] = []
  const staticMethods: Method[] = []

  const properties = classType.getProperties()

  for (const prop of properties) {
    // Skip private/protected members
    if (
      prop.valueDeclaration &&
      ts.getCombinedModifierFlags(prop.valueDeclaration as ts.Declaration) &
        ts.ModifierFlags.Private
    ) {
      continue
    }

    const propType = checker.getTypeOfSymbolAtLocation(
      prop,
      prop.valueDeclaration!
    )
    const callSignatures = propType.getCallSignatures()

    if (callSignatures.length > 0) {
      // It's a method
      const sig = callSignatures[0]
      const signature = getFunctionSignature(sig, checker)

      const method: Method = {
        name: prop.name,
        signature,
      }

      // Try to get description
      if (prop.valueDeclaration) {
        const desc = extractPropertyDescription(
          prop.valueDeclaration,
          sourceFile
        )
        if (desc) {
          method.description = desc
        }
      }

      methods.push(method)
    }
  }

  // Get static methods from the class symbol itself
  const symbol = classType.getSymbol()
  if (symbol) {
    const classDecl = symbol.valueDeclaration
    if (classDecl && ts.isClassDeclaration(classDecl)) {
      for (const member of classDecl.members) {
        if (
          ts.isMethodDeclaration(member) &&
          member.modifiers?.some(m => m.kind === ts.SyntaxKind.StaticKeyword)
        ) {
          const name = member.name.getText(sourceFile)

          // Skip private methods
          if (
            member.modifiers?.some(m => m.kind === ts.SyntaxKind.PrivateKeyword)
          ) {
            continue
          }

          const methodSymbol = checker.getSymbolAtLocation(member.name)
          if (methodSymbol) {
            const methodType = checker.getTypeOfSymbolAtLocation(
              methodSymbol,
              member
            )
            const callSigs = methodType.getCallSignatures()
            if (callSigs.length > 0) {
              const signature = getFunctionSignature(callSigs[0], checker)

              const method: Method = {
                name,
                signature,
              }

              const desc = extractPropertyDescription(member, sourceFile)
              if (desc) {
                method.description = desc
              }

              staticMethods.push(method)
            }
          }
        }
      }
    }
  }

  return { methods, staticMethods }
}

// Extract rules from the rules object
function extractRules(
  rulesType: ts.Type,
  checker: ts.TypeChecker,
  sourceFile: ts.SourceFile
): RuleFactory[] {
  const rules: RuleFactory[] = []
  const properties = rulesType.getProperties()

  for (const prop of properties) {
    const propType = checker.getTypeOfSymbolAtLocation(
      prop,
      prop.valueDeclaration!
    )
    const callSignatures = propType.getCallSignatures()

    if (callSignatures.length > 0) {
      const sig = callSignatures[0]
      const signature = getFunctionSignature(sig, checker)

      const rule: RuleFactory = {
        name: prop.name,
        signature,
      }

      // Try to get description
      if (prop.valueDeclaration) {
        const desc = extractPropertyDescription(
          prop.valueDeclaration,
          sourceFile
        )
        if (desc) {
          rule.description = desc
        }
      }

      rules.push(rule)
    }
  }

  return rules
}

// Main generator function
function generateManifest(): Manifest {
  // Create TypeScript program
  const configPath = ts.findConfigFile(ROOT_DIR, ts.sys.fileExists)
  const configFile = ts.readConfigFile(configPath!, ts.sys.readFile)
  const parsedConfig = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    ROOT_DIR
  )

  const program = ts.createProgram(parsedConfig.fileNames, parsedConfig.options)
  const checker = program.getTypeChecker()

  const manifest: Manifest = {
    version: getPackageVersion(),
    generatedAt: new Date().toISOString(),
    composables: {},
    utilities: {},
    rules: [],
  }

  // Get the source file for index.ts
  const indexSource = program.getSourceFile(INDEX_FILE)
  if (!indexSource) {
    throw new Error(`Could not find source file: ${INDEX_FILE}`)
  }

  // Get all exports from index.ts
  const indexSymbol = checker.getSymbolAtLocation(indexSource)
  if (!indexSymbol) {
    throw new Error('Could not get symbol for index.ts')
  }

  const exports = checker.getExportsOfModule(indexSymbol)

  for (const exp of exports) {
    const name = exp.name

    // Skip type exports (they don't have valueDeclaration)
    if (!exp.valueDeclaration && !(exp.flags & ts.SymbolFlags.Alias)) {
      continue
    }

    // Check if the export itself has @deprecated tag (for re-exported aliases)
    // Also check for known deprecated aliases by name
    const deprecatedAliases = ['Auth', 'Chat', 'Router']
    if (deprecatedAliases.includes(name)) {
      continue
    }

    const exportDeclarations = exp.declarations || []
    let isDeprecated = false
    for (const exportDecl of exportDeclarations) {
      if (ts.getJSDocDeprecatedTag(exportDecl)) {
        isDeprecated = true
        break
      }
    }
    if (isDeprecated) {
      continue
    }

    // Resolve aliased symbols
    const resolvedSymbol =
      exp.flags & ts.SymbolFlags.Alias
        ? checker.getAliasedSymbol(exp)
        : exp

    // Also skip if the resolved declaration has @deprecated tag
    if (
      resolvedSymbol.valueDeclaration &&
      ts.getJSDocDeprecatedTag(resolvedSymbol.valueDeclaration)
    ) {
      continue
    }

    // Get the declaration
    const decl = resolvedSymbol.valueDeclaration
    if (!decl) continue

    // Get the source file for this declaration
    const declSourceFile = decl.getSourceFile()

    // Check if it's a composable (function starting with use)
    if (name.match(/^use[A-Z]/) && ts.isFunctionDeclaration(decl)) {
      const funcType = checker.getTypeAtLocation(decl)
      const callSignatures = funcType.getCallSignatures()

      if (callSignatures.length > 0) {
        const sig = callSignatures[0]
        const params = sig.getParameters()

        let options: OptionField[] = []
        let returns: ReturnField[] = []

        // Find the options parameter - look for an object type with user-declared properties
        // Composables may have (options) or (endpoint, options) or similar patterns
        for (const param of params) {
          const paramType = checker.getTypeOfSymbolAtLocation(
            param,
            param.valueDeclaration!
          )

          // Check if this looks like an options object (has user-declared properties)
          const props = paramType.getProperties()
          const userProps = props.filter(p => isUserDeclaredProperty(p))

          if (userProps.length > 0) {
            options = extractComposableOptions(
              paramType,
              checker,
              declSourceFile
            )
            break // Use the first options-like parameter
          }
        }

        // Get return type
        const returnType = sig.getReturnType()
        returns = extractComposableReturns(returnType, checker, declSourceFile)

        const summary = extractSummary(decl, declSourceFile)

        manifest.composables[name] = {
          summary: summary || `Vue composable: ${name}`,
          options,
          returns,
        }
      }
    }
    // Check if it's the rules object
    else if (name === 'rules') {
      const rulesType = checker.getTypeAtLocation(decl)
      manifest.rules = extractRules(rulesType, checker, declSourceFile)
    }
    // Check if it's a utility class
    else if (ts.isClassDeclaration(decl)) {
      const classType = checker.getTypeAtLocation(decl)
      const { methods, staticMethods } = extractClassMethods(
        classType,
        checker,
        declSourceFile
      )

      const summary = extractSummary(decl, declSourceFile)

      const utility: UtilityEntry = {
        summary: summary || `Utility class: ${name}`,
        methods,
      }

      if (staticMethods.length > 0) {
        utility.staticMethods = staticMethods
      }

      manifest.utilities[name] = utility
    }
    // Check if it's a utility function (not a composable)
    else if (
      ts.isFunctionDeclaration(decl) &&
      !name.match(/^use[A-Z]/) &&
      !name.endsWith('Error')
    ) {
      const funcType = checker.getTypeAtLocation(decl)
      const callSignatures = funcType.getCallSignatures()

      if (callSignatures.length > 0) {
        const sig = callSignatures[0]
        const signature = getFunctionSignature(sig, checker)
        const summary = extractSummary(decl, declSourceFile)

        manifest.utilities[name] = {
          summary: summary || `Utility function: ${name}`,
          methods: [
            {
              name: name,
              signature,
            },
          ],
        }
      }
    }
    // Skip errors, types, etc.
    else {
      if (!name.endsWith('Error')) {
        console.warn(`Skipping export '${name}' — type not recognised`)
      }
    }
  }

  return manifest
}

// Validate manifest against schema
function validateManifest(manifest: Manifest): void {
  const schema = JSON.parse(fs.readFileSync(SCHEMA_FILE, 'utf-8'))

  const ajv = new Ajv({ strict: false, allErrors: true })
  addFormats(ajv)

  const validate = ajv.compile(schema)
  const valid = validate(manifest)

  if (!valid) {
    console.error('Manifest validation failed:')
    for (const error of validate.errors || []) {
      console.error(`  - ${error.instancePath}: ${error.message}`)
    }
    process.exit(1)
  }
}

// Main execution
function main(): void {
  console.log('Generating StellifyJS framework manifest...')

  try {
    // Ensure dist directory exists
    if (!fs.existsSync(DIST_DIR)) {
      fs.mkdirSync(DIST_DIR, { recursive: true })
    }

    // Generate manifest
    const manifest = generateManifest()

    // Validate against schema
    validateManifest(manifest)

    // Write to file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2) + '\n')

    // Print summary
    const composableCount = Object.keys(manifest.composables).length
    const utilityCount = Object.keys(manifest.utilities).length
    const ruleCount = manifest.rules.length

    console.log(
      `Generated manifest: ${composableCount} composables, ${utilityCount} utilities, ${ruleCount} rules.`
    )
    console.log(`Output: ${OUTPUT_FILE}`)
  } catch (error) {
    console.error('Error generating manifest:', error)
    process.exit(1)
  }
}

main()
