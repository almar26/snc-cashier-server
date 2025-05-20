const { parseISO, isBefore } = require('date-fns');
//@ts-ignore
const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::payment.payment", ({ strapi }) => ({
  async getPaymentDetails(ctx) {
    try {
      console.log("[getPaymentDetails] Incoming Request");
      const { studentid } = ctx.params;
      const result = await strapi
        .documents("api::payment.payment")
        .findMany({
          filters: {
            student_id: studentid,
            payment_type: "tuition_fee"
          },
          orderBy: { payment_number: "ASC" },
        });

        

        if (result) {
            ctx.status = 200;
            return ctx.body = result;
        }
    } catch (err) {
      console.log("[getPaymentDetails] Error: ", err.message);
      return ctx.badRequest(err.message, err);
    }
  },

  async dues(ctx) {
    const { studentid } = ctx.params;

    // Get unpaid or partially paid invoices of this student
    const invoices = await strapi.entityService.findMany('api::payment.payment', {
      fields: ['payment_amount', 'amount_paid', 'due_date', 'payment_status', 'createdAt'],
      filters: {
        student_id: studentid,
        payment_status: { $in: ['unpaid', 'partial']},
      },
      pagination: { pageSize: 1000 }
    });

    let totalAmountDue = 0;
    let previousDue = 0;
    const today = new Date();

    // invoices.forEach(invoice => {
    //   const balance = invoice.payment_amount - invoice.amount_paid;
    //   totalAmountDue += balance;

    //   const dueDate = invoice.due_date;
    //   if(isBefore(parseISO(dueDate), today)) {
    //     previousDue += balance;
    //   }
    // });



        // invoices.forEach(invoice => {
    //   const balance = invoice.payment_amount - invoice.amount_paid;

    //   if (balance > 0) {
    //     totalAmountDue += balance;

    //     const dueDate  = invoice.due_date;
    //     if(isBefore(parseISO(dueDate), today)) {
    //       previousDue += balance;
    //     }
    //   }
    // })

    const enrichedInvoices = invoices.map(invoice => {
       const balance = invoice.payment_amount - invoice.amount_paid;
      totalAmountDue += balance;

      const dueDate = invoice.due_date || invoice.createdAt;
      if (isBefore(parseISO(dueDate), today)) {
        previousDue += balance;
      }

      return {
        ...invoice,
        balance,
        isOverdue: isBefore(parseISO(dueDate), today),
      };
    })


    const currentDue = totalAmountDue - previousDue;

    ctx.body = {
      studentid,
      totalAmountDue,
      previousDue,
      currentDue,
      invoices: enrichedInvoices,
    }
  },

  async summary(ctx) {
    const today = new Date();

    // Fetch all invoices
    const invoices = await strapi.entityService.findMany('api::payment.payment', {
      fields: ['payment_amount', 'amount_paid', 'due_date'],
      filters: {
        payment_status: { $ne: 'paid' },
      },
      pagination: { pageSize: 1000 },
    });

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
    }
  }
}));
