import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

// Types pour Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
          renderButton: (element: HTMLElement, config: any) => void;
        };
        oauth2: {
          initTokenClient: (config: any) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
  }
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit, OnDestroy {
  form: FormGroup;
  authMode: 'login' | 'signup' = 'login';
  errorMessage: string = '';
  isLoading: boolean = false;
  // Client ID Google OAuth 2.0 configuré
  private googleClientId: string = '248580902178-3s8374jnjcm4o3g0k2oi98md1sl9r7av.apps.googleusercontent.com';
  private authSubscription: Subscription = new Subscription();

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.form = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit(): void {
    // Initialiser Google Identity Services quand le composant est chargé
    this.initializeGoogleSignIn();
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  private initializeGoogleSignIn(): void {
    // Attendre que Google Identity Services soit chargé
    const checkGoogle = setInterval(() => {
      if (window.google) {
        clearInterval(checkGoogle);
        if (this.googleClientId) {
          window.google.accounts.id.initialize({
            client_id: this.googleClientId,
            callback: this.handleGoogleSignIn.bind(this),
            auto_select: false,
            cancel_on_tap_outside: true
          });
        }
      }
    }, 100);

    // Timeout après 5 secondes
    setTimeout(() => clearInterval(checkGoogle), 5000);
  }
  switchMode(mode: 'login' | 'signup'): void {
    if (this.authMode === mode) {
      return;
    }
    this.authMode = mode;
    this.errorMessage = '';
    this.form = this.buildForm();
  }
    private buildForm(): FormGroup {
    if (this.authMode === 'signup') {
      return this.formBuilder.group({
        fullName: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]]
      });
    }

    return this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;

    if (this.authMode === 'login') {
      this.authService.login({
        email: this.form.value.email,
        password: this.form.value.password
      }).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.router.navigate(['/home']);
          } else {
            this.errorMessage = response.error || response.message || 'Erreur de connexion';
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.message || 'Erreur de connexion';
        }
      });
    } else {
      this.authService.signup({
        fullName: this.form.value.fullName,
        email: this.form.value.email,
        password: this.form.value.password
      }).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.router.navigate(['/home']);
          } else {
            this.errorMessage = response.error || response.message || 'Erreur lors de l\'inscription';
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.message || 'Erreur lors de l\'inscription';
        }
      });
    }
  }

  get isSignup(): boolean {
    return this.authMode === 'signup';
  }

  signupWithGoogle(): void {
    this.errorMessage = '';
    this.isLoading = true;

    // Vérifier si Google Identity Services est chargé
    if (window.google && this.googleClientId) {
      // Utiliser Google Identity Services avec Client ID
      try {
        // Méthode 1: Utiliser One Tap (popup automatique)
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Si One Tap n'est pas disponible, utiliser OAuth2
            this.useGoogleOAuth2();
          }
        });
      } catch (error) {
        console.error('Erreur Google One Tap:', error);
        this.useGoogleOAuth2();
      }
    } else if (window.google && !this.googleClientId) {
      // Si Google est chargé mais pas de Client ID, utiliser OAuth2 sans Client ID (mode développement)
      this.useGoogleOAuth2();
    } else {
      // Si Google n'est pas chargé, utiliser la simulation
      this.simulateGoogleSignIn();
    }
  }

  private useGoogleOAuth2(): void {
    // Utiliser OAuth2 pour obtenir un token d'accès
    if (window.google) {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: this.googleClientId || 'YOUR_CLIENT_ID.apps.googleusercontent.com',
          scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
          callback: (response: any) => {
            if (response.access_token) {
              this.getGoogleUserInfo(response.access_token);
            } else if (response.error) {
              console.error('Erreur OAuth2:', response.error);
              this.isLoading = false;
              this.errorMessage = 'Erreur lors de la connexion avec Google';
            }
          }
        });
        tokenClient.requestAccessToken();
      } catch (error) {
        console.error('Erreur OAuth2:', error);
        // Fallback vers la simulation
        this.simulateGoogleSignIn();
      }
    } else {
      this.simulateGoogleSignIn();
    }
  }

      private async getGoogleUserInfo(accessToken: string): Promise<void> {
        try {
          const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
          }

          const userInfo = await response.json();
          
          if (!userInfo.email || !userInfo.id) {
            throw new Error('Informations utilisateur incomplètes depuis Google');
          }

          const googleUser = {
            name: userInfo.name || `${userInfo.given_name || ''} ${userInfo.family_name || ''}`.trim() || 'Utilisateur Google',
            email: userInfo.email,
            sub: userInfo.id
          };

          this.authSubscription.add(this.authService.signupWithGoogle(googleUser).subscribe({
            next: (result) => {
              this.isLoading = false;
              if (result.success) {
                this.router.navigate(['/home']);
              } else {
                this.errorMessage = result.message || 'Erreur lors de l\'inscription avec Google';
              }
            },
            error: (error) => {
              console.error('Erreur lors de la connexion avec Google:', error);
              this.isLoading = false;
              this.errorMessage = error.message || 'Erreur lors de la connexion avec Google';
            }
          }));
        } catch (error: any) {
          console.error('Erreur lors de la récupération des infos Google:', error);
          this.isLoading = false;
          this.errorMessage = error.message || 'Erreur lors de la connexion avec Google';
        }
      }

  private handleGoogleSignIn(response: any): void {
    try {
      if (!response.credential) {
        throw new Error('Réponse Google invalide: credential manquant');
      }

      const parts = response.credential.split('.');
      if (parts.length !== 3) {
        throw new Error('Format de credential Google invalide');
      }

      const payload = JSON.parse(atob(parts[1]));

      if (!payload.email || !payload.sub) {
        throw new Error('Informations utilisateur incomplètes dans le token Google');
      }

      const googleUser = {
        name: payload.name || `${payload.given_name || ''} ${payload.family_name || ''}`.trim() || 'Utilisateur Google',
        email: payload.email,
        sub: payload.sub
      };

      this.authSubscription.add(this.authService.signupWithGoogle(googleUser).subscribe({
        next: (result) => {
          this.isLoading = false;
          if (result.success) {
            this.router.navigate(['/home']);
          } else {
            this.errorMessage = result.message || 'Erreur lors de l\'inscription avec Google';
          }
        },
        error: (error) => {
          console.error('Erreur lors de la connexion Google:', error);
          this.isLoading = false;
          this.errorMessage = error.message || 'Erreur lors de la connexion avec Google';
        }
      }));
    } catch (error: any) {
      console.error('Erreur lors de la connexion Google:', error);
      this.isLoading = false;
      this.errorMessage = error.message || 'Erreur lors de la connexion avec Google';
    }
  }

  private simulateGoogleSignIn(): void {
    // Simulation pour le développement
    // En production, remplacer par l'appel réel à l'API Google
    setTimeout(() => {
      const mockGoogleUser = {
        name: 'Utilisateur Google',
        email: `google.user.${Date.now()}@gmail.com`,
        sub: `google_${Date.now()}`
      };

      this.authService.signupWithGoogle(mockGoogleUser).subscribe({
        next: (result) => {
          this.isLoading = false;
          if (result.success) {
            this.router.navigate(['/home']);
          } else {
            this.errorMessage = result.error || result.message || 'Erreur lors de l\'inscription avec Google';
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.message || 'Erreur lors de l\'inscription avec Google';
        }
      });
    }, 1000);
  }

  signupWithFacebook(): void {
    // eslint-disable-next-line no-console
    console.log('Signup with Facebook');
  }
}
