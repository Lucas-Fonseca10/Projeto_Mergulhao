import { IonItemSliding, LoadingController } from '@ionic/angular';
import { BookingService } from './booking.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Booking } from './booking.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-booking',
  templateUrl: './booking.page.html',
  styleUrls: ['./booking.page.scss'],
})
export class BookingPage implements OnInit, OnDestroy {
  loadedBookings: Booking[];
  isLoading = false
  private bookingSub: Subscription

  constructor(
    private bookingService: BookingService,
    private loadingCtrl: LoadingController

    
    ) { }

  ngOnInit() {
   
    this.bookingSub = this.bookingService.bookings.subscribe(bookings => {
      this.loadedBookings = bookings;
    });
  }

  ionViewWillEnter(){
    this.isLoading= true;
    this.bookingService.fetchBookings().subscribe(() => {
      this.isLoading= false;
    });
  }

  onCancelBooking(bookingId: string, slidingEl:IonItemSliding){
    slidingEl.close();
    this.loadingCtrl.create({message: 'Cancelando...'})
    .then(loadingEl => {
      loadingEl.present();
      this.bookingService.cancelBooking(bookingId).subscribe( () => {
        loadingEl.dismiss();
      });
    });
  }

  ngOnDestroy(){
    if(this.bookingSub){
      this.bookingSub.unsubscribe();
    }
  }

}
