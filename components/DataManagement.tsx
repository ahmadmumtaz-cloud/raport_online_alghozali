import React, { useState, useRef } from 'react';
import { Student, Teacher, HomeroomTeacher } from '../types';
import { parseJsonFile } from '../services/dataService';
import DataFormModal, { FormConfig } from './DataFormModal';
import { UndoIcon, RedoIcon } from './icons/UndoRedoIcons';
import ConfirmationModal from './ConfirmationModal';

interface DataManagementProps {
    students: Student[];
    teachers: Teacher[];
    homeroomTeachers: HomeroomTeacher[];
    subjects: string[];
    onStudentAction: (action: 'add' | 'update' | 'delete', data: Student | string) => void;
    onTeacherAction: (action: 'add' | 'update' | 'delete', data: Teacher | string) => void;
    onHomeroomAction: (action: 'add' | 'update' | 'delete', data: HomeroomTeacher | string) => void;
    onSubjectAction: (action: 'add' | 'update' | 'delete', data: { oldName: string, newName: string } | string) => void;
    onBulkDataChange: (dataType: 'students' | 'teachers' | 'homeroom', data: any[]) => void;
    addHistoryLog: (action: string, details: string) => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
}

type ManagedTab = 'students' | 'teachers' | 'homeroom' | 'subjects';
type ModalState = {
    isOpen: boolean;
    mode: 'add' | 'edit';
    data: any;
    config: FormConfig | null;
};
type DeletionState = {
    isOpen: boolean;
    id: string | null;
    name: string | null;
};

