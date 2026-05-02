import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  Calendar,
  MapPin,
  IdCard,
  FileText,
  ChevronDown,
  Plus,
  Phone,
  Mail,
  Home,
  Paperclip,
  MoreVertical,
  ChevronRight,
  Printer,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Camera,
  Upload,
  Trash2,
  Shield,
  PenTool
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Application } from '../App';
import WalkInIdIssuanceModal from './WalkInIdIssuanceModal';
import { IDCard } from './IDCard';
import { OscaApplicationForm } from './OscaApplicationForm';
import { QRCodeSVG } from 'qrcode.react';

interface IdIssuanceModuleProps {
  type: 'Management' | 'Walk-In';
  applications: Application[];
  onUnauthorized?: () => void;
}

interface IdViewModalProps {
  record: any;
  isOpen: boolean;
  onClose: () => void;
}

const IdViewModal = ({ record, isOpen, onClose }: IdViewModalProps) => {
  if (!isOpen || !record) return null;

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '---';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return dateString;
    }
  };

  const isImage = (url: string) => {
    if (!url) return false;
    return url.match(/\.(jpg|jpeg|png|gif|webp)$/i) !== null || url.startsWith('data:image');
  };

  return (
    <AnimatePresence>
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
          className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center">
                <IdCard className="w-6 h-6 text-rose-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  ID Application Details
                </h2>
                <p className="text-[11px] font-semibold text-slate-500 tracking-wide mt-0.5">Reference: ID-{record.id || 'N/A'}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-10">
            {/* Header Info */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 tracking-wide">Application Date</p>
                <p className="text-sm font-semibold text-slate-900">{formatDate(record.application_date)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 tracking-wide">Modality</p>
                <p className="text-sm font-semibold text-slate-900">{record.modality ? record.modality.charAt(0).toUpperCase() + record.modality.slice(1).toLowerCase() : '---'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 tracking-wide">Status</p>
                <span className={cn(
                  "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block",
                  record.status?.issuance_status === 'approved' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                  record.status?.issuance_status === 'pending' ? "bg-amber-50 text-amber-600 border border-amber-100" : 
                  record.status?.issuance_status === 'rejected' ? "bg-rose-50 text-rose-600 border border-rose-100" :
                  record.status?.issuance_status === 'printed' ? "bg-blue-50 text-blue-600 border border-blue-100" :
                  record.status?.issuance_status === 'issued' ? "bg-indigo-50 text-indigo-600 border border-indigo-100" : "bg-slate-50 text-slate-600 border border-slate-100"
                )}>
                  {record.status?.issuance_status || 'pending'}
                </span>
                {['approved', 'disapproved'].includes(record.status?.issuance_status?.toLowerCase()) && record.date_reviewed && (
                  <p className="text-[10px] font-semibold text-slate-400 mt-1">
                    Reviewed: {new Date(record.date_reviewed).toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' })}
                  </p>
                )}
                {record.status?.issuance_status?.toLowerCase() === 'released' && record.released_date && (
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    RELEASED: {new Date(record.released_date).toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' }).toUpperCase()}
                  </p>
                )}
                {record.status?.issuance_status?.toLowerCase() === 'disapproved' && record.remarks && (
                  <div className="mt-2 p-3 bg-rose-50 rounded-xl border border-rose-100 text-[10px] font-medium text-rose-600 italic">
                    Reason: {record.remarks}
                  </div>
                )}
              </div>
            </div>

            {/* Personal Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                <User className="w-4 h-4 text-rose-500" />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Personal Information</h3>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</p>
                  <p className="text-sm font-bold text-slate-900 uppercase">
                    {record.full_name}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sex</p>
                  <p className="text-sm font-bold text-slate-900 uppercase">{record.sex}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Birthdate</p>
                  <p className="text-sm font-bold text-slate-900">{formatDate(record.birth_date)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Birth Place</p>
                  <p className="text-sm font-bold text-slate-900 uppercase">{record.birth_place}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Civil Status</p>
                  <p className="text-sm font-bold text-slate-900 uppercase">{record.civil_status}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Citizenship</p>
                  <p className="text-sm font-bold text-slate-900 uppercase">{record.citizenship}</p>
                </div>
              </div>
            </div>

            {/* Residential Address */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                <Home className="w-4 h-4 text-rose-500" />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Residential Address</h3>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="col-span-2 space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Address</p>
                  <p className="text-sm font-bold text-slate-900 uppercase">{record.address}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Barangay</p>
                  <p className="text-sm font-bold text-slate-900 uppercase">{record.barangay}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">City/Municipality</p>
                  <p className="text-sm font-bold text-slate-900 uppercase">{record.city_municipality}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">District</p>
                  <p className="text-sm font-bold text-slate-900 uppercase">{record.district}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Province</p>
                  <p className="text-sm font-bold text-slate-900 uppercase">{record.province}</p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                <Phone className="w-4 h-4 text-rose-500" />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Contact Information</h3>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</p>
                  <p className="text-sm font-bold text-slate-900">{record.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Number</p>
                  <p className="text-sm font-bold text-slate-900">{record.contact_number}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Emergency Contact Name</p>
                  <p className="text-sm font-bold text-slate-900 uppercase">{record.emergency_contact_person}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Emergency Contact Number</p>
                  <p className="text-sm font-bold text-slate-900">{record.emergency_contact_number}</p>
                </div>
              </div>
            </div>

            {/* Attachment */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                <Paperclip className="w-4 h-4 text-rose-500" />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Attachments</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(record.req1_url || record.req2_url) ? (
                  <>
                    {record.req1_url && (
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-rose-200 transition-all">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-100 group-hover:border-rose-100 shrink-0">
                            <FileText className="w-5 h-5 text-slate-400 group-hover:text-rose-500" />
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-xs font-black text-slate-900 truncate">Requirement 1</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Main Document</p>
                          </div>
                        </div>
                        <a href={record.req1_url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-white rounded-lg transition-colors text-rose-500">
                          <Eye className="w-4 h-4" />
                        </a>
                      </div>
                    )}
                    {record.req2_url && (
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-rose-200 transition-all">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-100 group-hover:border-rose-100 shrink-0">
                            <FileText className="w-5 h-5 text-slate-400 group-hover:text-rose-500" />
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-xs font-black text-slate-900 truncate">Requirement 2</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Supporting Document</p>
                          </div>
                        </div>
                        <a href={record.req2_url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-white rounded-lg transition-colors text-rose-500">
                          <Eye className="w-4 h-4" />
                        </a>
                      </div>
                    )}
                  </>
                ) : record.user_details?.document && Array.isArray(record.user_details.document) && record.user_details.document.length > 0 ? (
                  record.user_details.document.map((doc: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-rose-200 transition-all">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-100 group-hover:border-rose-100 shrink-0">
                          <FileText className="w-5 h-5 text-slate-400 group-hover:text-rose-500" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-black text-slate-900 truncate">{doc.name || `Document ${idx + 1}`}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Attachment</p>
                        </div>
                      </div>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-white rounded-lg transition-colors text-rose-500">
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 py-8 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No attachments found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Photo and Signature */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                  <User className="w-4 h-4 text-rose-500" />
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Citizen Photo</h3>
                </div>
                <div className="w-full aspect-[3/4] bg-slate-50 rounded-[2rem] border border-slate-100 overflow-hidden relative flex items-center justify-center group">
                  {record.photo_url ? (
                     <img src={record.photo_url} alt="Citizen Photo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                       <User className="w-12 h-12 text-slate-200" />
                       <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No Photo</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                  <FileText className="w-4 h-4 text-rose-500" />
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Signature</h3>
                </div>
                <div className="w-full aspect-[3/4] md:aspect-auto md:h-[calc(100%-2.5rem)] bg-slate-50 rounded-[2rem] border border-slate-100 overflow-hidden flex items-center justify-center p-6">
                  {record.files?.signature_url || record.signature_url ? (
                    <img src={record.files?.signature_url || record.signature_url} alt="Signature" className="w-full object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                       <Paperclip className="w-12 h-12 text-slate-200" />
                       <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No Signature</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Released & Expiration Dates */}
            {record.status?.issuance_status === 'released' && (
              <div className="mt-10 pt-8 border-t border-slate-100 space-y-4">
                <div className="flex items-center gap-3 mb-6">
                  <Calendar className="w-4 h-4 text-rose-500" />
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Issuance Details</h3>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Released Date</p>
                    <p className="text-sm font-bold text-slate-900">{formatDate(record.dates?.released || record.released_date)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expiration Date</p>
                    <p className="text-sm font-bold text-slate-900">{formatDate(record.dates?.expiration || record.expiration_date)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end">
            <button 
              onClick={onClose}
              className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all"
            >
              Close Details
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

interface ReasonForDisapprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason: string;
}

const ReasonForDisapprovalModal = ({ isOpen, onClose, reason }: ReasonForDisapprovalModalProps) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
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
          className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden"
        >
          <div className="p-8 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase">Reason for Disapproval</h2>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div className="p-8">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 italic text-slate-600 text-sm leading-relaxed">
              "{reason || "No remarks provided"}"
            </div>
          </div>

          <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export const IdPreviewModal = ({ record, isOpen, onClose }: { record: any; isOpen: boolean; onClose: () => void }) => {
  const [zoom, setZoom] = useState(1.4);
  const [viewSide, setViewSide] = useState<'front' | 'back'>('front');
  const [fullView, setFullView] = useState(false);

  if (!isOpen || !record) return null;

  const handlePrint = () => {
    const printContent = document.getElementById('print-area');
    if (!printContent) return;

    const win = window.open('', '', 'width=1000,height=800');
    if (!win) return;

    win.document.write(`
      <html>
        <head>
          <title>Print ID - ${record.full_name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { 
              margin: 0; 
              padding: 40px;
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              gap: 40px;
              background: white;
              font-family: 'Inter', sans-serif;
            }
            .print-container {
              display: flex;
              flex-direction: column;
              gap: 40px;
              align-items: center;
            }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body>
          <div class="print-container">
            ${printContent.innerHTML}
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const fullAddress = 
    (record.user_details?.address || record.address || '') + ', ' + 
    (record.user_details?.barangay || record.barangay || '') + ', ' + 
    (record.user_details?.city_municipality || record.city_municipality || '') + ', ' + 
    (record.user_details?.province || record.province || '');

  return (
    <AnimatePresence>
       <div className={cn(
         "fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:block print:static",
         fullView ? "p-0" : "pt-20 pb-20"
       )}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              "bg-white relative print:shadow-none print:p-0 print:rounded-none transition-all flex flex-col overflow-hidden",
              fullView ? "w-full h-full rounded-none" : "rounded-[2rem] shadow-2xl w-[90%] max-w-[1024px] h-[90vh]"
            )}
          >
             {/* Modal Header for non-print */}
             <div className={cn(
               "flex items-center justify-between mb-0 print:hidden shrink-0",
               fullView ? "p-8 border-b border-slate-100" : "p-8 border-b border-slate-50"
             )}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center">
                    {viewSide === 'front' ? <IdCard className="w-6 h-6 text-rose-500" /> : <Printer className="w-6 h-6 text-rose-500" />}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase">ID {viewSide === 'front' ? 'Front' : 'Back'} Preview</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Previewing ID for {record.full_name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                   {/* View Side Toggles */}
                   <div className="flex bg-slate-100 p-1 rounded-xl">
                      <button 
                        onClick={() => setViewSide('front')}
                        className={cn(
                          "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                          viewSide === 'front' ? "bg-white text-rose-500 shadow-sm" : "text-slate-400 hover:text-slate-600"
                        )}
                      >
                        Front
                      </button>
                      <button 
                        onClick={() => setViewSide('back')}
                        className={cn(
                          "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                          viewSide === 'back' ? "bg-white text-rose-500 shadow-sm" : "text-slate-400 hover:text-slate-600"
                        )}
                      >
                        Back
                      </button>
                   </div>

                   {/* Zoom Controls */}
                   <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                      <button 
                        onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}
                        className="p-2 hover:bg-white rounded-lg transition-all text-slate-500 hover:text-rose-500"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      <span className="text-[10px] font-black w-10 text-center text-slate-600">
                        {Math.round(zoom * 100)}%
                      </span>
                      <button 
                        onClick={() => setZoom(prev => Math.min(2, prev + 0.1))}
                        className="p-2 hover:bg-white rounded-lg transition-all text-slate-500 hover:text-rose-500"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setZoom(1)}
                        className="p-2 hover:bg-white rounded-lg transition-all text-slate-500 hover:text-rose-500"
                        title="Reset Zoom"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                   </div>

                   <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setFullView(!fullView)}
                        className="p-3 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 hover:text-slate-900"
                        title={fullView ? "Exit Fullscreen" : "Maximize"}
                      >
                        {fullView ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                      </button>
                      <button 
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-6 py-3 bg-rose-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-200 focus:outline-none"
                      >
                        <Printer className="w-4 h-4" />
                        Print ID
                      </button>
                      <button 
                        onClick={onClose}
                        className="p-3 hover:bg-slate-100 rounded-xl transition-colors"
                      >
                        <X className="w-6 h-6 text-slate-400" />
                      </button>
                   </div>
                </div>
             </div>

             <div className="flex-1 flex flex-col items-center p-8 overflow-y-auto bg-slate-50/30">
                <div id="print-area">
                    <IDCard record={record} zoom={zoom} viewSide={viewSide} />
                </div>
             </div>
          </motion.div>
       </div>
    </AnimatePresence>
  );
};

export default function IdIssuanceModule({ type, applications, onUnauthorized }: IdIssuanceModuleProps) {
  const [idIssuances, setIdIssuances] = useState<any[]>([]);
  const [masterlistData, setMasterlistData] = useState<any[]>([]);
  const [walkInTab, setWalkInTab] = useState<'New ID' | 'Renewal' | 'Replacement'>('New ID');
  const [masterlistSearch, setMasterlistSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [requestTypeFilter, setRequestTypeFilter] = useState('All');
  const [barangayFilter, setBarangayFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusRecord, setStatusRecord] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [rejectionRemarks, setRejectionRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<any | null>(null);
  const [selectedReason, setSelectedReason] = useState('');
  const [selectedCitizen, setSelectedCitizen] = useState<any | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewRecord, setPreviewRecord] = useState<any | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedFormRecord, setSelectedFormRecord] = useState<any | null>(null);

  const lastFetchIdRef = useRef<number>(0);
  const lastFetchMasterRef = useRef<number>(0);

  const fetchIdIssuances = useCallback(async () => {
    // Throttle: don't fetch more than once every 30 seconds
    const now = Date.now();
    if (now - lastFetchIdRef.current < 30000) return;
    lastFetchIdRef.current = now;

    setIsLoading(true);
    setIdIssuances([]); // Reset before fetch
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {
        "Accept": "application/json"
      };
      
      if (token && token !== 'undefined' && token !== 'null') {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("https://api-dbosca.phoenix.com.ph/api/id-issuances", { 
        method: "GET",
        headers 
      });
      
      if (response.status === 429) {
        setError("Rate limit reached. Please wait a moment.");
        return;
      }

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      const rawData = result.data?.data || result.data || result || [];
      const dataArray = Array.isArray(rawData) ? rawData : [];
      
      // Map nested data for cleaner frontend usage
      const mappedData = dataArray.map((item: any) => {
        const u = item.user_details || {};
        const rd = item.request_details || {};
        const dates = item.dates || {};
        const ec = item.emergency_contact || {};
        const files = item.files || {};

        const calculateAge = (birthDate: string) => {
          if (!birthDate) return '---';
          const today = new Date();
          const birth = new Date(birthDate);
          let age = today.getFullYear() - birth.getFullYear();
          const m = today.getMonth() - birth.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
          }
          return age > 0 ? age : '---';
        };

        return {
          ...item,
          // Identification and Demographics
          full_name: item.full_name || (u.last_name ? `${u.last_name}, ${u.first_name}` : '---'),
          birth_date: item.birth_date || u.birth_date,
          age: u.age || calculateAge(item.birth_date || u.birth_date),
          sex: item.sex || u.sex || '---',
          civil_status: item.civil_status || u.civil_status || '---',
          citizenship: item.citizenship || u.citizenship || '---',
          birth_place: item.birth_place || u.birth_place || '---',
          
          // Address 
          barangay: item.barangay || u.barangay || '---',
          city_municipality: item.city_municipality || u.city_municipality || '---',
          district: item.district || u.district || '---',
          province: item.province || u.province || '---',
          address: item.address || u.address || '---',

          // Contact
          email: item.email || u.email || '---',
          contact_number: item.contact_number || u.contact_number || item.user_details?.contact_number || '---',

          // Status and Dates
          date_reviewed: dates.reviewed || item.date_reviewed,
          released_date: dates.released || item.released_date,
          id_expiration_date: dates.expiration || item.id_expiration_date,
          application_date: rd.application_date || item.application_date || dates.registration_date || dates.created_at,

          // Emergency Contact
          emergency_contact_person: ec.person || ec.name || item.emergency_contact_person || u.emergency_contact_name || '-',
          emergency_contact_number: ec.number || item.emergency_contact_number || '-',
          
          // ID number
          scid_number: item.scid_number || u.scid_number || '---',
          
          // Request Details
          request_type: rd.type || (rd.request_type === 'Lost/Damage' ? 'Replacement' : (rd.request_type || 'New ID')),
          modality: rd.modality || 'Walk-in',
          
          // Files
          photo_url: files.photo_url || item.photo_url || '',
          signature_url: files.signature_url || item.signature_url || null,
          req1_url: files.req1_url || item.req1_url || '',
          req2_url: files.req2_url || item.req2_url || ''
        };
      });

      setIdIssuances(mappedData);
    } catch (err) {
      console.error("FETCH ID ISSUANCES ERROR:", err);
      setError("Failed to load ID issuance data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchMasterlist = useCallback(async () => {
    // Throttle: don't fetch more than once every 30 seconds
    const now = Date.now();
    if (now - lastFetchMasterRef.current < 30000) return;
    lastFetchMasterRef.current = now;

    setIsLoading(true);
    setMasterlistData([]); // Reset before fetch
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {
        "Accept": "application/json"
      };
      
      if (token && token !== 'undefined' && token !== 'null') {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Fetch more records for walk-in filtering
      const response = await fetch("https://api-dbosca.phoenix.com.ph/api/masterlist?per_page=5000", { 
        method: "GET",
        headers 
      });
      
      if (response.status === 429) {
        setError("Rate limit reached. Please wait a moment.");
        return;
      }

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const result = await response.json();
      const data = result.data?.data || result.data || result || [];
      setMasterlistData(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("FETCH MASTERLIST ERROR:", err);
      if (err.message?.includes('401') && onUnauthorized) {
        onUnauthorized();
      }
      setError("Failed to load Masterlist data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (type === 'Management') {
      fetchIdIssuances();
    } else {
      fetchIdIssuances(); // Load for filtering existing applications
      fetchMasterlist();
    }
  }, [fetchIdIssuances, fetchMasterlist, type]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '---';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = date.getFullYear();
      return `${month}-${day}-${year}`;
    } catch (e) {
      return dateString;
    }
  };

  const handleViewDetails = (record: any) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const handleOpenStatusModal = (record: any) => {
    setStatusRecord(record);
    setNewStatus('');
    setRejectionRemarks('');
    setIsStatusModalOpen(true);
    setActiveMenuId(null);
  };

  const handleOpenEditModal = (record: any) => {
    setEditRecord(record);
    setIsEditModalOpen(true);
    setActiveMenuId(null);
  };

  const getAllowedStatuses = (currentStatus: string) => {
    const status = currentStatus?.toLowerCase() || 'pending';
    switch (status) {
      case 'pending':
        return ['approved', 'disapproved'];
      case 'approved':
        return ['pending', 'released'];
      case 'disapproved':
        return ['pending'];
      default:
        return [];
    }
  };

  const handleUpdateStatus = async () => {
    if (!statusRecord || !newStatus) return;
    if (newStatus === 'disapproved' && !rejectionRemarks.trim()) {
      alert("Please provide a rejection reason.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Accept": "application/json"
      };
      
      if (token && token !== 'undefined' && token !== 'null') {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const today = new Date();
      const formatDate = (date: Date) => date.toISOString().split('T')[0];
      
      const released_date = newStatus === 'released' ? formatDate(today) : null;
      const id_expiration_date = newStatus === 'released' ? formatDate(new Date(today.getFullYear() + 3, today.getMonth(), today.getDate())) : null;

      const payload = {
        id_status: newStatus,
        date_reviewed: new Date().toISOString(),
        rejection_remarks: newStatus === 'disapproved' ? rejectionRemarks : null,
        released_date,
        id_expiration_date
      };

      const response = await fetch(`https://api-dbosca.phoenix.com.ph/api/id-issuances/${statusRecord.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Update failed");
      }

      // Sync with Masterlist
      if (statusRecord.citizen_id) {
        try {
          const mapStatus = (status: string) => {
            if (status === 'disapproved') return 'rejected';
            return status;
          };

          await fetch(`https://api-dbosca.phoenix.com.ph/api/masterlist/${statusRecord.citizen_id}`, {
            method: "PATCH",
            headers,
            body: JSON.stringify({ id_status: mapStatus(newStatus) })
          });
        } catch (syncErr) {
          console.error("MASTERLIST SYNC ERROR:", syncErr);
          // We don't necessarily want to fail the whole operation if sync fails, but we log it.
        }
      }

      setIsStatusModalOpen(false);
      fetchIdIssuances();
    } catch (err) {
      console.error("UPDATE STATUS ERROR:", err);
      alert("Failed to update status. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenReasonModal = (reason: string) => {
    setSelectedReason(reason);
    setIsReasonModalOpen(true);
    setActiveMenuId(null);
  };

  const handlePreviewId = (record: any) => {
    setPreviewRecord(record);
    setIsPreviewModalOpen(true);
    setActiveMenuId(null);
  };

  const handleOpenFormModal = (record: any) => {
    setSelectedFormRecord(record);
    setIsFormModalOpen(true);
    setActiveMenuId(null);
  };

  const handleProceedWithId = (citizen: any) => {
    setSelectedCitizen(citizen);
    setIsWalkInModalOpen(true);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setRequestTypeFilter('All');
    setBarangayFilter('All');
    setStartDate('');
    setEndDate('');
  };

  const barangayCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    idIssuances.forEach(item => {
      const brgy = item.barangay || 'Unknown';
      counts[brgy] = (counts[brgy] || 0) + 1;
    });
    return counts;
  }, [idIssuances]);

  const sortedAvailableBarangays = useMemo(() => {
    return Object.keys(barangayCounts).filter(b => b !== 'Unknown').sort();
  }, [barangayCounts]);

  const displayData = idIssuances.filter(item => {
    const search = searchTerm.toLowerCase();
    const fullName = (item.full_name || '').toLowerCase();
    const scid = (item.scid_number || '').toString().toLowerCase();
    const brgyRaw = (item.barangay || '').toLowerCase();
    
    const matchesSearch = searchTerm === '' || 
                          fullName.includes(search) || 
                          scid.includes(search) ||
                          brgyRaw.includes(search);
    
    const itemStatus = item.status?.issuance_status || 'pending';
    const matchesStatus = statusFilter === 'All' || itemStatus === statusFilter;
    
    // Normalize request type for comparison
    const itemReqType = (item.request_type || item.request_details?.type || 'New ID');
    const matchesRequestType = requestTypeFilter === 'All' || itemReqType === requestTypeFilter;
    
    const matchesBarangay = barangayFilter === 'All' || item.barangay === barangayFilter;
    
    const regDate = item.application_date;
    let matchesDate = true;
    if (startDate || endDate) {
      const itemDate = new Date(regDate).getTime();
      if (startDate) {
        matchesDate = matchesDate && itemDate >= new Date(startDate).getTime();
      }
      if (endDate) {
        // Set end date to end of day
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && itemDate <= endDateTime.getTime();
      }
    }

    return matchesSearch && matchesStatus && matchesRequestType && matchesBarangay && matchesDate;
  });

  const uniqueBarangays = Array.from(new Set(idIssuances.map(item => item.user_details?.barangay).filter(Boolean))).sort();

  const filteredMasterlist = (walkInTab === 'Renewal' ? idIssuances : masterlistData).filter(item => {
    // Basic search filtering
    const fullName = (item.full_name || 
                     (item.first_name ? `${item.last_name}, ${item.first_name}` : '') || 
                     '---').toLowerCase();
    const scid = (item.scid_number || '').toLowerCase();
    const searchLower = masterlistSearch.toLowerCase();
    const matchesSearch = fullName.includes(searchLower) || scid.includes(searchLower);
    
    if (!matchesSearch) return false;

    // Common id issuance check helper
    const hasActiveIssuance = (reqType: string) => {
      return idIssuances.some(issuance => {
        const citizenMatch = String(issuance.citizen_id) === String(item.citizen_id || item.id);
        const typeMatch = (issuance.request_type || issuance.request_details?.type || 'New ID') === reqType;
        const statusMatch = ['pending', 'approved'].includes(issuance.status?.issuance_status?.toLowerCase());
        return citizenMatch && typeMatch && statusMatch;
      });
    };

    if (walkInTab === 'New ID') {
      // Exclude if already has ANY existing New ID request in the system
      const hasExistingNewID = idIssuances.some(issuance => {
        const citizenMatch = String(issuance.citizen_id) === String(item.citizen_id || item.id);
        const typeMatch = (issuance.request_type || issuance.request_details?.type || 'New ID') === 'New ID';
        return citizenMatch && typeMatch;
      });
      
      if (hasExistingNewID) return false;
      return item.id_status === 'new';
    }

    if (walkInTab === 'Replacement') {
      // 1. Only show citizens with released ID
      if (item.id_status !== 'released') return false;
      
      // 2. Exclude if has existing active Replacement request
      if (hasActiveIssuance('Replacement')) return false;

      return true;
    }

    if (walkInTab === 'Renewal') {
      // Source is ID Issuance API
      const status = item.status?.issuance_status || item.issuance_status;
      const exp = item.dates?.expiration || item.id_expiration_date || item.expiration_date;

      // Filter: status must be released
      if (status !== 'released') return false;

      // Filter: expiration is NOT null
      if (!exp) return false;

      const today = new Date();
      const expirationDate = new Date(exp);
      const threeMonthsBefore = new Date(expirationDate);
      threeMonthsBefore.setMonth(threeMonthsBefore.getMonth() - 3);

      // ✅ FIX: include expired
      return today >= threeMonthsBefore;
    }

    // Default for other tabs: Exclude if already has any active issuance record
    const hasAnyActive = idIssuances.some(issuance => 
      String(issuance.citizen_id) === String(item.citizen_id || item.id) &&
      ['pending', 'approved'].includes(issuance.status?.issuance_status?.toLowerCase())
    );
    return !hasAnyActive;
  });

  // Debug for Data Verification
  useEffect(() => {
    if (walkInTab === 'Renewal') {
      console.log("RENEWAL SOURCE (ID ISSUANCES):", idIssuances);
      console.log("FILTERED RENEWAL LIST:", filteredMasterlist);
    }
  }, [walkInTab, idIssuances, filteredMasterlist]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            ID Issuance {type === 'Management' ? 'Management' : 'Walk-in'}
          </h2>
          <p className="text-slate-500 font-medium mt-1">
            {type === 'Management' ? 'Manage and track ID applications' : 'New ID applications from Masterlist'}
          </p>
        </div>

        {type === 'Management' ? (
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by name or barangay..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-1 focus:ring-[#ef4444] focus:border-[#ef4444] transition-all shadow-sm"
              />
            </div>
            <div className="relative">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-1 focus:ring-[#ef4444] focus:border-[#ef4444] transition-all appearance-none cursor-pointer min-w-[140px] shadow-sm"
              >
                <option value="All">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="disapproved">Disapproved</option>
                <option value="released">Released</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select 
                value={requestTypeFilter}
                onChange={(e) => setRequestTypeFilter(e.target.value)}
                className="pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-1 focus:ring-[#ef4444] focus:border-[#ef4444] transition-all appearance-none cursor-pointer min-w-[160px] shadow-sm"
              >
                <option value="All">All Types</option>
                <option value="New ID">New ID</option>
                <option value="Renewal">Renewal</option>
                <option value="Replacement">Replacement</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select 
                value={barangayFilter}
                onChange={(e) => setBarangayFilter(e.target.value)}
                className="pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-1 focus:ring-[#ef4444] focus:border-[#ef4444] transition-all appearance-none cursor-pointer min-w-[200px] shadow-sm"
              >
                <option value="All">All Barangays ({idIssuances.length})</option>
                {sortedAvailableBarangays.map(brgy => (
                  <option key={brgy} value={brgy}>{brgy} ({barangayCounts[brgy]})</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {(searchTerm || statusFilter !== 'All' || requestTypeFilter !== 'All' || barangayFilter !== 'All' || startDate || endDate) && (
              <button 
                onClick={resetFilters}
                className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-[#ef4444] transition-colors text-[10px] font-black uppercase tracking-widest bg-slate-50 rounded-xl"
              >
                <X className="w-4 h-4" />
                Remove All Filters
              </button>
            )}
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-1.5 shadow-sm">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Start</span>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-xs font-semibold text-slate-900 outline-none bg-transparent"
                />
              </div>
              <div className="w-px h-8 bg-slate-100 mx-2" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">End</span>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-xs font-semibold text-slate-900 outline-none bg-transparent"
                />
              </div>
            </div>
            <button className="flex items-center gap-2 px-6 py-2.5 bg-[#ef4444] text-white rounded-xl font-semibold text-sm hover:bg-red-600 transition-all shadow-sm">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
              {['New ID', 'Renewal', 'Replacement'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setWalkInTab(tab as any)}
                  className={cn(
                    "px-6 py-2 rounded-lg text-xs font-semibold transition-all",
                    walkInTab === tab 
                      ? "bg-white text-[#ef4444] shadow-sm" 
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {walkInTab === 'New ID' && (
              <button 
                onClick={() => handleProceedWithId(null)}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#ef4444] text-white rounded-xl font-semibold text-sm hover:bg-red-600 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Manual Entry
              </button>
            )}

            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder={`Search by Fullname or SCID in ${walkInTab}...`}
                value={masterlistSearch}
                onChange={(e) => setMasterlistSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-1 focus:ring-[#ef4444] focus:border-[#ef4444] transition-all shadow-sm"
              />
            </div>
          </div>
        )}
      </header>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-slate-100">
          <Loader2 className="w-10 h-10 text-rose-500 animate-spin mb-4" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading records...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-slate-100">
          <AlertCircle className="w-10 h-10 text-rose-500 mb-4" />
          <p className="text-slate-600 font-bold">{error}</p>
          <button 
            onClick={type === 'Management' ? fetchIdIssuances : fetchMasterlist}
            className="mt-4 text-rose-500 font-black text-[10px] uppercase tracking-widest hover:underline"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="overflow-x-auto rounded-[2.5rem]">
            {type === 'Management' ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-8 py-4 text-xs font-semibold text-slate-500 tracking-wider">SCID Number</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider">Full Name</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider text-center">Birthdate</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider text-center">Barangay</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider text-center">Applied Date</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider text-center">Type</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider text-center">Modality</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider text-center">Status</th>
                    <th className="px-8 py-4 text-xs font-semibold text-slate-500 tracking-wider text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {displayData.length > 0 ? (
                    displayData.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-4">
                          <p className="text-xs font-bold text-[#ef4444] font-mono tracking-wider uppercase">
                            {item.scid_number || '---'}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center grayscale opacity-70">
                              <User className="w-4 h-4 text-slate-500" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {item.full_name}
                              </p>
                              <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">ID Ref: {item.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-xs font-medium text-slate-600">{formatDate(item.birth_date)}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-xs font-semibold text-slate-700">{item.barangay}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-xs font-medium text-slate-500">{formatDate(item.application_date)}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase tracking-wide">
                            {item.request_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-xs font-medium text-slate-600">{item.modality}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className={cn(
                              "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                              item.status?.issuance_status === 'approved' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                              item.status?.issuance_status === 'pending' ? "bg-amber-50 text-amber-600 border-amber-100" : 
                              (item.status?.issuance_status === 'rejected' || item.status?.issuance_status === 'disapproved') ? "bg-rose-50 text-rose-600 border-rose-100" :
                              item.status?.issuance_status === 'released' ? "bg-indigo-50 text-indigo-600 border-indigo-100" : 
                              item.status?.issuance_status === 'printed' ? "bg-blue-50 text-blue-600 border-blue-100" :
                              item.status?.issuance_status === 'issued' ? "bg-indigo-50 text-indigo-600 border-indigo-100" : "bg-slate-50 text-slate-600 border-slate-100"
                            )}>
                              {item.status?.issuance_status || 'pending'}
                            </span>
                            
                            {['approved', 'disapproved'].includes(item.status?.issuance_status?.toLowerCase()) && item.date_reviewed && (
                              <p className="text-[10px] font-semibold text-slate-400 mt-1">
                                Reviewed: {new Date(item.date_reviewed).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                              </p>
                            )}

                            {item.status?.issuance_status?.toLowerCase() === 'released' && item.released_date && (
                              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                <span>RELEASED:</span>
                                <span>{new Date(item.released_date).toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' }).toUpperCase()}</span>
                              </div>
                            )}

                            {item.status?.issuance_status?.toLowerCase() === 'disapproved' && (
                              <button 
                                onClick={() => handleOpenReasonModal(item.remarks)}
                                className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline text-left font-sans"
                              >
                                VIEW REASON
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-4 text-center">
                          <div className="flex items-center justify-center relative">
                            <div className="relative">
                              <button 
                                onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)}
                                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              <AnimatePresence>
                                {activeMenuId === item.id && (
                                  <>
                                    <div 
                                      className="fixed inset-0 z-[60]" 
                                      onClick={() => setActiveMenuId(null)}
                                    />
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0.95, x: 10 }}
                                      animate={{ opacity: 1, scale: 1, x: 0 }}
                                      exit={{ opacity: 0, scale: 0.95, x: 10 }}
                                      className="absolute right-12 top-1/2 -translate-y-1/2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/50 z-[70] overflow-hidden origin-right"
                                    >
                                      <div className="p-2 space-y-1">
                                        <button
                                          onClick={() => handleViewDetails(item)}
                                          className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-all"
                                        >
                                          <Eye className="w-4 h-4 text-slate-400" />
                                          View Details
                                        </button>
                                        <button
                                          onClick={() => handleOpenStatusModal(item)}
                                          className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-all"
                                        >
                                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                          Change Status
                                        </button>

                                        {item.status?.issuance_status?.toLowerCase() === 'pending' && (
                                          <button
                                            onClick={() => handleOpenEditModal(item)}
                                            className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-[#ef4444] hover:bg-red-50 hover:text-red-700 rounded-lg transition-all"
                                          >
                                            <PenTool className="w-4 h-4" />
                                            Edit Profile
                                          </button>
                                        )}
                                        
                                        {['approved', 'released', 'printed'].includes(item.status?.issuance_status?.toLowerCase()) && (
                                          <button
                                            onClick={() => handlePreviewId(item)}
                                            className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50 rounded-lg transition-all"
                                          >
                                            <IdCard className="w-4 h-4 text-slate-400" />
                                            Preview ID
                                          </button>
                                        )}

                                        {item.request_type === 'New ID' && (item.status?.issuance_status?.toLowerCase() === 'approved' || item.status?.issuance_status?.toLowerCase() === 'released') && (
                                          <button
                                            onClick={() => handleOpenFormModal(item)}
                                            className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50 rounded-lg transition-all"
                                          >
                                            <FileText className="w-4 h-4 text-orange-400" />
                                            View form
                                          </button>
                                        )}
                                      </div>
                                    </motion.div>
                                  </>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <Search className="w-8 h-8 text-slate-200" />
                          </div>
                          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No records found</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-8 py-4 text-xs font-semibold text-slate-500 tracking-wider">SCID Number</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider">Full Name</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider text-center">Birthdate</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider text-center">Barangay</th>
                    {walkInTab === 'Renewal' ? (
                      <>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider text-center">Released</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider text-center">Expiration</th>
                      </>
                    ) : (
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider">Address</th>
                    )}
                    <th className="px-8 py-4 text-xs font-semibold text-slate-500 tracking-wider text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredMasterlist.length > 0 ? (
                    filteredMasterlist.map((item) => (
                      <tr key={item.citizen_id || item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-4">
                          <span className="text-xs font-bold text-[#ef4444] font-mono tracking-wider">
                            {item.scid_number || '---'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center grayscale opacity-70">
                              <User className="w-4 h-4 text-slate-500" />
                            </div>
                            <p className="text-sm font-semibold text-slate-900">
                              {walkInTab === 'Renewal' ? item.full_name : `${item.last_name}, ${item.first_name} ${item.middle_name || ''}`}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-xs font-medium text-slate-600">
                            {formatDate(walkInTab === 'Renewal' ? (item.birth_date || item.user_details?.birth_date) : item.birth_date)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-xs font-semibold text-slate-700">
                            {walkInTab === 'Renewal' ? (item.barangay || item.user_details?.barangay || '---') : (item.barangay || '---')}
                          </span>
                        </td>
                        {walkInTab === 'Renewal' ? (
                          <>
                            <td className="px-6 py-4 text-center">
                              <span className="text-xs font-medium text-slate-600">
                                {item.dates?.released ? new Date(item.dates.released).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '-'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-xs font-medium text-slate-600">
                                {item.dates?.expiration ? new Date(item.dates.expiration).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '-'}
                              </span>
                            </td>
                          </>
                        ) : (
                          <td className="px-6 py-4">
                            <p className="text-xs font-medium text-slate-400 truncate max-w-[200px]">
                              {item.address || '---'}
                            </p>
                          </td>
                        )}
                        <td className="px-8 py-4 text-center">
                          <button 
                            onClick={() => handleProceedWithId(item)}
                            className="px-6 py-2 bg-[#ef4444] text-white rounded-lg font-semibold text-xs hover:bg-red-600 transition-all shadow-sm"
                          >
                            Proceed
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={walkInTab === 'Renewal' ? 7 : (walkInTab === 'Replacement' ? 6 : 5)} className="px-8 py-24 text-center">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <Search className="w-8 h-8 text-slate-200" />
                          </div>
                          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                            No masterlist records found
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      <IdViewModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        record={selectedRecord}
      />

      {/* Status Transition Modal */}
      <AnimatePresence>
        {isStatusModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSubmitting && setIsStatusModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase">Change Status</h2>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">ID-{statusRecord?.id}</p>
                  </div>
                </div>
                <button 
                  disabled={isSubmitting}
                  onClick={() => setIsStatusModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Current Status</label>
                  <div className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 text-sm font-bold text-slate-600 uppercase">
                    {statusRecord?.status?.issuance_status || 'pending'}
                  </div>
                  {['approved', 'disapproved'].includes(statusRecord?.status?.issuance_status?.toLowerCase()) && statusRecord?.date_reviewed && (
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 ml-1">
                      REVIEWED ON: {new Date(statusRecord.date_reviewed).toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' }).toUpperCase()}
                    </p>
                  )}
                  {statusRecord?.status?.issuance_status?.toLowerCase() === 'released' && statusRecord?.released_date && (
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 ml-1">
                      RELEASED ON: {new Date(statusRecord.released_date).toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' }).toUpperCase()}
                    </p>
                  )}
                  {statusRecord?.status?.issuance_status?.toLowerCase() === 'disapproved' && statusRecord?.remarks && (
                    <div className="mt-2 p-3 bg-rose-50 rounded-xl border border-rose-100 text-[10px] font-medium text-rose-600 italic">
                      Remarks: {statusRecord.remarks}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">New Status</label>
                  <div className="relative">
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all appearance-none cursor-pointer"
                    >
                      <option value="" disabled>Select next status...</option>
                      {getAllowedStatuses(statusRecord?.status?.issuance_status).map(status => (
                        <option key={status} value={status} className="uppercase">
                          {status === 'pending' ? 'Move to Pending' : status}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {newStatus === 'disapproved' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-2"
                  >
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Disapproval Remarks <span className="text-rose-500">*</span></label>
                    <textarea
                      value={rejectionRemarks}
                      onChange={(e) => setRejectionRemarks(e.target.value)}
                      placeholder="Enter reason for disapproval..."
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all min-h-[100px] resize-none"
                    />
                  </motion.div>
                )}

                {newStatus === 'released' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-2"
                  >
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Released Date</label>
                    <div className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 text-sm font-bold text-slate-600">
                      {new Date().toISOString().split('T')[0]}
                    </div>
                  </motion.div>
                )}

                {newStatus === 'released' && (
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <div className="flex gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-xs font-black text-emerald-900 uppercase">Auto-generation Active</p>
                        <p className="text-[10px] font-bold text-emerald-600/80 leading-relaxed">System will automatically set the release date to today and expiration date to 3 years from now.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-3">
                <button
                  disabled={isSubmitting}
                  onClick={() => setIsStatusModalOpen(false)}
                  className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  disabled={isSubmitting || !newStatus || (newStatus === 'disapproved' && !rejectionRemarks.trim())}
                  onClick={handleUpdateStatus}
                  className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
                  Confirm Update
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <WalkInIdIssuanceModal 
        isOpen={isWalkInModalOpen}
        onClose={() => setIsWalkInModalOpen(false)}
        citizen={selectedCitizen}
        initialTab={walkInTab}
        onSuccess={() => {
          if (type === 'Management') fetchIdIssuances();
          else fetchMasterlist();
        }}
      />

      <ReasonForDisapprovalModal 
        isOpen={isReasonModalOpen}
        onClose={() => setIsReasonModalOpen(false)}
        reason={selectedReason}
      />

      <IdPreviewModal 
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        record={previewRecord}
      />

      <IdEditProfileModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        record={editRecord}
        onSuccess={() => {
          setIsEditModalOpen(false);
          fetchIdIssuances();
        }}
      />

      <OscaApplicationForm 
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        record={selectedFormRecord}
      />
    </div>
  );
}

const IdEditProfileModal = ({ 
  isOpen, 
  onClose, 
  record, 
  onSuccess 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  record: any; 
  onSuccess: () => void;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emergencyContact, setEmergencyContact] = useState({ person: '', number: '' });
  const [attachments, setAttachments] = useState({
    req1_url: '',
    req2_url: '',
    photo_url: '',
    signature_url: ''
  });

  const [activeTab, setActiveTab] = useState<'Emergency' | 'Attachments' | 'Photo' | 'Signature'>('Emergency');
  
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signatureRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (record) {
      setEmergencyContact({
        person: record.emergency_contact_person || record.emergency_contact?.person || '',
        number: record.emergency_contact_number || record.emergency_contact?.number || ''
      });
      setAttachments({
        req1_url: record.req1_url || record.files?.req1_url || '',
        req2_url: record.req2_url || record.files?.req2_url || '',
        photo_url: record.photo_url || record.files?.photo_url || '',
        signature_url: record.signature_url || record.files?.signature_url || ''
      });
    }
  }, [record]);

  const base64ToFile = (base64: string, filename: string) => {
    if (!base64 || !base64.startsWith('data:')) return null;
    const arr = base64.split(',');
    const match = arr[0].match(/:(.*?);/);
    if (!match) return null;
    const mime = match[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, key: keyof typeof attachments) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachments(prev => ({ ...prev, [key]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access failed:", err);
      alert("Could not access camera.");
      setIsCapturing(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setAttachments(prev => ({ ...prev, photo_url: dataUrl }));
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !signatureRef.current) return;
    const canvas = signatureRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0F172A';
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (signatureRef.current) {
      const ctx = signatureRef.current.getContext('2d');
      ctx?.beginPath();
      const dataUrl = signatureRef.current.toDataURL();
      setAttachments(prev => ({ ...prev, signature_url: dataUrl }));
    }
  };

  const clearSignature = () => {
    if (signatureRef.current) {
      const canvas = signatureRef.current;
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      setAttachments(prev => ({ ...prev, signature_url: '' }));
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const fd = new FormData();
      fd.append("_method", "PATCH");
      fd.append("emergency_contact_person", emergencyContact.person);
      fd.append("emergency_contact_number", emergencyContact.number);

      if (attachments.photo_url.startsWith('data:')) {
        const photoFile = base64ToFile(attachments.photo_url, "photo.jpg");
        if (photoFile) fd.append("photo", photoFile);
      }
      if (attachments.signature_url.startsWith('data:')) {
        const signatureFile = base64ToFile(attachments.signature_url, "signature.png");
        if (signatureFile) fd.append("signature", signatureFile);
      }
      if (attachments.req1_url.startsWith('data:')) {
        const req1File = base64ToFile(attachments.req1_url, "req1.jpg");
        if (req1File) fd.append("req1", req1File);
      }
      if (attachments.req2_url.startsWith('data:')) {
        const req2File = base64ToFile(attachments.req2_url, "req2.jpg");
        if (req2File) fd.append("req2", req2File);
      }

      const response = await fetch(`https://api-dbosca.phoenix.com.ph/api/id-issuances/${record.id}`, {
        method: "POST", 
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        },
        body: fd
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Update failed");
      }

      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to update profile.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !record) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto pt-20 pb-20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col"
        >
          <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
            <div>
              <h3 className="text-xl font-black text-[#0F172A] uppercase tracking-tight flex items-center gap-3">
                <Shield className="w-6 h-6 text-blue-500" />
                Edit Profile
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Editing {record.full_name}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-all"><X className="w-6 h-6 text-slate-400" /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none">
              {[
                { id: 'Emergency', label: 'Emergency', icon: Phone },
                { id: 'Attachments', label: 'Attachments', icon: FileText },
                { id: 'Photo', label: 'Photo', icon: Camera },
                { id: 'Signature', label: 'Signature', icon: PenTool }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                    activeTab === tab.id ? "bg-blue-500 text-white shadow-lg shadow-blue-200" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-xs font-bold">{error}</p>
              </div>
            )}

            {activeTab === 'Emergency' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Emergency Contact Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text"
                      value={emergencyContact.person}
                      onChange={(e) => setEmergencyContact(prev => ({ ...prev, person: e.target.value }))}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:border-blue-500 transition-all uppercase"
                      placeholder="Full Name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Emergency Contact Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text"
                      value={emergencyContact.number}
                      onChange={(e) => setEmergencyContact(prev => ({ ...prev, number: e.target.value }))}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:border-blue-500 transition-all font-mono"
                      placeholder="Contact Number"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Attachments' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Requirement 1</p>
                    <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-6 hover:border-blue-500 transition-all text-center">
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileUpload(e, 'req1_url')} className="absolute inset-0 opacity-0 cursor-pointer" />
                      {attachments.req1_url ? (
                        <div className="space-y-2">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                          <p className="text-[10px] font-black text-slate-600">FILE READY</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="w-8 h-8 text-slate-300 mx-auto" />
                          <p className="text-[10px] font-black text-slate-400">UPLOAD DOC</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Requirement 2</p>
                    <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-6 hover:border-blue-500 transition-all text-center">
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileUpload(e, 'req2_url')} className="absolute inset-0 opacity-0 cursor-pointer" />
                      {attachments.req2_url ? (
                        <div className="space-y-2">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                          <p className="text-[10px] font-black text-slate-600">FILE READY</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="w-8 h-8 text-slate-300 mx-auto" />
                          <p className="text-[10px] font-black text-slate-400">UPLOAD DOC</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Photo' && (
              <div className="space-y-6 text-center">
                <div className="w-full aspect-square max-w-[280px] mx-auto bg-slate-50 rounded-[2.5rem] border border-slate-100 overflow-hidden relative flex items-center justify-center group shadow-sm bg-slate-100">
                  {isCapturing ? (
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                  ) : attachments.photo_url ? (
                    <img src={attachments.photo_url} alt="Captured" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-20 h-20 text-slate-200" />
                  )}
                  <canvas ref={canvasRef} className="hidden" />
                </div>
                
                <div className="flex flex-wrap justify-center gap-3">
                  {isCapturing ? (
                    <button onClick={capturePhoto} className="flex items-center gap-2 px-6 py-3 bg-rose-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-200">
                      <Camera className="w-4 h-4" /> Snap
                    </button>
                  ) : (
                    <button onClick={startCamera} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest">
                      <Camera className="w-4 h-4" /> Start Camera
                    </button>
                  )}
                  <button className="relative flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest">
                    <Upload className="w-4 h-4" /> Upload
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileUpload(e, 'photo_url')} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'Signature' && (
              <div className="space-y-6">
                <div className="w-full h-48 bg-white rounded-[2rem] border-2 border-dashed border-slate-200 overflow-hidden relative group">
                  <canvas 
                    ref={signatureRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-full cursor-crosshair touch-none"
                    width={500}
                    height={200}
                  />
                  {!attachments.signature_url && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                      <p className="text-[10px] font-black uppercase tracking-[0.5em]">Sign Here</p>
                    </div>
                  )}
                </div>
                <div className="flex justify-center gap-4">
                  <button onClick={clearSignature} className="flex items-center gap-2 px-6 py-3 bg-slate-50 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-colors">
                    <RotateCcw className="w-4 h-4" /> Clear
                  </button>
                  <button className="relative flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest">
                    <Upload className="w-4 h-4" /> Upload
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileUpload(e, 'signature_url')} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="p-8 border-t border-slate-100 flex justify-end gap-3 shrink-0 bg-slate-50/30">
             <button onClick={onClose} className="px-6 py-3 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all">Cancel</button>
             <button 
               onClick={handleSubmit} 
               disabled={isLoading}
               className="px-10 py-3 bg-[#0F172A] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2"
             >
               {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
               Save Profile Changes
             </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
