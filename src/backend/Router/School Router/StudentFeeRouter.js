import express from "express";
import db from "../../db.js";

const router = express.Router();


/*
===========================================================
GET STUDENT FEES
FILTERS:
    academic_year_id
    fee_month
    class_id
    campus_id
    section_id
    search
===========================================================
*/

router.get("/student-fees", async (req, res) => {

    try {

        const {
            academic_year_id,
            fee_month,
            class_id,
            campus_id,
            section_id,
            search
        } = req.query;


        let conditions = [];
        let params = [];


        /*
        -------------------------------------------------------
        ACADEMIC YEAR
        -------------------------------------------------------
        */

        if (academic_year_id) {

            conditions.push(`
                sf.academic_year_id = ?
            `);

            params.push(academic_year_id);
        }


        /*
        -------------------------------------------------------
        MONTH
        -------------------------------------------------------
        */

        if (fee_month) {

            conditions.push(`
                sf.fee_month = ?
            `);

            params.push(fee_month);
        }


        /*
        -------------------------------------------------------
        CLASS
        -------------------------------------------------------
        */

        if (class_id) {

            conditions.push(`
                sf.class_id = ?
            `);

            params.push(class_id);
        }


        /*
        -------------------------------------------------------
        CAMPUS
        -------------------------------------------------------
        */

        if (campus_id) {

            conditions.push(`
                sf.campus_id = ?
            `);

            params.push(campus_id);
        }


        /*
        -------------------------------------------------------
        SECTION
        -------------------------------------------------------
        */

        if (section_id) {

            conditions.push(`
                sf.section_id = ?
            `);

            params.push(section_id);
        }


        /*
        -------------------------------------------------------
        SEARCH
        -------------------------------------------------------
        */

        if (search) {

            conditions.push(`
                (
                    s.admission_no LIKE ?
                    OR s.student_name LIKE ?
                    OR s.father_name LIKE ?
                    OR sf.challan_no LIKE ?
                )
            `);

            const searchValue = `%${search}%`;

            params.push(
                searchValue,
                searchValue,
                searchValue,
                searchValue
            );
        }


        const whereClause =
            conditions.length > 0
                ? `WHERE ${conditions.join(" AND ")}`
                : "";


        /*
        -------------------------------------------------------
        QUERY
        -------------------------------------------------------
        */

        const [rows] = await db.query(`

            SELECT

                sf.student_fee_id,

                sf.student_id,

                sf.academic_year_id,

                ay.year_name AS academic_year,

                sf.class_id,

                c.name AS class_name,

                sf.section_id,

                sec.section_name,

                sf.campus_id,

                s.admission_no,

                s.student_name,

                s.father_name,

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
                    sf.net_amount - sf.paid_amount
                ) AS balance_amount,

                sf.status,

                sf.remarks,

                sf.created_at,

                sf.updated_at

            FROM student_fees sf

            INNER JOIN students s
                ON s.student_id = sf.student_id

            INNER JOIN academic_years ay
                ON ay.academic_year_id =
                   sf.academic_year_id

            INNER JOIN classes c
                ON c.class_id = sf.class_id

            LEFT JOIN sections sec
                ON sec.section_id = sf.section_id

            ${whereClause}

            ORDER BY
                sf.fee_month DESC,
                s.admission_no ASC

        `, params);


        res.json(rows);


    } catch (error) {

        console.error(
            "GET STUDENT FEES ERROR:",
            error
        );

        res.status(500).json({

            message:
                "Failed to load student fees",

            error:
                error.sqlMessage ||
                error.message

        });
    }
});



/*
===========================================================
GET SUBSIDIARY ACCOUNTS
FOR DISCOUNT / FINE ADJUSTMENT MODAL
===========================================================
*/

router.get(
    "/student-fees/adjustment-accounts",
    async (req, res) => {

        try {

            const [rows] = await db.query(`

                SELECT

                    Sa_ID,
                    Ga_ID,
                    SA_Name,
                    Type,
                    Opening_Debit,
                    Opening_Credit,
                    Remarks,
                    Date

                FROM subsidaryaccount

                ORDER BY SA_Name ASC

            `);


            res.json(rows);


        } catch (error) {

            console.error(
                "GET ADJUSTMENT ACCOUNTS ERROR:",
                error
            );

            res.status(500).json({

                message:
                    "Failed to load subsidiary accounts",

                error:
                    error.sqlMessage ||
                    error.message

            });
        }
    }
);

