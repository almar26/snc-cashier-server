"use strict"

module.exports = {
    routes: [
        {
            method: "GET",
            path: '/tuition-fee/list',
            handler: 'custom-controller.getStudentTuitionFee'
        },
        
    ]
}