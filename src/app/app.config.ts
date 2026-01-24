import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    { provide: LocationStrategy, useClass: HashLocationStrategy },
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};
