
import React, { useState } from 'react';
import { OCRResult } from '../types';
import { Download, Copy, Share2, Volume2, FileText, Code, Check, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';

interface Props {
  result: OCRResult;
}

const ResultsView: React.FC<Props> = ({ result }) => {
  const [copied, setCopied] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(true);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result.fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = (format: 'txt' | 'json' | 'md') => {
    let content = '';
    let fileName = `${result.fileName.split('.')[0]}.${format}`;

    if (format === 'json') {
      content = JSON.stringify(result, null, 2);
    } else if (format === 'md') {
      content = `# OCR Extraction Results\n**File:** ${result.fileName}\n**Confidence:** ${result.confidence.toFixed(1)}%\n\n## Extracted Text\n${result.fullText}`;
    } else {
      content = result.fullText;
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const speakText = () => {
    const utterance = new SpeechSynthesisUtterance(result.fullText);
    utterance.lang = result.language;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="space-y-6 animate-in zoom-in-95 duration-300">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
            result.confidence > 90 
              ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' 
              : result.confidence > 70 
              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
              : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
          }`}>
            {result.confidence > 90 ? <ShieldCheck size={14} /> : <AlertCircle size={14} />}
            {result.confidence.toFixed(1)}% Confidence
          </div>
          <span className="text-xs font-mono text-slate-500">{result.processingTime}ms</span>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={copyToClipboard}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-2 text-sm font-medium"
            title="Copy Text"
          >
            {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
            <span className="hidden sm:inline">Copy</span>
          </button>
          <button 
            onClick={speakText}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-2 text-sm font-medium"
            title="Read Aloud"
          >
            <Volume2 size={18} />
            <span className="hidden sm:inline">Read</span>
          </button>
          <div className="h-6 w-[1px] bg-slate-200 dark:border-slate-800 mx-1"></div>
          <button 
            onClick={() => downloadFile('md')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-2 text-sm font-medium text-cyan-600 dark:text-cyan-400"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visual Map */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col h-full">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">Spatial Confidence Map</h4>
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-medium text-slate-500">Heatmap</span>
               <button 
                onClick={() => setShowHeatmap(!showHeatmap)}
                className={`w-10 h-5 rounded-full p-1 transition-colors ${showHeatmap ? 'bg-cyan-500' : 'bg-slate-200 dark:bg-slate-700'}`}
               >
                 <div className={`w-3 h-3 bg-white rounded-full transition-transform ${showHeatmap ? 'translate-x-5' : 'translate-x-0'}`} />
               </button>
            </div>
          </div>
          <div className="relative flex-1 p-4 bg-slate-100 dark:bg-slate-950 flex items-center justify-center min-h-[400px]">
            <div className="relative max-w-full max-h-full">
              <img src={result.previewUrl} alt="Scan" className="max-w-full max-h-[600px] rounded-lg shadow-2xl" />
              {showHeatmap && result.words.map((word, idx) => (
                <div 
                  key={idx}
                  className="absolute border border-white/20 transition-opacity"
                  style={{
                    left: `${(word.bbox[0] / result.words[0].bbox[2]) * 10}%`, // Simplified scaling logic for demo, usually need natural vs rendered size ratio
                    top: `${word.bbox[1]}px`,
                    width: `${word.bbox[2]}px`,
                    height: `${word.bbox[3]}px`,
                    backgroundColor: `rgba(${255 * (1 - word.confidence/100)}, ${255 * (word.confidence/100)}, 0, 0.3)`,
                    transform: 'scale(0.95)'
                  }}
                  title={`${word.text} (${word.confidence.toFixed(1)}%)`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Extracted Text Area */}
        <div className="flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col h-full">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <FileText size={18} className="text-cyan-500" />
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">Extracted Text</h4>
            </div>
            <div className="flex-1 p-6 overflow-auto max-h-[500px] scrollbar-thin">
               <pre className="whitespace-pre-wrap text-sm font-medium leading-relaxed font-sans text-slate-700 dark:text-slate-300">
                 {result.fullText || "No text could be extracted."}
               </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsView;
