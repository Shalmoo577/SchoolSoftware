import express from "express";
import db from "../../db.js";

const router = express.Router();


/* =========================================================
   GET SINGLE RECEIPT FOR PRINT
   ========================================================= */

router.get("/fee-receipts/print/:receiptNo", async (req, res) => {
    try {

        const { receiptNo } = req.params;

        const [rows] = await db.query(`
            SELECT
                fr.fee_receipt_id,
                fr.receipt_no,
                fr.student_fee_id,
                fr.student_id,
                fr.campus_id,
                fr.section_id,
                fr.payment_date,
                fr.payment_method,
                fr.bank_id,
                fr.reference_no,
                fr.amount_paid,
                fr.remarks,
                fr.created_at,

                sf.academic_year_id,
                sf.class_id,
                sf.section_id AS fee_section_id,
                sf.campus_id AS fee_campus_id,
                sf.fee_month,
                sf.challan_no,
                sf.issue_date,
                sf.due_date,
                sf.total_amount,
                sf.discount_amount,
                sf.fine_amount,
                sf.net_amount,
                sf.paid_amount,
                sf.status,

                s.admission_no,
                s.student_name,
                s.father_name,

                c.name AS class_name,
                sec.section_name,

                ay.year_name AS academic_year

            FROM fee_receipts fr

            INNER JOIN student_fees sf
                ON sf.student_fee_id = fr.student_fee_id

            INNER JOIN students s
                ON s.student_id = fr.student_id

            LEFT JOIN classes c
                ON c.class_id = sf.class_id

            LEFT JOIN sections sec
                ON sec.section_id = sf.section_id

            LEFT JOIN academic_years ay
                ON ay.academic_year_id = sf.academic_year_id

            WHERE fr.receipt_no = ?

            LIMIT 1
        `, [receiptNo]);

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Fee receipt not found"
            });
        }

        const receipt = rows[0];

        const remainingBalance =
            Number(receipt.net_amount || 0) -
            Number(receipt.paid_amount || 0);

        res.json({
            ...receipt,
            remaining_balance: remainingBalance
        });

    } catch (error) {

        console.error(
            "Fee Receipt Print Error:",
            error
        );

        res.status(500).json({
            message: "Unable to load fee receipt"
        });
    }
});


/* =========================================================
   NEXT RECEIPT NUMBER
   ========================================================= */

router.get("/fee-receipts/next-receipt-no", async (req, res) => {
    try {

        const [rows] = await db.query(`
            SELECT receipt_no
            FROM fee_receipts
            ORDER BY fee_receipt_id DESC
            LIMIT 1
        `);

        let nextNumber = 1;

        if (
            rows.length > 0 &&
            rows[0].receipt_no
        ) {

            const match =
                rows[0].receipt_no.match(/(\d+)$/);

            if (match) {
                nextNumber =
                    parseInt(match[1], 10) + 1;
            }
        }

        const receiptNo =
            `FR-${String(nextNumber).padStart(6, "0")}`;

        res.json({
            receipt_no: receiptNo
        });

    } catch (error) {

        console.error(
            "Next Receipt No Error:",
            error
        );

        res.status(500).json({
            message: "Unable to generate receipt number"
        });
    }
});


/* =========================================================
   GET STUDENT FEES AVAILABLE FOR PAYMENT
   ========================================================= */

