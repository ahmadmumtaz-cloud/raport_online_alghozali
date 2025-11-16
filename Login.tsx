import React, { useState } from 'react';
import { User, HomeroomTeacher } from '../types';

interface LoginProps {
    teachers: (User & { role: 'teacher' })[];
    adminUser: User;
    homeroomTeachers: HomeroomTeacher[];
    onLogin: (user: User) => void;
}

type Role = 'teacher' | 'homeroom' | 'admin';

const Login: React.FC<LoginProps> = ({ teachers, adminUser, homeroomTeachers, onLogin }) => {
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [selectedValue, setSelectedValue] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string>('');

    const handleLogin = () => {
        setError(''); // Reset error on new attempt
        if (!selectedRole) return;

        if (selectedRole === 'admin') {
            if (password === 'alg@2025') {
                onLogin(adminUser);
            } else {
                setError('Password yang Anda masukkan salah.');
            }
            return;
        }
        
        if (!selectedValue) return;

        if (selectedRole === 'teacher') {
            const user = teachers.find(u => u.id === selectedValue);
            if (user) onLogin(user);
        } else if (selectedRole === 'homeroom') {
            const hr = homeroomTeachers.find(h => h.class === selectedValue);
            if (hr) {
                const homeroomUser: User = {
                    id: hr.id,
                    name: hr.name,
                    role: 'homeroom',
                    class: hr.class,
                };
                onLogin(homeroomUser);
            }
        }
    };
    
    const isLoginDisabled = () => {
        if (!selectedRole) return true;
        if (selectedRole === 'admin') return !password;
        return !selectedValue;
    }

    const renderSecondaryInput = () => {
        if (!selectedRole) return null;

        switch (selectedRole) {
            case 'teacher':
                return (
                    <div>
                        <label htmlFor="teacher-select" className="block text-sm font-medium text-slate-700 mb-1">
                            Pilih Nama Guru
                        </label>
                        <select
                            id="teacher-select"
                            value={selectedValue}
                            onChange={(e) => setSelectedValue(e.target.value)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                            <option value="" disabled>Pilih nama Anda...</option>
                            {teachers.map(teacher => (
                                <option key={teacher.id} value={teacher.id}>
                                    {teacher.name}
                                </option>
                            ))}
                        </select>
                    </div>
                );
            case 'homeroom':
                return (
                     <div>
                        <label htmlFor="class-select" className="block text-sm font-medium text-slate-700 mb-1">
                            Pilih Kelas
                        </label>
                        <select
                            id="class-select"
                            value={selectedValue}
                            onChange={(e) => setSelectedValue(e.target.value)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                            <option value="" disabled>Pilih kelas Anda...</option>
                            {homeroomTeachers.map(hr => (
                                <option key={hr.id} value={hr.class}>
                                    {hr.class}
                                </option>
                            ))}
                        </select>
                    </div>
                );
            case 'admin':
                 return (
                    <div>
                        <label htmlFor="password-input" className="block text-sm font-medium text-slate-700 mb-1">
                            Password
                        </label>
                        <input
                            id="password-input"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full pl-3 pr-4 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            placeholder="Masukkan password admin"
                        />
                        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100">
            <div className="p-8 bg-white rounded-xl shadow-lg w-full max-w-md">
                 <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-indigo-700">RAPORT ONLINE</h1>
                    <p className="text-slate-500">PONDOK MODERN AL-GHOZALI</p>
                </div>
                
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Login Sebagai
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['teacher', 'homeroom', 'admin'] as Role[]).map(role => (
                                <button
                                    key={role}
                                    onClick={() => { 
                                        setSelectedRole(role); 
                                        setSelectedValue(''); 
                                        setPassword('');
                                        setError('');
                                    }}
                                    className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
                                        selectedRole === role
                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                                    }`}
                                >
                                    {role === 'teacher' ? 'Guru' : role === 'homeroom' ? 'Wali Kelas' : 'Admin'}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {renderSecondaryInput()}

                    <button
                        onClick={handleLogin}
                        disabled={isLoginDisabled()}
                        className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed"
                    >
                        Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;