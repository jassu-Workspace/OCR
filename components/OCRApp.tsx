import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader2, Sparkles, Languages, Settings2, Download, Copy, Share2, Volume2, Info, Save, Check } from 'lucide-react';
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

const OCRApp: React.FC<Props> = ({ settings, setSettings, onResult, onSaveSettings }) => {
  const [file, setFile] = useState<File | null>(null);
  const [previews, setPreviews] = useState<{ original: string; processed: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OCRResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File) => {
    if (!f.type.startsWith('image/') && f.type !== 'application/pdf') {
      setError('Please upload an image or PDF file.');
      return;
    }
    setError(null);
    setFile(f);
    setResult(null);
    
    try {
      const p = await preprocessImage(f, settings.preprocessing);
      setPreviews(p);
    } catch (e) {
      setError('Failed to process image preview.');
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
    } catch (e) {
      setError('OCR processing failed. Please try again.');
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
      {/* File Dropzone */}
      {!previews && !isProcessing ? (
        <div 
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          className={`relative group border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center transition-all cursor-pointer ${
            isDragging 
              ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-900/10 scale-[0.99]' 
              : 'border-slate-200 dark:border-slate-800 hover:border-cyan-400 hover:bg-slate-50 dark:hover:bg-slate-900'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*,.pdf" 
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} 
          />
          <div className="w-20 h-20 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110">
            <Upload size={40} />
          </div>
          <h3 className="text-xl font-semibold mb-2">Drop your document here</h3>
          <p className="text-slate-500 dark:text-slate-400 text-center max-w-sm">
            Support JPG, PNG, WEBP, and PDF. Your files are processed 100% locally in your browser.
          </p>
          <div className="mt-8 flex gap-3">
             <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-medium">Auto-Deskew</span>
             <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-medium">95%+ Accuracy</span>
          </div>
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Original Source</label>
                    <img src={previews.original} alt="Original" className="rounded-xl w-full h-auto object-contain bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 max-h-[500px]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">OCR Preprocessed</label>
                    <img src={previews.processed} alt="Processed" className="rounded-xl w-full h-auto object-contain bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 max-h-[500px]" />
                  </div>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-950/50 flex flex-col sm:flex-row items-center justify-between gap-4">
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
              <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl border border-red-100 dark:border-red-900/50 flex items-center gap-3">
                <Info size={20} />
                <p className="text-sm font-medium">{error}</p>
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
      )}
    </div>
  );
};

export default OCRApp;