router.get(
    "/fee-receipts/student-fees",
    async (req, res) => {

        try {

            const {
                search = "",
                campus_id,
                section_id,
                class_id,
                academic_year_id
            } = req.query;


            /* ---------------------------------------------
               VALIDATE CAMPUS
            --------------------------------------------- */

            if (!campus_id) {

                return res.status(400).json({
                    message: "Campus is required"
                });
            }


            /* ---------------------------------------------
               VALIDATE SECTION
            --------------------------------------------- */

            if (!section_id) {

                return res.status(400).json({
                    message: "Section is required"
                });
            }


            let sql = `
                SELECT
                    sf.student_fee_id,
                    sf.student_id,
                    sf.academic_year_id,
                    sf.class_id,
                    sf.section_id,
                    sf.campus_id,
                    sf.fee_month,
                    sf.challan_no,
                    sf.issue_date,
                    sf.due_date,
                    sf.total_amount,
                    sf.discount_amount,
                    sf.fine_amount,
                    sf.net_amount,
                    sf.paid_amount,

                    (
                        sf.net_amount -
                        sf.paid_amount
                    ) AS balance,

                    sf.status,

                    s.admission_no,
                    s.student_name,
                    s.father_name,

                    c.name AS class_name,
                    sec.section_name,

                    ay.year_name AS academic_year

                FROM student_fees sf

                INNER JOIN students s
                    ON s.student_id = sf.student_id

                INNER JOIN classes c
                    ON c.class_id = sf.class_id

                INNER JOIN sections sec
                    ON sec.section_id = sf.section_id

                INNER JOIN academic_years ay
                    ON ay.academic_year_id =
                       sf.academic_year_id

                WHERE
                    sf.status IN ('UNPAID', 'PARTIAL')

                    AND sf.campus_id = ?

                    AND sf.section_id = ?
            `;

            const params = [
                Number(campus_id),
                Number(section_id)
            ];


            /* ---------------------------------------------
               CLASS FILTER
            --------------------------------------------- */

            if (class_id) {

                sql += `
                    AND sf.class_id = ?
                `;

                params.push(
                    Number(class_id)
                );
            }


            /* ---------------------------------------------
               ACADEMIC YEAR FILTER
            --------------------------------------------- */

            if (academic_year_id) {

                sql += `
                    AND sf.academic_year_id = ?
                `;

                params.push(
                    Number(academic_year_id)
                );
            }


            /* ---------------------------------------------
               SEARCH
            --------------------------------------------- */

            if (search.trim()) {

                sql += `
                    AND (
                        s.admission_no LIKE ?
                        OR s.student_name LIKE ?
                        OR s.father_name LIKE ?
                        OR sf.challan_no LIKE ?
                    )
                `;

                const searchValue =
                    `%${search.trim()}%`;

                params.push(
                    searchValue,
                    searchValue,
                    searchValue,
                    searchValue
                );
            }


            /* ---------------------------------------------
               ORDER
            --------------------------------------------- */

            sql += `
                ORDER BY
                    sf.fee_month DESC,
                    s.student_name ASC
            `;


            const [rows] =
                await db.query(
                    sql,
                    params
                );


            res.json(rows);

        } catch (error) {

            console.error(
                "Student Fees For Receipt Error:",
                error
            );

            res.status(500).json({
                message:
                    "Unable to load student fees"
            });
        }
    }
);


/* =========================================================
   GET SINGLE FEE FOR PAYMENT
   ========================================================= */

router.get(
    "/fee-receipts/fee/:studentFeeId",
    async (req, res) => {

        try {

            const { studentFeeId } =
                req.params;


            const [rows] =
                await db.query(`
                    SELECT
                        sf.student_fee_id,
                        sf.student_id,
                        sf.academic_year_id,
                        sf.class_id,
                        sf.section_id,
                        sf.campus_id,
                        sf.fee_month,
                        sf.challan_no,
                        sf.issue_date,
                        sf.due_date,
                        sf.total_amount,
                        sf.discount_amount,
                        sf.fine_amount,
                        sf.net_amount,
                        sf.paid_amount,

                        (
                            sf.net_amount -
                            sf.paid_amount
                        ) AS balance,

                        sf.status,

                        s.admission_no,
                        s.student_name,
                        s.father_name,

                        c.name AS class_name,
                        sec.section_name,

                        ay.year_name AS academic_year

                    FROM student_fees sf

                    INNER JOIN students s
                        ON s.student_id =
                           sf.student_id

                    INNER JOIN classes c
                        ON c.class_id =
                           sf.class_id

                    INNER JOIN sections sec
                        ON sec.section_id =
                           sf.section_id

                    INNER JOIN academic_years ay
                        ON ay.academic_year_id =
                           sf.academic_year_id

                    WHERE sf.student_fee_id = ?

                    LIMIT 1
                `,
                [studentFeeId]
            );


            if (rows.length === 0) {

                return res.status(404).json({
                    message:
                        "Student fee not found"
                });
            }


            res.json(rows[0]);

        } catch (error) {

            console.error(
                "Single Student Fee Error:",
                error
            );

            res.status(500).json({
                message:
                    "Unable to load student fee"
            });
        }
    }
);


