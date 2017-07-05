import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
// import * as_ from 'leaflet';
// import 'leaflet/dist/images/marker-shadow.png';
// import 'leaflet/dist/images/marker-icon.png'
// import { LeafletCoreDemoModel } from './map.model';
declare let _:any;
declare let L:any;

@Component({
    moduleId: module.id,
    selector: 'map-leaflet',
    templateUrl: 'map.component.html',
    styleUrls: ['map.component.scss']
})

export class MapComponent implements OnInit {

  
    constructor() {
        console.log('constructor', L)

       L.NETWORK = {
          DRONES: [],
          CAMERAES: [],
          CLUSTERS: {
            CAMERAES: []
          }
        };
        //   private points = [
        // {lat:10.824517, lng:106.630340},
        // {lat:10.825846, lng:106.622515},
        // {lat:10.822980, lng:106.633630}
    //]
       // this.onApply();
           
    }

    ngOnInit() {
        let map = L.map('map', {
                    center: [10.824517, 106.630340],
                    zoom: 13
            });

       L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {}).addTo(map);
        let item = {
            points: {
                location: {
                    lat:10.824517, 
                    lon:106.630340
                }
            }
        }
        let camera = new L.camera(map, item, {
          on: {
            cell: {
              "hide-bts": () => {
                //self.hideAllCameraInCurrentArea();
              }
            }
          }
        });
        L.NETWORK.CAMERAES.push(camera)
  
        let searchControl = new L.Control.Search({
              // sourceData: (text, callResponse) => {
              //   geocoder.geocode({ address: text }, callResponse);
              // },
              markerLocation: true,
              autoType: false,
              autoCollapse: true,
              minLength: 2,
              zoom: 15
            });
        map.addControl(searchControl)
        return false;
    }
}