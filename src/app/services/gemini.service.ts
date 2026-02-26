import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

const HEALTH_SYSTEM_INSTRUCTION = `Tu es un assistant santé intégré à l'application DailyFix. Tu réponds de façon bienveillante et factuelle sur la nutrition, le sommeil, l'activité physique, l'hydratation et la méditation. Donne des conseils courts et pratiques. Ne pose pas de diagnostic médical ; en cas de doute, recommande de consulter un professionnel de santé. Réponds dans la même langue que l'utilisateur.`;

const HOUSEHOLD_SYSTEM_INSTRUCTION = `Tu es un assistant maison et cuisine intégré à l'application DailyFix. Tu aides l'utilisateur pour : idées de repas à partir des ingrédients qu'il a, recettes simples, listes de courses, organisation du foyer, astuces ménage. Quand il donne une liste d'ingrédients, propose 1 à 3 idées de plats ou recettes (entrée, plat, dîner) avec des instructions courtes. Sois pratique et concis. Réponds toujours dans la même langue que l'utilisateur.`;

export interface UserHealthProfile {
  height?: number | null;
  weight?: number | null;
  gender?: string | null;
}

export interface MealCaloriesEstimate {
  calories: number;
  name?: string;
}

/** Résultat de l'analyse d'une facture/reçu par photo (vision Gemini). */
export interface ReceiptEstimate {
  amount?: number;
  description?: string;
  date?: string;
  category?: string;
  paymentMethod?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private apiKey = environment.geminiApiKey;
  private apiUrl = environment.apiUrl || '';

  constructor(private http: HttpClient) {}

  /** Disponible si clé locale ou URL backend configurée (proxy avec GEMINI_API_KEY sur Render). */
  isAvailable(): boolean {
    if (!!this.apiKey && this.apiKey.length > 0) return true;
    return !!(this.apiUrl && this.apiUrl.length > 0);
  }

  /** Clé i18n pour afficher le message de quota dépassé (health.discussionQuotaExceeded). */
  static readonly QUOTA_ERROR_KEY = 'health.discussionQuotaExceeded';

