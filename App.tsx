import React, { useState, useEffect, useCallback } from 'react';
import { OCRResult, OCRSettings, PSM } from './types';
import OCRApp from './components/OCRApp';
import History from './components/History';
import { Settings as SettingsIcon, History as HistoryIcon, Scan, Info } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'scan' | 'history'>('scan');
  const [history, setHistory] = useState<OCRResult[]>([]);
  
  // Initialize settings from localStorage or default
  const [settings, setSettings] = useState<OCRSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ocr_settings');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse settings', e);
        }
      }
    }
    return {
      language: 'eng',
      psm: PSM.AUTO,
      theme: 'system',
      preprocessing: {
        grayscale: true,
        contrast: 1.2,
        threshold: 0.5,
      },
    };
  });

  // Save settings to localStorage
  const saveSettings = useCallback(() => {
    localStorage.setItem('ocr_settings', JSON.stringify(settings));
  }, [settings]);

  // Initialize theme
  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = settings.theme === 'dark' || 
      (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  // Load History
  useEffect(() => {
    const savedHistory = localStorage.getItem('ocr_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  const addToHistory = (result: OCRResult) => {
    const updated = [result, ...history].slice(0, 20);
    setHistory(updated);
    localStorage.setItem('ocr_history', JSON.stringify(updated));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('ocr_history');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 glass border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center text-white font-bold">
              <Scan size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight hidden sm:block">VisionPro OCR</h1>
          </div>

          <nav className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-full border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('scan')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeTab === 'scan' 
                ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Scan size={16} />
              <span>Scan</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeTab === 'history' 
                ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <HistoryIcon size={16} />
              <span>History</span>
              {history.length > 0 && (
                <span className="w-5 h-5 flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-[10px] rounded-full">
                  {history.length}
                </span>
              )}
            </button>
          </nav>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                const newTheme = settings.theme === 'light' ? 'dark' : 'light';
                setSettings(prev => ({ ...prev, theme: newTheme }));
              }}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <SettingsIcon size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'scan' ? (
          <OCRApp 
            settings={settings} 
            setSettings={setSettings} 
            onResult={addToHistory}
            onSaveSettings={saveSettings}
          />
        ) : (
          <History items={history} onClear={clearHistory} />
        )}
      </main>

      <footer className="py-6 border-t border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500">
        <div className="flex items-center justify-center gap-4 mb-2">
          <span className="flex items-center gap-1"><Info size={14} /> Tesseract.js Engine</span>
          <span className="flex items-center gap-1"><Info size={14} /> Local Processing</span>
        </div>
        <p>&copy; {new Date().getFullYear()} VisionPro OCR. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default App;