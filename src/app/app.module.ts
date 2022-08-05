import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MainService } from './services/main.service';
// import { RouterModule } from '@angular/router';
import { AppRoutingModule } from './routing.module';
import { NgxImageZoomModule } from 'ngx-image-zoom';

// Components
import { AppComponent } from './app.component';
import { HelloComponent } from './hello.component';
import { FileBrowseComponent } from './file-browse/file-browse.component';
import { VisualizeHomographyComponent } from './visualize-homography/visualize-homography.component';
import { ComputeHomographyComponent } from './compute-homography/compute-homography.component';
import { FileAnnotateComponent } from './file-annotate/file-annotate.component';

@NgModule({
  imports: [
    BrowserModule, FormsModule, NgxImageZoomModule, HttpClientModule, AppRoutingModule
  ],
  declarations: [AppComponent, HelloComponent, FileBrowseComponent, VisualizeHomographyComponent, ComputeHomographyComponent, FileAnnotateComponent],
  bootstrap: [AppComponent],
  providers: [MainService],
})
export class AppModule {}
