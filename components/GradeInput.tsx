import React, { useState, useEffect } from 'react';
import { Teacher, Student, Grade } from '../types';

interface GradeInputProps {
    currentTeacher: Teacher;
    studentsByClass: { [key: string]: Student[] };
    onSaveGrades: (grades: Grade[], subject: string, studentClass: string) => void;
    allClasses: string[];
    initialGrades: Grade[];
}

const GradeInput: React.FC<GradeInputProps> = ({ currentTeacher, studentsByClass, onSaveGrades, allClasses, initialGrades }) => {
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedSemester, setSelectedSemester] = useState<1 | 2>(1);
    const [grades, setGrades] = useState<{ [studentId: string]: number }>({});
    
    const studentsInClass = selectedClass ? studentsByClass[selectedClass] || [] : [];

    useEffect(() => {
        if (selectedClass && selectedSubject && selectedSemester) {
            const existingGrades = initialGrades.filter(
                g => g.class === selectedClass && g.subject === selectedSubject && g.semester === selectedSemester
            );
            const gradesMap = existingGrades.reduce((acc, grade) => {
                const student = studentsInClass.find(s => s.studentId === grade.studentId);
                if (student) {
                    acc[student.studentId] = grade.score;
                }
                return acc;
            }, {} as { [studentId: string]: number });
            setGrades(gradesMap);
        } else {
            setGrades({});
        }
    }, [selectedClass, selectedSubject, selectedSemester, initialGrades, studentsByClass, studentsInClass]);


    const handleGradeChange = (studentId: string, score: string) => {
        const numericScore = parseInt(score, 10);
        if (!isNaN(numericScore) && numericScore >= 0 && numericScore <= 100) {
            setGrades(prev => ({ ...prev, [studentId]: numericScore }));
        } else if (score === '') {
            setGrades(prev => {
                const newGrades = { ...prev };
                delete newGrades[studentId];
                return newGrades;
            });
        }
    };

    const handleSave = () => {
        if (!selectedSubject || !selectedClass || !selectedSemester) {
            alert('Silakan pilih mata pelajaran, kelas, dan semester terlebih dahulu.');
            return;
        }
        const newGrades: Grade[] = Object.entries(grades).map(([studentId, score]) => ({
            studentId,
            subject: selectedSubject,
            teacherId: currentTeacher.id,
            class: selectedClass,
            semester: selectedSemester,
            // FIX: Ensure score is a number to match the Grade type.
            score: Number(score),
        }));
        onSaveGrades(newGrades, selectedSubject, selectedClass);
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Input Nilai Siswa</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-slate-50 rounded-lg border">
                <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-slate-700">Mata Pelajaran</label>
                    <select
                        id="subject"
                        value={selectedSubject}
                        onChange={e => setSelectedSubject(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                        <option value="">Pilih Mata Pelajaran</option>
                        {currentTeacher.subjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="class" className="block text-sm font-medium text-slate-700">Kelas</label>
                    <select
                        id="class"
                        value={selectedClass}
                        onChange={e => setSelectedClass(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                        <option value="">Pilih Kelas</option>
                        {allClasses.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="semester" className="block text-sm font-medium text-slate-700">Semester</label>
                    <select
                        id="semester"
                        value={selectedSemester}
                        onChange={e => setSelectedSemester(Number(e.target.value) as 1 | 2)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                        <option value={1}>Semester 1</option>
                        <option value={2}>Semester 2</option>
                    </select>
                </div>
            </div>

            {selectedClass && selectedSubject ? (
                <div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">No.</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nomor Induk</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nama Siswa</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-32">Nilai (0-100)</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {studentsInClass.map((student, index) => (
                                    <tr key={student.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{index + 1}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{student.studentId}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{student.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={grades[student.studentId] || ''}
                                                onChange={e => handleGradeChange(student.studentId, e.target.value)}
                                                className="w-24 border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={handleSave}
                            className="inline-flex items-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Simpan Nilai
                        </button>
                    </div>
                </div>
            ) : (
                <div className="text-center py-10 px-4 bg-slate-50 rounded-lg">
                    <p className="text-slate-500">Silakan pilih mata pelajaran dan kelas untuk menampilkan daftar siswa.</p>
                </div>
            )}
        </div>
    );
};

export default GradeInput;