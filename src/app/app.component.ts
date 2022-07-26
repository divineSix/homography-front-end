import { Component, VERSION } from '@angular/core';
import { MainService } from './services/main.service';

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  name = 'Angular ' + VERSION.major;

  constructor(private mainService: MainService) {}

  triggerShellScript() {
    var output_string: string = '';
    var isError: boolean = false;
    this.mainService.execShellScript().subscribe({
      next: (data: any) => (output_string = data.msg),
      error: (err: any) => {
        console.log(err);
        isError = true;
      },
    });
  }
}
