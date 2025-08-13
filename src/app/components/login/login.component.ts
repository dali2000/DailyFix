import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  form: FormGroup;
  authMode: 'login' | 'signup' = 'login';

  constructor(private formBuilder: FormBuilder) {
    this.form = this.buildForm();
  }

  switchMode(mode: 'login' | 'signup'): void {
    if (this.authMode === mode) {
      return;
    }
    this.authMode = mode;
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

    if (this.authMode === 'login') {
      // eslint-disable-next-line no-console
      console.log('Login data', this.form.value);
    } else {
      // eslint-disable-next-line no-console
      console.log('Signup data', this.form.value);
    }
  }

  get isSignup(): boolean {
    return this.authMode === 'signup';
  }

  signupWithGoogle(): void {
    // eslint-disable-next-line no-console
    console.log('Signup with Google');
  }

  signupWithFacebook(): void {
    // eslint-disable-next-line no-console
    console.log('Signup with Facebook');
  }
}
