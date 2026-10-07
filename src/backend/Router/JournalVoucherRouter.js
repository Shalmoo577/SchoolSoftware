import express from "express";
import db from "../db.js";

const router = express.Router();


// ==========================================================
// GET NEXT JOURNAL VOUCHER NUMBER
// ==========================================================
router.get("/journal-voucher/next-vno", async (req, res) => {

    try {

        const [rows] = await db.query(`
            SELECT VNO
            FROM master
            WHERE VOUCHER_TYPE = 'JV'
              AND IS_DELETED = 0
            ORDER BY MASTER_ID DESC
            LIMIT 1
        `);

        let nextNumber = 1;

        if (rows.length > 0 && rows[0].VNO) {

            const match = rows[0].VNO.match(/JV-(\d+)/);

            if (match) {
                nextNumber = parseInt(match[1], 10) + 1;
            }
        }

        const vno = `JV-${String(nextNumber).padStart(6, "0")}`;

        res.json({
            success: true,
            vno
        });

    } catch (error) {

        console.error("NEXT JV ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to generate Journal Voucher number."
        });

    }

});


// ==========================================================
// GET SUBSIDIARY ACCOUNTS
// ==========================================================
router.get("/journal-voucher/accounts", async (req, res) => {

    try {

        const [rows] = await db.query(`
            SELECT
                Sa_ID,
                Ga_ID,
                Sa_Name,
                type,
                Opening_Debit,
                Opening_Credit,
                remarks
            FROM subsidaryaccount
            ORDER BY Sa_Name ASC
        `);

        res.json(rows);

    } catch (error) {

        console.error("JV ACCOUNTS ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to load subsidiary accounts."
        });

    }

});


// ==========================================================
// GET JOURNAL VOUCHER HISTORY
// ==========================================================
router.get("/journal-vouchers", async (req, res) => {

    try {

        const {
            search = "",
            date_from = "",
            date_to = ""
        } = req.query;


        let conditions = [
            "m.VOUCHER_TYPE = 'JV'",
            "m.IS_DELETED = 0"
        ];

        let params = [];


        // --------------------------------------------------
        // SEARCH
        // --------------------------------------------------
        if (search.trim() !== "") {

            conditions.push(`
                (
                    m.VNO LIKE ?
                    OR m.FILE_NO LIKE ?
                    OR m.NARRATION LIKE ?
                    OR s.Sa_Name LIKE ?
                )
            `);

            const value = `%${search.trim()}%`;

            params.push(
                value,
                value,
                value,
                value
            );

        }


        // --------------------------------------------------
        // DATE FROM
        // --------------------------------------------------
        if (date_from) {

            conditions.push("m.VDT >= ?");

            params.push(date_from);

        }


        // --------------------------------------------------
        // DATE TO
        // --------------------------------------------------
        if (date_to) {

            conditions.push("m.VDT <= ?");

            params.push(date_to);

        }


        const sql = `
            SELECT

                m.VNO,
                DATE_FORMAT(m.VDT, '%Y-%m-%d') AS VDT,

                MAX(m.FILE_NO) AS FILE_NO,

                SUM(COALESCE(m.DEBIT, 0)) AS TOTAL_DEBIT,

                SUM(COALESCE(m.CREDIT, 0)) AS TOTAL_CREDIT,

                COUNT(m.MASTER_ID) AS ROW_COUNT,

                GROUP_CONCAT(
                    DISTINCT s.Sa_Name
                    ORDER BY s.Sa_Name
                    SEPARATOR ', '
                ) AS ACCOUNTS

            FROM master m

            LEFT JOIN subsidaryaccount s
                ON s.Sa_ID = m.SUBID

            WHERE ${conditions.join(" AND ")}

            GROUP BY
                m.VNO,
                m.VDT

            ORDER BY
                m.VDT DESC,
                m.MASTER_ID DESC
        `;


        const [rows] = await db.query(
            sql,
            params
        );


        res.json(rows);

    } catch (error) {

        console.error("JV HISTORY ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to load Journal Voucher history."
        });

    }

});


