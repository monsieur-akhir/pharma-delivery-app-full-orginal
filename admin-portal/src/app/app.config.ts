import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { appRoutes } from './app.routes';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { TokenInterceptor } from './core/interceptors/token.interceptor';

// Utiliser la méthode recommandée d'Angular pour les intercepteurs
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes),
    // Utiliser la nouvelle syntaxe pour les intercepteurs
    provideHttpClient(),
    provideAnimations(),
    { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ]
};