'use strict';

/**
 * tuition-fee service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::tuition-fee.tuition-fee');
