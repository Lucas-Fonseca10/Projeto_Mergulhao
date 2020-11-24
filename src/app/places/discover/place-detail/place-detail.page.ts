import { switchMap, take } from 'rxjs/operators';
import { AuthService } from './../../../auth/auth.service';
import { BookingService } from './../../../booking/booking.service';
import { CreateBookingComponent } from './../../../booking/create-booking/create-booking.component';
import { Place } from './../../place.model';
import { PlacesService } from './../../places.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ActionSheetController, ModalController, NavController, LoadingController, AlertController } from '@ionic/angular';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-place-detail',
  templateUrl: './place-detail.page.html',
  styleUrls: ['./place-detail.page.scss'],
})
export class PlaceDetailPage implements OnInit, OnDestroy {

  place:Place;
  isBookable= false;
  isLoading = false;
  private placeSub: Subscription;

  constructor(
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private placesService: PlacesService,
    private modalCtrl: ModalController,
    private actionSheetCtrl: ActionSheetController,
    private bookingService: BookingService,
    private loadingCtrl: LoadingController,
    private authService : AuthService,
    private alertCtrl: AlertController,
    private router: Router
 
    
    ) { }

  ngOnInit() {
    this.route.paramMap.subscribe(paramMap => {
      if(!paramMap.has('placeId')){
          this.navCtrl.navigateBack('/places/discover');
          return;
      }
       this.isLoading = true; 
       let fetchedUserId: string;
       return this.authService.userId.pipe(
        take(1),
        switchMap(userId => {
         if(!userId){
           throw new Error('Não encontramos nenhum usuário');
         }
         fetchedUserId = userId;
         return this.placesService.getPlace(paramMap.get('placeId'));
       })).subscribe( place => {
            this.place = place;
            this.isBookable = place.userId !== fetchedUserId;
            this.isLoading = false;
        }, error => {
          this.alertCtrl.create({
            header: 'Ocorreu um erro!',
            message: 'Não foi possivel carregar o Local',
            buttons: [{text: 'Ok', handler:() => {
              this.router.navigate(['/places/discover'])
            } 
          }
        ]
      }).then(alertEl=> alertEl.present());
        });
    });
  }

  onBookPlace(){
     // this.router.navigateByUrl('places/discover');
     // this.navCtrl.navigateBack('places/discover');
     //this.navCtrl.pop
     this.actionSheetCtrl.create({
       header: 'Escolha',
       buttons:[
         {
          text:'Reservar',
          handler: () => {
            this.openBookingModal('select');
          }
         },
         {
           text: 'Cancelar',
           role: 'cancel'
         }

        ]
     })
     .then(actionSheetEl => {
        actionSheetEl.present();
     });
    
    }

    openBookingModal(mode: 'select'){
      console.log(mode);
      this.modalCtrl
      .create(
        {component: CreateBookingComponent, 
        componentProps: {selectedPlace: this.place}
      })
      .then(modalEl=>{
          modalEl.present();
          return modalEl.onDidDismiss();
      })
      .then(resultData =>{
          if(resultData.role === 'confirm'){
            this.loadingCtrl
            .create({message: 'Reservando Lugar...'})
            .then(loadingEl => {
              loadingEl.present();
              const data = resultData.data.bookingData;
              this.bookingService.addBooking(
                this.place.id,
                this.place.title,
                this.place.imageUrl,
                data.firstName,
                data.lastName,
                data.guestNumber,
                data.startDate,
                data.endDate
                ).subscribe(() => {
                  loadingEl.dismiss();
                });
            });
          }
      });
    }

    ngOnDestroy(){
      if(this.placeSub){
        this.placeSub.unsubscribe();
      }
    }
}
