/**
 * Common type definitions for Collection atomics
 */

export type Predicate<T> = (item: T, index: number) => boolean
export type Mapper<T, U> = (item: T, index: number) => U
export type Reducer<T, U> = (acc: U, item: T, index: number) => U
export type KeyMapper<T> = (item: T, index: number) => { key: string | number; value: unknown }
export type Operator = '=' | '==' | '===' | '!=' | '!==' | '<' | '<=' | '>' | '>=' | '<>'
