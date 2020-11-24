import { HttpClient } from '@angular/common/http';
import { AuthService } from './../auth/auth.service';
import { Injectable } from '@angular/core';


import { Place } from './place.model';
import { BehaviorSubject, of } from 'rxjs';
import { take, map, tap, delay, switchMap } from 'rxjs/operators';

// [
//     new Place(
//     'p1',
//    'Manhattam Mansion',
//    'In the heart of New York City',
//    'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Abu_Nawas_Beach_restaurant_-_Flickr_-_Al_Jazeera_English_%281%29.jpg/800px-Abu_Nawas_Beach_restaurant_-_Flickr_-_Al_Jazeera_English_%281%29.jpg',
//    149.99,
//    new Date('2020-01-01'),
//    new Date('2020-12-31'),
//    'xyz'
//    ),
//    new Place(
//      'p2',
//      "L'Amour Toujours",
//      'A romantic place in Paris',
//      'https://slicedpickles.com/wp-content/uploads/2017/02/cq5dam_Fotor.jpg',
//      189.99,
//      new Date('2020-01-01'),
//      new Date('2020-12-31'),
//      'abc'
//    ),
//    new Place(
//      'p3',
//      'The Foggy Place',
//      'Not your average city place',
//      'https://i.pinimg.com/originals/f5/31/1e/f5311e6f15baedcc714091858bfa8a24.jpg',
//      99.99,
//      new Date('2020-01-01'),
//      new Date('2020-12-31'),
//      'abc'
//    )
// ]

interface PlaceData {
  availableFrom: string;
  availableTo: string;
  description: string;
  imageUrl: string;
  price: number;
  title: string;
  userId: string;
}

@Injectable({
  providedIn: 'root'
})
export class PlacesService {
  private places_ = new BehaviorSubject<Place[]>([]);    
       

  get places(){
    return this.places_.asObservable() ;
  }
  constructor(
    private authService: AuthService,
    private http: HttpClient 
    ){}

  fetchPlaces(){
    return this.http
      .get<{ [key: string]: PlaceData}>('https://projeto-mergulhao.firebaseio.com/offered_places.json')
      .pipe(map(resData => {
        const places = [];
        for (const key in resData){
          if (resData.hasOwnProperty(key)) {
            places.push(
              new Place(
                key, 
                resData[key].title,
                resData[key].description,
                resData[key].imageUrl,
                resData[key].price,
                new Date(resData[key].availableFrom),
                new Date(resData[key].availableTo),
                resData[key].userId
              )
            );
          }
        }
      return places;
      }),
      tap(places => {
        this.places_.next(places);
      })
    );
  }

  getPlace(id: string){
    return this.http.get<PlaceData>(`https://projeto-mergulhao.firebaseio.com/offered_places/${id}.json`
    ).pipe(
      map(placeData => {
        return new Place(
          id,
          placeData.title,
          placeData.description,
          placeData.imageUrl,
          placeData.price,
          new Date(placeData.availableFrom),
          new Date(placeData.availableTo),
          placeData.userId
        );
      })
    );
  }

  addPlace(
    title:string,
    description: string,
    price: number,
    dateFrom: Date,
    dateTo: Date,
    ) {
      let generateId: string;
      let newPlace: Place;
      return this.authService.userId.pipe(take(1), switchMap(userId => {
        if(!userId){
          throw new Error('Nenhum usuário encontrado');
        }
        newPlace = new Place(
          Math.random().toString(),
          title,
          description,
          'https://br.habcdn.com/photos/project/medium/casa-toda-por-dentro-e-fora-1275597.jpg',
          price,
          dateFrom,
          dateTo,
          userId,
          );
          return this.http
          .post<{name: string}>(
            'https://projeto-mergulhao.firebaseio.com/offered_places.json',
            {
              ...newPlace, 
              id:null
            } 
          );
      }), switchMap(resData => {
            generateId = resData.name;
            return this.places;
          }),
          take(1),
          tap( places => {
            newPlace.id = generateId;
            this.places_.next(places.concat(newPlace));
          })
        );
    
      }

      updatePlace(
        placeId: string,
        title: string,
        description: string){
          let updatedPlaces: Place[];
          return this.places.pipe(
            take(1),
            switchMap(places => {
              if(!places || places.length <=0){
                return this.fetchPlaces();
              } else{
                return of(places);
              }
            }), 
            switchMap(places => {
              const updatedPlaceIndex = places.findIndex(pl => pl.id === placeId);
            updatedPlaces = [...places];
            const oldPlace = updatedPlaces[updatedPlaceIndex];
            updatedPlaces[updatedPlaceIndex] = new Place(
              oldPlace.id, 
              title, 
              description, 
              oldPlace.imageUrl, 
              oldPlace.price, 
              oldPlace.availableFrom,
              oldPlace.availableTo,
              oldPlace.userId
              );
              return this.http.put(
                `https://projeto-mergulhao.firebaseio.com/offered_places/${placeId}.json`,
                { ...updatedPlaces[updatedPlaceIndex], id:null}
                ); 
            }),
            tap(() => {
              this.places_.next(updatedPlaces);
            })
          );
        }

}

