import { Component } from "@angular/core";
import { MainService } from "../services/main.service";

@Component({
    selector: 'app-config-selector',
    templateUrl: './config-selector.component.html',
  })
  export class ConfigSelectorComponent {
    constructor(private mainService: MainService) {}

    triggerStartScript() {
        this.mainService.execStartScript().subscribe({
            next: (data: any) => {
                if(data.message) {
                    alert(data.message);
                }
            },
            error: (err: any) => {
                
            },
        });
    }

    triggerStopScript() {
        this.mainService.execStopScript().subscribe({
            next: (data: any) => {
                if(data.message) {
                    alert(data.message);
                }
            },
            error: (err: any) => {
                
            },
        });
    }
  }