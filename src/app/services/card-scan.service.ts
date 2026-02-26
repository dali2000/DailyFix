import { Injectable } from '@angular/core';

export interface CardScanResult {
  cardNumber?: string;
  expiryDate?: string;
  holderName?: string;
}

/**
 * Service to scan a card image (camera or file) and extract card number, expiry and optional holder name via OCR.
 * Uses Tesseract.js dynamically; processing stays in the browser (no image sent to server).
 */
@Injectable({ providedIn: 'root' })
export class CardScanService {

  /**
   * Run OCR on an image (File, Blob or data URL) and parse card number, expiry and holder name.
   */
  async scanCardImage(imageSource: File | Blob | string): Promise<CardScanResult> {
    const Tesseract = await import('tesseract.js');
    const worker = await Tesseract.createWorker('eng');
    try {
      const { data } = await worker.recognize(imageSource as any);
      await worker.terminate();
      return this.parseCardText(data.text || '');
    } catch (e) {
      await worker.terminate().catch(() => {});
      throw e;
    }
  }

  /**
   * Normalise le texte OCR : O/I/l souvent lus à la place de 0/1 dans les chiffres.
   */
  private normalizeDigits(text: string): string {
    return text
      .replace(/[Oo]/g, '0')
      .replace(/[Il|]/g, '1')
      .replace(/[Zz]/g, '2')
      .replace(/[Ss]/g, '5')
      .replace(/[B]/g, '8');
  }

  /**
   * Parse OCR text to extract card number (16–19 digits), expiry (MM/YY) and optional holder name.
   */
  parseCardText(text: string): CardScanResult {
    const result: CardScanResult = {};
    const normalized = this.normalizeDigits(text);
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    // Numéro de carte : 16 chiffres en 4 groupes, ou 12–19 chiffres d'affilée
    const digitsOnly = normalized.replace(/\D/g, '');
    const card16 = digitsOnly.match(/(\d{4}\d{4}\d{4}\d{4})/);
    const cardAny = digitsOnly.match(/(\d{12,19})/);
    const cardMatch = card16 || cardAny;
    if (cardMatch) {
      result.cardNumber = cardMatch[1];
    }

    // Expiration : MM/YY ou MM-YY ou MM YY (sur texte normalisé pour éviter O au lieu de 0)
    const expiryMatch = normalized.match(/(0[1-9]|1[0-2])[\s\/\-]*(\d{2})\b/);
    if (expiryMatch) {
      result.expiryDate = `${expiryMatch[1]}/${expiryMatch[2]}`;
    }

    // Titulaire : ligne qui ressemble à un nom (lettres, espaces ; pas que des chiffres)
    for (const line of lines) {
      const cleaned = line.replace(/[\s']/g, '');
      if (cleaned.length >= 3 && cleaned.length <= 50 && /^[A-Za-z\u00C0-\u024F\u1E00-\u1EFF\s'-]+$/.test(line) && !/^\d+$/.test(cleaned)) {
        if (result.cardNumber && line.replace(/\s/g, '').includes(result.cardNumber.slice(-4))) continue;
        if (result.expiryDate && line.includes(result.expiryDate.slice(0, 2))) continue;
        // Éviter mots courts type "COLAB", "VISA"
        if (cleaned.length >= 6 || (cleaned.length >= 3 && line.includes(' '))) {
          result.holderName = line.trim();
          break;
        }
      }
    }

    return result;
  }
}
