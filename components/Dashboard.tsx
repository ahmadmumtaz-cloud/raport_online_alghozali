import React, { useMemo } from 'react';
import { Grade, Student, Teacher } from '../types';

interface DashboardProps {
    grades: Grade[];
    students: Student[];
    teachers: Teacher[];
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
        <div className="bg-indigo-500 text-white rounded-full p-3 mr-4">
            {icon}
        </div>
        <div>
            <p className="text-sm text-slate-500">{title}</p>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
    </div>
);

const Dashboard: React.FC<DashboardProps> = ({ grades, students, teachers }) => {
    const totalStudents = students.length;
    const totalTeachers = teachers.length;
    
    const averageGrade = useMemo(() => {
        if (grades.length === 0) return 'N/A';
        const total = grades.reduce((sum, g) => sum + g.score, 0);
        return (total / grades.length).toFixed(2);
    }, [grades]);
    
    const gradesEntered = grades.length;

    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Dashboard</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Total Siswa" 
                    value={totalStudents} 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} 
                />
                <StatCard 
                    title="Total Guru" 
                    value={totalTeachers} 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                />
                <StatCard 
                    title="Rata-rata Nilai" 
                    value={averageGrade} 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
                />
                 <StatCard 
                    title="Jumlah Nilai Masuk" 
                    value={gradesEntered} 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
                />
            </div>
            <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
                 <h3 className="text-lg font-semibold text-slate-800 mb-4">Selamat Datang di Sistem Raport Online</h3>
                 <p className="text-slate-600">Gunakan menu navigasi di atas untuk mengakses fitur yang tersedia sesuai dengan peran Anda. Anda dapat beralih peran antara 'Guru' dan 'Admin' menggunakan dropdown di header untuk melihat perbedaan hak akses.</p>
            </div>
        </div>
    );
};

export default Dashboard;