// ==========================================================
// GET SINGLE JOURNAL VOUCHER
// ==========================================================
router.get("/journal-voucher/:vno", async (req, res) => {

    try {

        const { vno } = req.params;


        const [rows] = await db.query(`
            SELECT

                m.MASTER_ID,
                m.VNO,
                DATE_FORMAT(m.VDT, '%Y-%m-%d') AS VDT,
                DATE_FORMAT(m.PDT, '%Y-%m-%d') AS PDT,

                m.SUBID,
                m.NARRATION,
                m.FILE_NO,
                m.CHQ_NO,

                m.DEBIT,
                m.CREDIT,

                s.Sa_Name

            FROM master m

            LEFT JOIN subsidaryaccount s
                ON s.Sa_ID = m.SUBID

            WHERE m.VNO = ?
              AND m.VOUCHER_TYPE = 'JV'
              AND m.IS_DELETED = 0

            ORDER BY m.MASTER_ID ASC
        `, [vno]);


        if (rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Journal Voucher not found."
            });

        }


        res.json({
            success: true,
            voucher: rows
        });

    } catch (error) {

        console.error("GET JV ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to load Journal Voucher."
        });

    }

});


// ==========================================================
// SAVE JOURNAL VOUCHER
// ==========================================================
router.post("/journal-voucher", async (req, res) => {

    const connection = await db.getConnection();

    try {

        const {
            vno,
            date,
            file_no,
            rows
        } = req.body;


        // --------------------------------------------------
        // BASIC VALIDATION
        // --------------------------------------------------
        if (!vno) {
            return res.status(400).json({
                success: false,
                message: "Voucher number is required."
            });
        }


        if (!date) {
            return res.status(400).json({
                success: false,
                message: "Date is required."
            });
        }


        if (!Array.isArray(rows) || rows.length === 0) {

            return res.status(400).json({
                success: false,
                message: "At least one account row is required."
            });

        }


        // --------------------------------------------------
        // CLEAN ROWS
        // --------------------------------------------------
        const cleanRows = rows
            .map(row => {

                const debit =
                    Number(row.debit || 0);

                const credit =
                    Number(row.credit || 0);

                return {

                    subid:
                        Number(row.subid),

                    narration:
                        String(row.description || "").trim(),

                    chq_no:
                        row.cheque_no
                            ? String(row.cheque_no).trim()
                            : null,

                    debit,

                    credit

                };

            })
            .filter(row =>
                row.subid > 0 &&
                (row.debit > 0 || row.credit > 0)
            );


        if (cleanRows.length === 0) {

            return res.status(400).json({
                success: false,
                message: "Please enter valid account and amount."
            });

        }


        // --------------------------------------------------
        // VALIDATE ROW
        // --------------------------------------------------
        for (const row of cleanRows) {

            if (
                row.debit > 0 &&
                row.credit > 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "A row cannot contain both Debit and Credit."
                });

            }

        }


        // --------------------------------------------------
        // TOTALS
        // --------------------------------------------------
        const totalDebit =
            cleanRows.reduce(
                (sum, row) => sum + row.debit,
                0
            );

        const totalCredit =
            cleanRows.reduce(
                (sum, row) => sum + row.credit,
                0
            );


        const difference =
            Math.abs(
                totalDebit - totalCredit
            );


        if (difference > 0.009) {

            return res.status(400).json({
                success: false,
                message:
                    `Voucher is not balanced. Difference: ${difference.toFixed(2)}`
            });

        }


        // --------------------------------------------------
        // CHECK DUPLICATE VNO
        // --------------------------------------------------
        const [existing] = await connection.query(`
            SELECT MASTER_ID
            FROM master
            WHERE VNO = ?
              AND VOUCHER_TYPE = 'JV'
              AND IS_DELETED = 0
            LIMIT 1
        `, [vno]);


        if (existing.length > 0) {

            return res.status(409).json({
                success: false,
                message: "Voucher number already exists."
            });

        }


        // --------------------------------------------------
        // TRANSACTION
        // --------------------------------------------------
        await connection.beginTransaction();


        for (const row of cleanRows) {

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
                    ?,
                    ?,
                    NULL,
                    ?,
                    ?,
                    0,
                    0,
                    0,
                    0,
                    'JV',
                    0
                )
            `, [

                vno,
                date,
                date,
                row.subid,
                row.narration || null,
                file_no || null,
                row.chq_no,

                row.debit,
                row.credit

            ]);

        }


        await connection.commit();


        res.json({
            success: true,
            message: "Journal Voucher saved successfully.",
            vno,
            totalDebit,
            totalCredit
        });


    } catch (error) {

        await connection.rollback();

        console.error("SAVE JV ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to save Journal Voucher."
        });

    } finally {

        connection.release();

    }

});


// ==========================================================
// UPDATE JOURNAL VOUCHER
// ==========================================================
router.put("/journal-voucher/:vno", async (req, res) => {

    const connection = await db.getConnection();

    try {

        const { vno } = req.params;

        const {
            date,
            file_no,
            rows
        } = req.body;


        if (!date) {

            return res.status(400).json({
                success: false,
                message: "Date is required."
            });

        }


        if (!Array.isArray(rows) || rows.length === 0) {

            return res.status(400).json({
                success: false,
                message: "At least one account row is required."
            });

        }


        const cleanRows = rows
            .map(row => {

                const debit =
                    Number(row.debit || 0);

                const credit =
                    Number(row.credit || 0);

                return {

                    subid:
                        Number(row.subid),

                    narration:
                        String(row.description || "").trim(),

                    chq_no:
                        row.cheque_no
                            ? String(row.cheque_no).trim()
                            : null,

                    debit,
                    credit

                };

            })
            .filter(row =>
                row.subid > 0 &&
                (row.debit > 0 || row.credit > 0)
            );


        if (cleanRows.length === 0) {

            return res.status(400).json({
                success: false,
                message: "Please enter valid account and amount."
            });

        }


        for (const row of cleanRows) {

            if (
                row.debit > 0 &&
                row.credit > 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "A row cannot contain both Debit and Credit."
                });

            }

        }


        const totalDebit =
            cleanRows.reduce(
                (sum, row) => sum + row.debit,
                0
            );

        const totalCredit =
            cleanRows.reduce(
                (sum, row) => sum + row.credit,
                0
            );


        if (
            Math.abs(totalDebit - totalCredit)
            > 0.009
        ) {

            return res.status(400).json({
                success: false,
                message:
                    `Voucher is not balanced. Difference: ${Math.abs(totalDebit - totalCredit).toFixed(2)}`
            });

        }


        await connection.beginTransaction();


        // --------------------------------------------------
        // SOFT DELETE OLD ROWS
        // --------------------------------------------------
        await connection.query(`
            UPDATE master
            SET IS_DELETED = 1
            WHERE VNO = ?
              AND VOUCHER_TYPE = 'JV'
              AND IS_DELETED = 0
        `, [vno]);


        // --------------------------------------------------
        // INSERT UPDATED ROWS
        // --------------------------------------------------
        for (const row of cleanRows) {

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
                    ?,
                    ?,
                    NULL,
                    ?,
                    ?,
                    0,
                    0,
                    0,
                    0,
                    'JV',
                    0
                )
            `, [

                vno,
                date,
                date,
                row.subid,
                row.narration || null,
                file_no || null,
                row.chq_no,

                row.debit,
                row.credit

            ]);

        }


        await connection.commit();


        res.json({
            success: true,
            message: "Journal Voucher updated successfully.",
            vno
        });


    } catch (error) {

        await connection.rollback();

        console.error("UPDATE JV ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update Journal Voucher."
        });

    } finally {

        connection.release();

    }

});


export default router;
