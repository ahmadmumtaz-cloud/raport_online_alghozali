import React, { useState, useCallback, useMemo } from 'react';
import { Grade, AppView, User, HistoryLog, Teacher, Student, HomeroomTeacher } from './types';
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

const App: React.FC = () => {
    // --- STATE MANAGEMENT ---
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [view, setView] = useState<AppView>(AppView.DASHBOARD);
    
    // Data master sekarang dikelola sebagai state
    const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
    const [teachers, setTeachers] = useState<Teacher[]>(INITIAL_TEACHERS);
    const [homeroomTeachers, setHomeroomTeachers] = useState<HomeroomTeacher[]>(INITIAL_HOMEROOM_TEACHERS);
    const [subjects, setSubjects] = useState<string[]>(INITIAL_SUBJECTS);
    const [grades, setGrades] = useState<Grade[]>(INITIAL_GRADES);
    const [history, setHistory] = useState<HistoryLog[]>([]);

    // --- COMPUTED/MEMOIZED DATA ---
    const allUsers: User[] = useMemo(() => [...teachers, ADMIN_USER], [teachers]);
    
    const studentsByClass = useMemo(() => {
        return students.reduce((acc, student) => {
            if (!acc[student.class]) acc[student.class] = [];
            acc[student.class].push(student);
            return acc;
        }, {} as { [key: string]: Student[] });
    }, [students]);

    const teachersById = useMemo(() => {
        return allUsers.reduce((acc, user) => {
            acc[user.id] = user;
            return acc;
        }, {} as { [key: string]: User });
    }, [allUsers]);

    const studentsById = useMemo(() => {
        return students.reduce((acc, student) => {
            acc[student.studentId] = student;
            return acc;
        }, {} as { [key: string]: Student });
    }, [students]);
    
    const allClasses = useMemo(() => [...new Set([...students.map(s => s.class), ...homeroomTeachers.map(h => h.class)])].sort(), [students, homeroomTeachers]);

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

    // --- CRUD & DATA HANDLERS ---
    const handleSaveGrades = useCallback((newGrades: Grade[], subject: string, studentClass: string) => {
        setGrades(prevGrades => {
            const updatedGrades = [...prevGrades];
            newGrades.forEach(newGrade => {
                const index = updatedGrades.findIndex(
                    g => g.studentId === newGrade.studentId && g.subject === newGrade.subject && g.semester === newGrade.semester
                );
                if (index !== -1) updatedGrades[index] = newGrade;
                else updatedGrades.push(newGrade);
            });
            return updatedGrades;
        });
        addHistoryLog('Simpan Nilai', `Menyimpan ${newGrades.length} nilai untuk mapel ${subject} di kelas ${studentClass}.`);
        alert('Nilai berhasil disimpan!');
    }, [addHistoryLog]);
    
    // Student CRUD
    const handleStudentAction = (action: 'add' | 'update' | 'delete', data: Student | string) => {
        if (action === 'add') {
            const newStudent = { ...data as Student, id: `S${Date.now()}` };
            setStudents(prev => [...prev, newStudent]);
            addHistoryLog('Tambah Siswa', `Menambahkan siswa baru: ${newStudent.name} (${newStudent.studentId})`);
        } else if (action === 'update') {
            const updatedStudent = data as Student;
            setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
            addHistoryLog('Update Siswa', `Memperbarui data siswa: ${updatedStudent.name}`);
        } else if (action === 'delete') {
            const studentId = data as string;
            const studentName = students.find(s => s.id === studentId)?.name || 'N/A';
            setStudents(prev => prev.filter(s => s.id !== studentId));
            addHistoryLog('Hapus Siswa', `Menghapus siswa: ${studentName}`);
        }
    };
    
    // Teacher CRUD
    const handleTeacherAction = (action: 'add' | 'update' | 'delete', data: Teacher | string) => {
         if (action === 'add') {
            const newTeacher = { ...data as Teacher, id: `T${Date.now()}` };
            setTeachers(prev => [...prev, newTeacher]);
            addHistoryLog('Tambah Guru', `Menambahkan guru baru: ${newTeacher.name}`);
        } else if (action === 'update') {
            const updatedTeacher = data as Teacher;
            setTeachers(prev => prev.map(t => t.id === updatedTeacher.id ? updatedTeacher : t));
            addHistoryLog('Update Guru', `Memperbarui data guru: ${updatedTeacher.name}`);
        } else if (action === 'delete') {
            const teacherId = data as string;
            const teacherName = teachers.find(t => t.id === teacherId)?.name || 'N/A';
            setTeachers(prev => prev.filter(t => t.id !== teacherId));
            addHistoryLog('Hapus Guru', `Menghapus guru: ${teacherName}`);
        }
    };
    
    // Homeroom Teacher CRUD
    const handleHomeroomAction = (action: 'add' | 'update' | 'delete', data: HomeroomTeacher | string) => {
        if (action === 'add') {
            const newHr = { ...data as HomeroomTeacher, id: `HR${Date.now()}` };
            setHomeroomTeachers(prev => [...prev, newHr]);
            addHistoryLog('Tambah Wali Kelas', `Menambahkan wali kelas baru: ${newHr.name}`);
        } else if (action === 'update') {
            const updatedHr = data as HomeroomTeacher;
            setHomeroomTeachers(prev => prev.map(h => h.id === updatedHr.id ? updatedHr : h));
            addHistoryLog('Update Wali Kelas', `Memperbarui data wali kelas: ${updatedHr.name}`);
        } else if (action === 'delete') {
            const hrId = data as string;
            const hrName = homeroomTeachers.find(h => h.id === hrId)?.name || 'N/A';
            setHomeroomTeachers(prev => prev.filter(h => h.id !== hrId));
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
            setSubjects(prev => [...prev, newSubject].sort());
            addHistoryLog('Tambah Mapel', `Menambahkan mata pelajaran baru: ${newSubject}`);
        } else if (action === 'update') {
            const { oldName, newName } = data as { oldName: string, newName: string };
             if (subjects.includes(newName) && oldName !== newName) {
                alert(`Mata pelajaran "${newName}" sudah ada.`);
                return;
            }
            // Cascading update
            setSubjects(prev => prev.map(s => s === oldName ? newName : s).sort());
            setTeachers(prev => prev.map(t => ({...t, subjects: t.subjects.map(s => s === oldName ? newName : s)})));
            setGrades(prev => prev.map(g => g.subject === oldName ? {...g, subject: newName} : g));
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
            
            setSubjects(prev => prev.filter(s => s !== subjectToDelete));
            addHistoryLog('Hapus Mapel', `Menghapus mata pelajaran: ${subjectToDelete}`);
        }
    };

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
        return <Login teachers={teachers} adminUser={ADMIN_USER} onLogin={handleLogin} />;
    }

    const teacherViews = [AppView.DASHBOARD, AppView.GRADE_INPUT, AppView.SUMMARY, AppView.REPORT_CARD];
    const adminViews = [AppView.DASHBOARD, AppView.SUMMARY, AppView.REPORT_CARD, AppView.DATA_MANAGEMENT, AppView.HISTORY];
    const availableViews = currentUser.role === 'admin' ? adminViews : teacherViews;

    const renderView = () => {
        switch (view) {
            case AppView.DASHBOARD:
                return <Dashboard grades={grades} students={students} teachers={teachers} />;
            case AppView.GRADE_INPUT:
                if (currentUser.role !== 'teacher') return <p>Hanya guru yang bisa mengakses halaman ini.</p>;
                return <GradeInput 
                    currentTeacher={currentUser as Teacher}
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
                />;
            case AppView.REPORT_CARD:
                return <ReportCard
                    grades={grades}
                    homeroomTeachers={homeroomTeachers}
                    schoolInfo={SCHOOL_INFO}
                    classes={allClasses}
                    studentsByClass={studentsByClass}
                    teachersById={teachersById}
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
                    setStudents={setStudents}
                    setTeachers={setTeachers}
                    setHomeroomTeachers={setHomeroomTeachers}
                    addHistoryLog={addHistoryLog}
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