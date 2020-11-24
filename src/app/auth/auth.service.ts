import { BehaviorSubject, from } from 'rxjs';
import { environment } from './../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { User } from './user.model';
import { map, tap } from 'rxjs/operators';
import { Plugins } from '@capacitor/core'
 
/*
  padrão de informação que é repassada da requisição.
  utiliza o "?" para indicar que é um preenchimento opcional
*/
export interface AuthResponseData{
  kind: string;
  idToken: string;
  email: string;
  refreshToken: string;
  localId: string;
  expiresIn: string;
  registered?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnDestroy{

 
  private _user = new BehaviorSubject<User>(null);
  private activeLogoutTimer: any;
  
  get userIsAuthenticated(){
    return this._user.asObservable().pipe(map(user => {
      if(user){
        return!!user.token
      } else {
        return false;
      }
    })
    );
  }

  get userId(){
    return this._user.asObservable().pipe(map(user => {
      if(user){
        return user.id
      }else {
        return null;
      }
    })
    );
  }

  constructor(
    private http : HttpClient
  ) { }

  /*
    Método que tenta buscar dados armzenados e se encontrar dados que são validos, ele faz o login
    
    A partir da chave que foi feita la no storeAuthData

    */

  autoLogin(){
    return from (Plugins.Storage.get({key: 'authData'}))
    .pipe(map(storedData => {
      if(!storedData || !storedData.value){
        return null;
      }
      const parsedData = JSON.parse(storedData.value) as {
        token: string;
        tokenExpirationDate: string;
        userId: string;
        email: string;
      };
      const expirationTime = new Date(parsedData.tokenExpirationDate);
      if(expirationTime <= new Date()){
        return null;
      }
      const user = new User(
        parsedData.userId,
        parsedData.email,
        parsedData.token,
        expirationTime
      );
      return user;
    }), 
    tap(user => {
      if (user){
        this._user.next(user);
        this.autoLogout(user.tokenDuration);
      }
    }),
    map(user => {
      return !!user;
    })
  );

  }
    /*
      Criação de usuário, recebe como parametro e-mail e senha
      Faz a requisição ao firebase por meio do metodo post, a partir da chave
      Atribuição de informação( email e senhas recebido pelo parametro, o returnSecureToken deve receber sempre true )
      
      */
    signup(email: string, password: string){
     return this.http
      .post<AuthResponseData>(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${
        environment.firebaseAPIKey
      }`
       , {
        email: email,
        password: password,
        returnSecureToken: true
        }
    ).pipe(tap(this.setUserData.bind(this)));

  }

  /*
   Requisição do tipo POST, utilizando o link, com a chave do projeto, assim como feito no signup
   Informações passadas
   Passa as informações para o setUserData

  */

  login(email: string, password: string){
   return this.http.post<AuthResponseData>(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${
     environment.firebaseAPIKey
    }`, {
      email: email,
      password: password,
      returnSecureToken: true
    }
    ).pipe(tap(this.setUserData.bind(this)));
  }

  /*
    Basicamente, define os dados do usuário como null
    Remove os dados armazenados do LocalStorage
  */
  logout(){
    if(this.activeLogoutTimer){
      clearTimeout(this.activeLogoutTimer);
    }
    this._user.next(null) ;
    Plugins.Storage.remove({key:'authData'});
  }

  ngOnDestroy(){
    if(this.activeLogoutTimer){
      clearTimeout(this.activeLogoutTimer);
    }
  }

  private autoLogout(duration: number){
   if(this.activeLogoutTimer){
     clearTimeout(this.activeLogoutTimer);
   }
    this.activeLogoutTimer = setTimeout(() => {
      this.logout();
    }, duration)
  }

  /*
  Define os dados do usuário quando emite novo usuário;
  */

  private setUserData(userData: AuthResponseData){
    
      const expirationTime = new Date(
        new Date().getTime() + +userData.expiresIn * 1000
        );
        const user = new User(
          userData.localId,
          userData.email,
          userData.idToken,
          expirationTime
        );
      this._user.next(user);
      this.autoLogout(user.tokenDuration);
      this.storeAuthData(
        userData.localId,
        userData.idToken, 
        expirationTime.toISOString(),
        userData.email
      );
  }

  /*
  Armazenar informações para "persistir" o usuário no app



  Passa as informações para Plugins.Storage, para que as informações fiquem guardadas momentaneamente para que quando recarregue o browser não deslogue o usuário
  */
  private storeAuthData(
    userId: string, 
    token: string, 
    tokenExpirationDate: string,
    email: string
  ){
    const data = JSON.stringify({
      userId: userId, 
      token: token, 
      tokenExpirationDate: tokenExpirationDate,
      email:email
    });
    Plugins.Storage.set({key:'authData', value: data});

    };

}
