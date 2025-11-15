import React, { useState, useMemo } from 'react';
import { Grade, Student, User, StudentLedgerData } from '../types';
import { exportToExcel } from '../services/exportService';
import { ExcelIcon } from './icons/ExportIcons';

interface GradeSummaryProps {
    grades: Grade[];
    subjects: string[];
    classes: string[];
    studentsById: { [key: string]: Student };
    teachersById: { [key: string]: User };
    students: Student[];
    currentUser: User;
}

const getPredicate = (average: number): string => {
    if (average >= 85) return 'Mumtaz';
    if (average >= 75) return 'Jayyid Jiddan';
    if (average >= 65) return 'Jayyid';
    if (average >= 50) return 'Hasan';
    if (average >= 40) return 'Maqbul';
    return 'Rosib';
}

const GradeSummary: React.FC<GradeSummaryProps> = ({ grades, subjects, classes, students, currentUser }) => {
    const isHomeroom = currentUser.role === 'homeroom';
    const initialClass = isHomeroom ? currentUser.class : '';

    const [filterClass, setFilterClass] = useState<string>(initialClass);
    const [filterSemester, setFilterSemester] = useState<string>('1');

    const ledgerData = useMemo(() => {
        if (!filterClass || !filterSemester) return { ledger: [], subjects: [] };

        const semester = parseInt(filterSemester, 10);
        const studentsInClass = students.filter(s => s.class === filterClass);
        const gradesInClassSemester = grades.filter(g => g.class === filterClass && g.semester === semester);
        const subjectsInLedger = [...new Set(gradesInClassSemester.map(g => g.subject))].sort();

        let ledger: Omit<StudentLedgerData, 'rank'>[] = studentsInClass.map(student => {
            const studentGrades = gradesInClassSemester.filter(g => g.studentId === student.studentId);
            const scores: { [subject: string]: number } = {};
            subjectsInLedger.forEach(sub => {
                const grade = studentGrades.find(g => g.subject === sub);
                scores[sub] = grade ? grade.score : 0;
            });
            const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
            const average = studentGrades.length > 0 ? total / subjectsInLedger.length : 0;

            return {
                studentId: student.studentId,
                studentName: student.name,
                scores,
                total,
                average,
                predicate: getPredicate(average),
            };
        });

        // Calculate ranks
        ledger.sort((a, b) => b.total - a.total);
        const rankedLedger: StudentLedgerData[] = ledger.map((data, index) => ({
            ...data,
            rank: index + 1,
        }));
        
        // Sort back by name for display
        rankedLedger.sort((a,b) => a.studentName.localeCompare(b.studentName));

        return { ledger: rankedLedger, subjects: subjectsInLedger };

    }, [filterClass, filterSemester, grades, students]);
    
    const handleExport = () => {
        const fileName = `Leger_Nilai_${filterClass.replace(/ /g, '_')}_Semester_${filterSemester}.xlsx`;
        exportToExcel('ledger-table', fileName);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-slate-800">Rekapitulasi Nilai (Leger)</h2>
                {filterClass && (
                    <button onClick={handleExport} className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                        <ExcelIcon />
                        Export ke Excel
                    </button>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-slate-50 rounded-lg border">
                <div>
                    <label htmlFor="filter-class" className="block text-sm font-medium text-slate-700">Filter Kelas</label>
                    <select id="filter-class" value={filterClass} onChange={e => setFilterClass(e.target.value)} disabled={isHomeroom} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md disabled:bg-slate-200">
                        <option value="">Pilih Kelas</option>
                        {classes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="filter-semester" className="block text-sm font-medium text-slate-700">Filter Semester</label>
                    <select id="filter-semester" value={filterSemester} onChange={e => setFilterSemester(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                        <option value="">Pilih Semester</option>
                        <option value="1">Semester 1</option>
                        <option value="2">Semester 2</option>
                    </select>
                </div>
            </div>

            {filterClass ? (
                 <div className="overflow-x-auto">
                    <table id="ledger-table" className="min-w-full divide-y divide-slate-200 border">
                        <thead className="bg-slate-100">
                            <tr>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider border">No</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider border">Nama</th>
                                {ledgerData.subjects.map(sub => <th key={sub} className="px-2 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider border whitespace-nowrap -rotate-90" style={{ writingMode: 'vertical-rl' }}>{sub}</th>)}
                                <th scope="col" className="px-2 py-3 text-center text-xs font-bold text-white bg-yellow-600 uppercase tracking-wider border" style={{ writingMode: 'vertical-rl' }}>Jumlah</th>
                                <th scope="col" className="px-2 py-3 text-center text-xs font-bold text-white bg-yellow-600 uppercase tracking-wider border" style={{ writingMode: 'vertical-rl' }}>Rata-Rata</th>
                                <th scope="col" className="px-2 py-3 text-center text-xs font-bold text-white bg-yellow-600 uppercase tracking-wider border" style={{ writingMode: 'vertical-rl' }}>Ranking</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider border">Keterangan</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {ledgerData.ledger.length > 0 ? ledgerData.ledger.map((data, index) => (
                                <tr key={data.studentId}>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-500 border">{index + 1}</td>
                                    <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-slate-900 border">{data.studentName}</td>
                                    {ledgerData.subjects.map(sub => <td key={sub} className="px-2 py-2 text-center text-sm text-slate-600 border">{data.scores[sub] ?? '-'}</td>)}
                                    <td className="px-2 py-2 text-center text-sm font-bold text-slate-800 bg-yellow-100 border">{data.total}</td>
                                    <td className="px-2 py-2 text-center text-sm font-bold text-slate-800 bg-yellow-100 border">{data.average.toFixed(2)}</td>
                                    <td className="px-2 py-2 text-center text-sm font-bold text-slate-800 bg-yellow-100 border">{data.rank}</td>
                                    <td className="px-6 py-2 whitespace-nowrap text-sm text-slate-600 border">{data.predicate}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={ledgerData.subjects.length + 6} className="text-center py-10 px-4 text-slate-500">
                                        Tidak ada data nilai untuk kelas dan semester ini.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                 <div className="text-center py-10 px-4 bg-slate-50 rounded-lg">
                    <p className="text-slate-500">Silakan pilih kelas untuk menampilkan leger nilai.</p>
                </div>
            )}
        </div>
    );
};

export default GradeSummary;