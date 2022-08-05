import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MainService } from '../services/main.service';

@Component({
  selector: 'app-visualize-homography',
  templateUrl: './visualize-homography.component.html',
  styleUrls: ['./visualize-homography.component.css']
})
export class VisualizeHomographyComponent implements OnInit {

  // Class Variables
  pointsArray: any;
  imageFile: File;
  isVisualizationComplete: boolean = false;
  visualizationImageUrl: string = "#";
  baseServerUrl: string = "http://localhost:3001";
  isBoundaryPoints: boolean = false;

  @ViewChild('selBoundary') selBoundary: ElementRef;

  constructor(private mainService: MainService) { }

  ngOnInit(): void {
  }

  validatePointsArray() {
    if (!this.pointsArray || this.pointsArray.length === 0) {
      alert("Please provide the ground frame points for visualizing homography!");
      return false;
    }
    return true;
  }

  triggerVisualizationScript() {
    if ((!this.selBoundary.nativeElement.value) || (this.selBoundary.nativeElement.value === "-1")) {
      alert("Please select the points type!");
      return false;
    }

    if (this.validatePointsArray()) {
      this.isVisualizationComplete = false;
      var output_string: string = '';
      var isError: boolean = false;
      let params: any = {
        "image-points": this.pointsArray,
        "is-boundary": (this.selBoundary.nativeElement.value === "1") ? true : false
      }
      var formData: FormData = new FormData();
      formData.append("data", JSON.stringify(params));
      formData.append("file", this.imageFile, "ground_frame.png");

      this.mainService.execVisualizeHomography(formData).subscribe({
        next: (data: any) => {
          if(data["resources"] && data["resources"]["stitched_image_url"]) {
            // Stitched Image URL does not change, only the actual image changes at the server. Adding a timestamp component to simply force the client-side to reload the URL to get the updated image. 
            this.visualizationImageUrl = this.baseServerUrl + data["resources"]["stitched_image_url"] + "?" + (new Date()).getTime();
            this.isVisualizationComplete = true;
          }
        },
        error: (err: any) => {
          // console.log(err);
          isError = true;
          this.isVisualizationComplete = false;
        },
      });
    }
  }

  readChildImageFile(file: any) {
    this.imageFile = file;
  }

  readChildJSON(event: any) {
    var data = JSON.parse(event);
    this.pointsArray = data.points;
  }

  boundaryDropdownChange(value: any) {
    if(value === "1")
      this.isBoundaryPoints = true;
    else
      this.isBoundaryPoints = false;
  }
}
