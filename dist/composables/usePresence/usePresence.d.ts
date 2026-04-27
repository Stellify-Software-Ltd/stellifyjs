import type { PresenceOptions, PresenceReturn } from './types';
/**
 * Real-time collaborative presence composable
 *
 * Enables seeing who else is on a page, where their cursor is, and what they're focused on.
 * Works with Laravel Reverb / Pusher presence channels.
 *
 * @example
 * ```vue
 * <script setup>
 * import { usePresence } from 'stellify-framework'
 *
 * const { users, cursor, focus } = usePresence({
 *   channel: 'customers',
 *   user: { id: currentUser.id, name: currentUser.name },
 * })
 * </script>
 *
 * <template>
 *   <div @mousemove="cursor" class="relative">
 *     <div v-for="row in rows" :key="row.id"
 *          @mouseenter="focus(row.id)"
 *          @mouseleave="focus(null)">
 *       {{ row.name }}
 *     </div>
 *     <UserCursor v-for="user in users" :key="user.id" :user="user" />
 *   </div>
 * </template>
 * ```
 */
export declare function usePresence(options: PresenceOptions): PresenceReturn;
