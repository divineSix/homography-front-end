import { HttpContext } from '@angular/common/http';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';

// Library
import { saveAs } from 'file-saver';
import panzoom, { PanZoomOptions } from 'panzoom';
import { Action } from 'rxjs/internal/scheduler/Action';

// Local Files
import { ClearType, ActionModes } from 'src/app/utils';

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
  @Input() allow_axes: boolean = true;

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
      var ignore = !event.ctrlKey;
      return ignore;
    }
  }

  // Mouse Coordinate
  public currPoint: any;

  inpFile: File;
  inpFileName: string = '';
  imgURL: any = '#';
  // Store the rendered image as an object, for quick redrawing of the canvas background. 
  imageObj: any = null;
  isFileSelected: boolean = false;
  
  // Point Coordinates stored for Homography. 
  selectedPoints: any[] = [];
  
  // Perpendicular paths for visualization
  axesPaths: any[] = []; 
  
  clearPointsSelection: ClearType = ClearType.NONE;
  clrTypes = ClearType;

  // Primary Mode
  currentActionMode: ActionModes = ActionModes.VIS_AXES
  action_modes = ActionModes;

  // ----------------------------------------------- ** -------------------------------- //

  // HTML Element References
  @ViewChild('myCanvas') myCanvasElement: ElementRef;
  @ViewChild('txtPointIndices', { static: false }) txtPointIndices: ElementRef;

  constructor() { }

  ngOnInit() {
    this.currentActionMode = (this.allow_axes) ? ActionModes.VIS_AXES : ActionModes.SELECT_POINTS
    // console.log(this.allow_axes, this.currentActionMode == ActionModes.VIS_AXES)
  }

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

  lineEquation(point1, point2) {
    

    // return slope, intercept
  }

  getX(y, coeffs) {
    var a = coeffs["a"], b = coeffs["b"], c = coeffs["c"]
    var x = null
    if (b == 0) {
      // Vertical Line
      x = -c/a;
    }
    else {
      // Normal Line
      x = -(b*y + c)/a
    }
    return x
  }

  getY(x, coeffs) {
    var a = coeffs["a"], b = coeffs["b"], c = coeffs["c"]
    var y = null
    if (a == 0) {
      // Horizontal Line
      y = -c/b;
    }
    else {
      // Normal Line
      y = -(a*x + c)/b
    }
    return y
  }

  getLineEquation(point1, point2) {
    var slope = null, intercept = null
    var coeffs = null
    if (point1.x - point2.x == 0) {
      // Slope is null => Eqn: x = point1.x
      slope = null;
      coeffs = {
        // [1, 0, -point1.x]
        a: 1,
        b: 0,
        c: -point1.x
      }
    } else {
      slope = (point1.y - point2.y)/(point1.x - point2.x)
      intercept = point2.y - (slope * point2.x)
      coeffs = {
        // [slope, -1, intercept]
        a: slope,
        b: -1,
        c: intercept
      }
    }
    return coeffs
  }

  getCornerPoints(canvasContext, slope, intercept, point) {
    var sp = null, ep = null
    if (slope === null) {
      // Vertical Line
      sp = { x: point.x, y: 0}
      ep = { x: point.x, y: canvasContext.canvas.height}
    } 
    else if (slope == 0) {
      // Horizontal Line
      sp = { x: 0, y: point.y},
      ep = { x: canvasContext.canvas.width, y: point.y}
    }
    else {
      sp = { x: (0 - intercept)/slope, y: 0}
      ep = { x: (canvasContext.canvas.height - intercept)/slope, y: canvasContext.canvas.height}
    }

    return {sp, ep}
  }
  
  drawLine(canvasContext, points, color: string) {
    canvasContext.strokeStyle = color;
    canvasContext.beginPath();
    canvasContext.moveTo(points[0].x, points[0].y);
    for (var i = 1; i < points.length; i++) {
      canvasContext.lineTo(points[i].x, points[i].y);
    }
    canvasContext.stroke();
  }

  // TODO: Remove this 
  tempLines(context, points) {
    // canvasContext.fillStyle = "orangered";
    // canvasContext.font = "bold 12px Serif";

    // // Fill point at the center.
    // canvasContext.fillRect(point.x - 1, point.y - 1, 2,2);
    // canvasContext.fillText(text, point.x + 5, point.y + 5);

    var point1 = points[0]
    var point2 = points[1]
    var point3 = points[2]
    var point4 = points[3]

    // TODO: Handling horizontal or vertical lines pending.  
    var slope = (point2.y - point1.y)/(point2.x - point1.x)
    var intercept = point2.y - (slope * point2.x)

    // Start Point
    var sp = {
        x: (0 - intercept)/slope,
        y: 0
    }
    var ep = {
        x: (context.canvas.height - intercept)/slope,
        y: context.canvas.height
    }
    context.strokeStyle = "pink";
    context.beginPath();
    context.moveTo(sp.x, sp.y);
    context.lineTo(point1.x, point1.y);
    context.lineTo(point2.x, point2.y);
    context.lineTo(ep.x, ep.y)
    context.stroke();
    console.log("Temp Lines: ", sp, point1, point2, ep, slope, intercept)

    // Perpendicular line
    var mid_point = {
        x: (point1.x + point2.x)/2,
        y: (point1.y + point2.y)/2
    }
    var new_slope = (point4.y - point3.y)/(point4.x - point3.x)
    var new_intercept = mid_point.y - (new_slope * mid_point.x)
    var nsp = {
        x: (0 - new_intercept)/new_slope,
        y: 0
    }
    var nep = {
        x: (context.canvas.height - new_intercept)/new_slope,
        y: context.canvas.height
    }
    console.log(nsp, nep, new_slope, new_intercept);
    context.strokeStyle = "purple"
    context.beginPath();
    context.moveTo(nsp.x, nsp.y);
    context.lineTo(mid_point.x, mid_point.y);
    context.lineTo(nep.x, nep.y);
    context.stroke();
    console.log("Temp Lines2 : ", nsp, mid_point, nep, slope, intercept)
  }

  // TODO: Remove this 
  drawPerpLines(canvasContext, points) {
    console.log(points)
    
    // Corner points of First Line
    var slope1 = (points[0].x - points[1].x == 0) ? null : (points[0].y - points[1].y)/(points[0].x - points[1].x)
    var intercept1 = (slope1) ? points[0].y - (slope1 * points[0].x) : null
    // var intercept1 = (slope1 === null) ? null : ()
    var cornerpts1 = this.getCornerPoints(canvasContext, slope1, intercept1, points[0])
    console.log(cornerpts1)
    console.log(slope1, intercept1)
    // this.drawPoint(canvasContext, cornerpts1.sp, "SP1")
    // this.drawPoint(canvasContext, cornerpts1.ep, "EP1")
    this.drawLine(canvasContext, [cornerpts1.sp, points[0], points[1], cornerpts1.ep], "yellow");

    var mid_point = { x: (points[0].x + points[1].x)/2, y: (points[0].y + points[1].y)/2}
    this.drawPoint(canvasContext, mid_point, "MP")
    var slope2 = (points[2].x - points[3].x == 0) ? null : (points[2].y - points[3].y)/(points[2].x - points[3].x)
    var intercept2 = (slope2)? mid_point.y - (slope2 * mid_point.x) : null
    var cornerpts2 = this.getCornerPoints(canvasContext, slope2, intercept2, mid_point)
    // this.drawPoint(canvasContext, cornerpts2.sp, "SP2")
    // this.drawPoint(canvasContext, cornerpts2.ep, "EP2")
    this.drawLine(canvasContext, [cornerpts2.sp, mid_point, cornerpts2.ep], "black")


    // TODO: Perpendicular line through midpoint. 
  }

  perpendicularLines(canvasContext, points) {
    var point1 = points[0], point2 = points[1], point3 = points[2], point4 = points[3]
    var paths = []

    // Corner Points for the first line. 
    var slope_1 = (point1.x - point2.x == 0) ? null : (point1.y - point2.y)/(point1.x - point2.x)
    var intercept_1 = (slope_1) ? point1.y - (slope_1 * point1.x) : null
    var corner_pts_1 = this.getCornerPoints(canvasContext, slope_1, intercept_1, point1)
    paths.push([corner_pts_1.sp, point1, point2, corner_pts_1.ep])
    this.drawLine(canvasContext, paths[0], "black")

    // Corner Points for the second line. Slope of the last two points, but passing through the midpoint of first two points. 
    var mid_point = { x: (point1.x + point2.x)/2, y: (point1.y + point2.y)/2 }
    this.drawPoint(canvasContext, mid_point, "MP")
    var slope_2 = (point3.x - point4.x == 0)? null : (point3.y - point4.y)/(point3.x - point4.x)
    var intercept_2 = (slope_2)? mid_point.y - (slope_2 * mid_point.x) : null
    var corner_pts_2 = this.getCornerPoints(canvasContext, slope_2, intercept_2, mid_point)
    paths.push([corner_pts_2.sp, mid_point, corner_pts_2.ep])
    this.drawLine(canvasContext, paths[1], "black")

    return paths
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

    // Redraw any saved visualizations
    this.axesPaths.forEach((path, index) => {
      this.drawLine(context, path, "black");
    })
  }

  clearPointsHelper() {
    console.log(this.currentActionMode == ActionModes.VIS_AXES)
    if (this.clearPointsSelection == ClearType.ALL || this.currentActionMode == ActionModes.VIS_AXES) {
      this.clearPoints(true);
    } else if (this.clearPointsSelection == ClearType.SPECIFIC) {
      this.clearPoints(false, this.txtPointIndices.nativeElement.value);
    } else {
      alert('Please select how you want to clear the points!');
    }
  }

  clearPoints(clearAll: boolean = false, strIndices: string = "") {
    if (clearAll) {
      if (this.currentActionMode == ActionModes.VIS_AXES)
        this.axesPaths = [];
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
    
    this.savePoints()
    
    var regex = /^[\w\-. ]+$/;
    if (!regex.test(fileName)) {
      alert('Invalid filename. Please provid valid characters!');
      return;
    }

    // if (!this.validatePoints()) {
    //   alert('No points to export!!');
    //   return;
    // }

    // // Emit the JSON to parent component. 
    // this.exportPointsEvent.emit(JSON.stringify({ points: this.selectedPoints, id: this.instance_id}));
    
    // Download the file to client side
    var blob = new Blob([JSON.stringify({ points: this.selectedPoints })], { type: 'application/json' });
    saveAs(blob, fileName + '.json');
  }

  savePoints() {
    if (!this.validatePoints()) {
      alert('No points to save!!');
      return;
    }

    // Emit the JSON to parent component, so that it is sent to the server during execution. 
    this.exportPointsEvent.emit(JSON.stringify({ points: this.selectedPoints, id: this.instance_id}));
  }

  visualizeLines(points: string) {
    var regex = /^[0-9]+(,[0-9]+)*$/;
    if (!regex.test(points)) {
      alert('Please enter only CSV numbers');
      return;
    }

    var indices = points.split(',').map((val) => {
      return parseInt(val, 10); // 10 -> decimals
    });

    const canvas = this.myCanvasElement.nativeElement;
    const context = canvas.getContext("2d");
    var line_pts = [];
    indices.forEach(elmnt => line_pts.push(this.selectedPoints[elmnt]))
    console.log(indices)
    console.log(line_pts)
    console.log(this.selectedPoints)
    // TODO: Refactor code properly
    this.tempLines(context, line_pts)

    this.drawPerpLines(context, line_pts)
    
    // Clear All Points from Storage
    this.selectedPoints = [];
  }

  triggerVisualization(strPoints: string) {
    // TODO: Validate that there exist four points. 
    var regex = /^[0-9]+(,[0-9]+)*$/;
    if (!regex.test(strPoints)) {
      alert('Please enter only CSV numbers');
      return;
    }

    // Store corresponding point coordinates
    // TODO: Catch error if invalid selection is passed.
    var error_flag = false;
    var points = strPoints.split(",").map((val) => {
      var a = this.selectedPoints[parseInt(val, 10)];
      if (!a)
        error_flag = true;
      return a
    })
    
    // Selection should have four valid points
    if (points.length != 4 || error_flag) {
      alert('Please select four valid points!');
      return;
    }

    // Visualization
    const canvas = this.myCanvasElement.nativeElement
    const context = canvas.getContext("2d");
    this.axesPaths = this.perpendicularLines(context, points)
  }

  // --------------------------------- ** ----------------------------------- //
  // Mouse Events
  clearPointsSelectionChangeEvent($event, selection: ClearType) {
    // console.log($event, selection);
    this.clearPointsSelection = selection;
  }

  changeActionMode(event: any, action: ActionModes) {
    this.currentActionMode = action
    // console.log(this.currentActionMode, action)
    this.clearPoints(true);
  }

  savePointClick(event: any) {
    // check for Alt Key press, to allow for panning. 
    if (event.ctrlKey) {
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

  mouseCoordinates(event: MouseEvent) {
    let canvas = this.myCanvasElement.nativeElement;
    let context = canvas.getContext('2d');
    let rect = canvas.getBoundingClientRect();
    let currTransform = this.panzoomCanvas.getTransform();
    let zoomFactor = currTransform.scale;

    this.currPoint = {
      x: Math.round((event.clientX - rect.left)/zoomFactor),
      y: Math.round((event.clientY - rect.top)/zoomFactor)
    }
  }

}