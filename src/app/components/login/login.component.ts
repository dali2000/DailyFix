import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  form: FormGroup;
  authMode: 'login' | 'signup' = 'login';
  errorMessage: string = '';
  isLoading: boolean = false;

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
      const result = this.authService.login({
        email: this.form.value.email,
        password: this.form.value.password
      });

      this.isLoading = false;

      if (result.success) {
        this.router.navigate(['/home']);
      } else {
        this.errorMessage = result.error || 'Erreur de connexion';
      }
    } else {
      const result = this.authService.signup({
        fullName: this.form.value.fullName,
        email: this.form.value.email,
        password: this.form.value.password
      });

      this.isLoading = false;

      if (result.success) {
        this.router.navigate(['/home']);
      } else {
        this.errorMessage = result.error || 'Erreur lors de l\'inscription';
      }
    }
  }

  get isSignup(): boolean {
    return this.authMode === 'signup';
  }

  signupWithGoogle(): void {
    console.log('Signup with Google');
  }

  signupWithFacebook(): void {
    // eslint-disable-next-line no-console
    console.log('Signup with Facebook');
  }
}
