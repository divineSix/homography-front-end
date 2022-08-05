import { DOCUMENT } from '@angular/common';
import { Component, Inject, VERSION } from '@angular/core';
import { MainService } from './services/main.service';

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  name = 'Angular ' + VERSION.major;

  // JSON points:
  groundFramePoints: any;
  cricketMapPoints: any;

  constructor(private mainService: MainService, @Inject(DOCUMENT) private document: Document) {}

  validateJSON() {
    if (!this.groundFramePoints || this.groundFramePoints.length === 0) {
      alert("Please provide the ground frame points for homography!");
      return false;
    }
    if (!this.cricketMapPoints || this.cricketMapPoints.length === 0) {
      alert("Please provide the ground map points for homography!");
      return false;
    }
    if (this.groundFramePoints.length !== this.cricketMapPoints.length) {
      alert("Mismatch in number of points between ground frame and ground map! Please select the same number of points and in the same order!");
      return false;
    }
    return true;
  }
  
  triggerShellScript() {
    if (this.validateJSON()) {
      var output_string: string = '';
      var isError: boolean = false;
      var params = {
        "image-points": this.groundFramePoints,
        "map-points": this.cricketMapPoints
      }
      
      this.mainService.execComputeHomography(params).subscribe({
        next: (data: any) => (output_string = data.msg),
        error: (err: any) => {
          console.log(err);
          isError = true;
        },
      });
    }
  }

  readChildJSON(event: string) {
    var data = JSON.parse(event);
    if(data.id == "cricket-map") {
      this.cricketMapPoints = data.points;
    }
    else if (data.id == "ground-frame") {
      this.groundFramePoints = data.points;
    }
  }

  /**
   * @deprecated after moving to canvas-based image visualization. HTML points not used anymore. 
   * May be required if using the old file-browse component. Look into it's code for more details on the below function's use. 
   */
  clearAllHTMLPoints() {
    const elements = this.document.getElementsByClassName('dot-div');
    for (let element of Array.from(elements)) {
      element.remove();
    }
  }
}