/* =========================================================
   PAYMENT HISTORY FOR A STUDENT FEE
   ========================================================= */

router.get(
    "/fee-receipts/history/:studentFeeId",
    async (req, res) => {

        try {

            const { studentFeeId } =
                req.params;


            const [rows] =
                await db.query(`
                    SELECT
                        fr.fee_receipt_id,
                        fr.receipt_no,
                        fr.student_fee_id,
                        fr.student_id,
                        fr.campus_id,
                        fr.section_id,
                        fr.payment_date,
                        fr.payment_method,
                        fr.bank_id,
                        fr.reference_no,
                        fr.amount_paid,
                        fr.remarks,
                        fr.created_at

                    FROM fee_receipts fr

                    WHERE fr.student_fee_id = ?

                    ORDER BY
                        fr.fee_receipt_id ASC
                `,
                [studentFeeId]
            );


            res.json(rows);

        } catch (error) {

            console.error(
                "Fee Payment History Error:",
                error
            );

            res.status(500).json({
                message:
                    "Unable to load payment history"
            });
        }
    }
);


/* =========================================================
   CREATE FEE RECEIPT / PAYMENT
   ========================================================= */

/* =========================================================
   CREATE FEE RECEIPT / PAYMENT
   WITH ACCOUNTING ENTRY
   ========================================================= */

