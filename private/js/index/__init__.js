let app = angular.module('com.spgill.StockHound', [
    'ngMaterial',
    'vcRecaptcha',

    'com.spgill.StockHound.config'
])

app.controller('MainController', function($http) {

    // VARIABLES
    this.key = '6Lf5Gx8UAAAAAL4CoiBySAXzJRr5KaYSHuNgOZDd'
    this.store_list = []

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

})
