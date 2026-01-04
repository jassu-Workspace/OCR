
export interface OCRWord {
  text: string;
  confidence: number;
  bbox: [number, number, number, number];
}

export interface OCRLine {
  text: string;
  confidence: number;
  bbox: [number, number, number, number];
}

export interface OCRBlock {
  text: string;
  confidence: number;
}

export interface OCRResult {
  fullText: string;
  confidence: number;
  language: string;
  processingTime: number;
  words: OCRWord[];
  lines: OCRLine[];
  blocks: OCRBlock[];
  id: string;
  timestamp: number;
  fileName: string;
  previewUrl: string;
}

export enum PSM {
  OSD_ONLY = '0',
  AUTO_OSD = '1',
  AUTO_ONLY = '2',
  AUTO = '3',
  SINGLE_COLUMN = '4',
  SINGLE_BLOCK_VERT_TEXT = '5',
  SINGLE_BLOCK = '6',
  SINGLE_LINE = '7',
  SINGLE_WORD = '8',
  CIRCLE_WORD = '9',
  SINGLE_CHAR = '10',
  SPARSE_TEXT = '11',
  SPARSE_TEXT_OSD = '12',
  RAW_LINE = '13',
}

export interface OCRSettings {
  language: string;
  psm: PSM;
  theme: 'light' | 'dark' | 'system';
  preprocessing: {
    grayscale: boolean;
    contrast: number;
    threshold: number;
  };
}
