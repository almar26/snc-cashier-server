const tuitionFee = require("../../tuition-fee/controllers/tuition-fee");

//@ts-ignore
const { createCoreController } = require("@strapi/strapi").factories;
module.exports = createCoreController(
  "api::student-info.student-info",
  ({ strapi }) => ({
    async testApi(ctx) {
      ctx.body = "Hello World";
      ctx.status = 200;
    },

    async getStudentList(ctx) {
      try {
        console.log("[getStudentList] Incoming Request");
        const result = await strapi
          .documents("api::student-info.student-info")
          .findMany({
            orderBy: { id: "DESC" },
          });

        if (result) {
          ctx.status = 200;
          return (ctx.body = result);
        }
      } catch (err) {
        console.log("[getStudentList] Error: ", err.message);
        return ctx.badRequest(err.message, err);
      }
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
          course_type,
          tuition_fee,
          discount,
          downpayment,
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
          return (ctx.body = existingPayload);
        }

        // Create a new record, if there is no existing record
        const result = await strapi
          .documents("api::student-info.student-info")
          .create({
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
              contact_number: contact_number,
              course_type: course_type,
            },
          });

        // Calculate the monthly payment
        const total_payment = downpayment + discount;
        const balance = tuition_fee - total_payment;
        const monthly_payment = balance / 6;
        console.log("Total payment: ", total_payment);
        console.log("Balance: ", balance);
        console.log("Monthly Payment: ", monthly_payment);

        // Create tuition fee data
        const tuition_fee_result = await strapi
          .documents("api::tuition-fee.tuition-fee")
          .create({
            data: {
              student_id: result.documentId,
              student_no: student_no,
              semester: semester,
              school_year: school_year,
              tuition_fee: tuition_fee,
              discount: discount,
              downpayment: downpayment,
              lt_prelim_amount: monthly_payment,
              prelim_amount: monthly_payment,
              lt_midterm_amount: monthly_payment,
              midterm_amount: monthly_payment,
              pre_finals_amount: monthly_payment,
              finals_amount: monthly_payment,
              balance: balance,
              student_info: {
                connect: [result.id],
              },
            },
          });

        // Create Payment data
        await strapi.documents("api::payment.payment").create({
          data: {
            tuition_fee_id: tuition_fee_result.documentId,
            student_id: result.documentId,
            student_no: student_no,
            semester: semester,
            school_year: school_year,
            tuition_fee_amount: tuition_fee,
            tuition_fee: {
              connect: [tuition_fee_result.id],
            },
            student_info: {
              connect: [result.id],
            },
          },
        });
        console.log("result: ", result);
        if (result) {
          myPayload.data = result;
          ctx.status = 200;
          return (ctx.body = myPayload);
        }
      } catch (err) {
        console.log("[createStudent] Error: ", err.message);
        return ctx.badRequest(err.message, err);
      }
    },

    async getStudentDetails(ctx) {
      try {
        console.log("[getStudentDetails] Incoming Request 1");
        const { documentid } = ctx.params;

        let myPayload = {
          data: [],
          message: "Successfully fetch data!",
          status: "success",
        };

        const result = await strapi
          .documents("api::student-info.student-info")
          .findOne({
            documentId: documentid,
            populate: ["tuition_fee", "payment"],
          });

        console.log(result);
        if (result) {
          myPayload.data = result;
          ctx.status = 200;
          return (ctx.body = myPayload);
        }
      } catch (err) {
        console.log("[getStudentDetails] Error: ", err.message);
        return ctx.badRequest(err.message, err);
      }
    },

    async getStudentsTuitionFeeList(ctx) {
      try {
        console.log("[getStudentsTuitionFeeList] Incoming Request");
        const result = await strapi
          .documents("api::student-info.student-info")
          .findMany({
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

    // Search Student Account Info
    async searchStudentAccount(ctx) {
      try {
        console.log("[searchStudentAccount] Incoming Request");
        const queryObj = ctx.request.query;
        console.log("Query Params: ", queryObj);

        const result = await strapi
          .documents("api::student-info.student-info")
          .findMany({
            where: {
              $or: [
                {
                  student_no: queryObj.searchid,
                },
                {
                  last_name: { $eqi: queryObj.searchid},
                },
                {
                  first_name: { $eqi: queryObj.searchid },
                },
              ],
            },
            orderBy: { student_no: "ASC" },
          });

        if (result) {
          ctx.status = 200;
          return (ctx.body = result);
        }
      } catch (err) {
        console.log("[searchStudentAccount] Error: ", err.message);
        return ctx.badRequest(err.message, err);
      }
    },

    


  })
);
