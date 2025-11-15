import React, { useState, useEffect } from 'react';

type FieldType = 'text' | 'multiselect' | 'select';

interface FormField {
    name: string;
    label: string;
    type: FieldType;
    required: boolean;
    options?: string[];
}

export interface FormConfig {
    title: string;
    fields: FormField[];
    initialData?: { [key: string]: any };
}

interface DataFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    initialData: any | null;
    config: FormConfig;
    mode: 'add' | 'edit';
}

const DataFormModal: React.FC<DataFormModalProps> = ({ isOpen, onClose, onSave, initialData, config, mode }) => {
    const [formData, setFormData] = useState<any>({});

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            // Set default values for add mode
            const defaults = config.fields.reduce((acc, field) => {
                acc[field.name] = field.type === 'multiselect' ? [] : '';
                return acc;
            }, {} as any);
            setFormData({...defaults, ...config.initialData});
        }
    }, [initialData, config]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };
    
    const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name } = e.target;
        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
        setFormData((prev: any) => ({ ...prev, [name]: selectedOptions }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };
    
    const renderField = (field: FormField) => {
        switch (field.type) {
            case 'multiselect':
                return (
                    <div key={field.name}>
                        <label htmlFor={field.name} className="block text-sm font-medium text-slate-700">{field.label}</label>
                        <select
                            id={field.name}
                            name={field.name}
                            multiple
                            required={field.required}
                            value={formData[field.name] || []}
                            onChange={handleMultiSelectChange}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md h-32"
                        >
                            {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                );
            // FIX: Add case for 'select' field type for dropdowns
            case 'select':
                 return (
                    <div key={field.name}>
                        <label htmlFor={field.name} className="block text-sm font-medium text-slate-700">{field.label}</label>
                        <select
                            id={field.name}
                            name={field.name}
                            required={field.required}
                            value={formData[field.name] || ''}
                            onChange={handleChange}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                            <option value="" disabled>Pilih salah satu</option>
                            {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                );
            case 'text':
            default:
                return (
                     <div key={field.name}>
                        <label htmlFor={field.name} className="block text-sm font-medium text-slate-700">{field.label}</label>
                        <input
                            type="text"
                            id={field.name}
                            name={field.name}
                            required={field.required}
                            value={formData[field.name] || ''}
                            onChange={handleChange}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        />
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md m-4">
                <h2 className="text-xl font-bold text-slate-800 mb-4">
                    {mode === 'add' ? `Tambah ${config.title}` : `Edit ${config.title}`}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {config.fields.map(renderField)}
                    <div className="flex justify-end gap-2 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md text-slate-700 bg-slate-100 hover:bg-slate-200">
                            Batal
                        </button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                            Simpan
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DataFormModal;
