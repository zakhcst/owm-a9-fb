import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';
import { ConstantsService } from './constants.service';
import { IOwmDataModel } from '../models/owm-data.model';
import { OwmFallbackDataService } from './owm-fallback-data.service';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  constructor(private _db: AngularFireDatabase, private _owmFallback: OwmFallbackDataService) {}
  

  getData(cityId: string) {
    return this._db.object(ConstantsService.owmData + '/' + cityId).valueChanges();
  }

  setData(cityId: string, data: IOwmDataModel) {
    const ref = this._db.object(ConstantsService.owmData + '/' + cityId);
    return ref.set(data);
  }
}
