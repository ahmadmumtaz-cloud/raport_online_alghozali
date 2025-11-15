import React, { useState, useRef } from 'react';
import { Student, Teacher, HomeroomTeacher } from '../types';
import { parseJsonFile } from '../services/dataService';
import DataFormModal, { FormConfig } from './DataFormModal';

interface DataManagementProps {
    students: Student[];
    teachers: Teacher[];
    homeroomTeachers: HomeroomTeacher[];
    subjects: string[];
    onStudentAction: (action: 'add' | 'update' | 'delete', data: Student | string) => void;
    onTeacherAction: (action: 'add' | 'update' | 'delete', data: Teacher | string) => void;
    onHomeroomAction: (action: 'add' | 'update' | 'delete', data: HomeroomTeacher | string) => void;
    onSubjectAction: (action: 'add' | 'update' | 'delete', data: { oldName: string, newName: string } | string) => void;
    setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
    setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
    setHomeroomTeachers: React.Dispatch<React.SetStateAction<HomeroomTeacher[]>>;
    addHistoryLog: (action: string, details: string) => void;
}

type ManagedTab = 'students' | 'teachers' | 'homeroom' | 'subjects';
type ModalState = {
    isOpen: boolean;
    mode: 'add' | 'edit';
    data: any;
    config: FormConfig | null;
};

