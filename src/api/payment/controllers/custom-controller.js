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
  async getTuitionFeeSummary(ctx) {
    const queryObj = ctx.request.query;
    const studentid = queryObj.student_id;
    const semester = queryObj.semester;
    const school_year = queryObj.school_year;

    // Get unpaid or partially paid tuition of the student
    const tuition_fee_summary = await strapi.entityService.findMany(
      "api::payment.payment",
      {
        fields: [
          "tuition_fee_id",
          "student_id",
          "student_no",
          "semester",
          "school_year",
          "payment_number",
          "payment_name",
          "payment_amount",
          "amount_paid",
          "due_date",
          "date_paid",
          "or_number",
          "payment_status",
          "payment_type",
          "createdAt",
        ],
        filters: {
          student_id: queryObj.student_id,
          semester: queryObj.semester,
          school_year: queryObj.school_year,
          payment_status: ["unpaid", "paid", "overdue", "partial"],
        },
        orderBy: { payment_number: "ASC" },
        pagination: { pageSize: 1000 },
      }
    );
    console.log("Tuition Fee Summary: ", tuition_fee_summary);

    if (tuition_fee_summary.length === 0) {
      return ctx.send(
        {
          message: "No Tuition Fee found",
          status: "fail",
        },
        200
      );
    }

    const today = new Date();
    let previousDue = 0;
    let currentDue = 0;
    let totalAmountDue = 0;
    let totalBalance = 0;
    let totalAmountPaid = 0;

    const enrichedInvoices = tuition_fee_summary
      .map((tuition_summary) => {
        let balance =
          tuition_summary.payment_amount - tuition_summary.amount_paid;
        // if (balance <= 0) return null;
        console.log("Balance: ", balance);
        // if (tuition_summary.payment_status === "overdue") {
        //   balance = 0;
        // }

        const dueDate = parseISO(tuition_summary.due_date);
        const dueToday = isToday(dueDate);
        const overdue = !dueToday && isBefore(dueDate, today);
        console.log("Overdue: ", overdue);
        console.log("Summary: ", tuition_summary);

        if (overdue) {
          previousDue += balance;
        } else if (dueToday) {
          currentDue += balance;
        }

        totalAmountPaid += tuition_summary.amount_paid || 0;

        totalBalance += balance;
        totalAmountDue = previousDue + currentDue;

        return {
          ...tuition_summary,
          balance,
          isOverdue: overdue,
          isDueToday: dueToday,
        };
      })
      .filter(Boolean);

    ctx.body = {
      studentid,
      semester,
      school_year,
      previousDue,
      currentDue,
      totalAmountDue,
      totalAmountPaid,
      //payment_summary,
      totalBalance,
      summary: enrichedInvoices,
    };
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
      return ctx.send(
        {
          message: "No Tuition Fee found",
          status: "fail",
        },
        200
      );
    }

    const today = new Date();
    let previousDue = 0;
    let currentDue = 0;
    let totalAmountDue = 0;
    let totalBalance = 0;

    console.log("Date Today:", today);

    const enrichedInvoices = invoices
      .map((invoice) => {
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
          isDueToday: dueToday,
        };
      })
      .filter(Boolean);

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
      return ctx.badRequest("Request body must be an array");
    }

    try {
      const results = await Promise.all(
        updates.map(async (update) => {
          // const { id, ...fields } = update;
          const { id, ...fields } = update;
          if (!id || Object.keys(fields).length === 0) return null;

          return await strapi.entityService.update("api::payment.payment", id, {
            data: fields,
          });
        })
      );
      return ctx.send({ success: true, results });
    } catch (err) {
      return ctx.internalServerError("Bulk update failed", err);
    }
  },

  async updateCurrentDueWithPrevious(ctx) {
    const { student_id } = ctx.request.body;

    console.log("Update Current Due with Previous");

    if (!student_id) {
      return ctx.badRequest("Missing student id");
    }

    const today = new Date().toISOString();

    console.log("Step 1");
    // Step 1: Get all unpaid previous payments (before today)
    const unpaidPreviousPayments = await strapi.entityService.findMany(
      "api::payment.payment",
      {
        filters: {
          student_id,
          due_date: { $lt: today },
          payment_status: { $ne: ["paid", "overdue"] },
          // payment_status: {
          //   $notIn: ['paid', 'overdue']
          // }
        },
        fields: ["payment_amount", "amount_paid"],
        sort: [{ due_date: "asc" }],
      }
    );

    const tuition_fee_summary = await strapi.entityService.findMany(
      "api::payment.payment",
      {
        filters: {
          student_id,
          payment_status: ["unpaid", "paid", "overdue", "partial"],
        },
        orderBy: { payment_number: "ASC" },
        pagination: { pageSize: 1000 },
      }
    );

    console.log("Tuition Fee Summary: ", tuition_fee_summary);

    // Update them all to overdue
    const updateStatus = await Promise.all(
      unpaidPreviousPayments.map((payment) =>
        strapi.entityService.update("api::payment.payment", payment.id, {
          data: { payment_status: "overdue" },
        })
      )
    );

    const previousBalance = unpaidPreviousPayments.reduce((sum, p) => {
      return sum + (p.payment_amount - p.amount_paid);
    }, 0);

    // Get all previous unpaid payment
    const todate = new Date();
    let previousDue = 0;
    let currentDue = 0;
    let totalAmountDue = 0;
    const previousUnpaidPayment = tuition_fee_summary.map((tuition_summary) => {
      let balance =
        tuition_summary.payment_amount - tuition_summary.amount_paid;
      console.log("Balance: ", balance);
      if (tuition_summary.payment_status === "overdue") {
        balance = 0;
      }

      const dueDate = parseISO(tuition_summary.due_date);
      const dueToday = isToday(dueDate);
      const overdue = !dueToday && isBefore(dueDate, todate);

      if (overdue) {
        previousDue += balance;
      } else if (dueToday) {
        currentDue += balance;
      }
    });

    console.log("Step 2", previousDue);
    // Step 2: Get the next upcoming payment (after today)
    const [nextPayment] = await strapi.entityService.findMany(
      "api::payment.payment",
      {
        filters: {
          student_id,
          due_date: { $gte: today },
        },
        fields: ["id", "payment_amount"],
        sort: [{ due_date: "asc" }],
        limit: 1,
      }
    );

    if (!nextPayment) {
      return ctx.notFound("No upcoming payment found.");
    }

    console.log("Step 3");
    // Step 3: Update next payment's amount
    const updated = await strapi.entityService.update(
      "api::payment.payment",
      nextPayment.id,
      {
        data: {
          payment_amount: nextPayment.payment_amount + previousDue,
        },
      }
    );

    // console.log("Step 4");
    // // Step 4: Find the most recent past-due or unpaid payment
    // const lastDue = await strapi.entityService.findMany('api::payment.payment', {
    //   filters: {
    //     student_id,
    //     payment_status: { $ne: 'paid'},
    //     due_date: { $lte: today },
    //   },
    //   sort: [{ due_date: 'desc'}], // latest due first,
    //   limit: 1,
    // })

    // if (!lastDue) {
    //   return ctx.send({ message: 'No due payments found.' });
    // }

    return ctx.send({
      message: "Next payment due updated with previous balance.",
      updated,
      //lastDue,
      previousBalanceAdded: previousBalance,
    });
  },

  async updateCurrentDueWithBalance(ctx) {
    const { studentid } = ctx.params;
    // Get unpaid or partially paid tuition of the student
    const tuition_fee_summary = await strapi.entityService.findMany(
      "api::payment.payment",
      {
        fields: [
          "tuition_fee_id",
          "student_id",
          "student_no",
          "semester",
          "school_year",
          "payment_number",
          "payment_name",
          "payment_amount",
          "amount_paid",
          "due_date",
          "date_paid",
          "or_number",
          "payment_status",
          "payment_type",
          "createdAt",
        ],
        filters: {
          student_id: studentid,
          payment_status: ["unpaid", "paid", "partial"],
        },
        orderBy: { payment_number: "ASC" },
        pagination: { pageSize: 1000 },
      }
    );

    if (tuition_fee_summary.length === 0) {
      return ctx.send(
        {
          message: "No Tuition Fee found",
          status: "fail",
        },
        200
      );
    }

    const today = new Date();
    let previousDue = 0;
    let currentDue = 0;

    const enrichedInvoices = tuition_fee_summary
      .map((tuition_summary) => {
        const balance =
          tuition_summary.payment_amount - tuition_summary.amount_paid;
        // if (balance <= 0) return null;

        const dueDate = parseISO(tuition_summary.due_date);
        const dueToday = isToday(dueDate);
        const overdue = !dueToday && isBefore(dueDate, today);

        if (overdue) {
          previousDue += balance;
        } else if (dueToday) {
          currentDue += balance;
        }

        return {
          ...tuition_summary,
          balance,
          isOverdue: overdue,
          isDueToday: dueToday,
        };
      })
      .filter(Boolean);

    ctx.body = {
      studentid,
      previousDue,
      currentDue,
    };
  },

  async updateOverdueStatuses(ctx) {
    const { student_id } = ctx.request.body;
    const today = new Date().toISOString();

    // 1. Find all overdue unpaid payments
    const overduePayments = await strapi.entityService.findMany(
      "api::payment.payment",
      {
        filters: {  
          student_id,
          due_date: { $lt: today },
          //payment_status: { $ne: ["paid", 'overdue'] },
          payment_status: 'unpaid'
        },
        fields: ["id", "payment_status"],
        limit: 1000,
      }
    );

    if (!overduePayments.length) {
      return ctx.send({ message: "No overdue payments to update." });
    }

    // 2. Update each to 'overdue
    const updates = await Promise.all(
      overduePayments.map((payment) =>
        strapi.entityService.update("api::payment.payment", payment.id, {
          data: { payment_status: "overdue" },
        })
      )
    );

    return ctx.send({
      message: `Updated ${updates.length} payments to status 'overdue'.`,
      updatePayments: updates.map((p) => p.id),
    });
  },
}));
