// import { HttpClient, HttpErrorResponse, HttpEvent, HttpHeaders, HttpRequest, HttpResponse } from '@angular/common/http';
// import { Injectable } from '@angular/core';
// import { KnownHttpHeaders, KnownHttpMethods, OData, PossibleNameSpace, XtendedBreezeHttpResponse } from '@atypes';
// import { SpCtxRepoService } from '@data/repo-managers/sp-ctx-repo.service';
// import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';
// import { DataProperty, DataType, MetadataStore } from 'breeze-client';
// import { filter } from 'rxjs/operators';
// import Swal from 'sweetalert2';
// import { SpJsonResultsAdapterService } from './sp-jra.service';

// interface IEntityError {
//     ErrorName: string;
//     EntityTypeName: string;
//     PropertyName: string;
//     ErrorMessage: string;
//     KeyValues: unknown;
// }

// interface IDotNetError {
//     Message?: string;
//     ExceptionMessage?: string;
//     EntityErrors?: IEntityError[];
//     Errors?: IEntityError[];
//     InnerException?: IDotNetError;
// }

// @Injectable({ providedIn: 'root' })
// export class SpDataUtilService {

//     constructor(
//         private httpClient: HttpClient,
//         private spContextRepo: SpCtxRepoService,
//         private fuseProgress: FuseProgressBarService
//     ) {

//     }

//     // getAbsoluteUrl(dataService: XtendedDataService, url: string): string {
//     //     const serviceName = dataService.qualifyUrl('');
//     //     // only prefix with serviceName if not already on the url
//     //     let base = core.stringStartsWith(url, serviceName) ? '' : serviceName;
//     //     // If no protocol, turn base into an absolute URI
//     //     if (window && serviceName.indexOf('//') < 0) {
//     //         // no protocol; make it absolute
//     //         base =
//     //             window.location.protocol +
//     //             '//' +
//     //             window.location.host +
//     //             (core.stringStartsWith(serviceName, '/') ? '' : '/') +
//     //             base;
//     //     }
//     //     return base + url;
//     // }

// }
