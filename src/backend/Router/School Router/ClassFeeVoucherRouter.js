import express from "express";
import db from "../../db.js";

const router = express.Router();


/*
====================================================
HELPER
GET USER ASSIGNED CAMPUS + SECTION
====================================================
*/

const getUserAssignment = async (connection, user_id) => {

    const [rows] = await connection.query(`
        SELECT
            user_id,
            campus_id,
            section_id
        FROM users
        WHERE user_id = ?
        LIMIT 1
    `, [user_id]);

    if (rows.length === 0) {
        return null;
    }

    return rows[0];
};


// ======================================================
// CREATE ACCOUNTING ENTRIES FOR A STUDENT FEE
// ======================================================
const createFeeVoucherAccounting = async (
    connection,
    studentFeeId
) => {

    // ==================================================
    // GET STUDENT FEE
    // ==================================================

    const [feeRows] =
        await connection.query(`
            SELECT
                student_fee_id,
                challan_no,
                issue_date,
                total_amount,
                discount_amount,
                fine_amount,
                net_amount,
                status
            FROM student_fees
            WHERE student_fee_id = ?
            LIMIT 1
        `, [studentFeeId]);

    if (feeRows.length === 0) {
        throw new Error(
            "Student fee voucher not found"
        );
    }

    const fee =
        feeRows[0];

    const vno =
        fee.challan_no;

    // ==================================================
    // PREVENT DUPLICATE ACCOUNTING
    // ==================================================

    const [existingRows] =
        await connection.query(`
            SELECT
                COUNT(*) AS total
            FROM master
            WHERE VNO = ?
              AND VOUCHER_TYPE = 'FV'
              AND IS_DELETED = 0
        `, [vno]);

    if (
        Number(existingRows[0].total) > 0
    ) {
        throw new Error(
            `Accounting entries already exist for ${vno}`
        );
    }

    // ==================================================
    // GET FEE DETAILS
    // ==================================================

    const [details] =
        await connection.query(`
            SELECT
                sfd.fee_head_id,
                fh.fee_head_name,
                sfd.amount
            FROM student_fee_details sfd
            INNER JOIN fee_heads fh
                ON fh.fee_head_id =
                   sfd.fee_head_id
            WHERE sfd.student_fee_id = ?
            ORDER BY
                sfd.student_fee_detail_id
        `, [studentFeeId]);

    if (details.length === 0) {
        throw new Error(
            "No fee details found for this voucher"
        );
    }

    // ==================================================
    // FEE HEAD → RECEIVABLE + INCOME
    // ==================================================

    const accountMap = {

        // ANNUAL FEE
        1: {
            receivable: 3,
            income: 11
        },

        // EXAM FEE
        2: {
            receivable: 4,
            income: 12
        },

        // LATE FEE
        3: {
            receivable: 7,
            income: 15
        },

        // ADMISSION FEE
        4: {
            receivable: 2,
            income: 10
        },

        // MONTHLY TUTION FEE
        5: {
            receivable: 1,
            income: 9
        },

        // TRANSPORT FEE
        6: {
            receivable: 6,
            income: 14
        },

        // FINE FEE
        7: {
            receivable: 8,
            income: 16
        },

        // COMPUTER FEE
        8: {
            receivable: 5,
            income: 13
        }
    };

    let totalDebit = 0;
    let totalCredit = 0;
    let insertedRows = 0;

    // ==================================================
    // INSERT ACCOUNTING ENTRIES
    // ==================================================

    for (const detail of details) {

        const amount =
            Number(detail.amount);

        if (
            Number.isNaN(amount) ||
            amount <= 0
        ) {
            continue;
        }

        const mapping =
            accountMap[
                Number(
                    detail.fee_head_id
                )
            ];

        if (!mapping) {
            throw new Error(
                `No accounting mapping found for fee head ID ${detail.fee_head_id}`
            );
        }

        // ==================================================
        // DEBIT — RECEIVABLE
        // ==================================================

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
                ?, ?, ?, ?,
                ?,
                NULL,
                NULL,
                NULL,
                NULL,
                ?,
                0.00,
                0.00,
                0.00,
                0.00,
                ?,
                'FV',
                0
            )
        `, [
            vno,
            fee.issue_date,
            fee.issue_date,
            mapping.receivable,

            `${detail.fee_head_name} RECEIVABLE - ${vno}`,

            amount,
            amount
        ]);

        totalDebit += amount;
        insertedRows++;

        // ==================================================
        // CREDIT — INCOME
        // ==================================================

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
                ?, ?, ?, ?,
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
                'FV',
                0
            )
        `, [
            vno,
            fee.issue_date,
            fee.issue_date,
            mapping.income,

            `${detail.fee_head_name} INCOME - ${vno}`,

            amount,
            amount
        ]);

        totalCredit += amount;
        insertedRows++;
    }

    // ==================================================
    // BALANCE CHECK
    // ==================================================

    if (
        Number(totalDebit.toFixed(2)) !==
        Number(totalCredit.toFixed(2))
    ) {
        throw new Error(
            `Accounting is not balanced. Debit=${totalDebit}, Credit=${totalCredit}`
        );
    }

    return {
        vno,
        insertedRows,
        totalDebit:
            Number(totalDebit.toFixed(2)),
        totalCredit:
            Number(totalCredit.toFixed(2))
    };
};

