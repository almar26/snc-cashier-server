const { parseISO, isBefore, isToday } = require("date-fns");
//@ts-ignore
const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::payment.payment", ({ strapi }) => ({
  async getPaymentDetails(ctx) {
    try {
      console.log("[getPaymentDetails] Incoming Request");
      const { studentid } = ctx.params;
      const result = await strapi.documents("api::payment.payment").findMany({
        filters: {
          student_id: studentid,
          payment_type: "tuition_fee",
        },
        orderBy: { payment_number: "ASC" },
      });

      if (result) {
        ctx.status = 200;
        return (ctx.body = result);
      }
    } catch (err) {
      console.log("[getPaymentDetails] Error: ", err.message);
      return ctx.badRequest(err.message, err);
    }
  },

  async dues(ctx) {
    const { tuitionid } = ctx.params;
    const queryObj = ctx.request.query;
    const studentid = queryObj.student_id;
    const semester = queryObj.semester;
    const school_year = queryObj.school_year;
   

    // Get unpaid or partially paid invoices of this student
    const invoices = await strapi.entityService.findMany(
      "api::payment.payment",
      {
        fields: [
          "payment_number",
          "payment_name",
          "payment_amount",
          "amount_paid",
          "due_date",
          "payment_status",
          "createdAt",
        ],
        filters: {
          student_id: queryObj.student_id,
          semester: queryObj.semester,
          school_year: queryObj.school_year,
          payment_status: ["unpaid", "partial", "paid"],
        },
        orderBy: { payment_number: "ASC" },
        pagination: { pageSize: 1000 },
      }
    );
    console.log("Invoices: ", invoices);
    const payment_summary = invoices;

    if (invoices.length === 0) {
      return ctx.send({ 
        message: 'No Tuition Fee found',
        status: 'fail'
      }, 200);
    }

     const today = new Date();
    let previousDue = 0;
    let currentDue = 0;
    let totalAmountDue = 0;
    let totalBalance = 0;
    

    console.log("Date Today:", today);

    const enrichedInvoices = invoices.map(invoice => {
      const balance = invoice.payment_amount - invoice.amount_paid;
      // if (balance <= 0) return null;

      const dueDate = parseISO(invoice.due_date);
      const dueToday = isToday(dueDate);
      const overdue = !dueToday && isBefore(dueDate, today);

      if (overdue) {
        previousDue += balance;
      } else if (dueToday) {
        currentDue += balance;
      }

      totalBalance += balance;
      totalAmountDue = previousDue + currentDue;

      return {
        ...invoice,
        balance,
        isOverdue: overdue,
        isDueToday: dueToday
      }
    }).filter(Boolean);

    ctx.body = {
      studentid,
      semester,
       school_year,
      previousDue,
      currentDue,
      totalAmountDue,
      //payment_summary,
      totalBalance,
      invoices: enrichedInvoices,
    };
  },

  async summary(ctx) {
    const today = new Date();

    // Fetch all invoices
    const invoices = await strapi.entityService.findMany(
      "api::payment.payment",
      {
        fields: ["payment_amount", "amount_paid", "due_date"],
        filters: {
          payment_status: { $ne: "paid" },
        },
        pagination: { pageSize: 1000 },
      }
    );

    let totalAmountDue = 0;
    let previousDue = 0;

    for (const invoice of invoices) {
      const balance = invoice.payment_amount - invoice.amount_paid;

      if (balance > 0) {
        totalAmountDue += balance;

        if (isBefore(parseISO(invoice.due_date), today)) {
          previousDue += balance;
        }
      }
    }

    ctx.body = {
      totalAmountDue,
      previousDue,
    };
  },

  async paySelected(ctx) {
    const updates = ctx.request.body;

    if (!Array.isArray(updates)) {
      return ctx.badRequest('Request body must be an array');
    }

    try {
      const results = await Promise.all(
        updates.map(async (update) => {
          const { id, ...fields } = update;
          if(!id || Object.keys(fields).length === 0) return null;

          return await strapi.entityService.update("api::payment.payment", id, {
            data: fields,
          })
        })
      );
      return ctx.send({ success: true, results });
    } catch (err) {
      return ctx.internalServerError('Bulk update failed', err);
    }
  }
}));
