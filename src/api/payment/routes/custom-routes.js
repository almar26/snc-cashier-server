"use strict"

module.exports = {
    routes: [
        {
            method: "GET",
            path: '/payment/list/:studentid',
            handler: 'custom-controller.getPaymentDetails'
        },
        {
            method: "GET",
            path: '/payment/summary',
            handler: 'custom-controller.summary'
        },    
        {
            method: "GET",
            path: '/payment/dues',
            handler: 'custom-controller.dues'
        },    
    ]
}