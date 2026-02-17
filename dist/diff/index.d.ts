type ChangeType = 'insert' | 'delete' | 'equal';
interface Change {
    type: ChangeType;
    value: string;
    oldStart?: number;
    oldEnd?: number;
    newStart?: number;
    newEnd?: number;
}
interface DiffOptions {
    ignoreCase?: boolean;
    ignoreWhitespace?: boolean;
    trimLines?: boolean;
}
export declare class Diff {
    private constructor();
    static chars(oldStr: string, newStr: string, options?: DiffOptions): Change[];
    static words(oldStr: string, newStr: string, options?: DiffOptions): Change[];
    static lines(oldStr: string, newStr: string, options?: DiffOptions): Change[];
    private static computeDiff;
    private static mergeChanges;
    static apply(original: string, changes: Change[]): string;
    static createPatch(filename: string, oldStr: string, newStr: string, context?: number): string;
    static distance(a: string, b: string): number;
    static similarity(a: string, b: string): number;
    static commonPrefix(a: string, b: string): string;
    static commonSuffix(a: string, b: string): string;
}
export {};
