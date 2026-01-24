import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  get<T>(endpoint: string, params?: any): Observable<T> {
    const url = `${this.apiUrl}${endpoint}`;
    console.log('GET Request:', url, params);
    
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        httpParams = httpParams.set(key, params[key]);
      });
    }

    return this.http.get<T>(url, { params: httpParams })
      .pipe(
        catchError((error) => {
          console.error('GET Error for', url, error);
          return this.handleError(error);
        })
      );
  }

  post<T>(endpoint: string, data: any): Observable<T> {
    const url = `${this.apiUrl}${endpoint}`;
    console.log('POST Request:', url, data);
    
    return this.http.post<T>(url, data)
      .pipe(
        catchError((error) => {
          console.error('POST Error for', url, error);
          return this.handleError(error);
        })
      );
  }

  put<T>(endpoint: string, data: any): Observable<T> {
    const url = `${this.apiUrl}${endpoint}`;
    console.log('PUT Request:', url, data);
    
    return this.http.put<T>(url, data)
      .pipe(
        catchError((error) => {
          console.error('PUT Error for', url, error);
          return this.handleError(error);
        })
      );
  }

  delete<T>(endpoint: string): Observable<T> {
    const url = `${this.apiUrl}${endpoint}`;
    console.log('DELETE Request:', url);
    
    return this.http.delete<T>(url)
      .pipe(
        catchError((error) => {
          console.error('DELETE Error for', url, error);
          return this.handleError(error);
        })
      );
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'Une erreur est survenue';
    
    console.error('API Error Details:', {
      status: error.status,
      statusText: error.statusText,
      url: error.url,
      error: error.error,
      message: error.message
    });
    
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = error.error.message;
    } else {
      // Erreur côté serveur
      if (error.status === 0) {
        errorMessage = 'Impossible de se connecter au serveur. Vérifiez que le backend est démarré.';
      } else if (error.status === 401) {
        errorMessage = 'Non autorisé. Veuillez vous reconnecter.';
      } else if (error.status === 404) {
        errorMessage = 'Ressource non trouvée.';
      } else if (error.status === 500) {
        errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
      } else {
        errorMessage = error.error?.message || error.message || errorMessage;
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}