/*
===========================================================
GET SINGLE STUDENT FEE
===========================================================
*/

// ======================================================
// GET SINGLE STUDENT FEE FOR EDIT
// ======================================================
router.get("/student-fees/:studentFeeId", async (req, res) => {

    try {

        const { studentFeeId } = req.params;

        // ==================================================
        // MAIN STUDENT FEE
        // ==================================================
        const [feeRows] = await db.query(`
            SELECT
                sf.student_fee_id,
                sf.student_id,
                sf.academic_year_id,
                ay.year_name,

                sf.class_id,
                c.name,

                sf.section_id,
                sec.section_name,

                sf.campus_id,

                s.admission_no,
                s.student_name,
                s.father_name,

                sf.fee_month,
                sf.challan_no,
                sf.issue_date,
                sf.due_date,

                -- ==============================
                -- ALL AMOUNT FIELDS
                -- ==============================
                sf.total_amount,
                sf.discount_amount,
                sf.fine_amount,
                sf.net_amount,
                sf.paid_amount,

                -- ==============================
                -- CALCULATED BALANCE
                -- ==============================
                (
            COALESCE(sf.net_amount, 0)
            -
            COALESCE(sf.paid_amount, 0)
        ) AS balance_amount,

                sf.status,
                sf.remarks,

                sf.user_id,
                sf.created_at,
                sf.updated_at

            FROM student_fees sf

            LEFT JOIN students s
                ON s.student_id = sf.student_id

            LEFT JOIN academic_years ay
                ON ay.academic_year_id = sf.academic_year_id

            LEFT JOIN classes c
                ON c.class_id = sf.class_id

            LEFT JOIN sections sec
                ON sec.section_id = sf.section_id

            WHERE sf.student_fee_id = ?

            LIMIT 1
        `, [studentFeeId]);


        if (!feeRows.length) {
            return res.status(404).json({
                message: "Student fee not found"
            });
        }


        // ==================================================
        // FEE DETAILS
        // ==================================================
        const [detailRows] = await db.query(`
            SELECT
                sfd.student_fee_detail_id,
                sfd.student_fee_id,
                sfd.fee_head_id,

                fh.fee_head_name,

                sfd.fee_description,
                sfd.amount

            FROM student_fee_details sfd

            LEFT JOIN fee_heads fh
                ON fh.fee_head_id = sfd.fee_head_id

            WHERE sfd.student_fee_id = ?

            ORDER BY sfd.student_fee_detail_id ASC
        `, [studentFeeId]);


        // ==================================================
        // RESPONSE
        // ==================================================
        return res.json({
            fee: feeRows[0],
            details: detailRows
        });


    } catch (error) {

        console.error(
            "GET SINGLE STUDENT FEE ERROR:",
            error
        );

        return res.status(500).json({
            message: "Failed to load student fee",
            error: error.message
        });
    }
});

// ======================================================
// GET CLASSES
// ======================================================

