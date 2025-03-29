"use strict"

module.exports = {
    routes: [
        {
            method: "GET",
            path: '/student/test',
            handler: 'custom-controller.testApi'
        },
        {
            method: "POST",
            path: '/student-info/create',
            handler: 'custom-controller.createStudent'
        }
        
    ]
}