router.post(
    "/fee-receipts",
    async (req, res) => {

        const connection =
            await db.getConnection();

        try {

            const {
                receipt_no,
                student_fee_id,
                student_id,
                payment_date,
                payment_method = "CASH",
                bank_id = null,
                reference_no = null,
                amount_paid,
                remarks = null
            } = req.body;


            /* =================================================
               BASIC VALIDATION
               ================================================= */

            if (!student_fee_id) {

                return res.status(400).json({
                    message:
                        "Student fee is required"
                });
            }


            if (!student_id) {

                return res.status(400).json({
                    message:
                        "Student is required"
                });
            }


            if (!receipt_no) {

                return res.status(400).json({
                    message:
                        "Receipt number is required"
                });
            }


            if (!payment_date) {

                return res.status(400).json({
                    message:
                        "Payment date is required"
                });
            }


            if (
                !amount_paid ||
                Number(amount_paid) <= 0
            ) {

                return res.status(400).json({
                    message:
                        "Payment amount must be greater than zero"
                });
            }


            const method =
                String(payment_method)
                    .trim()
                    .toUpperCase();


            if (
                !["CASH", "BANK"].includes(method)
            ) {

                return res.status(400).json({
                    message:
                        "Invalid payment method"
                });
            }


            /* =================================================
               BANK VALIDATION
               ================================================= */

            if (
                method === "BANK" &&
                !bank_id
            ) {

                return res.status(400).json({
                    message:
                        "Bank is required for bank payment"
                });
            }


            /* =================================================
               START TRANSACTION
               ================================================= */

            await connection.beginTransaction();


            /* =================================================
               GET STUDENT FEE
               LOCK ROW
               ================================================= */

            const [feeRows] =
                await connection.query(`
              SELECT
                    sf.student_fee_id,
                    sf.student_id,
                    sf.campus_id,
                    sf.section_id,
                    sf.class_id,
                    sf.due_date,
                    sf.net_amount,
                    sf.paid_amount,
                    sf.status,

                    s.admission_no,

                    c.name AS class_name,

                    cp.name,

                    sec.section_name

                FROM student_fees sf

                LEFT JOIN students s
                    ON s.student_id = sf.student_id

                LEFT JOIN classes c
                    ON c.class_id = sf.class_id

                LEFT JOIN campuses cp
                    ON cp.campus_id = sf.campus_id

                LEFT JOIN sections sec
                    ON sec.section_id = sf.section_id

                WHERE sf.student_fee_id = ?

                FOR UPDATE
                `,
                [student_fee_id]
            );


            if (feeRows.length === 0) {

                await connection.rollback();

                return res.status(404).json({
                    message:
                        "Student fee not found"
                });
            }


            const fee =
                feeRows[0];

           const feeMonth = fee.due_date
            ? new Date(fee.due_date).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric"
            })
            : "N/A";
            const narration =
                `Admission No: ${fee.admission_no || "N/A"} | ` +
                `Class: ${fee.class_name || "N/A"} | ` +
                `Campus: ${fee.name || "N/A"} | ` +
                `Section: ${fee.section_name || "N/A"} | ` +
                `Month: ${feeMonth}`;


            /* =================================================
               CHECK STUDENT
               ================================================= */

            if (
                Number(fee.student_id) !==
                Number(student_id)
            ) {

                await connection.rollback();

                return res.status(400).json({
                    message:
                        "Student does not match this fee"
                });
            }


            /* =================================================
               CAMPUS / SECTION
               ================================================= */

            if (
                !fee.campus_id ||
                !fee.section_id
            ) {

                await connection.rollback();

                return res.status(400).json({
                    message:
                        "Campus or section is missing from student fee"
                });
            }


            /* =================================================
               CALCULATE BALANCE
               ================================================= */

            const netAmount =
                Number(fee.net_amount || 0);

            const paidAmount =
                Number(fee.paid_amount || 0);

            const currentBalance =
                netAmount - paidAmount;

            const paymentAmount =
                Number(amount_paid);


            if (currentBalance <= 0) {

                await connection.rollback();

                return res.status(400).json({
                    message:
                        "This fee is already fully paid"
                });
            }


            if (
                paymentAmount >
                currentBalance
            ) {

                await connection.rollback();

                return res.status(400).json({
                    message:
                        `Payment cannot be greater than remaining balance (${currentBalance.toFixed(2)})`
                });
            }


            /* =================================================
               CHECK RECEIPT NUMBER
               ================================================= */

            const [existingReceipt] =
                await connection.query(`
                    SELECT
                        fee_receipt_id

                    FROM fee_receipts

                    WHERE receipt_no = ?

                    LIMIT 1
                `,
                [receipt_no]
            );


            if (
                existingReceipt.length > 0
            ) {

                await connection.rollback();

                return res.status(400).json({
                    message:
                        "Receipt number already exists"
                });
            }


            /* =================================================
               ACCOUNTING DEBIT ACCOUNT
               
               CASH:
               Find Cash account using
               Campus + Section

               BANK:
               Use selected Bank Sa_ID
               ================================================= */

            let debitSaId = null;
            let debitAccountName = "";


            /* =================================================
               CASH ACCOUNT
               ================================================= */

            if (method === "CASH") {

                const [cashRows] =
                    await connection.query(`
                        SELECT
                            Sa_ID,
                            SA_Name

                        FROM subsidaryaccount

                        WHERE Type = 'CASH'
                          AND campus_id = ?
                          AND section_id = ?

                        LIMIT 1
                    `,
                    [
                        fee.campus_id,
                        fee.section_id
                    ]);


                if (cashRows.length === 0) {

                    await connection.rollback();

                    return res.status(400).json({
                        message:
                            "Cash account is not configured for this campus and section"
                    });
                }


                debitSaId =
                    cashRows[0].Sa_ID;

                debitAccountName =
                    cashRows[0].SA_Name;
            }


            /* =================================================
               BANK ACCOUNT
               ================================================= */

            if (method === "BANK") {

                const [bankRows] =
                    await connection.query(`
                        SELECT
                            Sa_ID,
                            SA_Name

                        FROM subsidaryaccount

                        WHERE Sa_ID = ?
                          AND Type = 'BANK'

                        LIMIT 1
                    `,
                    [Number(bank_id)]
                );


                if (bankRows.length === 0) {

                    await connection.rollback();

                    return res.status(400).json({
                        message:
                            "Selected bank account not found"
                    });
                }


                debitSaId =
                    bankRows[0].Sa_ID;

                debitAccountName =
                    bankRows[0].SA_Name;
            }


            /* =================================================
               FEE RECEIVABLE ACCOUNT
               
               Current Fee Voucher system:
               SCHOOL FEE RECEIVABLE = SUBID 17
               ================================================= */

            const feeReceivableSaId = 17;


            const [receivableRows] =
                await connection.query(`
                    SELECT
                        Sa_ID,
                        SA_Name

                    FROM subsidaryaccount

                    WHERE Sa_ID = ?

                    LIMIT 1
                `,
                [feeReceivableSaId]
            );


            if (receivableRows.length === 0) {

                await connection.rollback();

                return res.status(400).json({
                    message:
                        "School Fee Receivable account (SUBID 17) not found"
                });
            }


            const receivableAccountName =
                receivableRows[0].SA_Name;


            /* =================================================
               ACCOUNTING VOUCHER NUMBER
               
               Receipt number itself is used as VNO
               
               Example:
               FR-000001
               ================================================= */

            const accountingVno =
                receipt_no;


            /* =================================================
               PREVENT DUPLICATE ACCOUNTING
               ================================================= */

            const [existingAccounting] =
                await connection.query(`
                    SELECT
                        COUNT(*) AS total

                    FROM master

                    WHERE VNO = ?
                      AND VOUCHER_TYPE = 'FR'
                      AND IS_DELETED = 0
                `,
                [accountingVno]
            );


            if (
                Number(existingAccounting[0].total) > 0
            ) {

                await connection.rollback();

                return res.status(400).json({
                    message:
                        `Accounting entry already exists for ${accountingVno}`
                });
            }


            /* =================================================
               INSERT FEE RECEIPT
               ================================================= */

            await connection.query(`
                INSERT INTO fee_receipts
                (
                    receipt_no,
                    student_fee_id,
                    student_id,
                    campus_id,
                    section_id,
                    payment_date,
                    payment_method,
                    bank_id,
                    reference_no,
                    amount_paid,
                    remarks
                )

                VALUES
                (
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?
                )
            `,
            [
                receipt_no,
                student_fee_id,
                student_id,
                fee.campus_id,
                fee.section_id,
                payment_date,
                method,
                method === "BANK"
                    ? Number(bank_id)
                    : null,
                reference_no,
                paymentAmount,
                remarks
            ]);


            /* =================================================
               UPDATE STUDENT FEE
               ================================================= */

            const newPaidAmount =
                paidAmount +
                paymentAmount;

            let newStatus =
                "PARTIAL";


            if (
                newPaidAmount >=
                netAmount
            ) {

                newStatus =
                    "PAID";
            }


            await connection.query(`
                UPDATE student_fees

                SET
                    paid_amount = ?,
                    status = ?

                WHERE student_fee_id = ?
            `,
            [
                newPaidAmount,
                newStatus,
                student_fee_id
            ]);


            /* =================================================
               ACCOUNTING
               
               DEBIT:
               CASH / BANK

               CREDIT:
               SCHOOL FEE RECEIVABLE
               ================================================= */


            /* =================================================
               DEBIT — CASH / BANK
               ================================================= */

            await connection.query(`
                INSERT INTO master
                (
                    VNO,
                    VDT,
                    PDT,
                    SUBID,
                    NARRATION,
                    BILL_NO,
                    FILE_NO,
                    CHQ_NO,
                    CHQ_DT,
                    DEBIT,
                    CREDIT,
                    ADD_OTHER_AMOUNT,
                    SUB_TOTAL,
                    LESS_OTHER_AMOUNT,
                    NET_AMOUNT,
                    VOUCHER_TYPE,
                    IS_DELETED
                )

                VALUES
                (
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    NULL,
                    NULL,
                    ?,
                    NULL,
                    ?,
                    0.00,
                    0.00,
                    0.00,
                    0.00,
                    ?,
                    'FR',
                    0
                )
            `,
            [
                accountingVno,
                payment_date,
                payment_date,
                debitSaId,

                `${debitAccountName} - FEE RECEIPT ${narration}`,

                method === "BANK"
                    ? reference_no
                    : null,

                paymentAmount,
                paymentAmount
            ]);


            /* =================================================
               CREDIT — SCHOOL FEE RECEIVABLE
               ================================================= */

            await connection.query(`
                INSERT INTO master
                (
                    VNO,
                    VDT,
                    PDT,
                    SUBID,
                    NARRATION,
                    BILL_NO,
                    FILE_NO,
                    CHQ_NO,
                    CHQ_DT,
                    DEBIT,
                    CREDIT,
                    ADD_OTHER_AMOUNT,
                    SUB_TOTAL,
                    LESS_OTHER_AMOUNT,
                    NET_AMOUNT,
                    VOUCHER_TYPE,
                    IS_DELETED
                )

                VALUES
                (
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    0.00,
                    ?,
                    0.00,
                    0.00,
                    0.00,
                    ?,
                    'FR',
                    0
                )
            `,
            [
                accountingVno,
                payment_date,
                payment_date,
                feeReceivableSaId,

                `SCHOOL FEE RECEIVABLE - ${narration}`,

                paymentAmount,
                paymentAmount
            ]);


            /* =================================================
               BALANCE CHECK
               ================================================= */

            const totalDebit =
                Number(paymentAmount.toFixed(2));

            const totalCredit =
                Number(paymentAmount.toFixed(2));


            if (
                totalDebit !==
                totalCredit
            ) {

                throw new Error(
                    `Fee receipt accounting is not balanced. Debit=${totalDebit}, Credit=${totalCredit}`
                );
            }


            /* =================================================
               COMMIT
               ================================================= */

            await connection.commit();


            /* =================================================
               RESPONSE
               ================================================= */

            return res.json({

                message:
                    "Fee payment saved and accounting entry created successfully",

                receipt_no,

                student_fee_id,

                student_id,

                campus_id:
                    fee.campus_id,

                section_id:
                    fee.section_id,

                payment_method:
                    method,

                debit_account:
                    debitAccountName,

                debit_sa_id:
                    debitSaId,

                receivable_account:
                    receivableAccountName,

                receivable_sa_id:
                    feeReceivableSaId,

                amount_paid:
                    paymentAmount,

                paid_amount:
                    newPaidAmount,

                balance:
                    Number(
                        (
                            netAmount -
                            newPaidAmount
                        ).toFixed(2)
                    ),

                status:
                    newStatus,

                accounting: {

                    voucher_no:
                        accountingVno,

                    voucher_type:
                        "FR",

                    debit:
                        totalDebit,

                    credit:
                        totalCredit,

                    balanced:
                        true
                }

            });


        } catch (error) {

            /* =================================================
               ROLLBACK
               ================================================= */

            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    "ROLLBACK ERROR:",
                    rollbackError
                );
            }


            console.error(
                "FEE RECEIPT SAVE ERROR:",
                error
            );


            return res.status(500).json({

                message:
                    error.sqlMessage ||
                    error.message ||
                    "Unable to save fee payment"

            });

        } finally {

            connection.release();
        }
    }
);

export default router;