import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection, enableProdMode } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { routes } from './app/app.routes';
import { register as registerSwiperElements } from 'swiper/element/bundle';

registerSwiperElements();
enableProdMode();
bootstrapApplication(App, {
  providers: [provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding())],
})
  .catch((err) => console.error(err));
