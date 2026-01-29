import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslatePipe],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent implements OnInit {
  form: FormGroup;
  token: string | null = null;
  isLoading = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const g = control as FormGroup;
    const newPassword = g.get('newPassword')?.value;
    const confirm = g.get('confirmPassword')?.value;
    if (confirm && newPassword !== confirm) {
      return { passwordMismatch: true };
    }
    return null;
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');
    if (!this.token) {
      this.errorMessage = 'Lien invalide. Veuillez redemander une réinitialisation.';
    }
  }

  submit(): void {
    if (this.form.invalid || !this.token) {
      this.form.markAllAsTouched();
      return;
    }
    this.errorMessage = null;
    this.successMessage = null;
    this.isLoading = true;
    this.authService.resetPassword(this.token, this.form.value.newPassword).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.successMessage = res.message ?? 'Mot de passe mis à jour.';
        setTimeout(() => this.router.navigate(['/login']), 2500);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message ?? 'Lien invalide ou expiré.';
      }
    });
  }

  backToLogin(): void {
    this.router.navigate(['/login']);
  }
}
