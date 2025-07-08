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
            path: '/payment/tuition_fee/summary',
            handler: 'custom-controller.getTuitionFeeSummary'
        },   
        {
            method: "GET",
            path: '/payment/dues',
            handler: 'custom-controller.dues'
        },   
        {
            method: "POST",
            path: '/payment/tuition-payment',
            handler: 'custom-controller.paySelected'
        }, 
        {
            method: "PUT",
            path: '/payment/update-next-due',
            handler: 'custom-controller.updateCurrentDueWithPrevious'
        },
        {
            method: "PUT",
            path: '/payment/update/overdue-status',
            handler: 'custom-controller.updateOverdueStatuses'
        } 
    ]
}