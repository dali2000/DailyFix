import { Injectable } from '@angular/core';
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

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private apiKey = environment.geminiApiKey;

  isAvailable(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  /** Clé i18n pour afficher le message de quota dépassé (health.discussionQuotaExceeded). */
  static readonly QUOTA_ERROR_KEY = 'health.discussionQuotaExceeded';

  /**
   * Envoie un message utilisateur avec l'historique et l'instruction système donnée.
   * En cas de 429 (quota), tente une seule fois après le délai indiqué par l'API (ou 6 s).
   */
  private async sendWithInstruction(userMessage: string, history: ChatMessage[], systemInstruction: string): Promise<string> {
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
      throw new Error('GEMINI_API_KEY is not configured. Add it in environment (geminiApiKey).');
    }
    return this.sendWithInstruction(userMessage, history, HEALTH_SYSTEM_INSTRUCTION);
  }

  /** Chat maison / cuisine : idées repas à partir des ingrédients, recettes, listes de courses, astuces. */
  async sendHouseholdMessage(userMessage: string, history: ChatMessage[]): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('GEMINI_API_KEY is not configured. Add it in environment (geminiApiKey).');
    }
    return this.sendWithInstruction(userMessage, history, HOUSEHOLD_SYSTEM_INSTRUCTION);
  }

  /**
   * Génère 2–3 conseils santé personnalisés selon le profil (taille, poids, genre) et la langue.
   * Utilisé à chaque entrée dans l'application pour afficher des conseils sur la page d'accueil.
   */
  async getDailyAdvice(profile: UserHealthProfile, locale: string): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }
    const parts: string[] = [];
    if (profile.height != null) parts.push(`taille ${profile.height} cm`);
    if (profile.weight != null) parts.push(`poids ${profile.weight} kg`);
    if (profile.gender) parts.push(`genre ${profile.gender}`);
    const lang = locale === 'ar' ? 'arabe' : locale === 'en' ? 'anglais' : 'français';
    const prompt = `Profil utilisateur : ${parts.join(', ') || 'non renseigné'}. Donne exactement 2 ou 3 conseils santé très courts et personnalisés pour la journée (nutrition, eau, sommeil, activité). Réponds UNIQUEMENT dans la langue : ${lang}. Pas de titre, pas de numérotation, juste des phrases courtes séparées par des retours à la ligne.`;
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(this.apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      const resp = result.response;
      const text = resp ? resp.text() : '';
      return (text || '').trim() || 'Pas de conseil disponible.';
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : '';
      if (message.includes('429') || message.includes('quota') || message.includes('Quota exceeded')) {
        throw new Error(GeminiService.QUOTA_ERROR_KEY);
      }
      throw err;
    }
  }
}
