import React, { useState, useMemo, useEffect } from 'react';
import { Grade, HomeroomTeacher, School, Student, User } from '../types';
import { exportToWord, exportToExcel } from '../services/exportService';
import { WordIcon, ExcelIcon } from './icons/ExportIcons';
import { SUBJECT_MAP } from '../constants';

interface ReportCardProps {
    grades: Grade[];
    homeroomTeachers: HomeroomTeacher[];
    schoolInfo: School;
    classes: string[];
    studentsByClass: { [key: string]: Student[] };
    teachersById: { [key: string]: User };
    currentUser: User;
}

const ReportCard: React.FC<ReportCardProps> = ({ grades, homeroomTeachers, schoolInfo, classes, studentsByClass, teachersById, currentUser }) => {
    const isHomeroom = currentUser.role === 'homeroom';
    const initialClass = isHomeroom ? currentUser.class : '';
    
    const [selectedClass, setSelectedClass] = useState<string>(initialClass);
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');
    const [selectedSemester, setSelectedSemester] = useState<1 | 2>(1);
    const [isExportingClass, setIsExportingClass] = useState(false);
    
    useEffect(() => {
        if(isHomeroom) {
            setSelectedClass(currentUser.class);
        }
    }, [currentUser, isHomeroom]);

    const studentsInClass = selectedClass ? studentsByClass[selectedClass] || [] : [];
    
    const selectedStudent = useMemo(() => {
        return studentsInClass.find(s => s.id === selectedStudentId);
    }, [studentsInClass, selectedStudentId]);

    const homeroomTeacher = useMemo(() => {
        return homeroomTeachers.find(t => t.class === selectedClass);
    }, [homeroomTeachers, selectedClass]);

    const studentGrades = useMemo(() => {
        if (!selectedStudent) return [];
        return grades
            .filter(g => g.studentId === selectedStudent.studentId && g.semester === selectedSemester)
            .sort((a, b) => a.subject.localeCompare(b.subject));
    }, [grades, selectedStudent, selectedSemester]);

    const totalScore = useMemo(() => {
        if (studentGrades.length === 0) return 0;
        return studentGrades.reduce((sum, g) => sum + g.score, 0);
    }, [studentGrades]);

    const averageScore = useMemo(() => {
        if (studentGrades.length === 0) return 0;
        const total = studentGrades.reduce((sum, g) => sum + g.score, 0);
        return (total / studentGrades.length).toFixed(2);
    }, [studentGrades]);
    
    const handleExportWord = () => {
        if (!selectedStudent) return;
        const fileName = `Raport_${selectedStudent.name.replace(' ', '_')}_Semester_${selectedSemester}`;
        exportToWord('report-card-content', fileName, schoolInfo.name);
    }
    
    const handleExportExcel = () => {
        if (!selectedStudent) return;
        const fileName = `Raport_${selectedStudent.name.replace(' ', '_')}_Semester_${selectedSemester}.xlsx`;
        exportToExcel('report-card-table', fileName);
    }

    const toHindiArabic = (num: number | string): string => {
        const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
        return String(num).replace(/[0-9.]/g, (d) => d === '.' ? ',' : arabicNumerals[parseInt(d)]);
    };

    const handleExportClassReport = async () => {
        if (!selectedClass) return;

        setIsExportingClass(true);
        
        try {
            const studentsToExport = studentsByClass[selectedClass] || [];
            if (studentsToExport.length === 0) {
                alert('Tidak ada siswa di kelas ini untuk diekspor.');
                return;
            }

            const classHomeroomTeacher = homeroomTeachers.find(t => t.class === selectedClass);
            
            const semesterText = selectedSemester === 1 ? 'الأول' : 'الثاني';

            let allReportsHtml = '';

            for (const student of studentsToExport) {
                const studentGrades = grades
                    .filter(g => g.studentId === student.studentId && g.semester === selectedSemester)
                    .sort((a, b) => a.subject.localeCompare(b.subject));
                
                const totalScore = studentGrades.reduce((sum, g) => sum + g.score, 0);
                const averageScore = studentGrades.length > 0 ? (totalScore / studentGrades.length).toFixed(2) : '0.00';
                
                const gradesRows = studentGrades.map((grade, index) => `
                    <tr>
                        <td style="border: 1px solid black; padding: 0.5rem; text-align: center; font-weight: 600;">${toHindiArabic(grade.score)}</td>
                        <td style="border: 1px solid black; padding: 0.5rem; text-align: left;">${grade.subject}</td>
                        <td style="border: 1px solid black; padding: 0.5rem; text-align: right; font-size: 1.125rem; font-family: 'Traditional Arabic', serif;">${SUBJECT_MAP[grade.subject] || grade.subject}</td>
                        <td style="border: 1px solid black; padding: 0.5rem; text-align: center;">${toHindiArabic(index + 1)}</td>
                    </tr>
                `).join('');

                const reportHtml = `
                    <div style="font-family: 'Times New Roman', serif; color: black; direction: rtl; page-break-after: always;">
                        <header style="text-align: center; padding-bottom: 1rem; margin-bottom: 1rem;">
                            <h3 style="font-size: 1.5rem; font-weight: bold; font-family: 'Traditional Arabic', serif;">
                                تربية المعلمين والمعلمات الإسلامية الغزالي
                            </h3>
                            <h4 style="font-size: 1.25rem; font-weight: bold; font-family: 'Traditional Arabic', serif;">
                                بمعهد التربية الإسلامية الحديثة
                            </h4>
                            <p style="font-size: 0.875rem;">تشورغ - غونونغ - سندور - بوغور - جاوى الغربية</p>
                            <hr style="margin-top: 0.5rem; margin-bottom: 0.5rem; border-top: 2px solid black;" />
                            <h2 style="font-size: 1.875rem; font-weight: bold; margin-top: 1rem; font-family: 'Traditional Arabic', serif;">كشف الدرجات</h2>
                            <p style="font-size: 1.125rem; font-weight: 600; font-family: 'Traditional Arabic', serif;">
                                الامتحانات للفصل الدراسي ${semesterText}
                            </p>
                        </header>
                        <div style="font-size: 1rem; margin-bottom: 1rem; text-align: right;">
                            <div style="display: flex; justify-content: space-between;">
                                <p style="direction: ltr;"><span style="font-weight: 600;">${toHindiArabic(schoolInfo.academicYear.split(' / ')[1])} / ${toHindiArabic(schoolInfo.academicYear.split(' / ')[0])}</span> : العام الدراسي</p>
                                <p><span style="font-weight: 600;">${student.name}</span> : اسم</p>
                            </div>
                            <p style="margin-top: 0.25rem; text-align: left; direction: ltr;">Kelas: ${student.class}</p>
                        </div>
                        <table style="width: 100%; border-collapse: collapse; border: 1px solid black; text-align: center; direction: ltr;">
                           <thead style="background-color: #f3f4f6; font-weight: bold;">
                                <tr style="text-align: right;">
                                    <th style="border: 1px solid black; padding: 0.5rem; text-align: center;">الدرجة</th>
                                    <th style="border: 1px solid black; padding: 0.5rem; text-align: left;">Mata Pelajaran</th>
                                    <th style="border: 1px solid black; padding: 0.5rem;">المواد الدراسية</th>
                                    <th style="border: 1px solid black; padding: 0.5rem; text-align: center;">الرقم</th>
                                </tr>
                            </thead>
                            <tbody>${gradesRows}</tbody>
                            <tfoot style="font-weight: bold; background-color: #f3f4f6;">
                                <tr>
                                    <td style="border: 1px solid black; padding: 0.5rem; text-align: center;">${toHindiArabic(totalScore)}</td>
                                    <td colspan="2" style="border: 1px solid black; padding: 0.5rem; text-align: right;">المجموع</td>
                                    <td style="border: 1px solid black; padding: 0.5rem;"></td>
                                </tr>
                                <tr>
                                    <td style="border: 1px solid black; padding: 0.5rem; text-align: center;">${toHindiArabic(averageScore)}</td>
                                    <td colspan="2" style="border: 1px solid black; padding: 0.5rem; text-align: right;">النتيجة المعدلة</td>
                                    <td style="border: 1px solid black; padding: 0.5rem;"></td>
                                </tr>
                                <tr>
                                    <td style="border: 1px solid black; padding: 0.5rem; text-align: center;">-</td>
                                    <td colspan="2" style="border: 1px solid black; padding: 0.5rem; text-align: right;">المقام</td>
                                    <td style="border: 1px solid black; padding: 0.5rem;"></td>
                                </tr>
                            </tfoot>
                        </table>
                        <div style="margin-top: 3rem; display: flex; justify-content: space-between; text-align: center; font-family: 'Traditional Arabic', serif;">
                            <div>
                                <p>ولي الأمر</p>
                                <div style="height: 4rem;"></div>
                                <p style="font-weight: bold; text-decoration: underline;">........................</p>
                            </div>
                            <div>
                                <p>ولي الفصل</p>
                                <div style="height: 4rem;"></div>
                                <p style="font-weight: bold; text-decoration: underline;">${classHomeroomTeacher?.name || 'N/A'}</p>
                            </div>
                        </div>
                        <div style="margin-top: 2rem; text-align: center; font-family: 'Traditional Arabic', serif;">
                                <p>مدير المعهد</p>
                                <div style="height: 4rem;"></div>
                                <p style="font-weight: bold; text-decoration: underline;">${schoolInfo.principal}</p>
                        </div>
                    </div>
                `;
                allReportsHtml += reportHtml;
            }

            const fileName = `Raport_Kelas_${selectedClass.replace(/ /g, '_')}_Semester_${selectedSemester}`;
            await exportToWord(allReportsHtml, fileName, schoolInfo.name, true);

        } catch (error) {
            console.error("Failed to export class report:", error);
            alert("Terjadi kesalahan saat mengekspor raport kelas.");
        } finally {
            setIsExportingClass(false);
        }
    };


    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Cetak Raport Siswa</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-slate-50 rounded-lg border">
                <div>
                    <label className="block text-sm font-medium text-slate-700">Kelas</label>
                    <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setSelectedStudentId(''); }} disabled={isHomeroom} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md disabled:bg-slate-200">
                        <option value="">Pilih Kelas</option>
                        {classes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Siswa</label>
                    <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} disabled={!selectedClass} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md disabled:bg-slate-200">
                        <option value="">Pilih Siswa</option>
                        {studentsInClass.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Semester</label>
                    <select value={selectedSemester} onChange={e => setSelectedSemester(Number(e.target.value) as 1|2)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                        <option value={1}>Semester 1</option>
                        <option value={2}>Semester 2</option>
                    </select>
                </div>
            </div>

            {selectedStudent ? (
                <div className="mt-6">
                    <div className="flex justify-end gap-2 mb-4">
                       <button onClick={handleExportWord} className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                           <WordIcon />
                           Export ke Word
                       </button>
                       <button onClick={handleExportExcel} className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                           <ExcelIcon />
                           Export ke Excel
                       </button>
                    </div>
                    <div id="report-card-content" className="p-4 sm:p-6 border rounded-lg bg-white shadow-lg font-['Times_New_Roman'] text-black" style={{ direction: 'rtl' }}>
                        <header className="text-center pb-4 mb-4">
                            <h3 className="text-2xl font-bold" style={{ fontFamily: 'Traditional Arabic, serif' }}>
                                تربية المعلمين والمعلمات الإسلامية الغزالي
                            </h3>
                            <h4 className="text-xl font-bold" style={{ fontFamily: 'Traditional Arabic, serif' }}>
                                بمعهد التربية الإسلامية الحديثة
                            </h4>
                            <p className="text-sm">تشورغ - غونونغ - سندور - بوغور - جاوى الغربية</p>
                            <hr className="my-2 border-t-2 border-black" />
                            <h2 className="text-3xl font-bold mt-4" style={{ fontFamily: 'Traditional Arabic, serif' }}>كشف الدرجات</h2>
                            <p className="text-lg font-semibold" style={{ fontFamily: 'Traditional Arabic, serif' }}>
                                الامتحانات للفصل الدراسي {selectedSemester === 1 ? 'الأول' : 'الثاني'}
                            </p>
                        </header>

                        <div className="text-base mb-4 text-right">
                            <div className="flex justify-between">
                                <p style={{direction: 'ltr'}}><span className="font-semibold">{toHindiArabic(schoolInfo.academicYear.split(' / ')[1])} / {toHindiArabic(schoolInfo.academicYear.split(' / ')[0])}</span> : العام الدراسي</p>
                                <p><span className="font-semibold">{selectedStudent.name}</span> : اسم</p>
                            </div>
                            <p className="text-left mt-1" style={{ direction: 'ltr' }}>Kelas: {selectedStudent.class}</p>
                        </div>
                        
                        <table id="report-card-table" className="min-w-full border-collapse border border-black text-center" style={{ direction: 'ltr' }}>
                            <thead className="bg-gray-100 font-bold">
                                <tr className="text-right">
                                    <th className="border border-black p-2 text-center">الدرجة</th>
                                    <th className="border border-black p-2 text-left">Mata Pelajaran</th>
                                    <th className="border border-black p-2">المواد الدراسية</th>
                                    <th className="border border-black p-2 text-center">الرقم</th>
                                </tr>
                            </thead>
                            <tbody>
                                {studentGrades.map((grade, index) => (
                                    <tr key={grade.subject}>
                                        <td className="border border-black p-2 text-center font-semibold">{toHindiArabic(grade.score)}</td>
                                        <td className="border border-black p-2 text-left">{grade.subject}</td>
                                        <td className="border border-black p-2 text-right text-lg" style={{ fontFamily: 'Traditional Arabic, serif' }}>{SUBJECT_MAP[grade.subject] || grade.subject}</td>
                                        <td className="border border-black p-2 text-center">{toHindiArabic(index + 1)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="font-bold bg-gray-100">
                                <tr>
                                    <td className="border border-black p-2 text-center">{toHindiArabic(totalScore)}</td>
                                    <td colSpan={2} className="border border-black p-2 text-right">المجموع</td>
                                    <td className="border border-black p-2"></td>
                                </tr>
                                <tr>
                                    <td className="border border-black p-2 text-center">{toHindiArabic(averageScore)}</td>
                                    <td colSpan={2} className="border border-black p-2 text-right">النتيجة المعدلة</td>
                                    <td className="border border-black p-2"></td>
                                </tr>
                                <tr>
                                    <td className="border border-black p-2 text-center">-</td>
                                    <td colSpan={2} className="border border-black p-2 text-right">المقام</td>
                                    <td className="border border-black p-2"></td>
                                </tr>
                            </tfoot>
                        </table>

                        <div className="mt-12 flex justify-between text-base text-center" style={{ fontFamily: 'Traditional Arabic, serif' }}>
                            <div>
                                <p>ولي الأمر</p>
                                <br /><br /><br />
                                <p className="font-bold underline">........................</p>
                            </div>
                            <div>
                                <p>ولي الفصل</p>
                                <br /><br /><br />
                                <p className="font-bold underline">{homeroomTeacher?.name || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="mt-8 text-center" style={{ fontFamily: 'Traditional Arabic, serif' }}>
                                <p>مدير المعهد</p>
                                <br /><br /><br />
                                <p className="font-bold underline">{schoolInfo.principal}</p>
                        </div>
                    </div>
                </div>
            ) : (
                 <div className="mt-6">
                    <div className="flex justify-end gap-2 mb-4">
                        <button 
                            onClick={handleExportClassReport} 
                            disabled={!selectedClass || isExportingClass}
                            className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
                        >
                           <WordIcon />
                           {isExportingClass ? 'Mengekspor...' : 'Download Raport Kelas'}
                       </button>
                    </div>
                    <div className="text-center py-10 px-4 bg-slate-50 rounded-lg">
                        <p className="text-slate-500">Silakan pilih kelas dan siswa untuk menampilkan raport, atau pilih kelas untuk mengunduh semua raport sekaligus.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportCard;