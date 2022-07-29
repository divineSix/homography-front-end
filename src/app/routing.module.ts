
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component'
import { ComputeHomographyComponent } from './compute-homography/compute-homography.component';
import { VisualizeHomographyComponent } from './visualize-homography/visualize-homography.component';

const routes: Routes = [
    { path: "compute", component: ComputeHomographyComponent},
    { path: "visualize", component: VisualizeHomographyComponent}
];

// configures NgModule imports and exports
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})

export class AppRoutingModule {}