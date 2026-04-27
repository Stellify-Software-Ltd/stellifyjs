// =============================================================================
// Utilities - Plain TypeScript, no Vue imports
// =============================================================================

// Data
export { Collection, collect } from './utilities/collection'
export { Tree } from './utilities/tree'

// Uploads
export { Uploader, UploadError } from './utilities/uploads'
export type {
  UploaderOptions,
  UploadEndpoints,
  UploadHandle,
  UploadResult,
  PartReceipt,
  ProgressEvent,
  PartCompleteEvent,
  UploadErrorCode,
} from './utilities/uploads'

// Network
export { Http, HttpError } from './utilities/http'
export { Socket } from './utilities/socket'
export { Stream, StreamError } from './utilities/stream'

// Graphics & Visualization
export { Svg } from './utilities/svg'
export { Graph } from './utilities/graph'
export { Scale } from './utilities/scale'
export { Axis } from './utilities/axis'
export { Motion } from './utilities/motion'
export { Canvas, CanvasError } from './utilities/canvas'

// Platform APIs
export { Media, MediaError } from './utilities/media'
export { DB, DBError } from './utilities/db'
export { Worker, WorkerPool, WorkerError } from './utilities/worker'

// AI & Language
export { Embed, EmbedError } from './utilities/embed'
export { Diff } from './utilities/diff'

// =============================================================================
// Composables - Vue-reactive, holds state that drives UI
// =============================================================================

// Form
export { useForm, rules } from './composables/useForm'
export type { FormOptions, FormReturn, SubmitResult, Rule } from './composables/useForm'

// Data fetching & pagination
export { usePagination } from './composables/usePagination'
export type { PaginationOptions, PaginationReturn, PaginationMeta } from './composables/usePagination'
export { useInfiniteScroll } from './composables/useInfiniteScroll'
export type { InfiniteScrollOptions, InfiniteScrollReturn } from './composables/useInfiniteScroll'
export { useLiveData } from './composables/useLiveData'
export type { LiveDataOptions, LiveDataReturn } from './composables/useLiveData'
export { useQueryState } from './composables/useQueryState'
export type { QueryStateOptions, QueryStateReturn } from './composables/useQueryState'
export { useLazyLoad } from './composables/useLazyLoad'
export type { LazyLoadOptions, LazyLoadReturn } from './composables/useLazyLoad'

// Auth & Chat
export { useAuth, AuthError } from './composables/useAuth'
export type { AuthOptions, AuthReturn } from './composables/useAuth'
export { useChat, useChatFromHistory } from './composables/useChat'
export type { ChatOptions, ChatReturn } from './composables/useChat'

// Router
export { useRouter } from './composables/useRouter'
export type { RouterReturn } from './composables/useRouter'

// Presence
export { usePresence } from './composables/usePresence'
export type { PresenceOptions, PresenceReturn, PresenceUser } from './composables/usePresence'

// =============================================================================
// Deprecated aliases - will be removed in next major version
// =============================================================================

/**
 * @deprecated Use `useAuth` instead. Will be removed in the next major version.
 */
export { useAuth as Auth } from './composables/useAuth'

/**
 * @deprecated Use `useChat` instead. Will be removed in the next major version.
 */
export { useChat as Chat } from './composables/useChat'

/**
 * @deprecated Use `useRouter` instead. Will be removed in the next major version.
 */
export { useRouter as Router } from './composables/useRouter'
