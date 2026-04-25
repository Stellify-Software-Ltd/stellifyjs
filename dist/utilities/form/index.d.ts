type FormData = Record<string, unknown>;
type ValidationRule = (value: unknown) => string | null;
type ValidationRules = Record<string, ValidationRule>;
type FormErrors = Record<string, string>;
export declare class Form {
    private data;
    private initial;
    private rules;
    private errors;
    private constructor();
    static create(data?: FormData): Form;
    set(key: string, value: unknown): Form;
    get(key: string): unknown;
    getData(): FormData;
    validate(rules?: ValidationRules): Form;
    isValid(): boolean;
    getErrors(): FormErrors;
    getError(key: string): string | null;
    reset(): Form;
    store(url: string): Promise<Response>;
    update(url: string): Promise<Response>;
    delete(url: string): Promise<Response>;
}
export {};
