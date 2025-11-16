import React from 'react';
import { User } from '../types';

interface HeaderProps {
    schoolName: string;
    user: User;
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ schoolName, user, onLogout }) => {
    
    const getRoleDisplay = () => {
        switch(user.role) {
            case 'admin': return '(Admin)';
            case 'teacher': return '(Guru)';
            case 'homeroom': return `(Wali Kelas: ${user.class})`;
            default: return '';
        }
    }

    return (
        <header className="bg-indigo-700 text-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight uppercase">{schoolName}</h1>
                </div>
                <div className="flex items-center gap-4 mt-2 sm:mt-0">
                    <div className="text-right">
                        <p className="text-sm">Selamat datang,</p>
                        <p className="font-semibold">{user.name} <span className="text-xs font-normal text-indigo-200">{getRoleDisplay()}</span></p>
                    </div>
                     <button
                        onClick={onLogout}
                        className="ml-2 px-3 py-1.5 text-sm font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-700 focus:ring-white"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;