/*
====================================================
GET ACTIVE ACADEMIC YEARS
====================================================
*/

router.get(
    "/class-fee-voucher/academic-years",
    async (req, res) => {

        try {

            const [rows] = await db.query(`
                SELECT
                    academic_year_id,
                    year_name,
                    start_date,
                    end_date,
                    is_current
                FROM academic_years
                WHERE is_current = 1
                ORDER BY start_date DESC
            `);

            res.json(rows);

        } catch (error) {

            console.error(
                "GET ACADEMIC YEARS ERROR:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to load academic years",
                error:
                    error.sqlMessage ||
                    error.message
            });
        }
    }
);


/*
====================================================
GET ACTIVE CLASSES
====================================================
*/

router.get(
    "/class-fee-voucher/classes",
    async (req, res) => {

        try {

            const campus_id = Number(
                req.query.campus_id
            );

            const section_id = Number(
                req.query.section_id
            );

            if (!campus_id) {
                return res.status(400).json({
                    message: "Campus is required"
                });
            }

            if (!section_id) {
                return res.status(400).json({
                    message: "Section is required"
                });
            }

            const [rows] = await db.query(`
                SELECT
                    class_id,
                    name
                FROM classes
                WHERE is_active = 1
                  AND campus_id = ?
                  AND section_id = ?
                ORDER BY name
            `, [
                campus_id,
                section_id
            ]);

            res.json(rows);

        } catch (error) {

            console.error(
                "GET CLASSES ERROR:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to load classes",
                error:
                    error.sqlMessage ||
                    error.message
            });
        }
    }
);

// 
/*
====================================================
CHECK WHETHER FEES ARE ALREADY GENERATED
====================================================
*/

router.get(
    "/class-fee-voucher/check",
    async (req, res) => {

        const connection = await db.getConnection();

        try {

            const {
                user_id,
                academic_year_id,
                class_id,
                fee_month
            } = req.query;


            if (
                !user_id ||
                !academic_year_id ||
                !class_id ||
                !fee_month
            ) {

                return res.status(400).json({
                    message:
                        "User, Academic Year, Class and Fee Month are required"
                });
            }


            /*
            GET USER ASSIGNMENT
            */

            const user =
                await getUserAssignment(
                    connection,
                    user_id
                );


            if (!user) {

                return res.status(401).json({
                    message:
                        "User not found"
                });
            }


            const campus_id =
                user.campus_id;

            const section_id =
                user.section_id;


            if (!campus_id || !section_id) {

                return res.status(400).json({
                    message:
                        "Campus or Section is not assigned to this user"
                });
            }


            /*
            CHECK EXISTING
            */

            const [rows] =
                await connection.query(`

                    SELECT
                        COUNT(*) AS total_vouchers
                    FROM student_fees
                    WHERE campus_id = ?
                      AND section_id = ?
                      AND academic_year_id = ?
                      AND class_id = ?
                      AND fee_month = ?
                      AND status <> 'CANCELLED'

                `, [
                    campus_id,
                    section_id,
                    academic_year_id,
                    class_id,
                    fee_month
                ]);


            res.json({

                exists:
                    Number(
                        rows[0].total_vouchers
                    ) > 0,

                total_vouchers:
                    Number(
                        rows[0].total_vouchers
                    ),

                campus_id,
                section_id

            });

        } catch (error) {

            console.error(
                "CHECK CLASS FEE VOUCHER ERROR:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to check existing vouchers",
                error:
                    error.sqlMessage ||
                    error.message
            });

        } finally {

            connection.release();
        }
    }
);


