import React, { useState } from 'react';
import { Search, UserPlus, ChevronRight, X, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { LcrRecord } from './LcrRegistry';

interface WalkInEnrollmentProps {
  lcrData: LcrRecord[];
  onProceed: (record: LcrRecord | null) => void;
  onBack: () => void;
}

export default function WalkInEnrollment({ lcrData, onProceed, onBack }: WalkInEnrollmentProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<LcrRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredRecords = searchQuery.trim() === '' 
    ? [] 
    : lcrData.filter(record => {
        const fullName = (record?.full_name || '').toString().toLowerCase();
        const search = (searchQuery || '').toLowerCase();
        return fullName.includes(search);
      });

  const handleRecordClick = (record: LcrRecord) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const formatDateLong = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h2 className="text-5xl font-black tracking-tighter text-[#0F172A] uppercase">Walk-in Enrollment</h2>
          <p className="text-slate-500 font-medium mt-2 text-lg">Initiate enrollment by searching the Local Civil Registry (LCR).</p>
        </div>
        <button 
          onClick={() => onProceed(null)}
          className="flex items-center gap-3 px-8 py-4 bg-[#0F172A] text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
        >
          <UserPlus className="w-5 h-5" />
          New Manual Entry
        </button>
      </div>

      <div className="space-y-8">
        {/* Search Bar */}
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 p-4 border border-slate-100">
          <div className="relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name..."
              className="w-full pl-16 pr-8 py-6 bg-transparent text-xl font-bold text-[#0F172A] outline-none placeholder:text-slate-300"
            />
          </div>
        </div>

        {/* Results */}
        <AnimatePresence>
          {searchQuery.trim() !== '' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100"
            >
              <div className="px-10 py-6 border-b border-slate-50 bg-slate-50/30">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Senior LCR Matches Found ({filteredRecords.length})
                </p>
              </div>
              
              <div className="divide-y divide-slate-50">
                {filteredRecords.length === 0 ? (
                  <div className="px-10 py-20 text-center">
                    <p className="text-slate-400 font-bold text-lg">No matches found in LCR database.</p>
                    <button 
                      onClick={() => onProceed(null)}
                      className="mt-4 text-[#E11D48] font-black text-sm uppercase tracking-widest hover:underline"
                    >
                      Proceed with manual entry instead
                    </button>
                  </div>
                ) : (
                  filteredRecords.map((record) => (
                    <button 
                      key={record.id}
                      onClick={() => handleRecordClick(record)}
                      className="w-full px-10 py-8 flex items-center justify-between hover:bg-slate-50 transition-colors text-left group"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-[#E11D48] group-hover:bg-[#E11D48] group-hover:text-white transition-colors">
                          <UserPlus className="w-8 h-8" />
                        </div>
                        <div>
                          <h4 className="text-2xl font-black text-[#0F172A] uppercase tracking-tight">{record.full_name}</h4>
                          <div className="flex items-center gap-4 mt-1 text-slate-400 font-bold text-sm">
                            <span className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              {record.birth_date}
                            </span>
                            <span>•</span>
                            <span>{record.age} Years Old</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-8 h-8 text-slate-200 group-hover:text-[#E11D48] group-hover:translate-x-1 transition-all" />
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Verification Modal */}
      <AnimatePresence>
        {isModalOpen && selectedRecord && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden relative"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute right-8 top-8 p-3 hover:bg-slate-100 rounded-full transition-colors z-10"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>

              <div className="p-12">
                <div className="flex flex-col items-center text-center mb-10">
                  <div className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full flex items-center gap-2 mb-6 border border-emerald-100">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">LCR Verified</span>
                  </div>
                  <h3 className="text-5xl font-black text-[#0F172A] uppercase tracking-tighter leading-none mb-10">
                    {selectedRecord.full_name}
                  </h3>

                  <div className="grid grid-cols-2 gap-4 w-full">
                    <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Birthdate</p>
                      <p className="text-xl font-black text-[#0F172A]">{selectedRecord.birth_date}</p>
                    </div>
                    <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Age</p>
                      <p className="text-xl font-black text-[#0F172A]">{selectedRecord.age} Years Old</p>
                    </div>
                  </div>
                </div>

                <div className="bg-rose-50 p-6 rounded-3xl flex gap-4 border border-rose-100 mb-10">
                  <AlertCircle className="w-6 h-6 text-[#E11D48] shrink-0" />
                  <p className="text-sm font-bold text-[#E11D48] leading-relaxed">
                    By proceeding, you trust the <span className="font-black">Birthdate</span> and <span className="font-black">Age</span> provided by the Local Civil Registry for this enrollment.
                  </p>
                </div>

                <button 
                  onClick={() => onProceed(selectedRecord)}
                  className="w-full py-6 bg-[#0F172A] text-white rounded-[2rem] font-black text-lg uppercase tracking-widest hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 flex items-center justify-center gap-3"
                >
                  Proceed to Enrollment
                  <ArrowRight className="w-6 h-6" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
