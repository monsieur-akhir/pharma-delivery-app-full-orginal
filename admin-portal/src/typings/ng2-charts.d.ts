declare module 'ng2-charts' {
  import { NgModule, Component, Directive } from '@angular/core';
  
  export const BaseChartDirective: any;
  
  /**
   * NgModule declaration for ng2-charts
   */
  export const NgChartsModule: {
    new (): any;
  };
}