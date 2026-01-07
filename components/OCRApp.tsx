import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, Loader2, Sparkles, Languages, Settings2, Download, Copy, Share2, Volume2, Info, Save, Check, ZoomIn, ZoomOut, Move, Camera, MonitorOff, SwitchCamera } from 'lucide-react';
import { OCRSettings, OCRResult, PSM } from '../types';
import { runOCR } from '../services/tesseractService';
import { preprocessImage } from '../services/imageService';
import ResultsView from './ResultsView';

interface Props {
  settings: OCRSettings;
  setSettings: React.Dispatch<React.SetStateAction<OCRSettings>>;
  onResult: (result: OCRResult) => void;
  onSaveSettings: () => void;
}

// Sub-component for Zoom/Pan Image
const ImageViewer: React.FC<{ src: string; label: string }> = ({ src, label }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    const newScale = Math.min(Math.max(0.5, scale + delta), 4);
    setScale(newScale);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="space-y-2 flex flex-col h-full">
      <div className="flex items-center justify-between">
         <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{label}</label>
         <div className="flex gap-1">
            <button onClick={() => setScale(s => Math.min(s + 0.2, 4))} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded"><ZoomIn size={14}/></button>
            <button onClick={() => { setScale(1); setPosition({x:0,y:0}) }} className="text-[10px] px-2 py-0.5 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-800">Reset</button>
            <button onClick={() => setScale(s => Math.max(s - 0.2, 0.5))} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded"><ZoomOut size={14}/></button>
         </div>
      </div>
      <div 
        className="relative overflow-hidden bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 h-[300px] cursor-move"
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
         <div 
           className="w-full h-full flex items-center justify-center transition-transform duration-75 ease-out"
           style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${scale})` }}
         >
           <img src={src} alt={label} className="max-w-full max-h-full object-contain select-none pointer-events-none" />
         </div>
      </div>
    </div>
  );
};

const OCRApp: React.FC<Props> = ({ settings, setSettings, onResult, onSaveSettings }) => {
  const [file, setFile] = useState<File | null>(null);
  const [previews, setPreviews] = useState<{ original: string; processed: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OCRResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [currentCameraId, setCurrentCameraId] = useState<string>('');
  const [isFlashing, setIsFlashing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async (deviceId?: string) => {
    setError(null);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    try {
      let stream: MediaStream;

      // Fallback strategy for camera selection
      try {
        // Attempt 1: High Quality + Preferred Config
        const constraints: MediaStreamConstraints = { 
          video: deviceId 
            ? { deviceId: { exact: deviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } }
            : { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } 
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        console.warn("Primary camera constraints failed, trying fallback...", err);
        // Attempt 2: Basic Config (Any Resolution)
        const fallbackConstraints: MediaStreamConstraints = {
           video: deviceId 
            ? { deviceId: { exact: deviceId } } 
            : true // Just get any video if environment/preferred failed
        };
        stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
      }

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowCamera(true);
      }

      // Enumerate devices after permission is granted
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      setCameras(videoDevices);
      
      // Determine which device is actually active
      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      
      let activeDeviceId = deviceId;
      
      // 1. Try from constraints or settings
      if (!activeDeviceId && settings.deviceId) {
        activeDeviceId = settings.deviceId;
      }
      
      // 2. Try matching label if deviceId is masked
      if (!activeDeviceId && videoDevices.length > 0) {
        const labelMatch = videoDevices.find(d => d.label === videoTrack.label);
        if (labelMatch) activeDeviceId = labelMatch.deviceId;
      }
      
      // 3. Fallback to first enumerated device
      if (!activeDeviceId && videoDevices.length > 0) {
        activeDeviceId = videoDevices[0].deviceId;
      }

      if (activeDeviceId) {
        setCurrentCameraId(activeDeviceId);
      }

    } catch (e: any) {
      console.error("Camera Error:", e);
      let msg = "Unable to access camera.";
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        msg = "Camera permission denied. Please check your browser settings.";
      } else if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError') {
        msg = "No camera device found on your system.";
      } else if (e.name === 'NotReadableError' || e.name === 'TrackStartError') {
        msg = "Camera is currently in use by another application.";
      } else if (e.name === 'OverconstrainedError') {
        msg = "Camera does not support the requested resolution.";
      }
      setError(msg);
      setShowCamera(false);
    }
  };

  const switchCamera = () => {
    if (cameras.length < 2) return;
    const currentIndex = cameras.findIndex(c => c.deviceId === currentCameraId);
    // If not found, default to 0, otherwise next
    const startIdx = currentIndex === -1 ? 0 : currentIndex;
    const nextIndex = (startIdx + 1) % cameras.length;
    const nextDevice = cameras[nextIndex];
    
    // Optimistic update
    setCurrentCameraId(nextDevice.deviceId);
    startCamera(nextDevice.deviceId);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const captureImage = () => {
    if (!videoRef.current) return;
    
    // Flash effect
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 150);

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const f = new File([blob], "scanned-document.jpg", { type: "image/jpeg" });
          setTimeout(() => {
            stopCamera();
            handleFile(f);
          }, 200); // Slight delay to let flash animation finish
        }
      }, 'image/jpeg', 0.95);
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const handleFile = async (f: File) => {
    // Validate type first
    if (!f.type.startsWith('image/') && f.type !== 'application/pdf') {
      setError(`Invalid file type: ${f.type}. Please upload an Image or PDF.`);
      return;
    }
    
    setError(null);
    setFile(f);
    setResult(null);
    setPreviews(null);
    
    try {
      const p = await preprocessImage(f, settings.preprocessing);
      setPreviews(p);
    } catch (e: any) {
      setError(e.toString());
      setFile(null);
    }
  };

  const processOCR = async () => {
    if (!previews) return;
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const ocrData = await runOCR(previews.processed, settings, (p) => setProgress(p));
      
      const finalResult: OCRResult = {
        ...ocrData as OCRResult,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        fileName: file?.name || 'capture.png',
        previewUrl: previews.original,
      };

      setResult(finalResult);
      onResult(finalResult);
    } catch (e: any) {
      let msg = "Processing failed.";
      if (e?.message?.includes('Network')) msg = "Network error: Failed to load Tesseract engine components. Check your connection.";
      else if (e?.message) msg = `Engine Error: ${e.message}`;
      setError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveSettings = () => {
    onSaveSettings();
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {showCamera ? (
        <div className="relative bg-black rounded-3xl overflow-hidden aspect-video flex items-center justify-center shadow-2xl">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          
          {/* Scanning Overlay */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full border-[50px] border-black/30"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 border-2 border-white/50 rounded-lg">
               {/* Corners */}
               <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-cyan-400 rounded-tl-lg"></div>
               <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-cyan-400 rounded-tr-lg"></div>
               <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-cyan-400 rounded-bl-lg"></div>
               <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-cyan-400 rounded-br-lg"></div>
               {/* Scan Line */}
               <div className="absolute top-0 left-0 w-full h-1 bg-cyan-400/80 shadow-[0_0_15px_rgba(34,211,238,0.8)] animate-[scan_2.5s_infinite_linear]"></div>
            </div>
            <div className="absolute top-8 left-0 w-full text-center">
               <span className="bg-black/50 text-white text-sm px-4 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                 Align document within the frame
               </span>
            </div>
          </div>

          {/* Flash Effect */}
          <div className={`absolute inset-0 bg-white pointer-events-none transition-opacity duration-150 ${isFlashing ? 'opacity-100' : 'opacity-0'}`} />

          {/* Controls */}
          <div className="absolute bottom-6 left-0 w-full flex items-center justify-center gap-8 pointer-events-auto">
             <button 
               onClick={stopCamera} 
               className="p-4 rounded-full bg-slate-800/80 text-white hover:bg-slate-900 backdrop-blur transition-all"
             >
               <X size={24} />
             </button>
             
             <button 
               onClick={captureImage} 
               className="w-20 h-20 rounded-full border-4 border-white bg-white/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
             >
               <div className="w-16 h-16 bg-white rounded-full"></div>
             </button>
             
             {cameras.length > 1 ? (
               <button 
                 onClick={switchCamera} 
                 className="p-4 rounded-full bg-slate-800/80 text-white hover:bg-slate-900 backdrop-blur transition-all"
               >
                 <SwitchCamera size={24} />
               </button>
             ) : (
               <div className="w-[56px]" /> /* Spacer to balance layout */
             )}
          </div>
          
          <style>{`
            @keyframes scan {
              0% { top: 0%; opacity: 0; }
              10% { opacity: 1; }
              90% { opacity: 1; }
              100% { top: 100%; opacity: 0; }
            }
          `}</style>
        </div>
      ) : (
        /* File Dropzone */
        !previews && !isProcessing ? (
          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            className={`relative group border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center transition-all ${
              isDragging 
                ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-900/10 scale-[0.99]' 
                : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="w-20 h-20 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110">
              <Upload size={40} />
            </div>
            <h3 className="text-xl font-semibold mb-2">Drop your document here</h3>
            <p className="text-slate-500 dark:text-slate-400 text-center max-w-sm mb-8">
              Support JPG, PNG, WEBP, and PDF. Your files are processed 100% locally.
            </p>
            
            <div className="flex gap-4 w-full max-w-sm">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-3 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                Upload File
              </button>
              <button 
                onClick={() => startCamera()}
                className="py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <Camera size={20} />
                <span className="hidden sm:inline">Camera</span>
              </button>
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*,.pdf" 
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} 
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Main Content Area */}
            <div className="lg:col-span-8 space-y-6">
              {previews && !result && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <span className="text-sm font-medium">Preview Ready</span>
                    </div>
                    <button 
                      onClick={() => { setPreviews(null); setFile(null); }}
                      className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 h-[350px]">
                    <ImageViewer src={previews.original} label="Original Source" />
                    <ImageViewer src={previews.processed} label="OCR Preprocessed" />
                  </div>

                  <div className="p-6 bg-slate-50 dark:bg-slate-950/50 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-4">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-500">File Details</p>
                        <p className="text-sm font-semibold truncate max-w-[200px]">{file?.name}</p>
                      </div>
                    </div>

                    {isProcessing ? (
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="flex-1 sm:w-48 bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-cyan-500 transition-all duration-300" 
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-sm font-mono font-bold w-12">{progress}%</span>
                      </div>
                    ) : (
                      <button 
                        onClick={processOCR}
                        className="w-full sm:w-auto px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
                      >
                        <Sparkles size={20} />
                        Start OCR Engine
                      </button>
                    )}
                  </div>
                </div>
              )}

              {result && (
                <ResultsView result={result} />
              )}

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl border border-red-100 dark:border-red-900/50 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                  <MonitorOff size={20} className="mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold">Operation Failed</p>
                    <p className="text-sm font-medium opacity-90">{error}</p>
                  </div>
                  <button onClick={() => setError(null)} className="ml-auto hover:bg-red-100 dark:hover:bg-red-900/40 p-1 rounded-full"><X size={14}/></button>
                </div>
              )}
            </div>

            {/* Settings Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <Settings2 size={20} className="text-cyan-500" />
                  <h3 className="font-bold">OCR Configuration</h3>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Language</label>
                    <div className="relative">
                      <Languages className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <select 
                        value={settings.language}
                        onChange={(e) => setSettings(s => ({ ...s, language: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                      >
                        <option value="eng">English</option>
                        <option value="spa">Spanish</option>
                        <option value="fra">French</option>
                        <option value="deu">German</option>
                        <option value="ita">Italian</option>
                        <option value="jpn">Japanese</option>
                        <option value="kor">Korean</option>
                        <option value="chi_sim">Chinese (Simplified)</option>
                        <option value="ara">Arabic</option>
                        <option value="rus">Russian</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Segmentation (PSM)</label>
                    <select 
                      value={settings.psm}
                      onChange={(e) => setSettings(s => ({ ...s, psm: e.target.value as PSM }))}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                    >
                      <option value={PSM.AUTO}>Automatic (Default)</option>
                      <option value={PSM.SINGLE_BLOCK}>Single Block</option>
                      <option value={PSM.SINGLE_LINE}>Single Line</option>
                      <option value={PSM.SINGLE_WORD}>Single Word</option>
                      <option value={PSM.SPARSE_TEXT}>Sparse Text</option>
                    </select>
                    <p className="text-[10px] text-slate-500">Fine-tune how the engine identifies text blocks.</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Settings2 size={18} className="text-cyan-500" />
                    <h3 className="font-bold">Preprocessing</h3>
                  </div>
                  <button
                    onClick={handleSaveSettings}
                    className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg transition-all ${
                      showSaved 
                        ? 'text-green-600 bg-green-50 dark:bg-green-900/20' 
                        : 'text-slate-400 hover:text-cyan-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                    title="Save current settings as default"
                  >
                    {showSaved ? <Check size={12} /> : <Save size={12} />}
                    {showSaved ? 'Saved' : 'Save Default'}
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">Auto-Grayscale</span>
                    <input 
                      type="checkbox" 
                      checked={settings.preprocessing.grayscale} 
                      onChange={(e) => setSettings(s => ({ ...s, preprocessing: { ...s.preprocessing, grayscale: e.target.checked } }))} 
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">Contrast</span>
                      <span className="text-xs font-mono">{settings.preprocessing.contrast.toFixed(1)}x</span>
                    </div>
                    <input 
                      type="range" min="0.5" max="3" step="0.1"
                      value={settings.preprocessing.contrast}
                      onChange={(e) => setSettings(s => ({ ...s, preprocessing: { ...s.preprocessing, contrast: parseFloat(e.target.value) } }))}
                      className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default OCRApp;