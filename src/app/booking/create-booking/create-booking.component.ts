import { NgForm } from '@angular/forms';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Place } from 'src/app/places/place.model';


@Component({
  selector: 'app-create-booking',
  templateUrl: './create-booking.component.html',
  styleUrls: ['./create-booking.component.scss'],
})
export class CreateBookingComponent implements OnInit {

  @Input() selectedPlace: Place;
  @Input() selectedMode : 'select'| 'random';
  @ViewChild('f', { static: true }) form: NgForm;
  startDate: string;
  endDate: string;
  

  
  constructor(
    private modalCtrl: ModalController
  ) { }

  ngOnInit() {
    const availableFrom = new Date(this.selectedPlace.availableFrom);
    const availableTo = new Date(this.selectedPlace.availableTo);
  }

  onCancel(){
    this.modalCtrl.dismiss(null, 'cancel');
  }

  onBookPlace(){
    if(!this.form.valid || !this.datesValid()){
      return;
    }
    this.modalCtrl.dismiss({bookingData: {
      firstName: this.form.value['first-name'],
      lastName: this.form.value['last-name'],
      guestNumber: +this.form.value['guest-number'],
      startDate: new Date (this.form.value['date-from']),
      endDate: new Date (this.form.value['date-to'])
    } }, 'confirm');
  }
    datesValid(){
      const startDate = new Date (this.form.value['date-from']);
      const endDate = new Date (this.form.value['date-to']);
      return endDate> startDate;
    }
}
