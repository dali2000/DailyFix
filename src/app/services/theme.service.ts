import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type Theme = 'light' | 'dark' | 'blue' | 'forest' | 'purple';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'dailyfix-theme';
  private themeSubject: BehaviorSubject<Theme>;
  public theme$: Observable<Theme>;
  private readonly allowedThemes: Theme[] = ['light', 'dark', 'blue', 'forest', 'purple'];

  constructor() {
    // Récupérer le thème depuis localStorage ou utiliser la préférence système
    const savedTheme = this.getSavedTheme();
    this.themeSubject = new BehaviorSubject<Theme>(savedTheme);
    this.theme$ = this.themeSubject.asObservable();
    
    // Appliquer le thème initial
    this.applyTheme(savedTheme);
  }

  /**
   * Récupère le thème sauvegardé ou la préférence système
   */
  private getSavedTheme(): Theme {
    const saved = localStorage.getItem(this.THEME_KEY) as Theme;
    if (saved && this.allowedThemes.includes(saved)) return saved;
    
    // Utiliser la préférence système si disponible
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  }

  /**
   * Obtient le thème actuel
   */
  getCurrentTheme(): Theme {
    return this.themeSubject.value;
  }

  /**
   * Bascule entre mode sombre et mode clair (depuis la navbar).
   * En mode sombre → passer en clair ; en tout autre thème → passer en sombre.
   */
  toggleTheme(): void {
    const currentTheme = this.themeSubject.value;
    const newTheme: Theme = currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  /**
   * Définit un thème spécifique
   */
  setTheme(theme: Theme): void {
    this.themeSubject.next(theme);
    this.applyTheme(theme);
    localStorage.setItem(this.THEME_KEY, theme);
  }

  /**
   * Applique le thème au document
   */
  private applyTheme(theme: Theme): void {
    const htmlElement = document.documentElement;
    // Nettoyer les anciennes classes de thème
    this.allowedThemes.forEach(t => htmlElement.classList.remove(`${t}-theme`));
    // Ajouter la classe du thème courant
    htmlElement.classList.add(`${theme}-theme`);
  }

  /**
   * Écoute les changements de préférence système
   */
  watchSystemPreference(): void {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        // Seulement si l'utilisateur n'a pas de préférence sauvegardée
        if (!localStorage.getItem(this.THEME_KEY)) {
          const newTheme: Theme = e.matches ? 'dark' : 'light';
          this.setTheme(newTheme);
        }
      });
    }
  }
}