const DataManagement: React.FC<DataManagementProps> = (props) => {
    const { 
        students, teachers, homeroomTeachers, subjects,
        onStudentAction, onTeacherAction, onHomeroomAction, onSubjectAction,
        setStudents, setTeachers, setHomeroomTeachers, addHistoryLog 
    } = props;
    const [activeTab, setActiveTab] = useState<ManagedTab>('students');
    const [modalState, setModalState] = useState<ModalState>({ isOpen: false, mode: 'add', data: null, config: null });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const formConfigs: { [key in ManagedTab]: FormConfig } = {
        students: {
            title: "Siswa",
            fields: [
                { name: "name", label: "Nama Siswa", type: "text", required: true },
                { name: "studentId", label: "Nomor Induk", type: "text", required: true },
                { name: "class", label: "Kelas", type: "text", required: true },
            ]
        },
        teachers: {
            title: "Guru",
            fields: [
                { name: "name", label: "Nama Guru", type: "text", required: true },
                { name: "subjects", label: "Mata Pelajaran", type: "multiselect", required: true, options: subjects },
            ],
            initialData: { role: 'teacher' }
        },
        homeroom: {
            title: "Wali Kelas",
            fields: [
                { name: "name", label: "Nama Wali Kelas", type: "text", required: true },
                { name: "class", label: "Kelas Ampuan", type: "text", required: true },
                { name: "contact", label: "Kontak", type: "text", required: false },
            ]
        },
        subjects: {
            title: "Mata Pelajaran",
            fields: [
                 { name: "name", label: "Nama Mata Pelajaran", type: "text", required: true },
            ]
        }
    };
    
    // Update teacher form config dynamically if subjects change
    formConfigs.teachers.fields.find(f => f.name === 'subjects')!.options = subjects;

    const handleOpenModal = (mode: 'add' | 'edit', data: any = null) => {
        const modalData = activeTab === 'subjects' && data ? { name: data } : data;
        setModalState({ isOpen: true, mode, data: modalData, config: formConfigs[activeTab] });
    };

    const handleCloseModal = () => {
        setModalState({ isOpen: false, mode: 'add', data: null, config: null });
    };

    const handleSave = (data: any) => {
        const action = modalState.mode === 'add' ? 'add' : 'update';
        switch (activeTab) {
            case 'students': onStudentAction(action, data); break;
            case 'teachers': onTeacherAction(action, data); break;
            case 'homeroom': onHomeroomAction(action, data); break;
            case 'subjects':
                if (action === 'add') {
                    onSubjectAction('add', data.name);
                } else {
                    onSubjectAction('update', { oldName: modalState.data.name, newName: data.name });
                }
                break;
        }
        handleCloseModal();
    };

    const handleDelete = (id: string, name: string) => {
        if (window.confirm(`Apakah Anda yakin ingin menghapus data "${name}"?`)) {
            switch (activeTab) {
                case 'students': onStudentAction('delete', id); break;
                case 'teachers': onTeacherAction('delete', id); break;
                case 'homeroom': onHomeroomAction('delete', id); break;
                case 'subjects': onSubjectAction('delete', id); break; // Here id is the subject name
            }
        }
    };
    
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const data = await parseJsonFile(file);
            let count = 0;
            switch (activeTab) {
                case 'students': setStudents(data as Student[]); count = (data as Student[]).length; break;
                case 'teachers': setTeachers(data as Teacher[]); count = (data as Teacher[]).length; break;
                case 'homeroom': setHomeroomTeachers(data as HomeroomTeacher[]); count = (data as HomeroomTeacher[]).length; break;
                // Note: Upload for subjects is not implemented as it's a simple string array
            }
            if (activeTab !== 'subjects') {
                addHistoryLog(`Upload Data ${formConfigs[activeTab].title}`, `Berhasil mengunggah ${count} data dari file ${file.name}`);
                alert('Data berhasil diunggah!');
            } else {
                 alert('Upload tidak didukung untuk Mata Pelajaran.');
            }
        } catch (error) {
            alert(`Gagal memproses file: ${error instanceof Error ? error.message : 'Unknown error'}`);
            console.error(error);
        }
        
        if(fileInputRef.current) fileInputRef.current.value = "";
    };

    const renderTable = () => {
        const commonButtonClasses = "px-3 py-1 text-xs font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2";
        const editButtonClasses = `${commonButtonClasses} text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500`;
        const deleteButtonClasses = `${commonButtonClasses} text-white bg-red-600 hover:bg-red-700 focus:ring-red-500`;

        switch (activeTab) {
            case 'students': return (
                <table className="min-w-full divide-y divide-slate-200">
                    {/* Student table JSX */}
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nama Siswa</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nomor Induk</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Kelas</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {students.map(s => (
                            <tr key={s.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{s.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{s.studentId}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{s.class}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                    <button onClick={() => handleOpenModal('edit', s)} className={editButtonClasses}>Edit</button>
                                    <button onClick={() => handleDelete(s.id, s.name)} className={deleteButtonClasses}>Hapus</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
            case 'teachers': return (
                 <table className="min-w-full divide-y divide-slate-200">
                    {/* Teacher table JSX */}
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nama Guru</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Mata Pelajaran</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {teachers.map(t => (
                            <tr key={t.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{t.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{t.subjects?.join(', ')}</td>
                                 <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                    <button onClick={() => handleOpenModal('edit', t)} className={editButtonClasses}>Edit</button>
                                    <button onClick={() => handleDelete(t.id, t.name)} className={deleteButtonClasses}>Hapus</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
            case 'homeroom': return (
                <table className="min-w-full divide-y divide-slate-200">
                    {/* Homeroom teacher table JSX */}
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nama Wali Kelas</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Kelas Ampuan</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Kontak</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {homeroomTeachers.map(h => (
                            <tr key={h.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{h.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{h.class}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{h.contact}</td>
                                 <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                    <button onClick={() => handleOpenModal('edit', h)} className={editButtonClasses}>Edit</button>
                                    <button onClick={() => handleDelete(h.id, h.name)} className={deleteButtonClasses}>Hapus</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
             case 'subjects': return (
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nama Mata Pelajaran</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {subjects.map(s => (
                            <tr key={s}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{s}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                    <button onClick={() => handleOpenModal('edit', s)} className={editButtonClasses}>Edit</button>
                                    <button onClick={() => handleDelete(s, s)} className={deleteButtonClasses}>Hapus</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
            default: return null;
        }
    }

    return (
        <div>
            {modalState.isOpen && modalState.config && (
                <DataFormModal 
                    isOpen={modalState.isOpen}
                    onClose={handleCloseModal}
                    onSave={handleSave}
                    initialData={modalState.data}
                    config={modalState.config}
                    mode={modalState.mode}
                />
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileUpload} />

            <h2 className="text-2xl font-bold text-slate-800 mb-4">Manajemen Data</h2>
            
            <div className="sm:flex sm:justify-between sm:items-center mb-4">
                <div className="flex items-center gap-2 border-b border-slate-200 sm:border-b-0 flex-wrap">
                    <TabButton tab="students" label="Siswa" activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton tab="teachers" label="Guru Mapel" activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton tab="homeroom" label="Wali Kelas" activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton tab="subjects" label="Mata Pelajaran" activeTab={activeTab} setActiveTab={setActiveTab} />
                </div>
                <div className="flex items-center gap-2 mt-4 sm:mt-0">
                     <button 
                        onClick={() => fileInputRef.current?.click()} 
                        className="px-4 py-2 text-sm font-medium rounded-md text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={activeTab === 'subjects'}
                        title={activeTab === 'subjects' ? "Upload tidak didukung untuk Mata Pelajaran" : "Upload Data"}
                    >
                        Upload Data
                    </button>
                    <button onClick={() => handleOpenModal('add')} className="px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                        Tambah {formConfigs[activeTab].title}
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                {renderTable()}
            </div>
        </div>
    );
};

const TabButton: React.FC<{ tab: ManagedTab, label: string, activeTab: ManagedTab, setActiveTab: (tab: ManagedTab) => void }> = ({ tab, label, activeTab, setActiveTab }) => (
    <button
        onClick={() => setActiveTab(tab)}
        className={`px-4 py-2 text-sm font-medium rounded-t-md whitespace-nowrap ${activeTab === tab ? 'border-b-2 border-indigo-600 text-indigo-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
    >
        {label}
    </button>
);

export default DataManagement;