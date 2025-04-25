"use strict"

module.exports = {
    routes: [
        {
            method: "GET",
            path: '/student/test',
            handler: 'custom-controller.testApi'
        },
        {
            method: "GET",
            path: '/student/list',
            handler: 'custom-controller.getStudentList'
        },
        {
            method: "POST",
            path: '/student-info/create',
            handler: 'custom-controller.createStudent'
        },
        {
            method: "GET",
            path: '/student-info/:documentid',
            handler: 'custom-controller.getStudentDetails'
        },
        {
            method: "GET",
            path: '/student-info/list/tuition-fee',
            handler: 'custom-controller.getStudentsTuitionFeeList'
        },
        {
            method: "GET",
            path: '/student-info/account/search',
            handler: 'custom-controller.searchStudentAccount'
        },
   
        
    ]
}