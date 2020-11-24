import { AuthService } from './auth.service';
import { Injectable } from '@angular/core';
import {  UrlTree, CanLoad, UrlSegment, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { Route } from '@angular/compiler/src/core';
import { take, tap, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanLoad {

  constructor( 
    private authService: AuthService,
    private router: Router
    ){}

  canLoad(route: Route, 
    segments: UrlSegment[]
    ): Observable<boolean> | Promise<boolean> | boolean {
    
      return this.authService.userIsAuthenticated.pipe(
          take(1),
          switchMap(isAutheticated => {
            if(!isAutheticated){
              return this.authService.autoLogin();
            } else {
              return of (isAutheticated);
            }
          }),tap(isAutheticated => {
            if(!isAutheticated){
              this.router.navigateByUrl('/auth');
          }
        }
      ));
    }
  }
  

