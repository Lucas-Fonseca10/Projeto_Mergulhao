import { AuthService } from './../../auth/auth.service';
import { PlacesService } from './../places.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Place } from '../place.model';
import { MenuController } from '@ionic/angular';
import { SegmentChangeEventDetail } from '@ionic/core';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-discover',
  templateUrl: './discover.page.html',
  styleUrls: ['./discover.page.scss'],
})
export class DiscoverPage implements OnInit, OnDestroy {
  loadedPlaces: Place[];
  // listedLoadedPlaces: Place[];
  relevantPlaces: Place[];
  isLoading = false;
  private filter = "all";
  private placesSub: Subscription;

  constructor(
    private placesService: PlacesService,
    private menuCtrl: MenuController,
    private authService: AuthService
    ) { }

  ngOnInit() {
  this.placesSub = this.placesService.places.subscribe(places => {
        this.loadedPlaces = places;
        this.onFilterUpdate(this.filter); 
    });
  }

  ionViewWillEnter(){
    this.isLoading = true;
    this.placesService.fetchPlaces().subscribe(() => {
      this.isLoading = false;
    });
  }

  onOpenMenu(){
    this.menuCtrl.toggle();
  }

  onFilterUpdate(filter: string)
  {
    this.authService.userId.pipe(take(1)).subscribe(userId => {
      const isShown = place => filter === 'all' || place.userId !== userId; 
      this.relevantPlaces = this.loadedPlaces.filter(isShown);
      this.filter = filter;

    });
  }

  ngOnDestroy(){
    if(this.placesSub){
      this.placesSub.unsubscribe();
    }
  }

}
