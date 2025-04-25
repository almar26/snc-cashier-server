//@ts-ignore
const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::tuition-fee.tuition-fee',
    ({ strapi }) => ({
        async getStudentTuitionFee(ctx) {
            try {

                const result = await strapi.documents("api::tuition-fee.tuition-fee").findMany({
                    populate: ["student_info", "payment"]
                })

                if (result) {
                    ctx.status = 200;
                    return ctx.body = result;
                }
            } catch (err) {
                return ctx.badRequest(err.message, err);
            }
        },

        // Get Student Tuition-Fee details
    async getStudentTuitionFeeDetails(ctx) {
        try {
          console.log("[getStudentTuitionFeeDetails] Incoming Request");
          const { documentid } = ctx.params;
            const result = await strapi
            .documents("api::student-info.student-info")
            .findOne({
              documentId: documentid,
              populate: ["tuition_fee", "payment"],
            });
          if (result) {
            ctx.status = 200;
            return (ctx.body = result);
          }
        } catch (err) {
          return ctx.badRequest(err.message, err);
        }
      },
    })
);