const DataManagement: React.FC<DataManagementProps> = (props) => {
    const { 
        students, teachers, homeroomTeachers, subjects,
        onStudentAction, onTeacherAction, onHomeroomAction, onSubjectAction,
        onBulkDataChange, addHistoryLog,
        onUndo, onRedo, canUndo, canRedo
    } = props;
    const [activeTab, setActiveTab] = useState<ManagedTab>('students');
    const [modalState, setModalState] = useState<ModalState>({ isOpen: false, mode: 'add', data: null, config: null });
    const [deletionState, setDeletionState] = useState<DeletionState>({ isOpen: false, id: null, name: null });
    const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
    const [bulkAddText, setBulkAddText] = useState('');
    const [bulkAddClass, setBulkAddClass] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const formConfigs: { [key in ManagedTab]: FormConfig } = {
        students: {
            title: "Siswa",
            fields: [
                { name: "name", label: "Nama Siswa", type: "text", required: true },
                { name: "studentId", label: "Nomor Induk", type: "text", required: true },
                { name: "class", label: "Kelas", type: "text", required: true },
                 { name: "gender", label: "Jenis Kelamin", type: "select", required: true, options: ["Laki-laki", "Perempuan"] },
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

    const handleDeleteRequest = (id: string, name: string) => {
        setDeletionState({ isOpen: true, id, name });
    };

    const handleConfirmDelete = () => {
        if (deletionState.id) {
            switch (activeTab) {
                case 'students': onStudentAction('delete', deletionState.id); break;
                case 'teachers': onTeacherAction('delete', deletionState.id); break;
                case 'homeroom': onHomeroomAction('delete', deletionState.id); break;
                case 'subjects': onSubjectAction('delete', deletionState.id); break; // Here id is the subject name
            }
        }
    };
    
    const handleBulkAdd = () => {
        if (!bulkAddClass.trim()) {
            alert('Silakan isi nama kelas terlebih dahulu.');
            return;
        }
        const lines = bulkAddText.trim().split('\n');
        const newStudents: Omit<Student, 'id'>[] = [];
        const errors: string[] = [];
        const existingNisns = new Set(students.map(s => s.studentId));

        lines.forEach((line, index) => {
            const parts = line.split(/\t|,/).map(p => p.trim());
            if (parts.length >= 4) { // No, Nama, NISN, L/P
                const name = parts[1];
                const nisn = parts[2];
                const genderChar = parts[3].toUpperCase();

                if (name && nisn && (genderChar === 'L' || genderChar === 'P')) {
                    if(existingNisns.has(nisn)) {
                        errors.push(`Baris ${index + 1}: NISN ${nisn} sudah ada.`);
                    } else {
                        newStudents.push({
                            name,
                            studentId: nisn,
                            class: bulkAddClass.trim(),
                            gender: genderChar === 'L' ? 'Laki-laki' : 'Perempuan'
                        });
                        existingNisns.add(nisn); // Avoid duplicates within the same bulk add
                    }
                } else {
                    errors.push(`Baris ${index + 1}: Data tidak lengkap atau format gender salah (gunakan L/P).`);
                }
            } else if (line.trim() !== '') {
                errors.push(`Baris ${index + 1}: Jumlah kolom tidak sesuai. Harap gunakan format: No, Nama, NISN, L/P`);
            }
        });

        if (errors.length > 0) {
            alert('Beberapa data tidak dapat diproses:\n\n' + errors.join('\n'));
            return;
        }
        
        if (newStudents.length > 0) {
            const addedStudents = newStudents.map((s, i) => ({...s, id: `S${Date.now() + i}`}));
            onBulkDataChange('students', [...students, ...addedStudents].sort((a, b) => a.name.localeCompare(b.name)));
            addHistoryLog('Tambah Siswa Massal', `Menambahkan ${addedStudents.length} siswa baru ke kelas ${bulkAddClass.trim()}.`);
            setIsBulkAddOpen(false);
            setBulkAddText('');
            setBulkAddClass('');
            alert(`${addedStudents.length} siswa berhasil ditambahkan.`);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const data = await parseJsonFile(file);
            let count = 0;
            switch (activeTab) {
                case 'students': onBulkDataChange('students', data as Student[]); count = (data as Student[]).length; break;
                case 'teachers': onBulkDataChange('teachers', data as Teacher[]); count = (data as Teacher[]).length; break;
                case 'homeroom': onBulkDataChange('homeroom', data as HomeroomTeacher[]); count = (data as HomeroomTeacher[]).length; break;
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

    const renderBulkAddModal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start pt-10 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl m-4">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Tambah Siswa Massal via Copy-Paste</h2>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="bulk-class" className="block text-sm font-medium text-slate-700">Nama Kelas untuk Siswa Baru</label>
                        <input type="text" id="bulk-class" value={bulkAddClass} onChange={e => setBulkAddClass(e.target.value)} placeholder="Contoh: 1 A Tahfidz Putri" className="mt-1 block w-full pl-3 pr-4 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md" />
                    </div>
                    <div>
                        <label htmlFor="bulk-data" className="block text-sm font-medium text-slate-700">Data Siswa</label>
                        <textarea 
                            id="bulk-data"
                            rows={10}
                            value={bulkAddText}
                            onChange={e => setBulkAddText(e.target.value)}
                            className="mt-1 block w-full pl-3 pr-4 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md font-mono text-sm"
                            placeholder={"Salin dan tempel data dari spreadsheet (pisahkan dengan Tab atau koma).\nFormat: No, Nama Lengkap, NISN, L/P\n\nContoh:\n1\tBUDI SANTOSO\t12345678\tL\n2\tSITI AMINAH\t87654321\tP"}
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                    <button type="button" onClick={() => setIsBulkAddOpen(false)} className="px-4 py-2 text-sm font-medium rounded-md text-slate-700 bg-slate-100 hover:bg-slate-200">
                        Batal
                    </button>
                    <button onClick={handleBulkAdd} className="px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                        Proses dan Tambah
                    </button>
                </div>
            </div>
        </div>
    );

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
                                    <button onClick={() => handleDeleteRequest(s.id, s.name)} className={deleteButtonClasses}>Hapus</button>
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
                                    <button onClick={() => handleDeleteRequest(t.id, t.name)} className={deleteButtonClasses}>Hapus</button>
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
                                    <button onClick={() => handleDeleteRequest(h.id, h.name)} className={deleteButtonClasses}>Hapus</button>
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
                                    <button onClick={() => handleDeleteRequest(s, s)} className={deleteButtonClasses}>Hapus</button>
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
            {isBulkAddOpen && renderBulkAddModal()}
            <ConfirmationModal
                isOpen={deletionState.isOpen}
                onClose={() => setDeletionState({ isOpen: false, id: null, name: null })}
                onConfirm={handleConfirmDelete}
                title={`Konfirmasi Penghapusan ${formConfigs[activeTab].title}`}
                message={`Apakah Anda yakin ingin menghapus data "${deletionState.name}"? Tindakan ini tidak dapat diurungkan.`}
            />
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
                    {activeTab !== 'subjects' && (
                        <>
                            <button 
                                onClick={onUndo} 
                                disabled={!canUndo}
                                className="px-3 py-2 text-sm font-medium rounded-md text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Undo"
                            >
                                <UndoIcon />
                            </button>
                             <button 
                                onClick={onRedo} 
                                disabled={!canRedo}
                                className="px-3 py-2 text-sm font-medium rounded-md text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Redo"
                            >
                                <RedoIcon />
                            </button>
                        </>
                    )}
                    {activeTab === 'students' && (
                        <button 
                            onClick={() => setIsBulkAddOpen(true)} 
                            className="px-4 py-2 text-sm font-medium rounded-md text-slate-700 bg-white border border-slate-300 hover:bg-slate-50"
                        >
                            Tambah Massal
                        </button>
                    )}
                     <button 
                        onClick={() => fileInputRef.current?.click()} 
                        className="px-4 py-2 text-sm font-medium rounded-md text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={activeTab === 'subjects'}
                        title={activeTab === 'subjects' ? "Upload tidak didukung untuk Mata Pelajaran" : "Upload Data dari file JSON"}
                    >
                        Upload JSON
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