/*
====================================================
GENERATED FEES TABLE
SELECTED MONTH ONLY
USER'S CAMPUS + SECTION ONLY
====================================================
*/

router.get(
    "/class-fee-voucher/generated",
    async (req, res) => {

        const connection = await db.getConnection();

        try {

            const {
                user_id,
                academic_year_id,
                fee_month
            } = req.query;


            if (
                !user_id ||
                !fee_month
            ) {

                return res.status(400).json({
                    message:
                        "User and Fee Month are required"
                });
            }


            /*
            GET USER ASSIGNMENT
            */

            const user =
                await getUserAssignment(
                    connection,
                    user_id
                );


            if (!user) {

                return res.status(401).json({
                    message:
                        "User not found"
                });
            }


            const campus_id =
                user.campus_id;

            const section_id =
                user.section_id;


            if (!campus_id || !section_id) {

                return res.status(400).json({
                    message:
                        "Campus or Section is not assigned to this user"
                });
            }


            /*
            GET GENERATED CLASS SUMMARY
            */

            let query = `

                SELECT
                    sf.class_id,

                    c.name AS class_name,

                    sf.section_id,

                    sec.section_name,

                    sf.fee_month,

                    COUNT(
                        DISTINCT sf.student_fee_id
                    ) AS total_students,

                    SUM(
                        sf.net_amount
                    ) AS total_amount

                FROM student_fees sf

                INNER JOIN classes c
                    ON c.class_id = sf.class_id

                LEFT JOIN sections sec
                    ON sec.section_id = sf.section_id

                WHERE sf.campus_id = ?
                  AND sf.section_id = ?
                  AND sf.fee_month = ?
                  AND sf.status <> 'CANCELLED'

            `;


            const params = [
                campus_id,
                section_id,
                fee_month
            ];


            if (academic_year_id) {

                query += `
                    AND sf.academic_year_id = ?
                `;

                params.push(
                    academic_year_id
                );
            }


            query += `

                GROUP BY
                    sf.class_id,
                    c.name,
                    sf.section_id,
                    sec.section_name,
                    sf.fee_month

                ORDER BY
                    c.name

            `;


            const [rows] =
                await connection.query(
                    query,
                    params
                );


            res.json(rows);

        } catch (error) {

            console.error(
                "GET GENERATED CLASS FEES ERROR:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to load generated fees",
                error:
                    error.sqlMessage ||
                    error.message
            });

        } finally {

            connection.release();
        }
    }
);


/*
====================================================
GENERATE MONTHLY FEES
ONLY LOGGED-IN USER'S CAMPUS + SECTION
====================================================
*/

