//@ts-ignore
const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::tuition-fee.tuition-fee',
    ({ strapi }) => ({
        async getStudentTuitionFee(ctx) {
            try {

                const result = await strapi.documents("api::tuition-fee.tuition-fee").findMany({
                    populate: ["studentid"]
                })

                if (result) {
                    ctx.status = 200;
                    return ctx.body = result;
                }
            } catch (err) {
                return ctx.badRequest(err.message, err);
            }
        }
    })
);
