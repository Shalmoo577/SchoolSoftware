
import express from "express";
import db from "../../db.js";

const router = express.Router();

/*
    GET STUDENT FEE VOUCHER
    Example:
    /api/student-fee-voucher/15
*/

router.get("/student-fee-voucher/:studentFeeId", async (req, res) => {

    const { studentFeeId } = req.params;

    try {

        // ====================================================
        // 1. MAIN FEE + STUDENT INFORMATION
        // ====================================================

        const [feeRows] = await db.query(
            `
            SELECT
                sf.student_fee_id,
                sf.student_id,
                sf.academic_year_id,
                sf.class_id,
                sf.section_id,
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
                sf.remarks,

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

            LEFT JOIN sections sec
                ON sec.section_id = sf.section_id

            INNER JOIN academic_years ay
                ON ay.academic_year_id = sf.academic_year_id

            WHERE sf.student_fee_id = ?

            LIMIT 1
            `,
            [studentFeeId]
        );


        if (feeRows.length === 0) {

            return res.status(404).json({
                message: "Student fee voucher not found"
            });
        }


        const fee = feeRows[0];


        // ====================================================
        // 2. FEE DETAILS
        // ====================================================
        //
        // IMPORTANT:
        // student_fee_details DOES NOT have sa_id
        //
        // ====================================================

        const [detailRows] = await db.query(
            `
            SELECT
                sfd.student_fee_detail_id,
                sfd.fee_head_id,
                sfd.fee_description,
                sfd.amount,

                fh.fee_head_name

            FROM student_fee_details sfd

            LEFT JOIN fee_heads fh
                ON fh.fee_head_id = sfd.fee_head_id

            WHERE sfd.student_fee_id = ?

            ORDER BY sfd.student_fee_detail_id
            `,
            [studentFeeId]
        );


        // ====================================================
        // 3. DISCOUNT / FINE ACCOUNTING INFORMATION
        // ====================================================
        //
        // SFA rows:
        //
        // DISCOUNT:
        //     Selected Discount SA     DR
        //     Receivable               CR
        //
        // FINE:
        //     Receivable               DR
        //     Selected Fine SA        CR
        //
        // ====================================================

        const vno = `SF-${studentFeeId}`;


        const [adjustmentRows] = await db.query(
            `
            SELECT
                m.SUBID,
                m.DEBIT,
                m.CREDIT,
                m.NARRATION,
                m.VOUCHER_TYPE

            FROM master m

            WHERE m.VNO = ?
              AND m.VOUCHER_TYPE = 'SFA'
              AND m.IS_DELETED = 0

            ORDER BY m.SUBID
            `,
            [vno]
        );


        // ====================================================
        // 4. FIND DISCOUNT ACCOUNT
        // ====================================================

        let discountAccount = null;

        const discountAmount =
            Number(fee.discount_amount || 0);


        if (discountAmount > 0) {

            const discountRow =
                adjustmentRows.find(
                    row =>
                        Number(row.DEBIT || 0) === discountAmount &&
                        Number(row.CREDIT || 0) === 0 &&
                        Number(row.SUBID) !== 17
                );


            if (discountRow) {

                discountAccount = {
                    sa_id: Number(discountRow.SUBID),
                    amount: discountAmount
                };
            }
        }


        // ====================================================
        // 5. FIND FINE ACCOUNT
        // ====================================================

        let fineAccount = null;

        const fineAmount =
            Number(fee.fine_amount || 0);


        if (fineAmount > 0) {

            const fineRow =
                adjustmentRows.find(
                    row =>
                        Number(row.CREDIT || 0) === fineAmount &&
                        Number(row.DEBIT || 0) === 0 &&
                        Number(row.SUBID) !== 17
                );


            if (fineRow) {

                fineAccount = {
                    sa_id: Number(fineRow.SUBID),
                    amount: fineAmount
                };
            }
        }


        // ====================================================
        // 6. PREVIOUS UNPAID / PARTIAL FEES
        // ====================================================

        const [previousRows] = await db.query(
            `
            SELECT
                student_fee_id,
                fee_month,
                challan_no,
                net_amount,
                paid_amount,

                (net_amount - paid_amount) AS balance,

                status

            FROM student_fees

            WHERE student_id = ?
              AND academic_year_id = ?
              AND student_fee_id <> ?
              AND fee_month < ?
              AND status IN ('UNPAID', 'PARTIAL')
              AND (net_amount - paid_amount) > 0

            ORDER BY fee_month ASC
            `,
            [
                fee.student_id,
                fee.academic_year_id,
                fee.student_fee_id,
                fee.fee_month
            ]
        );


        // ====================================================
        // 7. TOTAL PREVIOUS BALANCE
        // ====================================================

        const previousBalance =
            previousRows.reduce(
                (total, row) =>
                    total + Number(row.balance || 0),
                0
            );


        // ====================================================
        // 8. FINAL RESPONSE
        // ====================================================

        return res.json({

            // ------------------------------------------------
            // MAIN FEE
            // ------------------------------------------------

            fee: {

                ...fee,

                total_amount:
                    Number(fee.total_amount || 0),

                discount_amount:
                    Number(fee.discount_amount || 0),

                fine_amount:
                    Number(fee.fine_amount || 0),

                net_amount:
                    Number(fee.net_amount || 0),

                paid_amount:
                    Number(fee.paid_amount || 0),

                balance:
                    Number(fee.net_amount || 0) -
                    Number(fee.paid_amount || 0)
            },


            // ------------------------------------------------
            // FEE DETAILS
            // ------------------------------------------------

            details: detailRows.map(row => ({

                ...row,

                amount:
                    Number(row.amount || 0)
            })),


            // ------------------------------------------------
            // DISCOUNT
            // ------------------------------------------------

            discount: {

                amount:
                    discountAmount,

                sa_id:
                    discountAccount
                        ? discountAccount.sa_id
                        : null
            },


            // ------------------------------------------------
            // FINE
            // ------------------------------------------------

            fine: {

                amount:
                    fineAmount,

                sa_id:
                    fineAccount
                        ? fineAccount.sa_id
                        : null
            },


            // ------------------------------------------------
            // PREVIOUS FEES
            // ------------------------------------------------

            previousFees:
                previousRows.map(row => ({

                    ...row,

                    net_amount:
                        Number(row.net_amount || 0),

                    paid_amount:
                        Number(row.paid_amount || 0),

                    balance:
                        Number(row.balance || 0)
                })),


            // ------------------------------------------------
            // PREVIOUS BALANCE
            // ------------------------------------------------

            previousBalance:
                Number(previousBalance || 0)
        });


    } catch (error) {

        console.error(
            "Student Fee Voucher Error:",
            error
        );


        return res.status(500).json({

            message:
                error.sqlMessage ||
                error.message ||
                "Unable to load student fee voucher",

            error_code:
                error.code || null
        });
    }
});

