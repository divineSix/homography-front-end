import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

@Injectable()
export class MainService {
  base_api_url: string = 'http://localhost:3001/api';
  constructor(private http: HttpClient) {}

  execShellScript(data: any) {
    // console.log(data);
    var options = {
      headers:{
        'Content-Type': 'application/json'
      }
    }
    return this.http.post(this.base_api_url + "/shell", JSON.stringify(data), options);
  }
}