router.get("/class-fee-voucher/classes", async (req, res) => {

    try {

        const { campus_id, section_id } = req.query;

        let sql = `
            SELECT
                class_id,
                name
            FROM classes
            WHERE is_active = 1
        `;

        const params = [];

        // Campus + Section filter
        if (campus_id && section_id) {

            sql += `
                AND campus_id = ?
                AND section_id = ?
            `;

            params.push(
                campus_id,
                section_id
            );
        }

        sql += ` ORDER BY name`;

        const [rows] = await db.query(
            sql,
            params
        );

        res.json(rows);

    } catch (error) {

        console.error(
            "Classes Error:",
            error
        );

        res.status(500).json({
            message: "Failed to load classes",
            error: error.message
        });
    }

});


 router.put("/student-fees/:studentFeeId", async (req, res) => {

    const connection = await db.getConnection();

    try {

        const { studentFeeId } = req.params;

        const {
            details,
            discount_amount,
            fine_amount,
            discount_sa_id,
            fine_sa_id,
            remarks
        } = req.body;


        // =====================================================
        // VALIDATION
        // =====================================================

        if (!Array.isArray(details) || details.length === 0) {

            return res.status(400).json({
                message: "Fee details are required"
            });
        }


        const discount = Number(discount_amount || 0);
        const fine = Number(fine_amount || 0);


        if (discount < 0) {

            return res.status(400).json({
                message: "Discount cannot be negative"
            });
        }


        if (fine < 0) {

            return res.status(400).json({
                message: "Fine cannot be negative"
            });
        }


        // =====================================================
        // ADJUSTMENT ACCOUNT VALIDATION
        // =====================================================

        if (discount > 0 && !discount_sa_id) {

            return res.status(400).json({
                message:
                    "Please select Discount subsidiary account"
            });
        }


        if (fine > 0 && !fine_sa_id) {

            return res.status(400).json({
                message:
                    "Please select Fine subsidiary account"
            });
        }


        // =====================================================
        // START TRANSACTION
        // =====================================================

        await connection.beginTransaction();


        // =====================================================
        // GET EXISTING STUDENT FEE
        // =====================================================

        const [feeRows] = await connection.query(`
            SELECT
                student_fee_id,
                paid_amount,
                total_amount,
                discount_amount,
                fine_amount,
                net_amount,
                challan_no,
                issue_date,
                due_date,
                fee_month,
                campus_id,
                remarks
            FROM student_fees
            WHERE student_fee_id = ?
            LIMIT 1
        `, [studentFeeId]);


        if (!feeRows.length) {

            await connection.rollback();

            return res.status(404).json({
                message: "Student fee not found"
            });
        }


        const existingFee = feeRows[0];


        const paidAmount =
            Number(existingFee.paid_amount || 0);


        // =====================================================
        // CALCULATE TOTAL
        // =====================================================

        let totalAmount = 0;


        for (const detail of details) {

            if (!detail.fee_head_id) {

                await connection.rollback();

                return res.status(400).json({
                    message: "Fee head is required"
                });
            }


            const amount =
                Number(detail.amount || 0);


            if (amount < 0) {

                await connection.rollback();

                return res.status(400).json({
                    message:
                        "Fee amount cannot be negative"
                });
            }


            totalAmount += amount;
        }


        // =====================================================
        // NET AMOUNT
        // =====================================================

        const netAmount =
            totalAmount -
            discount +
            fine;


        if (netAmount < 0) {

            await connection.rollback();

            return res.status(400).json({
                message:
                    "Net amount cannot be negative"
            });
        }


        if (netAmount < paidAmount) {

            await connection.rollback();

            return res.status(400).json({
                message:
                    "Net amount cannot be less than paid amount"
            });
        }


        // =====================================================
        // STATUS
        // =====================================================

        let status = "UNPAID";


        if (paidAmount <= 0) {

            status = "UNPAID";

        } else if (paidAmount < netAmount) {

            status = "PARTIAL";

        } else {

            status = "PAID";
        }


        // =====================================================
        // UPDATE STUDENT FEE
        // =====================================================

        await connection.query(`
            UPDATE student_fees
            SET
                total_amount = ?,
                discount_amount = ?,
                fine_amount = ?,
                net_amount = ?,
                status = ?,
                remarks = ?,
                updated_at = NOW()
            WHERE student_fee_id = ?
        `, [
            totalAmount,
            discount,
            fine,
            netAmount,
            status,
            remarks || null,
            studentFeeId
        ]);


        // =====================================================
        // DELETE OLD FEE DETAILS
        // =====================================================

        await connection.query(`
            DELETE FROM student_fee_details
            WHERE student_fee_id = ?
        `, [studentFeeId]);


        // =====================================================
        // INSERT CURRENT FEE DETAILS
        // =====================================================

        for (const detail of details) {

            await connection.query(`
                INSERT INTO student_fee_details
                (
                    student_fee_id,
                    fee_head_id,
                    fee_description,
                    amount
                )
                VALUES (?, ?, ?, ?)
            `, [
                studentFeeId,
                detail.fee_head_id,
                detail.fee_description || "",
                Number(detail.amount || 0)
            ]);
        }


        // =====================================================
        // VOUCHER INFORMATION
        // =====================================================

        const vno = `SF-${studentFeeId}`;


        const voucherDate =
            existingFee.fee_month ||
            new Date();


        const postDate =
            new Date();


        const feeMonthDate =
            existingFee.fee_month
                ? new Date(existingFee.fee_month)
                    .toISOString()
                    .slice(0, 10)
                : new Date()
                    .toISOString()
                    .slice(0, 10);


        const narration =
            `Adjust | SCHOOL FEE RECEIVABLE - ${feeMonthDate}`;


        // =====================================================
        // REMOVE OLD SFA ADJUSTMENT ENTRIES
        // =====================================================
        //
        // Every time this fee is edited:
        //
        // OLD:
        //     Discount SA       DR
        //     Receivable       CR
        //
        //     Receivable       DR
        //     Fine SA           CR
        //
        // These old adjustment rows are removed first.
        //
        // Then the current Discount/Fine entries are inserted.
        //
        // This prevents duplicate SFA entries on every save.
        // =====================================================

        await connection.query(`
            DELETE FROM master
            WHERE VNO = ?
              AND VOUCHER_TYPE = 'SFA'
              AND IS_DELETED = 0
        `, [vno]);


        // =====================================================
        // MASTER SQL
        // =====================================================

        const masterSQL = `
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
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
        `;


        // =====================================================
        // DISCOUNT
        //
        // Selected Discount SA     DR
        // SCHOOL FEE RECEIVABLE   CR
        // =====================================================

        if (discount > 0) {


            // =================================================
            // DISCOUNT SA - DEBIT
            // =================================================

            await connection.execute(
                masterSQL,
                [
                    vno,
                    voucherDate,
                    postDate,
                    Number(discount_sa_id),

                    narration,

                    existingFee.challan_no || null,
                    null,
                    null,
                    null,

                    discount,
                    0,

                    0,
                    discount,
                    0,
                    discount,

                    "SFA"
                ]
            );


            // =================================================
            // SCHOOL FEE RECEIVABLE - CREDIT
            // =================================================

            await connection.execute(
                masterSQL,
                [
                    vno,
                    voucherDate,
                    postDate,
                    17,

                    narration,

                    existingFee.challan_no || null,
                    null,
                    null,
                    null,

                    0,
                    discount,

                    0,
                    discount,
                    0,
                    discount,

                    "SFA"
                ]
            );
        }


        // =====================================================
        // FINE
        //
        // SCHOOL FEE RECEIVABLE   DR
        // Selected Fine SA        CR
        // =====================================================

        if (fine > 0) {


            // =================================================
            // SCHOOL FEE RECEIVABLE - DEBIT
            // =================================================

            await connection.execute(
                masterSQL,
                [
                    vno,
                    voucherDate,
                    postDate,
                    17,

                    narration,

                    existingFee.challan_no || null,
                    null,
                    null,
                    null,

                    fine,
                    0,

                    0,
                    fine,
                    0,
                    fine,

                    "SFA"
                ]
            );


            // =================================================
            // FINE INCOME SA - CREDIT
            // =================================================

            await connection.execute(
                masterSQL,
                [
                    vno,
                    voucherDate,
                    postDate,
                    Number(fine_sa_id),

                    narration,

                    existingFee.challan_no || null,
                    null,
                    null,
                    null,

                    0,
                    fine,

                    0,
                    fine,
                    0,
                    fine,

                    "SFA"
                ]
            );
        }


        // =====================================================
        // COMMIT
        // =====================================================

        await connection.commit();


        // =====================================================
        // RESPONSE
        // =====================================================

        return res.status(200).json({

            message:
                "Student fee updated successfully",

            student_fee_id:
                Number(studentFeeId),

            total_amount:
                totalAmount,

            discount_amount:
                discount,

            fine_amount:
                fine,

            net_amount:
                netAmount,

            paid_amount:
                paidAmount,

            balance_amount:
                netAmount - paidAmount,

            status
        });


    } catch (error) {


        // =====================================================
        // ROLLBACK
        // =====================================================

        try {
            await connection.rollback();
        } catch (rollbackError) {
            console.error(
                "ROLLBACK ERROR:",
                rollbackError
            );
        }


        console.error(
            "UPDATE STUDENT FEE ERROR:",
            error
        );


        return res.status(500).json({

            message:
                "Failed to update student fee",

            error:
                error.message
        });


    } finally {

        connection.release();
    }
});
// ======================================================
// STUDENT FEE ADJUSTMENT ACCOUNTING
// ======================================================
router.post(
    "/student-fees/:studentFeeId/adjustment-accounting",
    async (req, res) => {

        const connection = await db.getConnection();

        try {

            const { studentFeeId } = req.params;

            const {
                discount_amount,
                fine_amount,
                discount_sa_id,
                fine_sa_id
            } = req.body;


            const discount = Number(
                discount_amount || 0
            );

            const fine = Number(
                fine_amount || 0
            );


            if (discount <= 0 && fine <= 0) {
                return res.json({
                    message: "No adjustment required",
                    inserted_rows: 0
                });
            }


            // ==========================================
            // GET STUDENT FEE
            // ==========================================
            const [feeRows] = await connection.query(`
                SELECT
                    student_fee_id,
                    challan_no,
                    issue_date
                FROM student_fees
                WHERE student_fee_id = ?
                LIMIT 1
            `, [studentFeeId]);


            if (!feeRows.length) {

                return res.status(404).json({
                    message: "Student fee not found"
                });
            }


            const fee = feeRows[0];

            const vno = fee.challan_no;

            const voucherDate =
                fee.issue_date;


            const narration =
                `Adjust | SCHOOL FEE RECEIVABLE - ${
                    voucherDate
                        ? new Date(voucherDate)
                            .toISOString()
                            .slice(0, 10)
                        : new Date()
                            .toISOString()
                            .slice(0, 10)
                }`;


            await connection.beginTransaction();


            // ==========================================
            // DISCOUNT
            // ==========================================
            if (discount > 0) {

                if (!discount_sa_id) {

                    await connection.rollback();

                    return res.status(400).json({
                        message:
                            "Discount subsidiary account is required"
                    });
                }


                // ------------------------------------------
                // DISCOUNT DEBIT
                // ------------------------------------------
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
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    vno,
                    voucherDate,
                    voucherDate,
                    discount_sa_id,
                    narration,
                    null,
                    vno,
                    null,
                    null,
                    discount,
                    0,
                    0,
                    0,
                    0,
                    discount,
                    "ADJ_DR",
                    0
                ]);


                // ------------------------------------------
                // RECEIVABLE CREDIT
                // ------------------------------------------
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
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    vno,
                    voucherDate,
                    voucherDate,
                    17,
                    narration,
                    null,
                    vno,
                    null,
                    null,
                    0,
                    discount,
                    0,
                    0,
                    0,
                    discount,
                    "ADJ_CR",
                    0
                ]);
            }


            // ==========================================
            // FINE
            // ==========================================
            if (fine > 0) {

                if (!fine_sa_id) {

                    await connection.rollback();

                    return res.status(400).json({
                        message:
                            "Fine subsidiary account is required"
                    });
                }


                // ------------------------------------------
                // RECEIVABLE DEBIT
                // ------------------------------------------
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
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    vno,
                    voucherDate,
                    voucherDate,
                    17,
                    narration,
                    null,
                    vno,
                    null,
                    null,
                    fine,
                    0,
                    0,
                    0,
                    0,
                    fine,
                    "ADJ_DR",
                    0
                ]);


                // ------------------------------------------
                // FINE INCOME CREDIT
                // ------------------------------------------
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
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    vno,
                    voucherDate,
                    voucherDate,
                    fine_sa_id,
                    narration,
                    null,
                    vno,
                    null,
                    null,
                    0,
                    fine,
                    0,
                    0,
                    0,
                    fine,
                    "ADJ_CR",
                    0
                ]);
            }


            await connection.commit();


            return res.json({
                message:
                    "Adjustment accounting saved successfully",

                inserted_rows:
                    (discount > 0 ? 2 : 0) +
                    (fine > 0 ? 2 : 0)
            });


        } catch (error) {

            await connection.rollback();

            console.error(
                "STUDENT FEE ADJUSTMENT ACCOUNTING ERROR:",
                error
            );

            return res.status(500).json({
                message:
                    "Failed to save adjustment accounting",
                error: error.message
            });

        } finally {

            connection.release();
        }
    }
);

export default router;