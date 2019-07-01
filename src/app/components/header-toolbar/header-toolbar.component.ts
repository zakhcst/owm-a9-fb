import { Component, OnInit, OnDestroy } from '@angular/core';
import { ICities } from '../../models/cities.model';
import {
  ActivatedRoute,
  Router,
  ChildActivationEnd,
  NavigationEnd
} from '@angular/router';
import { filter, switchMap, map, tap } from 'rxjs/operators';
import { combineLatest, Subscription, of } from 'rxjs';
import { CitiesService } from 'src/app/services/cities.service';
import { ConstantsService } from 'src/app/services/constants.service';
import { ErrorsService } from 'src/app/services/errors.service';
import { HistoryService } from 'src/app/services/history.service';
import { AppErrorPayloadModel } from 'src/app/states/app.models';

@Component({
  selector: 'app-header-toolbar',
  templateUrl: './header-toolbar.component.html',
  styleUrls: ['./header-toolbar.component.css']
})
export class HeaderToolbarComponent implements OnInit, OnDestroy {
  toolbarActions: [] = [];
  toolbarShow = true;
  cities: ICities;
  selectedCityId: string = ConstantsService.defaultCityId;
  subscriptions: Subscription;
  showActionButtonsXS = false;

  constructor(
    private _router: Router,
    private _activatedRoute: ActivatedRoute,
    private _cities: CitiesService,
    private _history: HistoryService,
    private _errors: ErrorsService
  ) {
    const eventNavigationEnd = this._router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(
        (event: ChildActivationEnd) =>
          event['urlAfterRedirects'].split('/').pop() ||
          event['url'].split('/').pop()
      ),
      filter(eventPathEndSegment => !!eventPathEndSegment)
    );
    this.subscriptions = combineLatest([
      this._activatedRoute.data,
      eventNavigationEnd
    ])
      .pipe(
        switchMap(([activatedRouteData, eventPathEndSegment]) => {
          if (eventPathEndSegment in activatedRouteData.toolbarActions &&
            this.toolbarActions !== activatedRouteData.toolbarActions[eventPathEndSegment]
          ) {
            this.toolbarActions = activatedRouteData.toolbarActions[eventPathEndSegment];
            this.toolbarShow = true;
            const hasSelectCities = this.toolbarActions.some(action => action['type'] === 'selectCities');
            return hasSelectCities && !this.cities && this._cities.getData() || of(null);
          }
          this.toolbarShow = false;
          return of(null);
        })
      )
      .subscribe(cities => {
        if (cities) {
          this.cities = cities;
          this.selectionChange(null);
        }
      },
        err => {
          this.addError('ngOnInit: onChange: subscribe', err.message);
        });
  }

  ngOnInit() { }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  toggleActionButtonsXS($event) {
    this.showActionButtonsXS = this.showActionButtonsXS ? false : true;
  }

  hideActionButtonsXS($event) {
    this.showActionButtonsXS = false;
  }

  selectionChange(eventSelectedCityId) {
    this.selectedCityId = eventSelectedCityId || this.selectedCityId;
    const historyLog = {
      cityId: this.selectedCityId,
      cityName: this.cities[this.selectedCityId].name,
      countryISO2: this.cities[this.selectedCityId].iso2
    };
    this._history.add(historyLog);
  }

  addError(custom: string, errorMessage: string) {
    const errorLog: AppErrorPayloadModel = {
      userMessage: 'Connection or service problem. Please reload or try later.',
      logMessage: `ForecastComponent: ${custom}: ${errorMessage}`
    };
    this._errors.add(errorLog);
  }
}