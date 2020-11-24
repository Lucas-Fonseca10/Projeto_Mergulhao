import { Observable } from 'rxjs';
import { AuthResponseData, AuthService } from './auth.service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController, AlertController } from '@ionic/angular';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
})
export class AuthPage implements OnInit {

  isLoading = false;
  isLogin= true;

  constructor(
    private authService: AuthService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController

  ) { }

  ngOnInit() {
  }

  /* 
  O metodo de autenticação vai decidir se fará o login ou signup,
  Se a varia isLogin estiver true, ele irá para o login, se não irá para o signup

  Utiliza o authObs como uma variável geral, do tipo Observable que deve ser preenchida com os dados do AuthResponseData

  Apos a inscrição ou cadastrado, ambos seguem para o a próxima página

  Mensagens de erros, a partir dos erros que são passados pelo firebase
  */
  autheticate(email: string, password: string){
    this.isLoading = true;
    this.loadingCtrl.create({keyboardClose: true, message: 'Loggin in...'})
    .then(loadingEl=> {
      loadingEl.present();
      let authObs: Observable<AuthResponseData>;
      if(this.isLogin){
       authObs = this.authService.login(email,password);
      } else {
        authObs = this.authService.signup(email,password);
      }
      authObs.subscribe(resData => {
        console.log(resData);
        this.isLoading = false;
        loadingEl.dismiss();
        this.router.navigateByUrl('/places/discover');
      }, errRes => {
        loadingEl.dismiss();
        const code = errRes.error.error.message;
        let message = ' Não foi possível cadastrar, por favor tente mais tarde'
        if (code ==='EMAIL_EXISTS') { 
          message = "Esse e-mail já existe";
        } else if( code === 'EMAIL_NOT_FOUND'){
          message = 'E-mail não encontrado';
        } else if (code === 'INVALID_PASSWORD'){
          message = 'Senha incorreta';
        }
        this.showAlert(message);
      });
    });
  }

  onSwichAuthMode(){
    this.isLogin= !this.isLogin;
  }

  
  /*
  Recebe as informações do formulário
  Faz a validação e põe os valores nas constantes
  */
  onSubmit(form: NgForm){
    if (!form.valid){
      return;
    }
    const email = form.value.email;
    const password = form.value.password;
   
    this.autheticate(email, password);

    form.reset();
  }

  private showAlert(message: string ){
    this.alertCtrl.create({
      header:'Falha na Autenticação',
      message: message,
      buttons: ['Ok']
    }).then(alertEl => alertEl.present());
  }

}
