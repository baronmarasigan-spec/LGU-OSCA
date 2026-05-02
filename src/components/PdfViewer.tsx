import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { 
  ZoomIn, 
  ZoomOut, 
  Download,
  Loader2,
  AlertCircle,
  FileText
} from 'lucide-react';

// Set up the worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

interface PdfViewerProps {
  url: string;
  filename?: string;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ url, filename }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [scale, setScale] = useState(1.0);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [url, numPages]);

  useEffect(() => {
    if (containerRef.current) {
      observerRef.current = new ResizeObserver((entries) => {
        if (entries[0]) {
          // Subtract padding (p-6 = 24px * 2 = 48px)
          setContainerWidth(entries[0].contentRect.width - 48);
        }
      });
      observerRef.current.observe(containerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  if (!url) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-4 text-rose-500 bg-slate-100 rounded-xl border border-slate-200">
        <AlertCircle className="w-8 h-8" />
        <span className="text-[10px] font-black uppercase tracking-widest">No PDF URL provided</span>
      </div>
    );
  }

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    // Force scroll to top again after load
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }

  const zoomIn = () => setScale(prev => Math.min(prev + 0.1, 3.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5));
  const resetZoom = () => setScale(1.0);

  return (
    <div className="flex flex-col w-full h-full min-h-[600px] bg-slate-100 rounded-xl overflow-hidden shadow-inner border border-slate-200" ref={containerRef}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
            <FileText className="w-4 h-4 text-indigo-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
              {numPages ? `${numPages} Pages` : 'Loading...'}
            </span>
          </div>
          {filename && (
            <span className="text-[10px] font-bold text-slate-400 truncate max-w-[200px] hidden md:block">
              {filename}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={zoomOut}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors group"
            title="Zoom Out"
          >
            <ZoomOut className="w-5 h-5 text-slate-500 group-hover:text-slate-700" />
          </button>
          <button
            onClick={resetZoom}
            className="px-3 py-1.5 hover:bg-slate-100 rounded-lg text-[10px] font-black text-slate-600 transition-colors border border-transparent hover:border-slate-200"
            title="Reset Zoom"
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            onClick={zoomIn}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors group"
            title="Zoom In"
          >
            <ZoomIn className="w-5 h-5 text-slate-500 group-hover:text-slate-700" />
          </button>
          <div className="w-px h-5 bg-slate-200 mx-2" />
          <a
            href={url}
            download={filename || 'document.pdf'}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors group"
            title="Download PDF"
          >
            <Download className="w-5 h-5 text-slate-500 group-hover:text-slate-700" />
          </a>
        </div>
      </div>

      {/* PDF Scrollable Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 bg-slate-200/50 no-scrollbar"
      >
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 animate-pulse">Initializing Viewer...</span>
            </div>
          }
          error={
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-rose-500">
              <AlertCircle className="w-10 h-10" />
              <span className="text-[10px] font-black uppercase tracking-widest">Failed to load document</span>
              <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-6 py-3 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all border border-rose-100"
              >
                Open in new tab
              </a>
            </div>
          }
          className="flex flex-col items-center gap-8"
        >
          {Array.from(new Array(numPages), (el, index) => (
            <div 
              key={`page_${index + 1}`} 
              className="shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-sm overflow-hidden bg-white transition-transform duration-300"
            >
              <Page
                pageNumber={index + 1}
                scale={scale}
                width={containerWidth > 0 ? containerWidth : undefined}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                loading={
                  <div 
                    style={{ width: containerWidth, height: containerWidth * 1.41 }} 
                    className="bg-white/50 animate-pulse rounded-sm flex items-center justify-center"
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Page {index + 1}</span>
                  </div>
                }
              />
            </div>
          ))}
        </Document>
      </div>
    </div>
  );
};

export default PdfViewer;
