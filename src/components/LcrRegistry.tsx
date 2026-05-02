import React, { useState, useMemo } from 'react';
import { 
  Search, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  User,
  Calendar,
  Clock
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export interface LcrRecord {
  id: number;
  full_name: string;
  birth_date: string;
  age: number;
}

interface LcrRegistryProps {
  lcrData: LcrRecord[];
  onRefresh: () => void;
  isLoading?: boolean;
}

export default function LcrRegistry({ lcrData, onRefresh, isLoading = false }: LcrRegistryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const dob = new Date(birthDate);
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateStr: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString(undefined, options).toUpperCase();
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    onRefresh();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const filteredData = useMemo(() => {
    return lcrData.filter(item => {
      const fullName = (item?.full_name || '').toString().toLowerCase();
      const search = (searchQuery || '').toLowerCase();
      return fullName.includes(search);
    });
  }, [lcrData, searchQuery]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">LCR Birth Registry</h2>
          <p className="text-slate-500 font-medium mt-1">Local birth records registry for testing</p>
        </div>
      </header>

      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-1 focus:ring-[#ef4444] focus:border-[#ef4444] outline-none transition-all shadow-sm"
          />
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={handleRefresh}
            className={cn(
              "p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all shadow-sm",
              isRefreshing && "animate-spin"
            )}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Record Indicator */}
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-600 rounded-lg">
        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
        <span className="text-[10px] font-bold uppercase tracking-wider">Displaying {itemsPerPage} items per page</span>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-8 py-4 text-xs font-semibold text-slate-500 tracking-wider">Full Name</th>
                <th className="px-8 py-4 text-xs font-semibold text-slate-500 tracking-wider">Birthday</th>
                <th className="px-8 py-4 text-xs font-semibold text-slate-500 tracking-wider text-center">Age</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="px-10 py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <RefreshCw className="w-16 h-16 text-slate-200 animate-spin" />
                      <p className="text-slate-400 font-medium text-lg tracking-tight">Fetching official registry...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-10 py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Search className="w-16 h-16 text-slate-100" />
                      <p className="text-slate-400 font-bold text-xl uppercase tracking-widest">No records found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-5">
                      <p className="text-sm font-semibold text-slate-900">{record.full_name}</p>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm font-medium text-slate-500 uppercase tracking-tight">{formatDate(record.birth_date)}</p>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 text-[#ef4444] text-[10px] font-bold border border-rose-100 uppercase tracking-wider">
                        {calculateAge(record.birth_date)} Years Old
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-8 py-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <p className="text-xs font-medium text-slate-500">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm"
            >
              Previous
            </button>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-[#ef4444] text-white rounded-xl text-xs font-semibold hover:bg-red-600 shadow-sm disabled:opacity-50 transition-all"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
