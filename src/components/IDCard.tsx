import React, { useState } from 'react';
import { User } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface IDCardProps {
  record: any;
  zoom?: number;
  viewSide?: 'front' | 'back';
}

export const IDCard = ({ record, zoom = 1, viewSide: controlledViewSide }: IDCardProps) => {
  const [internalViewSide, setInternalViewSide] = useState<'front' | 'back'>('front');
  const viewSide = controlledViewSide || internalViewSide;
  const setViewSide = controlledViewSide ? () => {} : setInternalViewSide;

  if (!record) return null;

  return (
    <div className="flex flex-col items-center gap-6">
      {!controlledViewSide && (
        <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
          <button 
            onClick={() => setInternalViewSide('front')}
            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
              viewSide === 'front' ? "bg-white text-rose-500 shadow-sm" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Front
          </button>
          <button 
            onClick={() => setInternalViewSide('back')}
            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
              viewSide === 'back' ? "bg-white text-rose-500 shadow-sm" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Back
          </button>
        </div>
      )}

      <div 
        style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
        className="transition-transform duration-200"
      >
        {viewSide === 'front' ? (
          /* ID FRONT */
          <div className="w-[450px] h-[280px] bg-white border border-slate-300 rounded-lg overflow-hidden flex flex-col font-sans text-black relative shadow-lg">
            {/* Header */}
            <div className="flex flex-col items-center pt-2 relative">
              <img 
                src="https://res.cloudinary.com/dx20khqe5/image/upload/v1777035946/Seal_of_San_Juan__Metro_Manila_1_k5lmzn.png" 
                className="absolute left-6 top-3 w-11 h-11 object-contain" 
                alt="San Juan Seal"
              />
              <img 
                src="https://res.cloudinary.com/dx20khqe5/image/upload/v1777035949/Group_271_rxyfrp.png" 
                className="absolute right-6 top-1.5 w-16 h-15 object-contain" 
                alt="Secondary Logo"
              />
              <span className="text-[7.5px] font-black tracking-tighter uppercase leading-tight opacity-70">REPUBLIC OF THE PHILIPPINES</span>
              <span className="text-xl font-black uppercase leading-none tracking-tight">City of San Juan</span>
              <span className="text-[7.5px] font-black uppercase leading-tight tracking-tighter opacity-70">OFFICE OF THE SENIOR CITIZEN AFFAIRS (OSCA)</span>
            </div>

            {/* Red Name Bar */}
            <div className="bg-[#ef4444] text-white mt-4 h-11 flex items-center justify-center relative">
                <h3 className="text-[22px] font-black uppercase truncate tracking-tight w-full text-center px-4">
                  {record.full_name || `${record.first_name || ''} ${record.middle_name ? record.middle_name[0] + '.' : ''} ${record.last_name || ''}`}
                </h3>
            </div>
            <div className="text-center mt-0.5">
              <span className="text-[7.5px] font-black uppercase tracking-widest leading-none">NAME</span>
            </div>

            {/* Content Container */}
            <div className="px-4 flex flex-1 flex-col">
                {/* ID No at top right of content area */}
                <div className="flex justify-end pr-1 mt-[-8px]">
                    <p className="text-[8px] font-black tracking-tighter uppercase">ID No.: <span className="border-b-2 border-black inline-block min-w-[100px] text-center ml-1">{record.scid_number || '---'}</span></p>
                </div>

                <div className="flex flex-1 mt-1">
                    <div className="flex-1 flex flex-col justify-between pr-4">
                      {/* Address Section */}
                      <div className="text-center w-full relative mt-1 flex flex-col items-center">
                          <p className="text-[9px] font-bold uppercase truncate leading-tight w-full">
                            {record.user_details?.address || record.address || '---'}
                          </p>
                          <p className="text-[9px] font-bold uppercase truncate leading-tight w-full">
                            {record.barangay ? `BRGY. ${record.barangay}, ` : ''}SAN JUAN CITY
                          </p>
                          <div className="border-t border-black w-full mt-1"></div>
                          <p className="text-[6px] font-black tracking-tighter uppercase mt-0.5">ADDRESS</p>
                      </div>

                      <div className="flex justify-between items-end mb-4 pt-2">
                          <div className="w-[22%] text-center">
                            <div className="text-[8px] font-bold uppercase mb-0.5 h-3 flex items-center justify-center tracking-tighter">
                              {record.user_details?.birth_date || record.birth_date || '---'}
                            </div>
                            <div className="border-t border-black mx-auto w-full"></div>
                            <div className="text-[6px] font-black tracking-tighter uppercase mt-0.5 whitespace-nowrap">DATE OF BIRTH</div>
                          </div>

                          <div className="w-[10%] text-center px-1">
                            <div className="text-[8px] font-bold mb-0.5 h-3 flex items-center justify-center">
                              {record.user_details?.age || record.age || '---'}
                            </div>
                            <div className="border-t border-black mx-auto w-full"></div>
                            <div className="text-[6px] font-black tracking-tighter uppercase mt-0.5">AGE</div>
                          </div>

                          <div className="w-[12%] text-center">
                            <div className="text-[8px] font-bold uppercase mb-0.5 h-3 flex items-center justify-center">
                              {record.user_details?.sex || record.sex || '---'}
                            </div>
                            <div className="border-t border-black mx-auto w-full"></div>
                            <div className="text-[6px] font-black tracking-tighter uppercase mt-0.5">SEX</div>
                          </div>

                          <div className="w-[35%] text-center relative px-2">
                            <div className="h-6 flex items-center justify-center mb-0.5">
                              {record.files?.signature_url || record.signature_url ? (
                                  <img src={record.files?.signature_url || record.signature_url} className="h-6 object-contain" />
                              ) : (
                                  <div className="h-6" />
                              )}
                            </div>
                            <div className="border-t border-black mx-auto w-full"></div>
                            <div className="text-[6px] font-black tracking-tighter uppercase mt-0.5">SIGNATURE</div>
                          </div>
                      </div>

                      <div className="pb-3 pl-2">
                          <p className="text-[10px] font-black leading-none uppercase">Hon. Francis Zamora</p>
                          <p className="text-[6px] font-black tracking-tighter uppercase leading-none opacity-80">CITY MAYOR</p>
                      </div>
                    </div>

                    <div className="w-[110px] flex flex-col items-center justify-center pb-2">
                        <div className="w-[100px] h-[110px] border-[2.5px] border-slate-700/80 rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center shadow-md">
                            {record.files?.photo_url || record.photo_url ? (
                              <img src={record.files?.photo_url || record.photo_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <User className="w-10 h-10 text-slate-200" />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bars */}
            <div className="bg-[#ef4444] text-white py-1.5 text-center mt-auto">
                <p className="text-[11px] font-black uppercase tracking-[0.4em] leading-none">Senior Citizen ID Card</p>
            </div>
          </div>
        ) : (
          /* ID BACK */
          <div className="w-[450px] h-[280px] bg-white border border-slate-300 rounded-lg overflow-hidden flex flex-col font-sans text-black relative shadow-lg">
            <div className="p-4 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[8px] font-black tracking-tighter uppercase whitespace-nowrap">In Case of Emergency Please Notify</span>
                  <div className="flex-1 border-b border-black text-center">
                      <p className="text-[8px] font-black uppercase tracking-tight">{record.emergency_contact_person || record.emergency_contact?.person || '---'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-3 pl-12">
                  <span className="text-[8px] font-black tracking-tighter uppercase whitespace-nowrap">Contact No.</span>
                  <div className="flex-1 border-b border-black text-center">
                      <p className="text-[8px] font-black tracking-wider">{record.emergency_contact_number || record.emergency_contact?.number || '---'}</p>
                  </div>
                </div>

                <div className="border-t border-dashed border-black/40 my-3" />
                
                <h4 className="text-[9px] font-black text-center uppercase tracking-tight mb-3">Benefits and Privileges under Republic Act No. 9994</h4>
                
                <div className="flex gap-4 flex-1">
                  <ul className="text-[7px] font-black uppercase tracking-tighter list-disc pl-4 flex-1 space-y-1">
                      <li>Free medical and dental, diagnostic & laboratory services in all government facilities</li>
                      <li>20% discount in purchase of unbranded generic medicines</li>
                      <li>20% discount in hotels, restaurants, recreation centers, etc.</li>
                      <li>20% discount on theaters, cinema houses and concert halls, etc</li>
                      <li>20% discount on medical and dental diagnostic & laboratory fees in private facilities</li>
                      <li>20% discount in fare for domestic air, sea travel and public land transportation</li>
                  </ul>
                  <div className="w-24 h-24 border border-black rounded flex items-center justify-center p-1 bg-white shrink-0 self-center">
                      {record.scid_number ? (
                          <QRCodeSVG value={record.scid_number} size={80} />
                      ) : (
                          <div className="text-[8px] font-black text-center uppercase opacity-20">QR CODE</div>
                      )}
                  </div>
                </div>
            </div>

            {/* Bottom Bars */}
            <div className="bg-[#ef4444] text-white py-2 text-center">
                <p className="text-xs font-black uppercase tracking-widest leading-none">SAN JUAN CITY</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
