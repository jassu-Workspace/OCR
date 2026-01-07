
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs`;

const convertPdfToImage = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    if (pdf.numPages === 0) throw new Error("PDF has no pages");
    
    // Get the first page
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR quality

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error("Canvas context unavailable");

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;

    return canvas.toDataURL('image/jpeg', 0.9);
  } catch (error) {
    console.error("PDF Conversion Error:", error);
    throw new Error("Failed to parse PDF. Please ensure it is a valid PDF file.");
  }
};

export const preprocessImage = async (
  file: File | string,
  config: { grayscale: boolean; contrast: number; threshold: number }
): Promise<{ processed: string; original: string }> => {
  return new Promise(async (resolve, reject) => {
    let src = '';
    
    try {
      if (typeof file === 'string') {
        src = file;
      } else if (file.type === 'application/pdf') {
        src = await convertPdfToImage(file);
      } else {
        src = URL.createObjectURL(file);
      }
    } catch (e: any) {
      return reject(e.message || "Failed to load file source");
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('No canvas context');

      // Max resolution for OCR efficiency while maintaining quality
      const maxWidth = 1800; // Increased slightly for PDF quality
      const scale = Math.min(1, maxWidth / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // 1. Grayscale
        if (config.grayscale) {
          const v = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          r = g = b = v;
        }

        // 2. Contrast
        const factor = (259 * (config.contrast * 255 + 255)) / (255 * (259 - config.contrast * 255));
        r = Math.min(255, Math.max(0, factor * (r - 128) + 128));
        g = Math.min(255, Math.max(0, factor * (g - 128) + 128));
        b = Math.min(255, Math.max(0, factor * (b - 128) + 128));

        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
      }

      ctx.putImageData(imageData, 0, 0);
      
      const originalCanvas = document.createElement('canvas');
      originalCanvas.width = canvas.width;
      originalCanvas.height = canvas.height;
      originalCanvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);

      resolve({
        processed: canvas.toDataURL('image/jpeg', 0.9),
        original: originalCanvas.toDataURL('image/jpeg', 0.8)
      });
    };
    img.onerror = () => reject("Failed to render image. The file might be corrupted.");
    img.src = src;
  });
};
