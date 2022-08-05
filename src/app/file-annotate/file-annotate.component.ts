import { HttpContext } from '@angular/common/http';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';

// Library
import { saveAs } from 'file-saver';
import panzoom, { PanZoomOptions } from 'panzoom';

// Local Files
import { ClearPointsSelection } from 'src/app/utils';

// Allow for usage of the Image() constructor
interface Window {
  Image: {
    prototype: HTMLImageElement;
    new (): HTMLImageElement;
  };
}

@Component({
    selector: 'app-file-annotate',
    templateUrl: './file-annotate.component.html',
    styleUrls: ['./file-annotate.component.css']
  })
export class FileAnnotateComponent implements OnInit {

  // Component Inputs
  @Input() title: string = "Empty Annotation Title";
  @Input() instance_id: string = "temporary";

  // Component Emitters / Outputs
  @Output() exportImageFileEvent = new EventEmitter<File>(); // Export the selected image file
  @Output() exportPointsEvent = new EventEmitter<string>(); // Export the selected points

  // ---------------------------------------------- ** ---------------------------------- //

  // CLASS VARIABLES
  panzoomCanvas: any = null;
  panzoomConfig: PanZoomOptions = {
    maxZoom: 20,
    minZoom: 1,
    
    // Allow Pan of Image only if alt key is pressed. 
    beforeMouseDown: (event) => {
      var ignore = !event.altKey;
      return ignore;
    }
  }
  inpFile: File;
  inpFileName: string = '';
  imgURL: any = '#';
  // Store the rendered image as an object, for quick redrawing of the canvas background. 
  imageObj: any = null;
  isFileSelected: boolean = false;
  // List of point co-ordinates stored. 
  selectedPoints: any[] = [];
  clearPointsSelection: ClearPointsSelection = ClearPointsSelection.NONE;
  ClearPointsSelectionType = ClearPointsSelection;

  // ----------------------------------------------- ** -------------------------------- //

  // HTML Element References
  @ViewChild('myCanvas') myCanvasElement: ElementRef;
  @ViewChild('txtPointIndices', { static: false }) txtPointIndices: ElementRef;

  constructor() { }

  ngOnInit() {}

  setupPanzoom() {
    if (this.myCanvasElement) {
      this.panzoomCanvas = panzoom(this.myCanvasElement.nativeElement, this.panzoomConfig);
    }
    else {
      alert("Pan & Zoom cannot be enabled! Please select the source image and try again!!");
      return false;
    }
  }

  validatePoints() {
    return this.selectedPoints && this.selectedPoints.length > 0;
  }

  handleFileInput(evnt) {
    const filesList = evnt.target.files;
    // console.log(filesList);
    if (filesList.length > 0) {
      const f = filesList[0];
      this.inpFile = f;
      this.inpFileName = f.name;
      this.isFileSelected = true;
      this.setupPanzoom();

      // Emit the image file to parent component. 
      this.exportImageFileEvent.emit(this.inpFile)

      const reader = new FileReader();
      reader.readAsDataURL(f);
      reader.onload = (_event) => {
        this.imgURL = reader.result;
        this.updateCanvasBackground();
      };
      this.selectedPoints = [];
    } else {
      this.isFileSelected = false;
    }
  }

  updateCanvasBackground() {
    if (!this.imageObj) {
      this.imageObj = new window.Image();
    }
    this.imageObj.src = this.imgURL;
    this.imageObj.onload = () => {
      this.drawBackground(this.imageObj);
    }
  }

  // Input: Image object
  drawBackground(image: any) {
    const canvas = this.myCanvasElement.nativeElement;
    const context = canvas.getContext('2d');
    canvas.width = image.width;
    canvas.height = image.height;
    context.drawImage(image, 0, 0);
  }

  drawPoint(canvasContext, point, text: string) {
    canvasContext.fillStyle = "orangered";
    canvasContext.font = "bold 12px Serif";

    // Fill point at the center.
    canvasContext.fillRect(point.x - 1, point.y - 1, 2,2);
    canvasContext.fillText(text, point.x + 5, point.y + 5);
  }

  // Redraw Canvas image & stored points
  redrawCanvas() {
    const canvas = this.myCanvasElement.nativeElement;
    const context = canvas.getContext("2d");
    
    // Clear & Redraw canvas background
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (this.imageObj) {
      this.drawBackground(this.imageObj);
    }

    // Redraw the new points
    this.selectedPoints.forEach((element, index) => {
      this.drawPoint(context, element, index.toString());
    })
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

  clearPoints(strIndices: string, clearAll: boolean = false) {
    if (clearAll) {
      this.selectedPoints = [];
    } else {
      // Check indices string for CSV numbers
      var regex = /^[0-9]+(,[0-9]+)*$/;
      if (!regex.test(strIndices)) {
        alert('Please enter only CSV numbers');
        return;
      }

      var indices = strIndices.split(',').map((val) => {
        return parseInt(val, 10); // 10 -> decimals
      });

      indices.sort((a, b) => b - a);
      // remove each element
      indices.forEach((elmnt) => {
        var removed_point = this.selectedPoints.splice(elmnt, 1);
      });
    }
    this.redrawCanvas();
  }

  exportToJSON(fileName: string) {
    var regex = /^[\w\-. ]+$/;
    if (!regex.test(fileName)) {
      alert('Invalid filename. Please provid valid characters!');
      return;
    }

    if (!this.validatePoints()) {
      alert('No points to export!!');
      return;
    }

    // Emit the JSON to parent component. 
    this.exportPointsEvent.emit(JSON.stringify({ points: this.selectedPoints, id: this.instance_id}));
    
    var blob = new Blob([JSON.stringify({ points: this.selectedPoints })], { type: 'application/json' });
    saveAs(blob, fileName + '.json');
  }

  // --------------------------------- ** ----------------------------------- //
  // Mouse Events
  clearPointsSelectionChangeEvent($event, selection: ClearPointsSelection) {
    // console.log($event, selection);
    this.clearPointsSelection = selection;
  }

  savePointClick(event: any) {
    // check for Alt Key press, to allow for panning. 
    if (event.altKey) {
      return false;
    }
    
    let canvas = this.myCanvasElement.nativeElement;
    let context = canvas.getContext('2d');
    let rect = canvas.getBoundingClientRect();
    let currTransform = this.panzoomCanvas.getTransform();
    let zoomFactor = currTransform.scale;

    // Calculate relative co-ordinates
    let point = {
      x: Math.round((event.clientX - rect.left)/zoomFactor),
      y: Math.round((event.clientY - rect.top)/zoomFactor)
    };

    let newIndex = this.selectedPoints.length;
    this.selectedPoints.push(point);
    this.drawPoint(context, point, newIndex.toString());
  }

}