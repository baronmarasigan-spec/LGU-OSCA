import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  Search, 
  CheckCircle2, 
  Eye, 
  X,
  AlertCircle,
  ChevronDown,
  Calendar,
  IdCard,
  Filter,
  Download,
  RefreshCw,
  FileText,
  MoreVertical
} from 'lucide-react';
import { cn, exportToCSV } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface PhilHealthRecord {
  id: number;
  ids: {
    citizen_id: number;
    user_id: number;
    scid_number: string;
    philhealth_number: string;
  };
  senior_info: {
    full_name: string;
    age: number;
    contact: string;
  };
  address: {
    barangay: string;
    city: string;
    province: string;
  };
  application: {
    status: string;
    remarks: string;
    id_view_url: string;
  };
  submitted_at: string;
}

interface PaginationLinks {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
}

interface PaginationMeta {
  current_page: number;
  from: number;
  last_page: number;
  links: { url: string | null; label: string; active: boolean }[];
  path: string;
  per_page: number;
  to: number;
  total: number;
}

export default function PhilHealthFacilitation() {
  const [data, setData] = useState<PhilHealthRecord[]>([]);
  const [links, setLinks] = useState<PaginationLinks | null>(null);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [barangayFilter, setBarangayFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const resetFilters = () => {
    setSearchTerm('');
    setBarangayFilter('');
    setStatusFilter('');
  };

  // Modal State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<PhilHealthRecord | null>(null);
  const [rejectionRemarks, setRejectionRemarks] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({
    scid_number: '',
    philhealth_number: '',
    status: ''
  });

  useEffect(() => {
    fetchData();
  }, [barangayFilter, statusFilter]);

  const fetchData = async (url = 'https://api-dbosca.phoenix.com.ph/api/philhealth-facilitation') => {
    setIsLoading(true);
    setError(null);
    setData([]); // Reset data before fetch
    try {
      const token = localStorage.getItem('token');
      // Append filters to URL if base URL is used
      let finalUrl = url;
      if (url === 'https://api-dbosca.phoenix.com.ph/api/philhealth-facilitation') {
        const params = new URLSearchParams();
        if (barangayFilter) params.append('barangay', barangayFilter);
        if (statusFilter) params.append('status', statusFilter);
        finalUrl = `${url}?${params.toString()}`;
      }

      const response = await fetch(finalUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const result = await response.json();
      if (response.ok) {
        const rawData = result.data || [];
        const transformedData = rawData.map((item: any) => ({
          id: item.id,
          ids: {
            citizen_id: item.ids?.citizen_id ?? item.citizen_id,
            user_id: item.ids?.user_id ?? item.user_id,
            scid_number: item.ids?.scid_number ?? item.scid_number,
            philhealth_number: item.ids?.philhealth_number ?? item.philhealth_number
          },
          senior_info: {
            full_name: item.senior_info?.full_name ?? item.full_name ?? `${item.first_name || ''} ${item.last_name || ''}`.trim(),
            age: item.senior_info?.age ?? item.age,
            contact: item.senior_info?.contact ?? item.contact_number ?? item.contact
          },
          address: {
            barangay: item.address?.barangay ?? item.barangay,
            city: item.address?.city ?? item.city_municipality ?? item.city,
            province: item.address?.province ?? item.province
          },
          application: {
            status: item.application?.status ?? item.status ?? 'for_verification',
            remarks: item.application?.remarks ?? item.remarks ?? null,
            id_view_url: item.application?.id_view_url ?? item.uploaded_file_url ?? item.id_file_url
          },
          submitted_at: item.submitted_at || item.created_at
        }));

        setData(transformedData);
        setLinks(result.links || null);
        setMeta(result.meta || null);
      } else {
        setError(result.message || 'Failed to fetch PhilHealth records');
      }
    } catch (err) {
      setError('A network error occurred while fetching records.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredData = data.filter(item => {
    const fullname = (item.senior_info?.full_name || '').toString();
    const scid_number = (item.ids?.scid_number || '').toString();
    const philhealth_number = (item.ids?.philhealth_number || '').toString();
    const search = (searchTerm || '').toLowerCase();

    const matchesSearch = fullname.toLowerCase().includes(search) || 
                         scid_number.toLowerCase().includes(search) ||
                         philhealth_number.toLowerCase().includes(search);
    
    return matchesSearch;
  });

  const handleStatusChange = async (record: PhilHealthRecord, newStatus: string) => {
    if (newStatus === 'rejected') {
      setSelectedRecord(record);
      setRejectionRemarks('');
      setIsRejectModalOpen(true);
      setActiveDropdown(null);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://api-dbosca.phoenix.com.ph/api/philhealth-facilitation/${record.id}`, {
        method: "PUT",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setData(prev => prev.map(item => 
          item.id === record.id ? { ...item, application: { ...item.application, status: newStatus } } : item
        ));
        alert(`Status updated to ${newStatus}`);
      } else {
        alert("Failed to update status");
      }
    } catch (err) {
      console.error("Update error:", err);
      alert("An error occurred during update");
    }
    setActiveDropdown(null);
  };

  const handleConfirmRejection = async () => {
    if (!rejectionRemarks.trim()) {
      alert("Please provide rejection remarks.");
      return;
    }

    if (!selectedRecord) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://api-dbosca.phoenix.com.ph/api/philhealth-facilitation/${selectedRecord.id}`, {
        method: "PUT",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status: 'rejected',
          remarks: rejectionRemarks 
        })
      });

      if (response.ok) {
        setData(prev => prev.map(item => 
          item.id === selectedRecord.id ? { 
            ...item, 
            application: { 
              ...item.application, 
              status: 'rejected',
              remarks: rejectionRemarks
            } 
          } : item
        ));
        setIsRejectModalOpen(false);
        setRejectionRemarks('');
        setSelectedRecord(null);
        alert("Record rejected with remarks.");
      } else {
        alert("Failed to update status");
      }
    } catch (err) {
      console.error("Rejection error:", err);
      alert("An error occurred during rejection");
    }
  };

  const handleFileAction = async (path: string, filename: string, action: 'view' | 'download') => {
    try {
      const token = localStorage.getItem('token');
      const baseUrl = `https://api-dbosca.phoenix.com.ph/api/files/view`;
      const queryParams = `path=${encodeURIComponent(path)}&name=${encodeURIComponent(filename)}&action=${action}`;
      const url = `${baseUrl}?${queryParams}`;

      if (action === 'download') {
        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const blob = await response.blob();
        const fileUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = fileUrl;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(fileUrl);
        return;
      }

      // For viewing images/PDFs
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const blob = await response.blob();
      const fileUrl = window.URL.createObjectURL(blob);
      window.open(fileUrl, '_blank');
    } catch (error) {
      console.error('Error handling file:', error);
      alert('Failed to process file request.');
    }
  };

  const handleOpenView = (record: PhilHealthRecord) => {
    setSelectedRecord(record);
    setIsViewModalOpen(true);
  };

  const handleExportCSV = () => {
    const headers = [
      'Date Submission',
      'SCID Number',
      'Full Name',
      'PhilHealth ID Number',
      'Barangay',
      'Status'
    ];

    const dataToExport = filteredData.map(item => ({
      'Date Submission': item.submitted_at,
      'SCID Number': item.ids?.scid_number,
      'Full Name': item.senior_info?.full_name,
      'PhilHealth ID Number': item.ids?.philhealth_number,
      'Barangay': item.address?.barangay,
      'Status': item.application?.status
    }));

    exportToCSV(dataToExport, headers, 'philhealth.csv');
  };

  const formatDate = (dateString: string) => {
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
    <div className="space-y-10">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">PhilHealth Facilitation</h2>
          <p className="text-slate-500 font-medium mt-1">Health Insurance Membership Management</p>
        </div>
      </header>

      {/* Main Card Container */}
      {/* Main Card Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
          <div className="flex flex-wrap items-center gap-4 flex-1">
            {/* Search Bar */}
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by name, SCID, or PhilHealth..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-1 focus:ring-[#ef4444] focus:border-[#ef4444] outline-none transition-all shadow-sm"
              />
            </div>
            
            <div className="relative">
              <select 
                value={barangayFilter}
                onChange={(e) => setBarangayFilter(e.target.value)}
                className="appearance-none bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-sm font-medium text-slate-900 outline-none focus:ring-1 focus:ring-[#ef4444] focus:border-[#ef4444] transition-all cursor-pointer min-w-[170px] shadow-sm"
              >
                <option value="">All Barangays</option>
                {[
                  'Addition Hills', 'Balong-Bato', 'Batis', 'Corazon de Jesus', 'Ermitaño', 
                  'Greenhills', 'Isabelita', 'Kabayanan', 'Little Baguio', 'Maytunas', 
                  'Onse', 'Pasadena', 'Pedro Cruz', 'Progreso', 'Rivera', 'Saint Joseph', 
                  'Salapan', 'San Perfecto', 'Santa Lucia', 'Tibagan', 'West Crame'
                ].sort().map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-sm font-medium text-slate-900 outline-none focus:ring-1 focus:ring-[#ef4444] focus:border-[#ef4444] transition-all cursor-pointer min-w-[170px] shadow-sm"
              >
                <option value="">All Status</option>
                <option value="For Verification">For Verification</option>
                <option value="Verified">Verified</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {(searchTerm || barangayFilter || statusFilter) && (
              <button 
                onClick={resetFilters}
                className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-[#ef4444] transition-colors text-[10px] font-black uppercase tracking-widest bg-slate-50 rounded-xl"
              >
                <X className="w-4 h-4" />
                Remove All Filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={handleExportCSV}
              disabled={filteredData.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <div className="h-10 w-px bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Records</span>
                <span className="text-sm font-bold text-slate-900 leading-none">{filteredData.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider">Applied Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider">SCID Number</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider">Full Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider">PhilHealth ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider text-center">Address</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider text-center">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <RefreshCw className="w-12 h-12 text-slate-200 animate-spin" />
                      <p className="text-slate-400 font-medium text-lg tracking-tight">Fetching records...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <AlertCircle className="w-16 h-16 text-red-100" />
                      <p className="text-red-400 font-medium text-lg tracking-tight">{error}</p>
                      <button 
                        onClick={fetchData}
                        className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all"
                      >
                        Try Again
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Stethoscope className="w-16 h-16 text-slate-100" />
                      <p className="text-slate-400 font-medium text-lg tracking-tight">No PhilHealth records found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((item, index) => (
                  <tr key={item.id || `phil-${index}`} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-xs font-medium text-slate-500 flex items-center gap-2">
                        {formatDate(item.submitted_at)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-semibold text-[#ef4444] tracking-wider text-center">
                        {item.ids?.scid_number}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-900">
                        {item.senior_info?.full_name}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-mono font-medium text-slate-600">
                        {item.ids?.philhealth_number}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <p className="text-xs font-medium text-slate-500 tracking-tight">
                        {item.address?.barangay}, {item.address?.city}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className={cn(
                        "inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider",
                        (item.application?.status === 'verified' || item.application?.status === 'Verified')
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                          : item.application?.status === 'rejected'
                          ? "bg-rose-50 text-rose-600 border-rose-100"
                          : "bg-amber-50 text-amber-600 border-amber-100"
                      )}>
                        {item.application?.status}
                      </div>
                    </td>
                    <td className="px-6 py-4 overflow-visible relative">
                      <div className="flex items-center justify-center">
                        <div className="relative">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdown(activeDropdown === item.id ? null : item.id);
                            }}
                            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          <AnimatePresence>
                            {activeDropdown === item.id && (
                              <>
                                <div 
                                  className="fixed inset-0 z-10" 
                                  onClick={() => setActiveDropdown(null)}
                                />
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                  className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-20 p-2 overflow-hidden"
                                >
                                  <button
                                    onClick={() => {
                                      handleOpenView(item);
                                      setActiveDropdown(null);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-600 transition-all"
                                  >
                                    <Eye className="w-4 h-4 text-slate-400" />
                                    View Details
                                  </button>

                                  <button
                                    onClick={() => {
                                      setSelectedRecord(item);
                                      setEditFormData({ status: item.application?.status || 'for_verification' });
                                      setIsStatusModalOpen(true);
                                      setActiveDropdown(null);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-amber-50 rounded-lg text-xs font-semibold text-amber-600 transition-all"
                                  >
                                    <RefreshCw className="w-4 h-4" />
                                    Update Status
                                  </button>
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="mt-8 flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-xs font-bold text-slate-500">
              Showing <span className="text-slate-900">{meta.from}</span> to <span className="text-slate-900">{meta.to}</span> of <span className="text-slate-900">{meta.total}</span> records
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => links?.prev && fetchData(links.prev)}
                disabled={!links?.prev}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all"
              >
                Previous
              </button>
              {meta.links.filter(l => !isNaN(Number(l.label))).map((pageLink, idx) => (
                <button
                  key={idx}
                  onClick={() => pageLink.url && fetchData(pageLink.url)}
                  className={cn(
                    "w-10 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    pageLink.active 
                      ? "bg-slate-900 text-white shadow-lg shadow-slate-200" 
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  )}
                >
                  {pageLink.label}
                </button>
              ))}
              <button
                onClick={() => links?.next && fetchData(links.next)}
                disabled={!links?.next}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View ID Modal */}
      <AnimatePresence>
        {isViewModalOpen && selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                      <IdCard className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-[#0F172A] uppercase tracking-tight">PhilHealth ID Document</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedRecord.senior_info?.full_name} • {selectedRecord.ids?.philhealth_number}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsViewModalOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <div className="flex flex-col md:flex-row gap-8 mb-8">
                  {/* Left: Document/Image Preview */}
                  <div className="flex-1 aspect-[1.6/1] bg-slate-50 rounded-3xl overflow-hidden border border-slate-100 flex items-center justify-center relative group">
                    {(() => {
                      const url = selectedRecord.application?.id_view_url || selectedRecord.uploaded_file_url || selectedRecord.id_file_url;
                      if (!url) {
                        return (
                          <div className="flex flex-col items-center gap-2 text-slate-400">
                            <AlertCircle className="w-8 h-8" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#0F172A]">No ID uploaded</p>
                          </div>
                        );
                      }
                      
                      const isPdf = url.toLowerCase().endsWith('.pdf');
                      
                      return (
                        <>
                          <button 
                            onClick={() => handleFileAction(url, `PhilHealth_ID_${selectedRecord.id}`, 'view')}
                            className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity gap-2"
                          >
                            <Eye className="w-8 h-8 text-white" />
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Click to View Full Document</span>
                          </button>
                          {isPdf ? (
                            <div className="flex flex-col items-center gap-2 text-slate-400">
                              <FileText className="w-8 h-8" />
                              <p className="text-[10px] font-black uppercase tracking-widest text-center">PDF Document Loaded<br/>(Click to view)</p>
                            </div>
                          ) : (
                            <img 
                              src={url} 
                              alt="PhilHealth ID" 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x250?text=Document+Available';
                              }}
                            />
                          )}
                          <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors pointer-events-none" />
                        </>
                      );
                    })()}
                  </div>
                  
                  {/* Right: Info */}
                  <div className="w-full md:w-64 space-y-6">
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Senior Citizen Information</p>
                      <div className="space-y-1">
                        <p className="text-lg font-black text-[#0F172A] leading-tight uppercase">{selectedRecord.senior_info?.full_name}</p>
                        <p className="text-[11px] text-slate-500 font-bold">Age: {selectedRecord.senior_info?.age} • Contact: {selectedRecord.senior_info?.contact}</p>
                      </div>
                      
                      <div className="mt-8 pt-6 border-t border-slate-200/60">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">PhilHealth ID Number</p>
                        <p className="text-xl font-black text-indigo-600 font-mono tracking-tight">{selectedRecord.ids?.philhealth_number}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center flex-col items-center gap-4">
                  <button 
                    onClick={() => setIsViewModalOpen(false)}
                    className="w-full max-w-sm px-8 py-4 bg-[#0F172A] text-white rounded-2xl font-black text-[13px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Change Status Modal */}
        {isStatusModalOpen && selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                      <RefreshCw className="w-5 h-5 text-amber-500 animate-spin-slow" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-[#0F172A] uppercase tracking-tight">Change Status</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedRecord.senior_info?.full_name}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsStatusModalOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <div className="space-y-4">
                  {[
                    { id: 'for_verification', label: 'For Verification', color: 'amber' },
                    { id: 'verified', label: 'Verified', color: 'emerald' },
                    { id: 'rejected', label: 'Rejected', color: 'rose' }
                  ].map((status) => (
                    <button
                      key={status.id}
                      onClick={() => setEditFormData({ ...editFormData, status: status.id })}
                      className={cn(
                        "w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all group",
                        editFormData.status?.toLowerCase() === status.id.toLowerCase()
                          ? `bg-${status.color}-50 border-${status.color}-500 shadow-md`
                          : "bg-white border-slate-100 hover:border-slate-300"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-3 h-3 rounded-full transition-transform group-hover:scale-125",
                          status.color === 'amber' ? "bg-amber-500" :
                          status.color === 'emerald' ? "bg-emerald-500" : "bg-rose-500"
                        )} />
                        <span className={cn(
                          "text-sm font-black uppercase tracking-wider",
                          editFormData.status?.toLowerCase() === status.id.toLowerCase()
                            ? `text-${status.color}-700`
                            : "text-slate-500"
                        )}>
                          {status.label}
                        </span>
                      </div>
                      {editFormData.status?.toLowerCase() === status.id.toLowerCase() && (
                        <CheckCircle2 className={cn(
                          "w-5 h-5",
                          status.color === 'emerald' ? "text-emerald-500" :
                          status.color === 'amber' ? "text-amber-500" : "text-rose-500"
                        )} />
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 mt-10">
                  <button 
                    onClick={() => setIsStatusModalOpen(false)}
                    className="flex-1 px-6 py-4 bg-white text-slate-600 border border-slate-200 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={async () => {
                      setIsUpdatingStatus(true);
                      await handleStatusChange(selectedRecord, editFormData.status);
                      setIsUpdatingStatus(false);
                      setIsStatusModalOpen(false);
                    }}
                    disabled={isUpdatingStatus}
                    className="flex-1 px-6 py-4 bg-[#0F172A] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
                  >
                    {isUpdatingStatus ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
        {/* Reject Modal */}
        {isRejectModalOpen && selectedRecord && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-rose-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-[#0F172A] uppercase tracking-tight">Reject Application</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">For: {selectedRecord.senior_info?.full_name}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsRejectModalOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Rejection Remarks (Required)</label>
                    <textarea 
                      required
                      value={rejectionRemarks}
                      onChange={(e) => setRejectionRemarks(e.target.value)}
                      placeholder="Please provide a reason for rejection..."
                      rows={4}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 outline-none resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <button 
                    onClick={() => setIsRejectModalOpen(false)}
                    className="flex-1 px-6 py-3.5 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleConfirmRejection}
                    disabled={!rejectionRemarks.trim()}
                    className="flex-1 px-6 py-3.5 bg-rose-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Confirm Reject
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
