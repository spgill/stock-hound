let app = angular.module('com.spgill.StockHound', [
    'ngMaterial',
    'vcRecaptcha',

    'com.spgill.StockHound.config'
])

app.controller('MainController', function($http, $mdDialog, vcRecaptchaService) {

    // VARIABLES
    this.key = '6Lf5Gx8UAAAAAL4CoiBySAXzJRr5KaYSHuNgOZDd'
    this.store_list = []
    this.busy = false

    // FORM VARIABLES
    this.store = ''
    this.product = ''
    this.email = ''
    this.verification = ''


    this.init = () => {
        // Fetch the list of stores
        $http.get('/json/store_list.json').then(
            (response) => {
                this.store_list = response.data
            },
            (response) => {
                alert('An error occurred fetching store list. Try reloading page.')
            }
        )
    }

    // Determine if the form is ready to submit
    this.ready = () => {
        return !(this.store && this.product && this.email && this.verification)
    }

    // Submit to the server
    this.submit = (confirmed = false) => {
        this.busy = true
        $http.post('/submit', {
            address: this.email,
            product: this.product,
            location: this.store,
            recaptcha: this.verification,
            confirm: confirmed
        }).then(
            // success
            (response) => {
                if (response.data.payload == 'confirm') {

                    let confirmation = $mdDialog.confirm({
                        title: 'Confirmation required',
                        textContent: response.data.message,
                        ok: 'Yes, please',
                        cancel: 'No, thank you'
                    })

                    $mdDialog.show(confirmation).then(
                        () => {
                            this.submit(true)
                        },
                        () => {
                            this.busy = false
                        }
                    )

                } else {
                    let alert = $mdDialog.alert({
                        title: 'Success!',
                        textContent: response.data.message,
                        ok: 'Close'
                    })

                    $mdDialog.show(alert)

                    vcRecaptchaService.reload()
                    
                    this.busy = false
                }
            },

            // error
            (response) => {
                let content = ''
                if (response.status == 500) {
                    vcRecaptchaService.reload()

                    content = 'Internal server error'
                } else {
                    content = response.data.message
                }

                let alert = $mdDialog.alert({
                    title: 'Error',
                    textContent: content,
                    ok: 'Close'
                })

                $mdDialog.show(alert)

                this.busy = false
            }
        )
    }

    // Open the attributions and disclaimers popup
    this.popup = (ev) => {
        $mdDialog.show({
            templateUrl: '/html/attdis.html',
            autoWrap: false,
            targetEvent: ev,
            controller: function ($scope, $mdDialog) {
                $scope.close = $mdDialog.cancel
            }
        })
    }

})
