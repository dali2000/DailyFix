import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';

const LOCALE_KEY = 'dailyfix_locale';
const SUPPORTED = ['fr', 'en', 'ar'] as const;
export type Locale = (typeof SUPPORTED)[number];

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private readonly prefix = './assets/i18n/';
  private translations: Record<string, Record<string, string>> = {};
  private currentLang$ = new BehaviorSubject<Locale>('fr');

  constructor(private http: HttpClient) {
    const saved = localStorage.getItem(LOCALE_KEY) as Locale | null;
    if (saved && SUPPORTED.includes(saved)) {
      this.currentLang$.next(saved);
      this.load(saved).subscribe();
    } else {
      this.load('fr').subscribe();
    }
  }

  get currentLang(): Locale {
    return this.currentLang$.value;
  }

  get onLangChange(): Observable<Locale> {
    return this.currentLang$.asObservable();
  }

  use(lang: string): Observable<Record<string, unknown>> {
    const locale = SUPPORTED.includes(lang as Locale) ? (lang as Locale) : 'fr';
    return this.load(locale).pipe(
      tap(() => {
        this.currentLang$.next(locale);
        try {
          localStorage.setItem(LOCALE_KEY, locale);
        } catch {}
      })
    );
  }

  instant(key: string): string {
    const lang = this.currentLang$.value;
    const data = this.translations[lang];
    if (!data) return key;
    // Clés stockées en aplati : "settings.title", "nav.home", etc.
    return data[key] ?? key;
  }

  get(key: string): Observable<string> {
    return this.currentLang$.pipe(
      map(() => this.instant(key))
    );
  }

  private loadCache: Partial<Record<Locale, Observable<Record<string, unknown>>>> = {};

  private load(lang: Locale): Observable<Record<string, unknown>> {
    if (this.translations[lang]) {
      return of(this.translations[lang] as unknown as Record<string, unknown>);
    }
    if (!this.loadCache[lang]) {
      this.loadCache[lang] = this.http.get<Record<string, unknown>>(`${this.prefix}${lang}.json`).pipe(
        tap((data) => {
          this.translations[lang] = this.flatten(data);
        }),
        catchError(() => of({})),
        shareReplay(1)
      );
    }
    return this.loadCache[lang]!;
  }

  private flatten(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(obj)) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
        Object.assign(out, this.flatten(v as Record<string, unknown>, key));
      } else if (typeof v === 'string') {
        out[key] = v;
      }
    }
    return out;
  }
}
