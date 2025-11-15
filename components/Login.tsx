import React, { useState } from 'react';
import { User, Teacher } from '../types';

interface LoginProps {
    teachers: Teacher[];
    adminUser: User;
    onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ teachers, adminUser, onLogin }) => {
    const [selectedUserId, setSelectedUserId] = useState<string>('');

    const allUsersForLogin = [adminUser, ...teachers];

    const handleLogin = () => {
        if (!selectedUserId) return;
        const user = allUsersForLogin.find(u => u.id === selectedUserId);
        if (user) {
            onLogin(user);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100">
            <div className="p-8 bg-white rounded-xl shadow-lg w-full max-w-md">
                <h1 className="text-3xl font-bold text-center text-indigo-700 mb-2">
                    RAPORT ONLINE
                </h1>
                <p className="text-center text-slate-500 mb-8">PONDOK MODERN AL-GHOZALI</p>
                
                <div className="space-y-6">
                    <div>
                        <label htmlFor="user-select" className="block text-sm font-medium text-slate-700 mb-1">
                            Pilih Pengguna
                        </label>
                        <select
                            id="user-select"
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                            <option value="" disabled>Pilih nama Anda...</option>
                            <option value={adminUser.id}>{adminUser.name} (Admin)</option>
                            {teachers.map(teacher => (
                                <option key={teacher.id} value={teacher.id}>
                                    {teacher.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleLogin}
                        disabled={!selectedUserId}
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