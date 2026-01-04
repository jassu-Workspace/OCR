import { createWorker, Worker } from 'tesseract.js';
import { OCRResult, OCRSettings } from '../types';

export const runOCR = async (
  imageSrc: string,
  settings: OCRSettings,
  onProgress: (p: number) => void
): Promise<Partial<OCRResult>> => {
  const startTime = Date.now();
  
  // Use a lower sampling frequency for progress to avoid UI lag
  const worker: Worker = await createWorker(settings.language, 1, {
    logger: m => {
      if (m.status === 'recognizing text') {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });

  try {
    await worker.setParameters({
      tessedit_pageseg_mode: settings.psm as any,
    });

    const { data } = await worker.recognize(imageSrc);
    
    // Cast data to any to access properties that might be missing in strict type definitions
    // but are present at runtime in Tesseract.js v5+
    const pageData = data as any;

    const words = (pageData.words || []).map((w: any) => ({
      text: w.text,
      confidence: w.confidence,
      bbox: [w.bbox.x0, w.bbox.y0, w.bbox.x1 - w.bbox.x0, w.bbox.y1 - w.bbox.y0] as [number, number, number, number],
    }));

    const lines = (pageData.lines || []).map((l: any) => ({
      text: l.text,
      confidence: l.confidence,
      bbox: [l.bbox.x0, l.bbox.y0, l.bbox.x1 - l.bbox.x0, l.bbox.y1 - l.bbox.y0] as [number, number, number, number],
    }));

    const blocks = data.blocks?.map(b => ({
      text: b.text,
      confidence: b.confidence,
    })) || [];

    await worker.terminate();

    return {
      fullText: data.text,
      confidence: data.confidence,
      language: settings.language,
      processingTime: Date.now() - startTime,
      words,
      lines,
      blocks,
    };
  } catch (error) {
    await worker.terminate();
    throw error;
  }
};