/*
====================================================
GENERATE MONTHLY FEES
ONLY LOGGED-IN USER'S CAMPUS + SECTION

ACCOUNTING:
    DR  SCHOOL FEE RECEIVABLE  (SUBID 17)
    CR  SCHOOL FEE INCOME       (SUBID 18)

ONLY 2 MASTER ROWS PER BATCH
====================================================
*/
router.post(
    "/class-fee-voucher/generate",
    async (req, res) => {

        const connection = await db.getConnection();

        try {

            const {
                user_id,
                academic_year_id,
                class_id,
                fee_month,
                due_date
            } = req.body;


            // ====================================================
            // VALIDATION
            // ====================================================

            if (
                !user_id ||
                !academic_year_id ||
                !class_id ||
                !fee_month ||
                !due_date
            ) {
                return res.status(400).json({
                    message:
                        "User, Academic Year, Class, Fee Month and Due Date are required"
                });
            }


            // ====================================================
            // GET USER ASSIGNMENT
            // ====================================================

            const user =
                await getUserAssignment(
                    connection,
                    user_id
                );

            if (!user) {
                return res.status(401).json({
                    message: "User not found"
                });
            }


            const campus_id =
                user.campus_id;

            const section_id =
                user.section_id;


            if (!campus_id || !section_id) {
                return res.status(400).json({
                    message:
                        "Campus or Section is not assigned to this user"
                });
            }


            // ====================================================
            // CHECK CLASS
            // ====================================================

   const [classRows] =
    await connection.query(`
        SELECT
            c.class_id,
            c.name AS class_name,
            cp.name AS campus_name,
            sec.section_name

        FROM classes c

        LEFT JOIN campuses cp
            ON cp.campus_id = c.campus_id

        LEFT JOIN sections sec
            ON sec.section_id = c.section_id
           AND sec.campus_id = c.campus_id

        WHERE c.class_id = ?
          AND c.campus_id = ?
          AND c.section_id = ?
          AND c.is_active = 1

        LIMIT 1
    `, [
        class_id,
        campus_id,
        section_id
    ]);


            if (classRows.length === 0) {
                return res.status(400).json({
                    message:
                        "Selected class not found or inactive"
                });
            }


            // ====================================================
            // GET FEE STRUCTURE
            // ====================================================

            const [feeStructure] =
                await connection.query(`
                    SELECT
                        fs.fee_head_id,
                        fs.amount,
                        fh.fee_head_name

                    FROM fee_structure fs

                    INNER JOIN fee_heads fh
                        ON fh.fee_head_id =
                           fs.fee_head_id

                    WHERE fs.academic_year_id = ?
                      AND fs.class_id = ?
                      AND fs.is_active = 1
                      AND fh.is_active = 1

                    ORDER BY fs.fee_structure_id
                `, [
                    academic_year_id,
                    class_id
                ]);


            if (feeStructure.length === 0) {
                return res.status(400).json({
                    message:
                        "No active Fee Structure found for this Academic Year and Class"
                });
            }


            // ====================================================
            // GET ACTIVE STUDENTS
            // ====================================================

            const [students] =
                await connection.query(`
                    SELECT
                        student_id,
                        admission_no,
                        student_name,
                        class_id,
                        section_id,
                        campus_id

                    FROM students

                    WHERE campus_id = ?
                      AND class_id = ?
                      AND section_id = ?
                      AND student_status = 'Active'

                    ORDER BY admission_no
                `, [
                    campus_id,
                    class_id,
                    section_id
                ]);


            if (students.length === 0) {
                return res.status(400).json({
                    message:
                        "No active students found in your assigned campus and section for this class"
                });
            }


            // ====================================================
            // CHECK DUPLICATE MONTH
            // ====================================================

            const [existingRows] =
                await connection.query(`
                    SELECT
                        COUNT(*) AS total

                    FROM student_fees

                    WHERE campus_id = ?
                      AND section_id = ?
                      AND academic_year_id = ?
                      AND class_id = ?
                      AND fee_month = ?
                      AND status <> 'CANCELLED'
                `, [
                    campus_id,
                    section_id,
                    academic_year_id,
                    class_id,
                    fee_month
                ]);


            if (
                Number(existingRows[0].total) > 0
            ) {
                return res.status(400).json({
                    message:
                        "Fee vouchers have already been generated for this class, section and month"
                });
            }


            // ====================================================
            // GET NEXT CHALLAN NUMBER
            // ====================================================

            const [lastChallanRows] =
                await connection.query(`
                    SELECT
                        challan_no

                    FROM student_fees

                    WHERE challan_no LIKE 'FEE-%'

                    ORDER BY student_fee_id DESC

                    LIMIT 1
                `);


            let nextNumber = 1;


            if (lastChallanRows.length > 0) {

                const lastChallan =
                    String(
                        lastChallanRows[0].challan_no
                    );

                const match =
                    lastChallan.match(/FEE-(\d+)/);

                if (match) {

                    nextNumber =
                        Number(match[1]) + 1;
                }
            }


            // ====================================================
            // CALCULATE ONE STUDENT TOTAL
            // ====================================================

            let studentTotalAmount = 0;


            for (const fee of feeStructure) {

                studentTotalAmount +=
                    Number(fee.amount);
            }


            studentTotalAmount =
                Number(
                    studentTotalAmount.toFixed(2)
                );


            // ====================================================
            // TOTAL CLASS RECEIVABLE
            // ====================================================

            const totalClassAmount =
                Number(
                    (
                        studentTotalAmount *
                        students.length
                    ).toFixed(2)
                );


            if (totalClassAmount <= 0) {
                return res.status(400).json({
                    message:
                        "Total fee amount must be greater than zero"
                });
            }


            // ====================================================
            // START TRANSACTION
            // ====================================================

            await connection.beginTransaction();


            let generatedCount = 0;

            let firstChallanNo = null;

            let lastChallanNo = null;


            // ====================================================
            // CREATE STUDENT FEE VOUCHERS
            // ====================================================

            for (const student of students) {

                const challanNo =
                    `FEE-${String(
                        nextNumber
                    ).padStart(6, "0")}`;


                nextNumber++;


                if (!firstChallanNo) {

                    firstChallanNo =
                        challanNo;
                }


                lastChallanNo =
                    challanNo;


                // ====================================================
                // INSERT STUDENT FEE
                // ====================================================

                const [feeResult] =
                    await connection.query(`
                        INSERT INTO student_fees
                        (
                            student_id,
                            user_id,
                            campus_id,
                            academic_year_id,
                            class_id,
                            section_id,
                            fee_month,
                            challan_no,
                            issue_date,
                            due_date,
                            total_amount,
                            discount_amount,
                            fine_amount,
                            net_amount,
                            paid_amount,
                            status,
                            remarks
                        )

                        VALUES
                        (
                            ?, ?, ?, ?, ?, ?, ?,
                            ?, CURDATE(), ?,
                            ?, 0.00, 0.00, ?,
                            0.00,
                            'UNPAID',
                            NULL
                        )
                    `, [
                        student.student_id,
                        user_id,
                        campus_id,
                        academic_year_id,
                        class_id,
                        section_id,
                        fee_month,
                        challanNo,
                        due_date,
                        studentTotalAmount,
                        studentTotalAmount
                    ]);


                const studentFeeId =
                    feeResult.insertId;


                // ====================================================
                // INSERT FEE DETAILS
                // ====================================================

                for (const fee of feeStructure) {

                    await connection.query(`
                        INSERT INTO student_fee_details
                        (
                            student_fee_id,
                            fee_head_id,
                            fee_description,
                            amount
                        )

                        VALUES
                        (
                            ?, ?, ?, ?
                        )
                    `, [
                        studentFeeId,
                        fee.fee_head_id,
                        fee.fee_head_name,
                        fee.amount
                    ]);
                }


                generatedCount++;
            }


    const formattedFeeMonth =
    fee_month
        ? new Date(fee_month).toLocaleDateString(
            "en-US",
            {
                month: "long",
                year: "numeric"
            }
        )
        : "N/A";

            // ====================================================
            // ACCOUNTING NARRATION
            // ====================================================
            //
            // Batch level narration:
            //
            // Class
            // Campus
            // Section
            // Month
            //
            // Example:
            //
            // Class: 5 | Campus: MHEMODABAD |
            // Section: MORNING | Month: October 2026
            // ====================================================

            const accountingNarration =
    `Class: ${classRows[0].class_name || "N/A"} | ` +
    `Campus: ${classRows[0].campus_name || "N/A"} | ` +
    `Section: ${classRows[0].section_name || "N/A"} | ` +
    `Month: ${formattedFeeMonth}`;


            // ====================================================
            // ACCOUNTING VOUCHER NUMBER
            // ====================================================

            const accountingVno =
                `CFV-${String(
                    nextNumber - students.length
                ).padStart(6, "0")}`;


            // ====================================================
            // DEBIT
            // SCHOOL FEE RECEIVABLE
            // ====================================================

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
                    ?, CURDATE(), CURDATE(), ?,
                    ?,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    ?,
                    0.00,
                    0.00,
                    0.00,
                    0.00,
                    ?,
                    'CFV',
                    0
                )
            `, [
                accountingVno,
                17,

                `SCHOOL FEE RECEIVABLE - ${accountingNarration}`,

                totalClassAmount,
                totalClassAmount
            ]);


            // ====================================================
            // CREDIT
            // SCHOOL FEE INCOME
            // ====================================================

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
                    ?, CURDATE(), CURDATE(), ?,
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
                    'CFV',
                    0
                )
            `, [
                accountingVno,
                18,

                `SCHOOL FEE INCOME - ${accountingNarration}`,

                totalClassAmount,
                totalClassAmount
            ]);


            // ====================================================
            // COMMIT
            // ====================================================

            await connection.commit();


            // ====================================================
            // RESPONSE
            // ====================================================

            return res.status(201).json({

                message:
                    "Class fee vouchers generated successfully",

                generated_count:
                    generatedCount,

                class_name:
                    classRows[0].name,

                campus_id,

                section_id,

                first_challan_no:
                    firstChallanNo,

                last_challan_no:
                    lastChallanNo,

                accounting_vno:
                    accountingVno,

                accounting_narration:
                    accountingNarration,

                accounting: {

                    receivable_subid:
                        17,

                    income_subid:
                        18,

                    debit:
                        totalClassAmount,

                    credit:
                        totalClassAmount,

                    balanced:
                        true
                }

            });


        } catch (error) {

            // ====================================================
            // ROLLBACK
            // ====================================================

            await connection.rollback();


            console.error(
                "GENERATE CLASS FEE VOUCHERS ERROR:",
                error
            );


            if (
                error.code === "ER_DUP_ENTRY"
            ) {

                return res.status(400).json({
                    message:
                        "Fee voucher already exists for one or more students for this month"
                });
            }


            return res.status(500).json({

                message:
                    error.sqlMessage ||
                    error.message ||
                    "Failed to generate class fee vouchers"

            });

        } finally {

            connection.release();

        }
    }
);



/*
====================================================
MANUAL / TEST ACCOUNTING
====================================================
*/

router.post(
    "/fee-voucher/accounting",
    async (req, res) => {

        const connection =
            await db.getConnection();

        try {

            const {
                student_fee_id
            } = req.body;


            if (!student_fee_id) {

                return res.status(400).json({
                    message:
                        "student_fee_id is required"
                });
            }


            await connection.beginTransaction();


            const result =
                await createFeeVoucherAccounting(
                    connection,
                    student_fee_id
                );


            await connection.commit();


            return res.status(201).json({

                message:
                    "Fee voucher accounting entries created successfully",

                student_fee_id,

                vno:
                    result.vno,

                voucher_type:
                    "FV",

                inserted_rows:
                    result.insertedRows,

                total_debit:
                    result.totalDebit,

                total_credit:
                    result.totalCredit,

                balanced:
                    true
            });


        } catch (error) {

            await connection.rollback();


            console.error(
                "FEE VOUCHER ACCOUNTING ERROR:",
                error
            );


            return res.status(500).json({

                message:
                    error.sqlMessage ||
                    error.message ||
                    "Failed to create fee voucher accounting entries"

            });


        } finally {

            connection.release();

        }
    }
);
export default router;