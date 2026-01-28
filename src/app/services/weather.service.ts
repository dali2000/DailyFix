import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface WeatherData {
  city: string;
  temperature: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  feelsLike: number;
  latitude?: number;
  longitude?: number;
}

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private apiKey = 'YOUR_API_KEY'; // À remplacer par votre clé API
  private apiUrl = 'https://api.openweathermap.org/data/2.5/weather';
  
  // Pour le développement, on peut utiliser une API sans clé ou mock
  private useMock = true; // Mettre à false quand vous avez une clé API

  constructor() {}

  getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('La géolocalisation n\'est pas supportée par votre navigateur'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          // Ne pas logger si l'utilisateur a refusé la géolocalisation (code 1)
          if (error.code !== 1) {
            console.warn('Géolocalisation:', error.message);
          }
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }

  getWeatherByLocation(latitude: number, longitude: number): Observable<WeatherData> {
    // Données mockées basées sur la localisation
    // Pour utiliser l'API réelle, décommentez le code ci-dessous
    
    return of({
      city: this.getCityNameFromCoordinates(latitude, longitude),
      temperature: Math.floor(Math.random() * 15) + 15,
      description: this.getRandomDescription(),
      icon: this.getRandomIcon(),
      humidity: Math.floor(Math.random() * 40) + 40,
      windSpeed: Math.floor(Math.random() * 20) + 5,
      feelsLike: Math.floor(Math.random() * 15) + 15,
      latitude: latitude,
      longitude: longitude
    });

    /* Code pour utiliser l'API réelle :
    const url = `${this.apiUrl}?lat=${latitude}&lon=${longitude}&appid=${this.apiKey}&units=metric&lang=fr`;
    
    return this.http.get<any>(url).pipe(
      map(response => ({
        city: response.name,
        temperature: Math.round(response.main.temp),
        description: response.weather[0].description,
        icon: this.getWeatherIcon(response.weather[0].main),
        humidity: response.main.humidity,
        windSpeed: Math.round(response.wind.speed * 3.6),
        feelsLike: Math.round(response.main.feels_like),
        latitude: latitude,
        longitude: longitude
      })),
      catchError(error => {
        console.error('Erreur API météo:', error);
        return of({
          city: 'Localisation inconnue',
          temperature: 20,
          description: 'Données non disponibles',
          icon: '🌤️',
          humidity: 0,
          windSpeed: 0,
          feelsLike: 20,
          latitude: latitude,
          longitude: longitude
        });
      })
    );
    */
  }

  getWeather(city: string = 'Paris'): Observable<WeatherData> {
    // Données mockées pour le développement
    return of({
      city: city,
      temperature: Math.floor(Math.random() * 15) + 15,
      description: this.getRandomDescription(),
      icon: this.getRandomIcon(),
      humidity: Math.floor(Math.random() * 40) + 40,
      windSpeed: Math.floor(Math.random() * 20) + 5,
      feelsLike: Math.floor(Math.random() * 15) + 15
    });
  }

  getWeatherAuto(): Observable<WeatherData> {
    return new Observable(observer => {
      this.getCurrentLocation()
        .then(location => {
          this.getWeatherByLocation(location.latitude, location.longitude)
            .subscribe({
              next: (data) => observer.next(data),
              error: (error) => {
                console.error('Erreur lors de la récupération de la météo:', error);
                // En cas d'erreur, utiliser Paris par défaut
                this.getWeather('Paris').subscribe({
                  next: (data) => observer.next(data),
                  error: (err) => observer.error(err),
                  complete: () => observer.complete()
                });
              },
              complete: () => observer.complete()
            });
        })
        .catch(error => {
          // Permission refusée (code 1) : pas de log, on utilise Paris par défaut
          if (error?.code !== 1) {
            console.warn('Géolocalisation:', error?.message || error);
          }
          this.getWeather('Paris').subscribe({
            next: (data) => observer.next(data),
            error: (err) => observer.error(err),
            complete: () => observer.complete()
          });
        });
    });
  }

  private getCityNameFromCoordinates(lat: number, lon: number): string {
    // Approximation simple basée sur les coordonnées
    // En production, utiliser une API de géocodage inverse
    
    // France
    if (lat >= 48.8 && lat <= 48.9 && lon >= 2.2 && lon <= 2.4) {
      return 'Paris';
    } else if (lat >= 45.7 && lat <= 45.8 && lon >= 4.8 && lon <= 4.9) {
      return 'Lyon';
    } else if (lat >= 43.2 && lat <= 43.3 && lon >= 5.3 && lon <= 5.4) {
      return 'Marseille';
    } else if (lat >= 50.6 && lat <= 50.7 && lon >= 3.0 && lon <= 3.1) {
      return 'Lille';
    } else if (lat >= 44.8 && lat <= 44.9 && lon >= -0.6 && lon <= -0.5) {
      return 'Bordeaux';
    } else if (lat >= 43.6 && lat <= 43.7 && lon >= 1.4 && lon <= 1.5) {
      return 'Toulouse';
    } else if (lat >= 47.2 && lat <= 47.3 && lon >= -1.5 && lon <= -1.4) {
      return 'Nantes';
    } else if (lat >= 48.1 && lat <= 48.2 && lon >= -1.6 && lon <= -1.5) {
      return 'Rennes';
    } else if (lat >= 45.1 && lat <= 45.2 && lon >= 5.7 && lon <= 5.8) {
      return 'Grenoble';
    } else if (lat >= 49.1 && lat <= 49.2 && lon >= 6.1 && lon <= 6.2) {
      return 'Strasbourg';
    }
    
    // Tunisie (basé sur les coordonnées de l'image)
    else if (lat >= 36.7 && lat <= 37.0 && lon >= 10.0 && lon <= 10.3) {
      return 'Tunis';
    }
    
    // Autres pays européens
    else if (lat >= 52.3 && lat <= 52.6 && lon >= 4.7 && lon <= 5.0) {
      return 'Amsterdam';
    } else if (lat >= 50.0 && lat <= 50.2 && lon >= 4.3 && lon <= 4.5) {
      return 'Bruxelles';
    } else if (lat >= 48.1 && lat <= 48.3 && lon >= 11.4 && lon <= 11.7) {
      return 'Munich';
    } else if (lat >= 52.4 && lat <= 52.6 && lon >= 13.2 && lon <= 13.6) {
      return 'Berlin';
    } else if (lat >= 41.8 && lat <= 41.9 && lon >= 12.4 && lon <= 12.6) {
      return 'Rome';
    } else if (lat >= 40.4 && lat <= 40.5 && lon >= -3.7 && lon <= -3.6) {
      return 'Madrid';
    } else if (lat >= 51.4 && lat <= 51.6 && lon >= -0.2 && lon <= 0.0) {
      return 'Londres';
    }
    
    // Si aucune correspondance, retourner une description plus propre
    return 'Ma localisation';
  }

  private getRandomDescription(): string {
    const descriptions = ['Ensoleillé', 'Nuageux', 'Partiellement nuageux', 'Pluvieux', 'Orageux'];
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }

  private getRandomIcon(): string {
    const icons = ['☀️', '☁️', '🌤️', '🌧️', '⛈️'];
    return icons[Math.floor(Math.random() * icons.length)];
  }

  private getWeatherIcon(weatherMain: string): string {
    const icons: { [key: string]: string } = {
      'Clear': '☀️',
      'Clouds': '☁️',
      'Rain': '🌧️',
      'Drizzle': '🌦️',
      'Thunderstorm': '⛈️',
      'Snow': '❄️',
      'Mist': '🌫️',
      'Fog': '🌫️'
    };
    return icons[weatherMain] || '🌤️';
  }
}