router.get("/student-fee-vouchers-all", async (req, res) => {

    try {

        const {
            campus_id,
            academic_year_id,
            class_id,
            section_id,
            fee_month
        } = req.query;


        // =====================================================
        // VALIDATION
        // =====================================================

        if (
            !campus_id ||
            !academic_year_id ||
            !class_id ||
            !section_id ||
            !fee_month
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Campus, Academic Year, Class, Section and Fee Month are required"
            });

        }


        // =====================================================
        // GET ALL FILTERED FEES
        // =====================================================

        const [fees] = await db.query(
            `

            SELECT

                sf.student_fee_id,
                sf.student_id,

                sf.academic_year_id,
                sf.class_id,
                sf.section_id,

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
                sf.remarks,

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


            LEFT JOIN sections sec
                ON sec.section_id = sf.section_id


            INNER JOIN academic_years ay
                ON ay.academic_year_id =
                   sf.academic_year_id


            WHERE


                s.campus_id = ?

                AND sf.academic_year_id = ?

                AND sf.class_id = ?

                AND sf.section_id = ?


                AND DATE_FORMAT(
                    sf.fee_month,
                    '%Y-%m'
                ) = ?


            ORDER BY
                s.student_name ASC,
                sf.student_fee_id ASC

            `,
            [
                campus_id,
                academic_year_id,
                class_id,
                section_id,
                fee_month
            ]
        );


        // =====================================================
        // LOAD DETAILS FOR EACH FEE
        // =====================================================

        for (const fee of fees) {

            const [details] = await db.query(
                `

                SELECT

                    sfd.student_fee_detail_id,
                    sfd.fee_head_id,
                    sfd.fee_description,
                    sfd.amount,

                    fh.fee_head_name


                FROM student_fee_details sfd


                LEFT JOIN fee_heads fh
                    ON fh.fee_head_id =
                       sfd.fee_head_id


                WHERE
                    sfd.student_fee_id = ?


                ORDER BY
                    sfd.student_fee_detail_id ASC

                `,
                [
                    fee.student_fee_id
                ]
            );


            fee.details = details.map(detail => ({

                ...detail,

                amount:
                    Number(detail.amount || 0)

            }));



            fee.total_amount =
                Number(fee.total_amount || 0);

            fee.discount_amount =
                Number(fee.discount_amount || 0);

            fee.fine_amount =
                Number(fee.fine_amount || 0);

            fee.net_amount =
                Number(fee.net_amount || 0);

            fee.paid_amount =
                Number(fee.paid_amount || 0);

            fee.balance =
                fee.net_amount -
                fee.paid_amount;

        }



        console.log(
            "PRINT ALL FILTERS:",
            {
                campus_id,
                academic_year_id,
                class_id,
                section_id,
                fee_month
            }
        );

        console.log(
            "FILTERED PRINT COUNT:",
            fees.length
        );


  
        return res.json({

            success: true,

            filters: {
                campus_id,
                academic_year_id,
                class_id,
                section_id,
                fee_month
            },

            count: fees.length,

            fees

        });


    } catch (error) {

        console.error(
            "PRINT ALL ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                error.sqlMessage ||
                error.message ||
                "Unable to load student fee vouchers",

            error_code:
                error.code || null

        });

    }

});

export default router;
