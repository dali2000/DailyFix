import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  form: FormGroup;
  mode: 'login' | 'signup' = 'login';

  constructor(private formBuilder: FormBuilder) {
    this.form = this.buildLoginForm();
  }

  switchMode(mode: 'login' | 'signup'): void {
    if (this.mode === mode) return;
    this.mode = mode;
    this.form = mode === 'login' ? this.buildLoginForm() : this.buildSignupForm();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.mode === 'login') {
      // eslint-disable-next-line no-console
      console.log('Login data', this.form.value);
    } else {
      // eslint-disable-next-line no-console
      console.log('Signup data', this.form.value);
    }
  }

  private buildLoginForm(): FormGroup {
    return this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  private buildSignupForm(): FormGroup {
    const form = this.formBuilder.group(
      {
        fullName: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
      },
      { validators: this.passwordsMatchValidator }
    );

    return form;
  }

  private passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    if (!password || !confirm) return null;
    return password === confirm ? null : { passwordsMismatch: true };
  }
}