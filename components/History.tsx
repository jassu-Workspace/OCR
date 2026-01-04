
import React from 'react';
import { OCRResult } from '../types';
import { Clock, Trash2, ChevronRight, FileSearch } from 'lucide-react';

interface Props {
  items: OCRResult[];
  onClear: () => void;
}

const History: React.FC<Props> = ({ items, onClear }) => {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center text-slate-400 mb-4">
          <Clock size={32} />
        </div>
        <h3 className="text-lg font-bold">No history found</h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-xs">Documents you process will appear here for quick access later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          Scan History
          <span className="text-sm font-normal text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{items.length}</span>
        </h2>
        <button 
          onClick={onClear}
          className="text-sm font-medium text-red-500 hover:text-red-600 flex items-center gap-1.5 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
        >
          <Trash2 size={16} />
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {items.map((item) => (
          <div 
            key={item.id}
            className="group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 hover:shadow-xl hover:shadow-cyan-500/5 transition-all cursor-pointer relative"
          >
            <div className="flex gap-4">
              <div className="w-20 h-24 bg-slate-100 dark:bg-slate-950 rounded-xl overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-800">
                <img src={item.previewUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm truncate mb-1 pr-6" title={item.fileName}>{item.fileName}</h4>
                  <p className="text-[10px] text-slate-500 font-medium mb-2 uppercase tracking-wide">
                    {new Date(item.timestamp).toLocaleDateString()} &middot; {item.language}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                   <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${item.confidence > 90 ? 'bg-green-500' : 'bg-amber-500'}`} 
                        style={{ width: `${item.confidence}%` }}
                      />
                   </div>
                   <span className="text-[10px] font-bold">{item.confidence.toFixed(0)}%</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <FileSearch size={14} className="text-cyan-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">View Details</span>
              </div>
              <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default History;
