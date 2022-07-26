import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { HelloComponent } from './hello.component';
import { FileBrowseComponent } from './file-browse/file-browse.component';
import { HttpClientModule } from '@angular/common/http';
import { MainService } from './services/main.service';

// import { MatIconModule } from '@angular/material/icon';
// import { MatButtonModule } from '@angular/material/button';
// import { MatInputModule } from '@angular/material/input';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatToolbarModule } from '@angular/material/toolbar';
// import { MatCardModule } from '@angular/material/card';
// import { MatDividerModule } from '@angular/material/divider';
// import { MatListModule } from '@angular/material/list';
import { NgxImageZoomModule } from 'ngx-image-zoom';

// const materialModules = [
//   MatIconModule,
//   MatButtonModule,
//   MatInputModule,
//   MatFormFieldModule,
//   MatToolbarModule,
//   MatCardModule,
//   MatDividerModule,
//   MatListModule,
// ];

@NgModule({
  imports: [BrowserModule, FormsModule, NgxImageZoomModule, HttpClientModule],
  declarations: [AppComponent, HelloComponent, FileBrowseComponent],
  bootstrap: [AppComponent],
  providers: [MainService],
})
export class AppModule {}
