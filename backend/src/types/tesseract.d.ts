// Type declarations for Tesseract.js
declare module 'tesseract.js' {
  export interface Word {
    text: string;
    confidence: number;
    bbox: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
    };
  }

  export interface Line {
    text: string;
    confidence: number;
    bbox: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
    };
    words: Word[];
  }

  export interface Block {
    text: string;
    confidence: number;
    bbox: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
    };
    lines: Line[];
  }

  export interface Page {
    text: string;
    confidence: number;
    blocks: Block[];
    lines: Line[];
    words: Word[];
    hocr: string;
    tsv: string;
  }

  export interface RecognizeResult {
    data: Page;
  }

  export function recognize(
    image: string | Uint8Array,
    langs: string,
    options?: {
      logger?: (status: { status: string; progress: number }) => void;
    }
  ): Promise<RecognizeResult>;

  export function detect(
    image: string | Uint8Array
  ): Promise<{ data: { script: string; confidence: number } }>;


  export interface RecognizeResult {
    data: {
      text: string;
      confidence: number;
      // Add other properties from Tesseract.RecognizeResult['data'] if needed
    };
  }

  export interface Worker {
    setProgressHandler(arg0: (progress: any) => void): unknown;
    loadLanguage(arg0: string): unknown;
    initialize(arg0: string): unknown;
    setParameters(arg0: { tessedit_pageseg_mode: string; preserve_interword_spaces: string; }): unknown;
    recognize(image: string | Buffer | File | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement, options?: any): Promise<RecognizeResult>;
    terminate(): Promise<void>;
    // Add other methods from Tesseract.Worker if needed
  }

  export function createWorker(languages?: string | string[], oem?: number, options?: Partial<any>): Promise<Worker>;

}