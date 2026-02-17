import { Form } from '../../form';
type BindType = 'text' | 'checkbox' | 'select' | 'file';
interface TextBinding {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}
interface CheckboxBinding {
    checked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
interface FileBinding {
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
type Binding = TextBinding | CheckboxBinding | FileBinding;
export interface ReactForm extends Form {
    bind(field: string, type?: BindType): Binding;
}
type FormData = Record<string, unknown>;
export declare function useForm(initialData?: FormData): ReactForm;
export {};