  /**
   * Envoie un message utilisateur avec l'historique et l'instruction système donnée.
   * En cas de 429 (quota), tente une seule fois après le délai indiqué par l'API (ou 6 s).
   */
  private async sendWithInstruction(userMessage: string, history: ChatMessage[], systemInstruction: string): Promise<string> {
    const useBackend = (!this.apiKey || !this.apiKey.length) && !!this.apiUrl;

    if (useBackend) {
      try {
        const res = await firstValueFrom(
          this.http.post<{ success: boolean; text?: string; message?: string }>(`${this.apiUrl}/gemini/chat`, {
            userMessage,
            history,
            systemInstruction
          })
        );
        if (res?.success && res.text != null) return res.text;
        if (res?.message === GeminiService.QUOTA_ERROR_KEY) throw new Error(GeminiService.QUOTA_ERROR_KEY);
        throw new Error(res?.message || 'Backend Gemini error');
      } catch (err: unknown) {
        const status = err && typeof err === 'object' && 'status' in err ? (err as { status: number }).status : 0;
        const bodyMsg = err && typeof err === 'object' && 'error' in err && typeof (err as { error: unknown }).error === 'object' && (err as { error: { message?: string } }).error?.message;
        const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : '';
        if (status === 429 || bodyMsg === GeminiService.QUOTA_ERROR_KEY || msg === GeminiService.QUOTA_ERROR_KEY) {
          throw new Error(GeminiService.QUOTA_ERROR_KEY);
        }
        throw err;
      }
    }

    const run = async (): Promise<string> => {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(this.apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const chatHistory = history.map(m => ({
        role: m.role === 'user' ? ('user' as const) : ('model' as const),
        parts: [{ text: m.text }]
      }));
      const chat = model.startChat({
        history: chatHistory,
        systemInstruction: { role: 'user', parts: [{ text: systemInstruction }] }
      });
      const result = await chat.sendMessage(userMessage);
      const response = result.response;
      const text = response.text();
      if (text == null || text === '') {
        return 'Désolé, je n\'ai pas pu générer une réponse. Réessaie.';
      }
      return text;
    };
    const isQuotaError = (err: unknown): boolean => {
      const message = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : '';
      return message.includes('429') || message.includes('quota') || message.includes('Quota exceeded');
    };
    const parseRetryDelayMs = (err: unknown): number => {
      const message = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : '';
      const match = message.match(/[Pp]lease retry in ([\d.]+)s/);
      if (match) {
        const sec = parseFloat(match[1]);
        return Number.isFinite(sec) ? Math.ceil(sec * 1000) : 6000;
      }
      return 6000;
    };
    try {
      return await run();
    } catch (err: unknown) {
      if (!isQuotaError(err)) throw err;
      const delayMs = parseRetryDelayMs(err);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      try {
        return await run();
      } catch (retryErr: unknown) {
        if (isQuotaError(retryErr)) {
          throw new Error(GeminiService.QUOTA_ERROR_KEY);
        }
        throw retryErr;
      }
    }
  }

  /** Chat santé (nutrition, sommeil, activité, etc.). */
  async sendMessage(userMessage: string, history: ChatMessage[]): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('GEMINI_API_KEY is not configured. Add it in environment (geminiApiKey) or on the server (GEMINI_API_KEY).');
    }
    return this.sendWithInstruction(userMessage, history, HEALTH_SYSTEM_INSTRUCTION);
  }

  /** Chat maison / cuisine : idées repas à partir des ingrédients, recettes, listes de courses, astuces. */
  async sendHouseholdMessage(userMessage: string, history: ChatMessage[]): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('GEMINI_API_KEY is not configured. Add it in environment (geminiApiKey) or on the server (GEMINI_API_KEY).');
    }
    return this.sendWithInstruction(userMessage, history, HOUSEHOLD_SYSTEM_INSTRUCTION);
  }

  /**
   * Estime les calories et le nom du repas à partir d'une photo (vision Gemini).
   * Utilise la clé API côté client si configurée, sinon appelle le backend (apiUrl + GEMINI_API_KEY).
   */
  async estimateCaloriesFromImage(imageBase64: string, mimeType: string): Promise<MealCaloriesEstimate> {
    const useBackend = (!this.apiKey || !this.apiKey.length) && !!this.apiUrl;

    if (useBackend) {
      try {
        const res = await firstValueFrom(
          this.http.post<{ success: boolean; calories?: number; name?: string; message?: string }>(
            `${this.apiUrl}/gemini/calories-from-image`,
            { imageBase64, mimeType: mimeType || 'image/jpeg' }
          )
        );
        if (res?.success && typeof res.calories === 'number') {
          return {
            calories: Math.round(res.calories),
            name: typeof res.name === 'string' ? res.name.trim() : undefined
          };
        }
        if (res?.message === GeminiService.QUOTA_ERROR_KEY) throw new Error(GeminiService.QUOTA_ERROR_KEY);
        throw new Error(res?.message || 'Erreur serveur');
      } catch (err: unknown) {
        const status = err && typeof err === 'object' && 'status' in err ? (err as { status: number }).status : 0;
        const bodyMsg = err && typeof err === 'object' && 'error' in err && typeof (err as { error: unknown }).error === 'object' && (err as { error: { message?: string } }).error?.message;
        const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : '';
        if (status === 429 || bodyMsg === GeminiService.QUOTA_ERROR_KEY || msg === GeminiService.QUOTA_ERROR_KEY) {
          throw new Error(GeminiService.QUOTA_ERROR_KEY);
        }
        if (status === 503) {
          throw new Error('L\'estimation par photo n\'est pas configurée sur le serveur (GEMINI_API_KEY).');
        }
        throw err;
      }
    }

    if (!this.apiKey || !this.apiKey.length) {
      throw new Error('Gemini (clé API) est requis pour l\'estimation par photo. Configurez geminiApiKey dans l\'environnement ou utilisez un backend avec GEMINI_API_KEY.');
    }
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    });
    const prompt = `Analyze this food/meal image. Return ONLY a valid JSON object with exactly these two keys (no other text, no markdown):
- "calories": number (estimated total calories for the whole meal/plate shown)
- "name": string (short meal name in the same language as the user, e.g. "Salade César", "Grilled chicken with rice")

Be realistic with calorie estimates. If you cannot see food clearly, use calories: 0 and name: "Repas non reconnu".`;
    const imagePart = { inlineData: { mimeType, data: imageBase64 } as { mimeType: string; data: string } };
    const result = await model.generateContent([imagePart, prompt]);
    const response = result.response;
    const text = response.text();
    if (!text || !text.trim()) {
      throw new Error('Réponse vide de l\'IA.');
    }
    try {
      const json = JSON.parse(text.trim()) as { calories?: number; name?: string };
      const calories = typeof json.calories === 'number' && json.calories >= 0 ? Math.round(json.calories) : 0;
      const name = typeof json.name === 'string' ? json.name.trim() : undefined;
      return { calories, name };
    } catch {
      throw new Error('Impossible de lire l\'estimation. Réessaie avec une photo plus nette.');
    }
  }

  /**
   * Analyse une photo de facture/reçu et extrait montant, description, date, catégorie.
   * Utilise le backend si pas de clé API côté client.
   */
  async analyzeReceiptFromImage(imageBase64: string, mimeType: string): Promise<ReceiptEstimate> {
    const useBackend = (!this.apiKey || !this.apiKey.length) && !!this.apiUrl;

    if (useBackend) {
      try {
        const res = await firstValueFrom(
          this.http.post<{ success: boolean; amount?: number; description?: string; date?: string; category?: string; paymentMethod?: string; message?: string }>(
            `${this.apiUrl}/gemini/receipt-from-image`,
            { imageBase64, mimeType: mimeType || 'image/jpeg' }
          )
        );
        if (res?.success) {
          return {
            amount: typeof res.amount === 'number' ? res.amount : undefined,
            description: typeof res.description === 'string' ? res.description.trim() : undefined,
            date: typeof res.date === 'string' ? res.date.trim() : undefined,
            category: typeof res.category === 'string' ? res.category.trim() : undefined,
            paymentMethod: typeof res.paymentMethod === 'string' ? res.paymentMethod.trim() : undefined
          };
        }
        if (res?.message === GeminiService.QUOTA_ERROR_KEY) throw new Error(GeminiService.QUOTA_ERROR_KEY);
        throw new Error(res?.message || 'Erreur serveur');
      } catch (err: unknown) {
        const status = err && typeof err === 'object' && 'status' in err ? (err as { status: number }).status : 0;
        const bodyMsg = err && typeof err === 'object' && 'error' in err && typeof (err as { error: unknown }).error === 'object' && (err as { error: { message?: string } }).error?.message;
        const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : '';
        if (status === 429 || bodyMsg === GeminiService.QUOTA_ERROR_KEY || msg === GeminiService.QUOTA_ERROR_KEY) {
          throw new Error(GeminiService.QUOTA_ERROR_KEY);
        }
        if (status === 503) {
          throw new Error('L\'analyse de facture n\'est pas configurée sur le serveur (GEMINI_API_KEY).');
        }
        throw err;
      }
    }

    if (!this.apiKey || !this.apiKey.length) {
      throw new Error('Gemini (clé API) est requis pour l\'analyse de facture. Configurez geminiApiKey ou utilisez un backend avec GEMINI_API_KEY.');
    }
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
    });
    const prompt = `This image is a receipt or invoice (facture). Extract the following and return ONLY a valid JSON object (no other text, no markdown):
- "amount": number (total amount to pay, as a number without currency symbol)
- "description": string (store name, merchant, or short description of the receipt)
- "date": string (date of the receipt in YYYY-MM-DD format if visible, otherwise empty string)
- "category": string (one of: food, shopping, health, leisure, transport, bills, other - choose the best match)
- "paymentMethod": string (e.g. Card, Cash, Visa) if visible, otherwise empty string

If you cannot read a field, omit it or use empty string. Always try to extract at least amount and description.`;
    const imagePart = { inlineData: { mimeType, data: imageBase64 } as { mimeType: string; data: string } };
    const result = await model.generateContent([imagePart, prompt]);
    const text = result.response.text();
    if (!text || !text.trim()) throw new Error('Réponse vide de l\'IA.');
    try {
      const json = JSON.parse(text.trim()) as ReceiptEstimate;
      return {
        amount: typeof json.amount === 'number' ? json.amount : undefined,
        description: typeof json.description === 'string' ? json.description.trim() : undefined,
        date: typeof json.date === 'string' ? json.date.trim() : undefined,
        category: typeof json.category === 'string' ? json.category.trim() : undefined,
        paymentMethod: typeof json.paymentMethod === 'string' ? json.paymentMethod.trim() : undefined
      };
    } catch {
      throw new Error('Impossible de lire la facture. Réessaie avec une photo plus nette.');
    }
  }

  private dailyAdviceCache: { dateKey: string; profileKey: string; text: string } | null = null;

  /**
   * Génère 2–3 conseils santé personnalisés selon le profil (taille, poids, genre) et la langue.
   * Mis en cache pour la même journée et le même profil pour éviter des appels répétés à l'ouverture de l'app.
   */
  async getDailyAdvice(profile: UserHealthProfile, locale: string): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }
    const dateKey = new Date().toDateString();
    const profileKey = `${profile.height ?? ''}_${profile.weight ?? ''}_${profile.gender ?? ''}_${locale}`;
    if (this.dailyAdviceCache && this.dailyAdviceCache.dateKey === dateKey && this.dailyAdviceCache.profileKey === profileKey) {
      return this.dailyAdviceCache.text;
    }
    const parts: string[] = [];
    if (profile.height != null) parts.push(`taille ${profile.height} cm`);
    if (profile.weight != null) parts.push(`poids ${profile.weight} kg`);
    if (profile.gender) parts.push(`genre ${profile.gender}`);
    const lang = locale === 'ar' ? 'arabe' : locale === 'en' ? 'anglais' : 'français';
    const prompt = `Profil utilisateur : ${parts.join(', ') || 'non renseigné'}. Donne exactement 2 ou 3 conseils santé très courts et personnalisés pour la journée (nutrition, eau, sommeil, activité). Réponds UNIQUEMENT dans la langue : ${lang}. Pas de titre, pas de numérotation, juste des phrases courtes séparées par des retours à la ligne.`;

    const useBackend = (!this.apiKey || !this.apiKey.length) && !!this.apiUrl;
    if (useBackend) {
      try {
        const res = await firstValueFrom(
          this.http.post<{ success: boolean; text?: string; message?: string }>(`${this.apiUrl}/gemini/advice`, { prompt })
        );
        if (res?.success && res.text != null) {
          const text = res.text.trim() || 'Pas de conseil disponible.';
          this.dailyAdviceCache = { dateKey, profileKey, text };
          return text;
        }
        if (res?.message === GeminiService.QUOTA_ERROR_KEY) throw new Error(GeminiService.QUOTA_ERROR_KEY);
        throw new Error(res?.message || 'Backend Gemini error');
      } catch (err: unknown) {
        const status = err && typeof err === 'object' && 'status' in err ? (err as { status: number }).status : 0;
        const bodyMsg = err && typeof err === 'object' && 'error' in err && typeof (err as { error: unknown }).error === 'object' && (err as { error: { message?: string } }).error?.message;
        const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : '';
        if (status === 429 || bodyMsg === GeminiService.QUOTA_ERROR_KEY || msg === GeminiService.QUOTA_ERROR_KEY) {
          throw new Error(GeminiService.QUOTA_ERROR_KEY);
        }
        throw err;
      }
    }

    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(this.apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      const resp = result.response;
      const text = (resp ? resp.text() : '').trim() || 'Pas de conseil disponible.';
      this.dailyAdviceCache = { dateKey, profileKey, text };
      return text;
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : '';
      if (message.includes('429') || message.includes('quota') || message.includes('Quota exceeded')) {
        throw new Error(GeminiService.QUOTA_ERROR_KEY);
      }
      throw err;
    }
  }
}
