import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Heart, ChevronRight, Search, AlertCircle, ArrowLeft, Gift, Wallet, Cake, Loader2, CheckCircle2, MoreVertical, Filter, RefreshCw, ChevronLeft, ChevronDown, X, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import AnnualCashGiftManagement from './AnnualCashGiftManagement';
import SocialPensionManagement from './SocialPensionManagement';
import WeddingAnniversaryManagement from './WeddingAnniversaryManagement';
import BirthdayIncentiveManagement from './BirthdayIncentiveManagement';
import { AnnualCashGiftForm, SocialPensionForm, WeddingAnniversaryForm, BirthdayIncentiveForm } from '../CitizenPortal';

const benefitsList = [
  { 
    id: 'annual-cash-gift', 
    name: 'Annual Cash Gift', 
    icon: Gift, 
    color: 'bg-rose-50 text-rose-600',
    description: 'Manage yearly birthday financial assistance'
  },
  { 
    id: 'social-pension', 
    name: 'Social Pension (DSWD)', 
    icon: Wallet, 
    color: 'bg-blue-50 text-blue-600',
    description: 'Monthly stipend for indigent senior citizens'
  },
  { 
    id: '50th-wedding-anniversary-incentive', 
    name: '50th Wedding Anniversary Incentive', 
    icon: Heart, 
    color: 'bg-amber-50 text-amber-600',
    description: 'One-time incentive for golden wedding couples'
  },
  { 
    id: 'birthday-cash-incentives', 
    name: 'Birthday Cash Incentives', 
    icon: Cake, 
    color: 'bg-emerald-50 text-emerald-600',
    description: 'Milestone birthday financial rewards'
  },
];

