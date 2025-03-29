//@ts-ignore
const { createCoreController } = require("@strapi/strapi").factories;
module.exports = createCoreController(
  "api::student-info.student-info",
  ({ strapi }) => ({
    async testApi(ctx) {
      ctx.body = "Hello World";
      ctx.status = 200;
    },

    async createStudent(ctx) {
      try {
        console.log("[createStudent] Incoming Request");
        let {
          student_id,
          student_no,
          semester,
          school_year,
          course,
          course_code,
          major,
          section,
          last_name,
          first_name,
          middle_name,
          gender,
          contact_number,
        } = ctx.request.body;

        let myPayload = {
          data: {},
          message: "Successfully Created!",
          status: "success",
        };

        let existingPayload = {
          message: `Student no "${student_no}" already exist!`,
          status: "fail",
        };

        // Check if there is an existing record
        const checkDuplicate = await strapi
          .documents("api::student-info.student-info")
          .findMany({
            filters: {
              student_no: {
                $startsWith: student_no,
              },
            },
          });

          if (checkDuplicate.length != 0) {
            console.log("[createStudent] Error: ", checkDuplicate);
            return ctx.body = existingPayload;
          }


          // Create a new record, if there is no existing record
          const result = await strapi.documents('api::student-info.student-info').create({
            data: {
                student_id: student_id,
                semester: semester,
                school_year: school_year,
                student_no: student_no,
                course: course,
                course_code: course_code,
                major: major,
                section: section,
                last_name: last_name,
                first_name: first_name,
                middle_name: middle_name,
                gender: gender,
                contact_number: contact_number
            }
          });

          if (result) {
            myPayload.data = result;
            ctx.status = 200;
            return ctx.body = myPayload;
          }



      } catch (err) {
        console.log("[createStudent] Error: ", err.message);
        return ctx.badRequest(err.message, err);
      }
    },
  })
);
