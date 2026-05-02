import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  MessageSquare, 
  Search, 
  Filter, 
  CheckCircle2, 
  Reply, 
  X,
  AlertCircle,
  ChevronDown,
  Download,
  Eye
} from 'lucide-react';
import { cn, exportToCSV } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface FeedbackItem {
  id: number;
  submitted_at: string;
  sender_name?: string;
  first_name?: string;
  last_name?: string;
  scid_number?: string;
  barangay?: string;
  message: string;
  category: string;
  contact?: {
    address?: string;
    barangay?: string;
    contact_number?: string;
    email?: string;
  };
  contact_number?: string; // Add flat fallback
  status: 'pending' | 'resolved' | 'closed';
  response?: string;
  response_message?: string;
  assigned_to?: string;
  admin_response?: {
    response?: string;
    response_message?: string;
    assigned_to?: string;
  };
}

const getBarangayFromAddress = (address?: string) => {
  if (!address) return 'N/A';
  const parts = address.split(',');
  return parts[0].trim();
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

export default function FeedbackConcern() {
  const [data, setData] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [barangayFilter, setBarangayFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // View Modal State
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingItem, setViewingItem] = useState<FeedbackItem | null>(null);
  
  // Response Modal State
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FeedbackItem | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [responseStatus, setResponseStatus] = useState<'pending' | 'resolved' | 'closed'>('pending');
  const [assignedTo, setAssignedTo] = useState('');
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  
  // Fetch Data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("https://api-dbosca.phoenix.com.ph/api/feedback-concerns", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });
      const result = await response.json();
      if (response.ok) {
        setData(result.data || []);
      } else {
        setError(result.message || "Failed to fetch feedback/concerns");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("An error occurred while fetching data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const barangayCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(item => {
      const brgy = getBarangayFromAddress(item.contact?.address || item.barangay || item.contact?.barangay);
      counts[brgy] = (counts[brgy] || 0) + 1;
    });
    return counts;
  }, [data]);

  const availableBarangays = useMemo(() => {
    return Object.keys(barangayCounts).sort();
  }, [barangayCounts]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const itemText = (item.message || '').toString().toLowerCase();
      const senderName = (item.sender_name || `${item.first_name || ''} ${item.last_name || ''}`).trim() || 'Anonymous';
      const scid = (item.scid_number || '').toString().toLowerCase();
      const brgy = getBarangayFromAddress(item.contact?.address || item.barangay || item.contact?.barangay);
      const search = (searchTerm || '').toLowerCase();
      
      const matchesBarangay = barangayFilter === '' || brgy === barangayFilter;
      const matchesStatus = statusFilter === '' || (item.status || '').toLowerCase() === statusFilter.toLowerCase();
      const matchesCategory = categoryFilter === '' || (item.category || '').toLowerCase() === categoryFilter.toLowerCase();
      const matchesSearch = searchTerm === '' || 
                           senderName.toLowerCase().includes(search) || 
                           itemText.includes(search) ||
                           scid.includes(search);
      return matchesBarangay && matchesStatus && matchesCategory && matchesSearch;
    });
  }, [data, barangayFilter, statusFilter, categoryFilter, searchTerm]);

  const resetFilters = () => {
    setSearchTerm('');
    setBarangayFilter('');
    setStatusFilter('');
    setCategoryFilter('');
  };

  const handleRespond = (item: FeedbackItem) => {
    setSelectedItem(item);
    setResponseMessage(item.admin_response?.response_message || item.admin_response?.response || item.response_message || item.response || '');
    setResponseStatus((item.status || 'pending').toLowerCase() as any);
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const currentUserName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    setAssignedTo(currentUserName || item.admin_response?.assigned_to || item.assigned_to || 'Admin');
    setShowResponseModal(true);
  };

  const submitResponse = async () => {
    if (!selectedItem) return;
    setIsSubmittingResponse(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`https://api-dbosca.phoenix.com.ph/api/feedback-concerns/${selectedItem.id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          assigned_to: assignedTo,
          response: responseMessage,
          status: responseStatus
        })
      });

      if (response.ok) {
        await fetchData();
        setShowResponseModal(false);
      } else {
        const result = await response.json();
        alert(result.message || "Failed to submit response");
      }
    } catch (err) {
      console.error("Response error:", err);
      alert("An error occurred while submitting response");
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  const updateStatus = async (item: FeedbackItem, newStatus: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`https://api-dbosca.phoenix.com.ph/api/feedback-concerns/${item.id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          status: newStatus
        })
      });

      if (response.ok) {
        await fetchData();
      } else {
        const result = await response.json();
        alert(result.message || "Failed to update status");
      }
    } catch (err) {
      console.error("Status error:", err);
      alert("An error occurred while updating status");
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Date',
      'Full Name',
      'Address',
      'Description',
      'Type',
      'Status'
    ];

    const dataToExport = filteredData.map(item => ({
      'Date': item.submitted_at,
      'Full Name': item.sender_name || `${item.first_name || ''} ${item.last_name || ''}`.trim(),
      'Address': item.contact?.address || 'N/A',
      'Description': item.message,
      'Type': item.category,
      'Status': item.status
    }));

    exportToCSV(dataToExport, headers, 'feedback_concern.csv');
  };

  return (
    <div className="space-y-10">
      <header className="mb-10">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Feedback & Concern</h2>
        <p className="text-slate-500 font-medium mt-1">Citizen Engagement Monitoring</p>
      </header>

      {/* Main Card Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-600 font-bold text-sm">
            <AlertCircle className="w-5 h-5 transition-transform group-hover:scale-110" />
            {error}
          </div>
        )}
        
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
          <div className="flex flex-wrap items-center gap-4 flex-1">
            {/* Search Bar */}
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-1 focus:ring-[#ef4444] focus:border-[#ef4444] outline-none transition-all shadow-sm"
              />
            </div>

            {/* Barangay Filter */}
            <div className="relative min-w-[240px]">
              <select 
                value={barangayFilter}
                onChange={(e) => setBarangayFilter(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-1 focus:ring-[#ef4444] focus:border-[#ef4444] outline-none transition-all shadow-sm appearance-none cursor-pointer"
              >
                <option value="">All Barangays ({data.length})</option>
                {availableBarangays.map(bg => (
                  <option key={bg} value={bg}>{bg} ({barangayCounts[bg]})</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {/* Status Filter */}
            <div className="relative min-w-[180px]">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-1 focus:ring-[#ef4444] focus:border-[#ef4444] outline-none transition-all shadow-sm appearance-none cursor-pointer"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {/* Category Filter Buttons */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-inner">
              <button 
                onClick={() => setCategoryFilter('')}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                  categoryFilter === '' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                All
              </button>
              <button 
                onClick={() => setCategoryFilter('concern')}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                  categoryFilter === 'concern' ? "bg-white text-[#ef4444] shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Concerns
              </button>
              <button 
                onClick={() => setCategoryFilter('feedback')}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                  categoryFilter === 'feedback' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Feedback
              </button>
            </div>

            {(searchTerm || barangayFilter || statusFilter || categoryFilter) && (
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
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Entries</span>
                <span className="text-sm font-bold text-slate-900 leading-none">{filteredData.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider">SCID Number</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider">Full Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider">Barangay</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-4 border-slate-900/10 border-t-slate-900 rounded-full animate-spin" />
                      <p className="text-slate-400 font-medium text-lg tracking-tight">Fetching entries...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <MessageSquare className="w-16 h-16 text-slate-100" />
                      <p className="text-slate-400 font-medium text-lg tracking-tight">No feedback or concerns found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((item, index) => (
                  <tr key={item.id || `feedback-${index}`} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-5">
                      <p className="text-xs font-medium text-slate-500">
                        {formatDate(item.submitted_at)}
                      </p>
                      <div className={cn(
                        "mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-block border",
                        (item.status || '').toLowerCase() === 'resolved' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                        (item.status || '').toLowerCase() === 'closed' ? "bg-slate-100 text-slate-500 border-slate-200" :
                        "bg-amber-50 text-amber-600 border-amber-100"
                      )}>
                        {item.status || 'pending'}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className={cn(
                        "px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest inline-block border",
                        (item.category || '').toLowerCase() === 'feedback' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"
                      )}>
                        {item.category || 'concern'}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs font-bold text-[#ef4444] font-mono tracking-wider">
                        {item.scid_number || '---'}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-semibold text-slate-900">
                        {item.sender_name || `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Anonymous'}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">{item.contact?.contact_number || item.contact_number}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-medium text-slate-600">
                        {getBarangayFromAddress(item.contact?.address || item.barangay || item.contact?.barangay)}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-2 items-center justify-center scale-90">
                        <button 
                          onClick={() => {
                            setViewingItem(item);
                            setShowViewModal(true);
                          }}
                          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-200 transition-all shadow-sm"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </button>
                        {!['closed', 'resolved'].includes((item.status || '').toLowerCase()) && (
                          <button 
                            onClick={() => handleRespond(item)}
                            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-all shadow-sm"
                          >
                            <Reply className="w-3 h-3" />
                            Respond
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal */}
      <AnimatePresence>
        {showViewModal && viewingItem && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowViewModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-slate-950 tracking-tight">Concern Details</h3>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Ticket #{viewingItem.id} • {viewingItem.category}</p>
                </div>
                <button 
                  onClick={() => setShowViewModal(false)}
                  className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sender Name</p>
                    <p className="text-sm font-bold text-slate-900">{viewingItem.sender_name || `${viewingItem.first_name || ''} ${viewingItem.last_name || ''}`.trim() || 'Anonymous'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SCID Number</p>
                    <p className="text-sm font-bold text-[#ef4444] font-mono">{viewingItem.scid_number || '---'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Submitted</p>
                    <p className="text-sm font-bold text-slate-900">{formatDate(viewingItem.submitted_at)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                    <div className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-block border",
                      (viewingItem.status || '').toLowerCase() === 'resolved' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                      (viewingItem.status || '').toLowerCase() === 'closed' ? "bg-slate-100 text-slate-500 border-slate-200" :
                      "bg-amber-50 text-amber-600 border-amber-100"
                    )}>
                      {viewingItem.status || 'pending'}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Address</p>
                  <p className="text-sm font-medium text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                    {viewingItem.contact?.address || 'No address provided'}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Message/Description</p>
                  <p className="text-base font-semibold text-slate-900 leading-relaxed p-5 bg-slate-50 rounded-2xl border border-dashed border-slate-200 shadow-inner italic">
                    "{viewingItem.message}"
                  </p>
                </div>

                {(viewingItem.response_message || viewingItem.response || viewingItem.admin_response?.response_message || viewingItem.admin_response?.response) && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-1">Admin Response</p>
                    <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2">
                        Responded by: {viewingItem.admin_response?.assigned_to || viewingItem.assigned_to || 'Admin'}
                      </p>
                      <p className="text-sm text-emerald-900 font-medium leading-relaxed italic">
                        "{viewingItem.admin_response?.response_message || viewingItem.admin_response?.response || viewingItem.response_message || viewingItem.response}"
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => setShowViewModal(false)}
                  className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Response Modal */}
      <AnimatePresence>
        {showResponseModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResponseModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-slate-950 tracking-tight">Respond to Concern</h3>
                  <p className="text-slate-400 text-sm font-medium mt-0.5 uppercase tracking-widest">Ticket #{selectedItem?.id}</p>
                </div>
                <button 
                  onClick={() => setShowResponseModal(false)}
                  className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                {selectedItem && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Original Message:</p>
                    <p className="text-sm text-slate-700 font-medium leading-relaxed italic">"{selectedItem.message}"</p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Response Message</label>
                  <textarea 
                    rows={5}
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-base font-medium text-slate-900 outline-none focus:ring-4 focus:ring-[#ef4444]/5 focus:border-[#ef4444] transition-all resize-none"
                    placeholder="Provide a detailed response or resolution plan..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Update Status</label>
                  <div className="relative">
                    <select 
                      value={responseStatus}
                      onChange={(e) => setResponseStatus(e.target.value as any)}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-base font-bold text-slate-900 outline-none focus:ring-4 focus:ring-[#ef4444]/5 focus:border-[#ef4444] transition-all appearance-none cursor-pointer"
                    >
                      <option value="pending">Pending</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button 
                    onClick={() => setShowResponseModal(false)}
                    className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={submitResponse}
                    disabled={isSubmittingResponse || !responseMessage}
                    className="flex-[2] py-4 bg-[#ef4444] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-all shadow-xl shadow-red-200 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmittingResponse ? (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Reply className="w-4 h-4" />
                    )}
                    Submit Response
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
