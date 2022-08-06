import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

@Injectable()
export class MainService {
  base_api_url: string = 'http://localhost:3001/api';
  constructor(private http: HttpClient) {}

  execComputeHomography(data: any) {
    // console.log(data);
    var options = {
      headers:{
        'Content-Type': 'application/json'
      }
    }
    return this.http.post(this.base_api_url + "/compute_homography", JSON.stringify(data), options);
  }

  // execVisualizeHomography(data: any)
  execVisualizeHomography(formData: FormData) {
    // var options = {
    //   headers:{
    //     'Content-Type': 'application/json'
    //   }
    // }
    console.log(formData);
    return this.http.post(this.base_api_url + "/visualize_homography", formData);
  }

  execStartScript () {
    return this.http.post(this.base_api_url + "/start_process", undefined);
  }

  execStopScript () {
    return this.http.post(this.base_api_url + "/stop_process", undefined);
  }
}
