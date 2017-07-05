import {
    Injectable
} from '@angular/core';
import {
    Http,
    Response,
    Headers,
    RequestOptions
} from '@angular/http';

import {
    Observable
} from 'rxjs/Rx';

// Import RxJs required methods
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/toPromise';

@Injectable()
export class AuthService {
    constructor(private http: Http) {}
    // private instance variable to hold base url
    private commentsUrl = 'https://staging.eyeview.city/token';
    getToken(): any {
        // let headers = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' });
        // let options = new RequestOptions({ headers: headers });

        let requestPayload = {
            'grant_type': 'password',
            'username': 'administrator@insightus.com.au',
            'password': 'Insightus@2016',
            'client_id': "b681e44b-7612-4c02-8bcd-69e4b874f4e1",
            'client_secret': "160b935e-9e8c-45c5-8949-d1c681650a08"
        };
      	return this.http.post(this.commentsUrl, this.transformRequestHandler(requestPayload)).toPromise()
            .then(result => result)
            .catch(this.handleError)

    }

    private transformRequestHandler(obj) {
  		let data: string[] = [];
        for (let key in obj) {
            data.push(key + "=" + encodeURIComponent(obj[key]))
        }
        return data.join('&');
    }

    private extractData(res: Response) {
        let body = res.json();
        return body.data || {};
    }

    private handleError(error: Response | any) {
        // In a real world app, we might use a remote logging infrastructure
        let errMsg: string;
        if (error instanceof Response) {
            const body = error.json() || '';
            const err = body.error || JSON.stringify(body);
            errMsg = `${error.status} - ${error.statusText || ''} ${err}`;
        } else {
            errMsg = error.message ? error.message : error.toString();
        }
        console.error(errMsg);
        return Promise.reject(errMsg);
    }
}