import {
  Component,
  ElementRef,
  Inject,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { DOCUMENT } from '@angular/common';
import { saveAs } from 'file-saver';
import { findElementsWithAttribute } from '@angular/cdk/schematics/ng-update/html-parsing/elements';
// import { FileUploadService } from './file-upload.service';

enum ClearPointsSelection {
  NONE,
  ALL,
  SPECIFIC,
}

@Component({
  selector: 'app-file-browse',
  templateUrl: './file-browse.component.html',
  styleUrls: ['./file-browse.component.css'],
})
export class FileBrowseComponent implements OnInit {
  constructor(@Inject(DOCUMENT) private document: Document) {
    // Javascript as Component Properties
    this.JSON = JSON;
  }

  @Input() instance_id: number;
  @ViewChild('myImg', { static: false }) myImg: ElementRef;
  @ViewChild('txtPointIndices', { static: false }) txtPointIndices: ElementRef;

  // File Storage!
  // file_store: FileList;
  // file_list: Array<string> = [];
  inpFile: File;
  inpFileName: string = '';
  imgURL: any = '#';
  isFileSelected: boolean = false;

  // Temporary Data!!
  myThumbnail = 'https://wallpaperaccess.com/full/138728.jpg';
  // myThumbnail = 'https://www.apple.com/v/imac-with-retina/a/images/overview/5k_image.jpg';
  // myThumbnail: '';
  currentPos: any;
  clickPos: any;

  // Actual Data!
  // Contains imgPoint & pagePoint co-ordinates
  selectedPoints: any[];

  // Global Javascript Utilities
  JSON: any;

  // HTML Element References
  clearPointsSelection: ClearPointsSelection = ClearPointsSelection.NONE;
  ClearPointsSelectionType = ClearPointsSelection;

  ngOnInit() {}

  handleFileInput(evnt) {
    const filesList = evnt.target.files;
    // console.log(filesList);
    if (filesList.length > 0) {
      const f = filesList[0];
      this.inpFile = f;
      this.inpFileName = f.name;
      this.isFileSelected = true;

      const reader = new FileReader();
      reader.readAsDataURL(f);
      reader.onload = (_event) => {
        this.imgURL = reader.result;
      };
      // console.log(this.imgURL);

      this.selectedPoints = [];
      this.clearVisualizationPoints();
    } else {
      this.isFileSelected = false;
    }
  }

  validatePoints() {
    // if (!(this.selectedPoints && this.selectedPoints.length > 0)) {
    //   alert('No points to clear!!');
    //   return;
    // }
    return this.selectedPoints && this.selectedPoints.length > 0;
  }

  clearPointsSelectionChangeEvent($event, selection: ClearPointsSelection) {
    // console.log($event, selection);
    this.clearPointsSelection = selection;
  }

  clearPointsHelper() {
    if (!this.validatePoints()) {
      alert('No points to clear!!');
      return;
    }

    if (this.clearPointsSelection == ClearPointsSelection.ALL) {
      this.clearPoints('', true);
    } else if (this.clearPointsSelection == ClearPointsSelection.SPECIFIC) {
      this.clearPoints(this.txtPointIndices.nativeElement.value, false);
    } else {
      alert('Please select how you want to clear the points!');
    }
  }

  // indices -> CSV string
  clearPoints(indices_string: string = '', clearAll: boolean = false) {
    if (clearAll) {
      this.selectedPoints = [];
      this.clearVisualizationPoints();
    } else {
      // Regex for CSV numbers
      var regex = /^[0-9]+(,[0-9]+)*$/;
      if (!regex.test(indices_string)) {
        alert('Please enter only CSV numbers');
        return;
      }

      var indices = indices_string.split(',').map((val) => {
        return parseInt(val, 10); // 10 -> decimals
      });

      this.clearVisualizationPoints();
      // sort indices in reverse order.
      indices.sort((a, b) => b - a);
      // remove each element
      indices.forEach((elmnt) => {
        var removed_point = this.selectedPoints.splice(elmnt, 1);
      });
      this.refillVisualizationPoints();
    }
  }

  // TODO: Remove all absolute points from the visualization screen
  clearVisualizationPoints() {
    const elements = this.document.getElementsByClassName(
      'dot-div' + ' ' + 'instance-' + this.instance_id.toString()
    );
    for (let element of Array.from(elements)) {
      element.remove();
    }
  }

  // TODO: Refill all visualization points if any of them have been cleared.
  refillVisualizationPoints() {
    this.selectedPoints.forEach((element, index) => {
      this.drawPoint(element['pagePoint'], 3, index.toString());
    });
  }

  trackCurrentPos(pos: any) {
    this.currentPos = { x: pos.x, y: pos.y };
  }

  imageClickEvent(event: any) {
    this.clickPos = this.currentPos;
    var absPoint = { x: event.pageX, y: event.pageY };
    // console.log(this.clickPos);
    // console.log(event);

    // TODO: Push ClickPositions into an array
    if (!this.selectedPoints) this.selectedPoints = [];
    this.selectedPoints.push({ imgPoint: this.clickPos, pagePoint: absPoint });
    var elmntIndex = this.selectedPoints?.length - 1;

    this.drawPoint(absPoint, 5, elmntIndex.toString());
  }

  drawPoint(pos, size: number = 3, label: string) {
    var dotDiv = this.document.createElement('div');
    dotDiv.className = 'dot-div' + ' ' + 'instance-' + this.instance_id;
    dotDiv.style.position = 'absolute';
    dotDiv.style.top = pos.y - size / 2 + 'px';
    dotDiv.style.left = pos.x - size / 2 + 'px';
    dotDiv.style.height = size + 'px';
    dotDiv.style.width = size + 'px';
    dotDiv.style.backgroundColor = 'red';
    dotDiv.style.color = 'red';
    dotDiv.style.cursor = 'crosshair';
    dotDiv.innerText = label;

    this.document.body.appendChild(dotDiv);
  }

  imgZoomMouseOverEvent() {
    this.myImg.nativeElement.focus();
  }

  // TODO: Export Click Positions into a JSON file
  exportToJSON(text: string = 'export') {
    var regex = /^[\w\-. ]+$/;
    if (!regex.test(text)) {
      alert('Invalid filename. Please provid valid characters!');
      return;
    }

    if (!this.validatePoints()) {
      alert('No points to export!!');
      return;
    }

    var pointsArray = this.selectedPoints.map((elmnt) => {
      return elmnt['imgPoint'];
    });
    var obj = { points: pointsArray };
    var blob = new Blob([JSON.stringify(obj)], { type: 'application/json' });
    saveAs(blob, text + '.json');
  }

  // TODO: Clear Annotations.
}