function SelectionModal({ children, onClose }: { children: React.ReactNode, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-10">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-6xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10"
      >
        <div className="overflow-y-auto no-scrollbar p-6 lg:p-10">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

function CitizenSelectionTable() {
  const { benefit } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [barangayFilter, setBarangayFilter] = useState('All');
  
  // Modal state
  const [openModal, setOpenModal] = useState(false);
  const [selectedData, setSelectedData] = useState<any | null>(null);

  const lastFetchRef = useRef<number>(0);

  const fetchData = async () => {
    const now = Date.now();
    if (now - lastFetchRef.current < 20000) return;
    lastFetchRef.current = now;

    setIsLoading(true);
    setData([]); // Reset data before fetch to prevent stale view
    try {
      const token = localStorage.getItem('token');
      // Fetch a larger dataset for selection
      const response = await fetch('https://api-dbosca.phoenix.com.ph/api/masterlist?per_page=5000', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (response.status === 429) {
        console.warn("Throttled benefits citizen selection");
        return;
      }

      const result = await response.json();
      const masterlist = result.data?.data || result.data || result || [];
      
      // Apply condition: id_status = 'released' ONLY (case-insensitive)
      const releasedList = (Array.isArray(masterlist) ? masterlist : []).filter(item => 
        (item.id_status || '').toString().toLowerCase() === 'released'
      );
      setData(releasedList);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [benefit]); // Reset/refetch when benefit changes

  const filteredData = data.filter(item => {
    const fullName = `${item.first_name} ${item.last_name}`.toLowerCase();
    const scid = (item.scid_number || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    const matchesSearch = fullName.includes(search) || scid.includes(search);
    const matchesBarangay = barangayFilter === 'All' || item.barangay === barangayFilter;
    return matchesSearch && matchesBarangay;
  });

  const uniqueBarangays = ['All', ...Array.from(new Set(data.map(item => item.barangay).filter(Boolean)))].sort();

  const handleApply = (item: any) => {
    setSelectedData(item);
    setOpenModal(true);
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate(`/benefits/${benefit}`)}
            className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-[#0F172A] hover:shadow-lg transition-all border border-slate-100 shadow-sm"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Select Citizen</h2>
            <p className="text-slate-500 font-medium mt-1">Apply benefits for released records</p>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name or SCID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-1 focus:ring-[#ef4444] focus:border-[#ef4444] outline-none transition-all shadow-sm"
          />
        </div>
        <div className="relative">
          <select 
            value={barangayFilter}
            onChange={(e) => setBarangayFilter(e.target.value)}
            className="appearance-none bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-sm font-medium text-slate-900 outline-none focus:ring-1 focus:ring-[#ef4444] focus:border-[#ef4444] transition-all cursor-pointer min-w-[160px] shadow-sm"
          >
            {uniqueBarangays.map(bg => <option key={bg} value={bg}>{bg}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider">SCID Number</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider">Full Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider text-center">Birthdate</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider text-center">Barangay</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="w-12 h-12 text-[#EF4444] animate-spin" />
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Masterlist...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <AlertCircle className="w-16 h-16 text-slate-100" />
                      <p className="text-slate-400 font-medium text-lg">No released records found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((item, index) => (
                  <tr key={item.citizen_id || item.id || `citizen-${index}`} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-xs font-semibold text-[#ef4444] tracking-wider">{item.scid_number || '---'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-900">
                        {item.last_name}, {item.first_name} {item.middle_name || ''}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <p className="text-xs font-medium text-slate-600">{item.birth_date || '---'}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <p className="text-xs font-semibold text-slate-700">{item.barangay}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handleApply(item)}
                        className="px-6 py-2 bg-emerald-500 text-white rounded-lg text-xs font-semibold hover:bg-emerald-600 transition-all shadow-sm"
                      >
                        Apply Benefits
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Benefits Form Modal */}
      <AnimatePresence>
        {openModal && (
          <SelectionModal onClose={() => setOpenModal(false)}>
            {benefit === 'annual-cash-gift' && (
              <AnnualCashGiftForm 
                mode="admin" 
                data={selectedData} 
                isReadOnly={false}
                onClose={() => setOpenModal(false)}
              />
            )}
            {benefit === 'social-pension' && (
              <SocialPensionForm 
                mode="admin" 
                data={selectedData} 
                isReadOnly={false}
                onClose={() => setOpenModal(false)}
              />
            )}
            {benefit === '50th-wedding-anniversary-incentive' && (
              <WeddingAnniversaryForm 
                mode="admin" 
                data={selectedData} 
                isReadOnly={false}
                onClose={() => setOpenModal(false)}
              />
            )}
            {benefit === 'birthday-cash-incentives' && (
              <BirthdayIncentiveForm 
                mode="admin" 
                data={selectedData} 
                isReadOnly={false}
                onClose={() => setOpenModal(false)}
              />
            )}
          </SelectionModal>
        )}
      </AnimatePresence>
    </div>
  );
}

function BenefitsMenu() {
  return (
    <div className="space-y-6">
      <header className="mb-10 text-center md:text-left">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Benefits Module</h2>
        <p className="text-slate-500 font-medium mt-1">Select a benefit to manage</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {benefitsList.map((benefit) => (
          <Link 
            key={benefit.id}
            to={`/benefits/${benefit.id}`}
            className="group bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 hover:border-[#ef4444] hover:shadow-xl transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-6">
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center transition-all group-hover:scale-105",
                benefit.color
              )}>
                <benefit.icon className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">{benefit.name}</h3>
                <p className="text-slate-500 font-medium text-xs mt-1">{benefit.description}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#ef4444] group-hover:translate-x-1 transition-all" />
          </Link>
        ))}
      </div>
    </div>
  );
}

function BenefitManagement() {
  const { benefit } = useParams();
  const navigate = useNavigate();

  const renderManagementView = () => {
    switch (benefit) {
      case 'annual-cash-gift':
        return <AnnualCashGiftManagement hideHeader={true} />;
      case 'social-pension':
        return <SocialPensionManagement hideHeader={true} />;
      case '50th-wedding-anniversary-incentive':
        return <WeddingAnniversaryManagement hideHeader={true} />;
      case 'birthday-cash-incentives':
        return <BirthdayIncentiveManagement hideHeader={true} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400">
            <AlertCircle className="w-16 h-16 mb-4 opacity-20" />
            <p className="font-bold uppercase tracking-widest">Management Module Not Found</p>
          </div>
        );
    }
  };

  const benefitData = benefitsList.find(b => b.id === benefit);

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/benefits')}
            className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-[#0F172A] hover:shadow-lg transition-all border border-slate-100 shadow-sm"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              {benefitData?.name || 'Benefit Management'}
            </h2>
            <p className="text-slate-500 font-medium mt-1">Registry and Action Management</p>
          </div>
        </div>
        <Link 
          to={['annual-cash-gift', 'social-pension', '50th-wedding-anniversary-incentive', 'birthday-cash-incentives'].includes(benefit || '') ? `/benefits/${benefit}/new` : `/benefits/${benefit}/new-entry`}
          className="px-6 py-3 bg-[#ef4444] text-white rounded-xl font-semibold text-sm hover:bg-red-600 transition-all shadow-sm flex items-center gap-2"
        >
          <Gift className="w-4 h-4" />
          New Entry
        </Link>
      </header>

      {renderManagementView()}
    </div>
  );
}

function BenefitFormWrapper() {
  const { benefit } = useParams();
  const [searchParams] = useSearchParams();
  const citizenId = searchParams.get('citizen_id');
  
  const navigate = useNavigate();

  switch (benefit) {
    case 'annual-cash-gift':
      return <AnnualCashGiftForm mode="admin" data={{ citizen_id: citizenId }} isReadOnly={false} />;
    case 'social-pension':
      return <SocialPensionForm mode="admin" data={{ citizen_id: citizenId }} isReadOnly={false} />;
    case '50th-wedding-anniversary-incentive':
      return <WeddingAnniversaryForm mode="admin" data={{ citizen_id: citizenId }} isReadOnly={false} />;
    case 'birthday-cash-incentives':
      return <BirthdayIncentiveForm mode="admin" data={{ citizen_id: citizenId }} isReadOnly={false} />;
    default:
      return <div>Form not found</div>;
  }
}

export default function BenefitsModule() {
  return (
    <Routes>
      <Route index element={<BenefitsMenu />} />
      <Route path=":benefit" element={<BenefitManagement />} />
      <Route path=":benefit/new" element={<CitizenSelectionTable />} />
      <Route path=":benefit/new/forms" element={<BenefitFormWrapper />} />
      {/* Fallback for existing links if any */}
      <Route path=":benefit/new-entry" element={<BenefitFormWrapper />} />
    </Routes>
  );
}
