import React, { useState } from 'react';
import { Printer, Download, X, ZoomIn, ZoomOut, Search } from 'lucide-react';

interface OscaApplicationFormProps {
  record: any;
  isOpen: boolean;
  onClose: () => void;
}

export const OscaApplicationForm = ({ record, isOpen, onClose }: OscaApplicationFormProps) => {
  const [zoom, setZoom] = useState(1);

  if (!isOpen || !record) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Standard web way to "Download as PDF" without specialized backend is to trigger print dialog
    // Most browsers have "Save as PDF" as default or available destination
    const originalTitle = document.title;
    document.title = `OSCA_Application_${record.scid_number || record.last_name || 'Form'}`;
    window.print();
    document.title = originalTitle;
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
  const resetZoom = () => setZoom(1);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '_________________';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-6 md:p-10 overflow-hidden print:p-0 print:bg-white print:block">
      <div className="bg-white w-full max-w-[820px] max-h-[95vh] rounded-2xl shadow-2xl relative flex flex-col overflow-hidden print:shadow-none print:w-full print:max-w-none print:min-h-0 print:rounded-none">
        {/* Toolbar */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 p-3.5 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">OSCA Application Form</h3>
            <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full text-xs font-bold uppercase tracking-widest border border-rose-100">
              New ID Template
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-200 mr-1">
              <button 
                onClick={handleZoomOut}
                className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-500"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={resetZoom}
                className="px-2 py-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-900 text-[9px] font-black uppercase tracking-widest min-w-[50px]"
                title="Reset Zoom"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button 
                onClick={handleZoomIn}
                className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-500"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button 
              onClick={handleDownload}
              className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-600 ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-auto bg-slate-500/5 flex justify-center p-8 print:p-0 print:bg-white print:overflow-visible no-scrollbar">
          <div 
            id="printable-form" 
            className="bg-white p-[35px] text-black font-serif leading-none shadow-sm origin-top transition-transform duration-200 print:shadow-none print:transform-none print:p-0 print:m-0 print:w-full"
            style={{ 
              width: '720px',
              minHeight: '1020px',
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
              marginBottom: zoom > 1 ? `${(zoom - 1) * 1020}px` : '0',
            }}
          >
          <div className="flex flex-col items-center text-center">
            {/* Header Logos */}
            <div className="flex items-center justify-center gap-8 mb-3">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/e/e0/Bagong_Pilipinas_logo.png" 
                className="w-16 h-16 object-contain" 
                alt="Bagong Pilipinas"
                referrerPolicy="no-referrer"
              />
              <img 
                src="https://res.cloudinary.com/dx20khqe5/image/upload/v1777035946/Seal_of_San_Juan__Metro_Manila_1_k5lmzn.png" 
                className="w-16 h-16 object-contain" 
                alt="San Juan Seal"
                referrerPolicy="no-referrer"
              />
              <img 
                src="https://res.cloudinary.com/dx20khqe5/image/upload/v1777035949/Group_271_rxyfrp.png" 
                className="w-16 h-16 object-contain" 
                alt="Makabagong San Juan"
                referrerPolicy="no-referrer"
              />
            </div>
            
            <h1 className="text-[12px] font-bold uppercase tracking-tight">REPUBLIC OF THE PHILIPPINES</h1>
            <h2 className="text-lg font-bold uppercase mt-0.5">OFFICE OF THE SENIOR CITIZENS AFFAIRS (OSCA)</h2>
            <p className="text-[12px] font-bold mt-0.5">City of San Juan, Metro Manila</p>
            
            <div className="mt-4 mb-6 py-1.5 border-y border-black/20 w-full">
              <h3 className="text-base font-bold uppercase tracking-tighter italic">APPLICATION FORM FOR NEW SENIOR CITIZEN</h3>
            </div>
          </div>

          <div className="space-y-5 text-[12px]">
            {/* Top Row */}
            <div className="flex justify-between items-end gap-8">
              <div className="flex-1 border-b border-black min-h-[2rem] flex items-end">
                <span className="font-bold pr-1">FMZ-</span>
                <span className="flex-1 pb-0.5 text-left font-mono">________-________</span>
              </div>
              <div className="flex-1 border-b border-black min-h-[2rem] flex items-end">
                <span className="font-bold whitespace-nowrap pr-2">DATE APPLIED: </span>
                <span className="flex-1 pb-0.5 text-center font-bold">{formatDate(record.application_date)}</span>
              </div>
            </div>

            <div className="flex justify-between items-end gap-8">
              <div className="flex-1 border-b border-black min-h-[2rem] flex items-end">
                <span className="font-bold whitespace-nowrap pr-2">OSCA ID NO: </span>
                <span className="flex-1 pb-0.5 text-center font-mono font-bold tracking-tight">{record.scid_number || '____________________'}</span>
              </div>
              <div className="flex-1 border-b border-black min-h-[2rem] flex items-end">
                <span className="font-bold whitespace-nowrap pr-2">SENIOR CONTACT NO.: </span>
                <span className="flex-1 pb-0.5 text-center font-mono">{record.contact_number || '____________________'}</span>
              </div>
            </div>

            {/* Name Row */}
            <div className="flex flex-col gap-1">
               <div className="flex items-end border-b border-black min-h-[2.5rem]">
                  <span className="font-bold pr-2">NAME: </span>
                  <span className="flex-1 pb-0.5 text-center uppercase font-bold text-base">
                    {record.full_name || `${record.last_name || ''}, ${record.first_name || ''} ${record.middle_name || ''}`}
                  </span>
               </div>
               <div className="flex justify-between text-[10px] font-bold text-center italic">
                  <span className="flex-1">(LASTNAME)</span>
                  <span className="flex-1">(FIRSTNAME)</span>
                  <span className="flex-1">(MIDDLENAME)</span>
               </div>
            </div>

            {/* Demographics Row */}
            <div className="flex items-end gap-6 h-auto">
               <div className="w-[10%] border-b border-black pb-0.5 min-h-[2.5rem] flex items-end">
                  <span className="font-bold">SEX: </span>
                  <span className="ml-2 flex-1 text-center uppercase">{record.sex || '_____'}</span>
               </div>
               <div className="flex-1 flex flex-col">
                  <div className="flex items-end border-b border-black min-h-[2.5rem]">
                    <span className="font-bold whitespace-nowrap pr-2">DATE OF BIRTH: </span>
                    <span className="flex-1 text-center pb-0.5 uppercase">{formatDate(record.birth_date)}</span>
                  </div>
                  <span className="text-[10px] font-bold text-center italic mt-1">(MM/DD/YYYY)</span>
               </div>
               <div className="flex-[1.5] flex items-end border-b border-black min-h-[2.5rem]">
                  <span className="font-bold whitespace-nowrap pr-2">PLACE OF BIRTH: </span>
                  <span className="flex-1 text-center pb-0.5 uppercase truncate">{record.birth_place || '____________________'}</span>
               </div>
               <div className="w-[10%] flex items-end border-b border-black min-h-[2.5rem]">
                  <span className="font-bold">AGE: </span>
                  <span className="ml-2 flex-1 text-center">{record.age || '____'}</span>
               </div>
            </div>

            {/* Address Row */}
            <div className="flex items-end gap-10">
               <div className="flex-[3] border-b border-black min-h-[2.5rem] flex items-end">
                  <span className="font-bold pr-2 whitespace-nowrap">ADDRESS: </span>
                  <span className="flex-1 pb-0.5 uppercase text-left">{record.address || '__________________________________________________'}</span>
               </div>
               <div className="flex-1 border-b border-black min-h-[2.5rem] flex items-end">
                  <span className="font-bold pr-2 whitespace-nowrap">CITIZENSHIP: </span>
                  <span className="flex-1 pb-0.5 uppercase text-center">{record.citizenship || '____________________'}</span>
               </div>
            </div>

            {/* Civil Status Row */}
            <div className="flex items-center pt-2">
               <span className="font-bold text-red-500 mr-4">CIVIL STATUS:</span>
               <div className="flex items-center gap-6 font-bold uppercase text-[11px]">
                  <span className="flex items-center gap-1.5 font-serif text-[14px]">({record.civil_status?.toLowerCase() === 'single' ? '✓' : ' '}) SINGLE</span>
                  <span className="flex items-center gap-1.5 font-serif text-[14px]">({record.civil_status?.toLowerCase() === 'married' ? '✓' : ' '}) MARRIED</span>
                  <span className="flex items-center gap-1.5 font-serif text-[14px]">({record.civil_status?.toLowerCase() === 'widow' ? '✓' : ' '}) WIDOW</span>
                  <span className="flex items-center gap-1.5 font-serif text-[14px]">({record.civil_status?.toLowerCase() === 'widower' ? '✓' : ' '}) WIDOWER</span>
                  <span className="flex items-center gap-1.5 font-serif text-[14px]">({record.civil_status?.toLowerCase() === 'separated' || record.civil_status?.toLowerCase() === 'seperated' ? '✓' : ' '}) SEPERATED</span>
               </div>
            </div>

            {/* Emergency Contact */}
            <div className="flex items-end gap-10">
              <div className="flex-[2] border-b border-black min-h-[2.5rem] flex items-end">
                <span className="font-bold pr-2 whitespace-nowrap">CONTACT PERSON INCASE OF EMERGENCY: </span>
                <span className="flex-1 pb-0.5 uppercase text-left">{record.emergency_contact_person || '________________________________'}</span>
              </div>
              <div className="flex-1 border-b border-black min-h-[2.5rem] flex items-end">
                <span className="font-bold pr-2 whitespace-nowrap">CONTACT NO.: </span>
                <span className="flex-1 pb-0.5 text-center">{record.emergency_contact_number || '____________________'}</span>
              </div>
            </div>

            {/* Question */}
            <div className="pt-4 space-y-2">
              <p className="font-bold leading-relaxed">
                ARE YOU WILLING TO BE A MEMBER OF THE FEDERATION OF SENIOR CITIZEN ASSOCIATION IN YOUR BARANGAY?
              </p>
              <div className="flex gap-10">
                <div className="flex items-center gap-2">
                  <span className="font-bold">YES</span>
                  <div className="w-[120px] border-b border-black h-4"></div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">NO</span>
                  <div className="w-[120px] border-b border-black h-4"></div>
                </div>
              </div>
            </div>

            {/* Certification */}
            <div className="pt-6">
              <p className="leading-relaxed font-medium">
                I HEREBY CERTIFY THAT THE FOREGOING FACTS ARE TRUTHFUL STATEMENT OF MY CITIZENSHIP AND AGE.
              </p>
            </div>

            {/* Signatures */}
            <div className="pt-12 grid grid-cols-5 items-end">
               <div className="col-span-2 col-start-3 text-center space-y-2">
                  <div className="h-10 flex items-center justify-center">
                    {record.signature_url && (
                      <img src={record.signature_url} className="h-12 object-contain" alt="Signature" referrerPolicy="no-referrer" />
                    )}
                  </div>
                  <div className="border-t border-black w-full"></div>
                  <p className="text-[11px] font-bold uppercase tracking-tight">APPLICANT SIGNATURE</p>
               </div>
            </div>

            <div className="pt-12 grid grid-cols-5">
              <div className="col-span-2 col-start-3 text-center space-y-8">
                  <p className="text-xs font-bold uppercase tracking-widest">APPROVED BY:</p>
                  
                  <div className="space-y-0.5">
                    <div className="border-b border-black w-full min-w-[200px] mb-1 pb-1">
                      <p className="text-base font-bold uppercase tracking-tighter">JAMES L. CHOA</p>
                    </div>
                    <p className="text-[11px] font-bold uppercase tracking-widest leading-none">OIC-OSCA</p>
                  </div>
              </div>
            </div>

            {/* Requirements */}
            <div className="pt-8 space-y-4">
              <p className="font-black border-b-2 border-black w-fit uppercase tracking-tighter text-sm">LIST OF REQUIREMENTS:</p>
              <ol className="list-decimal pl-5 space-y-4 font-medium uppercase text-[12px] tracking-tighter leading-tight">
                <li>
                  <span className="underline">BIRTH CERTIFICATE</span>, <span className="underline">PHILIPPINE PASSPORT</span>, OR <span className="underline">NATIONAL IDENTIFICATION</span>
                </li>
                <li className="space-y-4">
                  ANY IDENTIFICATION CARD TO SHOW PROOF OF RESIDENCY IN SAN JUAN ARE THE FOLLOWING:
                  <ul className="list-none pt-4 space-y-2 pl-4">
                    <li className="flex items-center gap-3"><span className="text-[10px]">❖</span> VOTERS ID OR VOTER CERTIFICATE</li>
                    <li className="flex items-center gap-3"><span className="text-[10px]">❖</span> DRIVERS LICENCE</li>
                    <li className="flex items-center gap-3"><span className="text-[10px]">❖</span> BARANGAY ID OR BARANGAY CERTIFICATE OF RESIDENCY</li>
                    <li className="flex items-center gap-3"><span className="text-[10px]">❖</span> TIN ID</li>
                    <li className="flex items-center gap-3"><span className="text-[10px]">❖</span> UMID ID</li>
                    <li className="flex items-center gap-3"><span className="text-[10px]">❖</span> PHILHEALTH ID</li>
                  </ul>
                </li>
              </ol>
            </div>

            {/* Warning */}
            <div className="pt-8">
              <p className="text-red-500 font-black text-sm uppercase mb-1">WARNING!</p>
              <p className="text-[11px] font-bold uppercase leading-tight tracking-tight">
                ANY UNTRUTHFUL STATEMENT OF FACTS IN THIS APPLICATION FORM CONSTITUTE FALCIFICATION OF PUBLIC DOCUMENT WHICH IS PUNISHABLE UNDER THE REVISED PENAL CODE.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-form, #printable-form * {
            visibility: visible !important;
          }
          #printable-form {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            transform: none !important;
          }
          @page {
            size: A4;
            margin: 10mm;
          }
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
};
