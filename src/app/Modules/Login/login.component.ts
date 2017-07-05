import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { AuthService } from '../../common/services/auth.service';

@Component({
    moduleId: module.id,
    templateUrl: 'login.component.html',
    styleUrls: ['login.component.scss']
})

export class LoginComponent implements OnInit {
    model: any = {};
    loading = false;
    returnUrl: string;

    constructor(
        private route: ActivatedRoute,
        private auth: AuthService,
        private router: Router){ }

        // private authenticationService: AuthenticationService,
        // private alertService: AlertService) { }

    ngOnInit() {

    }

    btnLogin() {
        this.loading = true;
        this.auth.getToken().then(resole =>{
            this.router.navigate(["home"]);
        })
    }
}