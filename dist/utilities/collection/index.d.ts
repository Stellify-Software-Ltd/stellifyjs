/**
 * Collection module - barrel exports
 *
 * Exports:
 * - Collection class and collect() function for chainable API
 * - All atomic functions for granular imports
 * - Type definitions
 */
export { Collection, collect } from './collect';
export type { Predicate, Mapper, Reducer, KeyMapper, Operator } from './types';
export { parseOperator, compareValues } from './operators';
export * from './retrieval';
export * from './where';
export * from './filter';
export * from './transform';
export * from './grouping';
export * from './ordering';
export * from './slicing';
export * from './mutation';
export * from './combining';
export * from './aggregate';
export * from './predicates';
export * from './control';
export * from './misc';
