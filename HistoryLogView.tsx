import React from 'react';
import { HistoryLog } from '../types';

interface HistoryLogViewProps {
    logs: HistoryLog[];
}

const HistoryLogView: React.FC<HistoryLogViewProps> = ({ logs }) => {
    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Riwayat Perubahan</h2>
            {logs.length > 0 ? (
                <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Waktu</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Pengguna</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Aksi</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Detail</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {logs.map((log, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{log.timestamp.toLocaleString('id-ID')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{log.user}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{log.details}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                 <div className="text-center py-10 px-4 bg-slate-50 rounded-lg">
                    <p className="text-slate-500">Belum ada riwayat perubahan yang tercatat.</p>
                </div>
            )}
        </div>
    );
};

export default HistoryLogView;
