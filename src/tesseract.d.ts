declare module 'tesseract.js' {
  export function createWorker(
    lang?: string,
    oem?: number,
    options?: { logger?: (m: unknown) => void }
  ): Promise<{
    recognize(image: File | Blob | string | HTMLImageElement): Promise<{ data: { text: string } }>;
    terminate(): Promise<void>;
  }>;
}
