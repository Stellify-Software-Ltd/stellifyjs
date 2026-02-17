import { Form } from '../../form';
type BindType = 'text' | 'checkbox' | 'select' | 'file';
interface TextBinding {
    value: string;
    onInput: (e: Event) => void;
}
interface CheckboxBinding {
    checked: boolean;
    onChange: (e: Event) => void;
}
interface FileBinding {
    onChange: (e: Event) => void;
}
type Binding = TextBinding | CheckboxBinding | FileBinding;
type FormData = Record<string, unknown>;
export declare function useForm(initialData?: FormData): {
    set: (key: string, value: unknown) => Form;
    get: (key: string) => unknown;
    getData: () => FormData;
    validate: (rules?: Record<string, (value: unknown) => string | null>) => Form;
    isValid: () => boolean;
    getErrors: () => Record<string, string>;
    getError: (key: string) => string | null;
    reset: () => Form;
    store: (url: string) => Promise<Response>;
    update: (url: string) => Promise<Response>;
    delete: (url: string) => Promise<Response>;
    bind: (field: string, type?: BindType) => Binding;
    state: {
        data: {
            [x: string]: unknown;
        };
        errors: Record<string, string>;
    };
};
export {};
