"use strict"

module.exports = {
    routes: [
        {
            method: "GET",
            path: '/tuition-fee/list',
            handler: 'custom-controller.getStudentTuitionFee'
        },
        {
            method: "GET",
            path: '/tuition-fee/account/:documentid',
            handler: 'custom-controller.getStudentTuitionFeeDetails'
        }
        
    ]
}