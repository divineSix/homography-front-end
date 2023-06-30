
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component'
import { ComputeHomographyComponent } from './compute-homography/compute-homography.component';
import { VisualizeHomographyComponent } from './visualize-homography/visualize-homography.component';
import { ConfigSelectorComponent } from './config-selector/config-selector.component';
// import { ExperimentComponent } from './experiment/experiment.component';

const routes: Routes = [
    { path: "compute", component: ComputeHomographyComponent},
    { path: "visualize", component: VisualizeHomographyComponent},
    { path: "config", component: ConfigSelectorComponent},
    // { path: "experiment", component: ExperimentComponent}
];

// configures NgModule imports and exports
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})

export class AppRoutingModule {}