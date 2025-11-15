import React, { useState, useMemo } from 'react';
import { Grade, Student, User } from '../types';

interface GradeSummaryProps {
    grades: Grade[];
    subjects: string[];
    classes: string[];
    studentsById: { [key: string]: Student };
    teachersById: { [key: string]: User };
}

const GradeSummary: React.FC<GradeSummaryProps> = ({ grades, subjects, classes, studentsById, teachersById }) => {
    const [filterClass, setFilterClass] = useState<string>('');
    const [filterSubject, setFilterSubject] = useState<string>('');
    const [filterSemester, setFilterSemester] = useState<string>('');

    const filteredGrades = useMemo(() => {
        return grades.filter(grade =>
            (filterClass === '' || grade.class === filterClass) &&
            (filterSubject === '' || grade.subject === filterSubject) &&
            (filterSemester === '' || grade.semester.toString() === filterSemester)
        );
    }, [grades, filterClass, filterSubject, filterSemester]);

    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Rekapitulasi Nilai</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-slate-50 rounded-lg border">
                <div>
                    <label htmlFor="filter-class" className="block text-sm font-medium text-slate-700">Filter Kelas</label>
                    <select id="filter-class" value={filterClass} onChange={e => setFilterClass(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                        <option value="">Semua Kelas</option>
                        {classes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="filter-subject" className="block text-sm font-medium text-slate-700">Filter Mata Pelajaran</label>
                    <select id="filter-subject" value={filterSubject} onChange={e => setFilterSubject(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                        <option value="">Semua Mapel</option>
                        {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="filter-semester" className="block text-sm font-medium text-slate-700">Filter Semester</label>
                    <select id="filter-semester" value={filterSemester} onChange={e => setFilterSemester(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                        <option value="">Semua Semester</option>
                        <option value="1">Semester 1</option>
                        <option value="2">Semester 2</option>
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nama Siswa</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Kelas</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Mata Pelajaran</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Semester</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nilai</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Guru</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {filteredGrades.length > 0 ? filteredGrades.sort((a,b) => (studentsById[a.studentId]?.name || '').localeCompare(studentsById[b.studentId]?.name || '')).map((grade, index) => (
                            <tr key={`${grade.studentId}-${grade.subject}-${index}`}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{studentsById[grade.studentId]?.name || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{grade.class}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{grade.subject}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{grade.semester}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-indigo-600">{grade.score}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{teachersById[grade.teacherId]?.name || 'N/A'}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={6} className="text-center py-10 px-4 text-slate-500">
                                    Tidak ada data nilai yang cocok dengan filter yang dipilih.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default GradeSummary;