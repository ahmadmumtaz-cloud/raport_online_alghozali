
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Grade, AppView, User, HistoryLog, Student, HomeroomTeacher } from './types';
import { 
    INITIAL_GRADES, SCHOOL_INFO, INITIAL_STUDENTS, INITIAL_TEACHERS, INITIAL_HOMEROOM_TEACHERS, 
    INITIAL_SUBJECTS, ADMIN_USER
} from './constants';
import Header from './components/Header';
import GradeInput from './components/GradeInput';
import GradeSummary from './components/GradeSummary';
import ReportCard from './components/ReportCard';
import Dashboard from './components/Dashboard';
import DataManagement from './components/DataManagement';
import HistoryLogView from './components/HistoryLogView';
import Login from './components/Login';

// Type for a snapshot of the data state for undo/redo
type DataState = {
    students: Student[];
    teachers: (User & { role: 'teacher' })[];
    homeroomTeachers: HomeroomTeacher[];
    subjects: string[];
    grades: Grade[];
};

// Type for the entire app state to be persisted
type AppState = {
    historyStack: DataState[];
    historyIndex: number;
    history: HistoryLog[];
};

const LOCAL_STORAGE_KEY = 'raportAlGhozaliAppState';

const App: React.FC = () => {
    // --- STATE MANAGEMENT & PERSISTENCE ---

    // A single function to load and parse the state from localStorage
    const loadStateFromLocalStorage = (): AppState | null => {
        try {
            const savedStateJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (!savedStateJSON) return null;

            const savedState = JSON.parse(savedStateJSON);

            // Basic validation
            if (
                !savedState.historyStack || !Array.isArray(savedState.historyStack) || savedState.historyStack.length === 0 ||
                typeof savedState.historyIndex !== 'number'
            ) {
                console.warn("Invalid data found in localStorage. Resetting to default.");
                localStorage.removeItem(LOCAL_STORAGE_KEY);
                return null;
            }
            
            // Re-hydrate Date objects in the history log from their string representation
            if (savedState.history && Array.isArray(savedState.history)) {
                savedState.history = savedState.history.map((log: any) => ({
                    ...log,
                    timestamp: new Date(log.timestamp),
                }));
            }

            return savedState;

        } catch (error) {
            console.error("Failed to load state from localStorage. Resetting.", error);
            localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear corrupted data
            return null;
        }
    };

    const initialAppState = loadStateFromLocalStorage();

    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [view, setView] = useState<AppView>(AppView.DASHBOARD);
    
    // Undo/Redo history state - SINGLE SOURCE OF TRUTH for all undoable data
    const [historyStack, setHistoryStack] = useState<DataState[]>(
        initialAppState?.historyStack || [{
            students: INITIAL_STUDENTS,
            teachers: INITIAL_TEACHERS,
            homeroomTeachers: INITIAL_HOMEROOM_TEACHERS,
            subjects: INITIAL_SUBJECTS,
            grades: INITIAL_GRADES,
        }]
    );
    const [historyIndex, setHistoryIndex] = useState<number>(initialAppState?.historyIndex ?? 0);

    // All undoable data is derived directly from the history stack
    const { students, teachers, homeroomTeachers, subjects, grades } = historyStack[historyIndex];
    
    // Other states not part of undo/redo, but we will persist it
    const [history, setHistory] = useState<HistoryLog[]>(initialAppState?.history || []);

    // Effect to save the entire app state to localStorage whenever it changes
    useEffect(() => {
        try {
            const stateToSave: AppState = {
                historyStack,
                historyIndex,
                history,
            };
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
        } catch (error) {
            console.error("Could not save state to localStorage", error);
        }
    }, [historyStack, historyIndex, history]);


    // --- HISTORY LOGGING ---
    const addHistoryLog = useCallback((action: string, details: string) => {
        const logEntry: HistoryLog = {
            timestamp: new Date(),
            user: currentUser?.name || 'System',
            action,
            details
        };
        setHistory(prevHistory => [logEntry, ...prevHistory]);
    }, [currentUser]);

    // --- UNDO/REDO & DATA UPDATE LOGIC ---
    const updateDataAndPushHistory = useCallback((updates: Partial<DataState>) => {
        const currentState = historyStack[historyIndex];
        const nextState: DataState = {
            students: updates.students ?? currentState.students,
            teachers: updates.teachers ?? currentState.teachers,
            homeroomTeachers: updates.homeroomTeachers ?? currentState.homeroomTeachers,
            subjects: updates.subjects ?? currentState.subjects,
            grades: updates.grades ?? currentState.grades,
        };

        const newHistoryStack = historyStack.slice(0, historyIndex + 1);
        newHistoryStack.push(nextState);
        setHistoryStack(newHistoryStack);
        setHistoryIndex(newHistoryStack.length - 1);
    }, [historyStack, historyIndex]);

    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < historyStack.length - 1;

    const handleUndo = useCallback(() => {
        if (!canUndo) return;
        setHistoryIndex(prevIndex => prevIndex - 1);
        addHistoryLog('Undo', `Mengembalikan perubahan data.`);
    }, [canUndo, addHistoryLog]);

    const handleRedo = useCallback(() => {
        if (!canRedo) return;
        setHistoryIndex(prevIndex => prevIndex + 1);
        addHistoryLog('Redo', `Mengulangi perubahan data.`);
    }, [canRedo, addHistoryLog]);


    // --- COMPUTED/MEMOIZED DATA ---
    const studentsByClass = useMemo(() => {
        return students.reduce((acc, student) => {
            if (!acc[student.class]) acc[student.class] = [];
            acc[student.class].push(student);
            return acc;
        }, {} as { [key: string]: Student[] });
    }, [students]);

    const teachersById = useMemo(() => {
        return [...teachers, ADMIN_USER].reduce((acc, user) => {
            acc[user.id] = user;
            return acc;
        }, {} as { [key: string]: User });
    }, [teachers]);

    const studentsById = useMemo(() => {
        return students.reduce((acc, student) => {
            acc[student.studentId] = student;
            return acc;
        }, {} as { [key: string]: Student });
    }, [students]);
    
    const allClasses = useMemo(() => [...new Set([...students.map(s => s.class), ...homeroomTeachers.map(h => h.class)])].sort(), [students, homeroomTeachers]);

    // --- CRUD & DATA HANDLERS ---
    const handleSaveGrades = useCallback((newGrades: Grade[], subject: string, studentClass: string) => {
        const updatedGrades = [...grades];
        newGrades.forEach(newGrade => {
            const index = updatedGrades.findIndex(
                g => g.studentId === newGrade.studentId && g.subject === newGrade.subject && g.semester === newGrade.semester
            );
            if (index !== -1) updatedGrades[index] = newGrade;
            else updatedGrades.push(newGrade);
        });
        updateDataAndPushHistory({ grades: updatedGrades });
        addHistoryLog('Simpan Nilai', `Menyimpan ${newGrades.length} nilai untuk mapel ${subject} di kelas ${studentClass}.`);
        alert('Nilai berhasil disimpan!');
    }, [addHistoryLog, grades, updateDataAndPushHistory]);
    
    // Student CRUD
    const handleStudentAction = (action: 'add' | 'update' | 'delete', data: Student | string) => {
        if (action === 'add') {
            const newStudent = { ...data as Student, id: `S${Date.now()}` };
            updateDataAndPushHistory({ students: [...students, newStudent] });
            addHistoryLog('Tambah Siswa', `Menambahkan siswa baru: ${newStudent.name} (${newStudent.studentId})`);
        } else if (action === 'update') {
            const updatedStudent = data as Student;
            updateDataAndPushHistory({ students: students.map(s => s.id === updatedStudent.id ? updatedStudent : s) });
            addHistoryLog('Update Siswa', `Memperbarui data siswa: ${updatedStudent.name}`);
        } else if (action === 'delete') {
            const studentId = data as string;
            const studentName = students.find(s => s.id === studentId)?.name || 'N/A';
            updateDataAndPushHistory({ students: students.filter(s => s.id !== studentId) });
            addHistoryLog('Hapus Siswa', `Menghapus siswa: ${studentName}`);
        }
    };
    
    // Teacher CRUD
    const handleTeacherAction = (action: 'add' | 'update' | 'delete', data: (User & {role: 'teacher'}) | string) => {
         if (action === 'add') {
            const newTeacher = { ...data as (User & {role: 'teacher'}), id: `T${Date.now()}` };
            updateDataAndPushHistory({ teachers: [...teachers, newTeacher] });
            addHistoryLog('Tambah Guru', `Menambahkan guru baru: ${newTeacher.name}`);
        } else if (action === 'update') {
            const updatedTeacher = data as (User & {role: 'teacher'});
            updateDataAndPushHistory({ teachers: teachers.map(t => t.id === updatedTeacher.id ? updatedTeacher : t) });
            addHistoryLog('Update Guru', `Memperbarui data guru: ${updatedTeacher.name}`);
        } else if (action === 'delete') {
            const teacherId = data as string;
            const teacherName = teachers.find(t => t.id === teacherId)?.name || 'N/A';
            updateDataAndPushHistory({ teachers: teachers.filter(t => t.id !== teacherId) });
            addHistoryLog('Hapus Guru', `Menghapus guru: ${teacherName}`);
        }
    };
    
    // Homeroom Teacher CRUD
    const handleHomeroomAction = (action: 'add' | 'update' | 'delete', data: HomeroomTeacher | string) => {
        if (action === 'add') {
            const newHr = { ...data as HomeroomTeacher, id: `HR${Date.now()}` };
            updateDataAndPushHistory({ homeroomTeachers: [...homeroomTeachers, newHr] });
            addHistoryLog('Tambah Wali Kelas', `Menambahkan wali kelas baru: ${newHr.name}`);
        } else if (action === 'update') {
            const updatedHr = data as HomeroomTeacher;
            updateDataAndPushHistory({ homeroomTeachers: homeroomTeachers.map(h => h.id === updatedHr.id ? updatedHr : h) });
            addHistoryLog('Update Wali Kelas', `Memperbarui data wali kelas: ${updatedHr.name}`);
        } else if (action === 'delete') {
            const hrId = data as string;
            const hrName = homeroomTeachers.find(h => h.id === hrId)?.name || 'N/A';
            updateDataAndPushHistory({ homeroomTeachers: homeroomTeachers.filter(h => h.id !== hrId) });
            addHistoryLog('Hapus Wali Kelas', `Menghapus wali kelas: ${hrName}`);
        }
    };
    
    // Subject CRUD
    const handleSubjectAction = (action: 'add' | 'update' | 'delete', data: { oldName: string, newName: string } | string) => {
        if (action === 'add') {
            const newSubject = data as string;
            if (subjects.includes(newSubject)) {
                alert(`Mata pelajaran "${newSubject}" sudah ada.`);
                return;
            }
            updateDataAndPushHistory({ subjects: [...subjects, newSubject].sort() });
            addHistoryLog('Tambah Mapel', `Menambahkan mata pelajaran baru: ${newSubject}`);
        } else if (action === 'update') {
            const { oldName, newName } = data as { oldName: string, newName: string };
             if (subjects.includes(newName) && oldName !== newName) {
                alert(`Mata pelajaran "${newName}" sudah ada.`);
                return;
            }
            const newSubjects = subjects.map(s => s === oldName ? newName : s).sort();
            const newTeachers = teachers.map(t => ({...t, subjects: t.subjects.map(s => s === oldName ? newName : s)}));
            const newGrades = grades.map(g => g.subject === oldName ? {...g, subject: newName} : g);
            updateDataAndPushHistory({ subjects: newSubjects, teachers: newTeachers, grades: newGrades });
            addHistoryLog('Update Mapel', `Mengubah nama mapel dari "${oldName}" menjadi "${newName}"`);

        } else if (action === 'delete') {
            const subjectToDelete = data as string;
            // Check for usage before deletion
            const isUsedByTeacher = teachers.some(t => t.subjects.includes(subjectToDelete));
            const isUsedInGrades = grades.some(g => g.subject === subjectToDelete);

            if(isUsedByTeacher || isUsedInGrades) {
                alert(`Tidak dapat menghapus "${subjectToDelete}" karena sedang digunakan oleh guru atau dalam data nilai.`);
                return;
            }
            
            updateDataAndPushHistory({ subjects: subjects.filter(s => s !== subjectToDelete) });
            addHistoryLog('Hapus Mapel', `Menghapus mata pelajaran: ${subjectToDelete}`);
        }
    };

     const handleBulkDataChange = useCallback((dataType: 'students' | 'teachers' | 'homeroom', data: any[]) => {
        if (dataType === 'students') {
            updateDataAndPushHistory({ students: data });
        } else if (dataType === 'teachers') {
            updateDataAndPushHistory({ teachers: data });
        } else if (dataType === 'homeroom') {
            updateDataAndPushHistory({ homeroomTeachers: data });
        }
    }, [updateDataAndPushHistory]);


    // --- AUTHENTICATION ---
    const handleLogin = (user: User) => {
        setCurrentUser(user);
        setView(AppView.DASHBOARD);
    };

    const handleLogout = () => {
        setCurrentUser(null);
    };

    // --- RENDER LOGIC ---
    if (!currentUser) {
        return <Login teachers={teachers} adminUser={ADMIN_USER} homeroomTeachers={homeroomTeachers} onLogin={handleLogin} />;
    }

    const adminViews = [AppView.DASHBOARD, AppView.SUMMARY, AppView.REPORT_CARD, AppView.DATA_MANAGEMENT, AppView.HISTORY];
    const teacherViews = [AppView.DASHBOARD, AppView.GRADE_INPUT, AppView.SUMMARY, AppView.REPORT_CARD];
    const homeroomViews = [AppView.DASHBOARD, AppView.SUMMARY, AppView.REPORT_CARD];

    let availableViews: AppView[];
    switch (currentUser.role) {
        case 'admin':
            availableViews = adminViews;
            break;
        case 'teacher':
            availableViews = teacherViews;
            break;
        case 'homeroom':
            availableViews = homeroomViews;
            break;
        default:
            availableViews = [];
    }
    

    const renderView = () => {
        switch (view) {
            case AppView.DASHBOARD:
                return <Dashboard grades={grades} students={students} teachers={teachers} />;
            case AppView.GRADE_INPUT:
                if (currentUser.role !== 'teacher') return <p>Hanya guru yang bisa mengakses halaman ini.</p>;
                return <GradeInput 
                    currentTeacher={currentUser}
                    studentsByClass={studentsByClass}
                    onSaveGrades={handleSaveGrades}
                    allClasses={allClasses}
                    initialGrades={grades}
                />;
            case AppView.SUMMARY:
                return <GradeSummary
                    grades={grades}
                    subjects={subjects}
                    classes={allClasses}
                    studentsById={studentsById}
                    teachersById={teachersById}
                    students={students}
                    currentUser={currentUser}
                />;
            case AppView.REPORT_CARD:
                return <ReportCard
                    grades={grades}
                    homeroomTeachers={homeroomTeachers}
                    schoolInfo={SCHOOL_INFO}
                    classes={allClasses}
                    studentsByClass={studentsByClass}
                    teachersById={teachersById}
                    currentUser={currentUser}
                />;
            case AppView.DATA_MANAGEMENT:
                if (currentUser.role !== 'admin') return <p>Hanya admin yang bisa mengakses halaman ini.</p>;
                return <DataManagement 
                    students={students} 
                    teachers={teachers} 
                    homeroomTeachers={homeroomTeachers}
                    subjects={subjects}
                    onStudentAction={handleStudentAction}
                    onTeacherAction={handleTeacherAction}
                    onHomeroomAction={handleHomeroomAction}
                    onSubjectAction={handleSubjectAction}
                    onBulkDataChange={handleBulkDataChange}
                    addHistoryLog={addHistoryLog}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    canUndo={canUndo}
                    canRedo={canRedo}
                />;
            case AppView.HISTORY:
                if (currentUser.role !== 'admin') return <p>Hanya admin yang bisa mengakses halaman ini.</p>;
                return <HistoryLogView logs={history} />;
            default:
                return <Dashboard grades={grades} students={students} teachers={teachers} />;
        }
    };
    
    return (
        <div className="bg-slate-100 min-h-screen font-sans">
            <Header schoolName={SCHOOL_INFO.name} user={currentUser} onLogout={handleLogout} />
            <main className="p-4 md:p-8">
                <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-4 sm:p-6">
                    <nav className="flex flex-wrap border-b border-slate-200 mb-6">
                        {availableViews.map(v => (
                            <button
                                key={v}
                                onClick={() => setView(v)}
                                className={`px-4 py-3 text-sm md:text-base font-medium transition-colors duration-200 ${
                                    view === v
                                        ? 'border-b-2 border-indigo-600 text-indigo-600'
                                        : 'text-slate-500 hover:text-indigo-500'
                                }`}
                            >
                                {v}
                            </button>
                        ))}
                    </nav>
                    {renderView()}
                </div>
            </main>
        </div>
    );
};

export default App;
