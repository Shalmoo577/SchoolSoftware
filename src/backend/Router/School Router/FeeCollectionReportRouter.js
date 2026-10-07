import express from "express";
import db from "../../db.js";

const router = express.Router();

/*
    GET /api/fee-collection-report

    Filters:
    from_date
    to_date
    academic_year_id
    class_id
    section_id
    payment_method
    search
*/

router.get("/fee-collection-report", async (req, res) => {
    try {
        const {
            from_date,
            to_date,
            academic_year_id,
            class_id,
            section_id,
            payment_method,
            search
        } = req.query;

        let where = [];
        let params = [];

        // --------------------------------------------------
        // DATE FILTER
        // --------------------------------------------------

        if (from_date) {
            where.push("fr.payment_date >= ?");
            params.push(from_date);
        }

        if (to_date) {
            where.push("fr.payment_date <= ?");
            params.push(to_date);
        }

        // --------------------------------------------------
        // ACADEMIC YEAR
        // --------------------------------------------------

        if (academic_year_id) {
            where.push("sf.academic_year_id = ?");
            params.push(academic_year_id);
        }

        // --------------------------------------------------
        // CLASS
        // --------------------------------------------------

        if (class_id) {
            where.push("sf.class_id = ?");
            params.push(class_id);
        }

        // --------------------------------------------------
        // SECTION
        // --------------------------------------------------

        if (section_id) {
            where.push("sf.section_id = ?");
            params.push(section_id);
        }

        // --------------------------------------------------
        // PAYMENT METHOD
        // --------------------------------------------------

        if (
            payment_method &&
            payment_method !== "ALL"
        ) {
            where.push("fr.payment_method = ?");
            params.push(payment_method);
        }

        // --------------------------------------------------
        // SEARCH
        // --------------------------------------------------

        if (search) {
            where.push(`
                (
                    fr.receipt_no LIKE ?
                    OR s.admission_no LIKE ?
                    OR s.student_name LIKE ?
                    OR s.father_name LIKE ?
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
            where.length > 0
                ? `WHERE ${where.join(" AND ")}`
                : "";

        // --------------------------------------------------
        // REPORT DATA
        // --------------------------------------------------

        const [rows] = await db.query(
            `
            SELECT
                fr.fee_receipt_id,
                fr.receipt_no,
                fr.payment_date,
                fr.payment_method,
                fr.reference_no,
                fr.amount_paid,
                fr.remarks,

                s.student_id,
                s.admission_no,
                s.student_name,
                s.father_name,

                c.name AS class_name,
                sec.section_name,

                sf.student_fee_id,
                sf.fee_month,
                sf.challan_no,

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

            ${whereClause}

            ORDER BY
                fr.payment_date DESC,
                fr.fee_receipt_id DESC
            `,
            params
        );

        // --------------------------------------------------
        // TOTALS
        // --------------------------------------------------

        const totalAmount = rows.reduce(
            (sum, row) =>
                sum + Number(row.amount_paid || 0),
            0
        );

        const cashAmount = rows
            .filter(
                row =>
                    row.payment_method === "CASH"
            )
            .reduce(
                (sum, row) =>
                    sum + Number(row.amount_paid || 0),
                0
            );

        const bankAmount = rows
            .filter(
                row =>
                    row.payment_method === "BANK"
            )
            .reduce(
                (sum, row) =>
                    sum + Number(row.amount_paid || 0),
                0
            );

        res.json({
            rows,
            totals: {
                cash: cashAmount,
                bank: bankAmount,
                total: totalAmount,
                count: rows.length
            }
        });

    } catch (error) {
        console.error(
            "Fee Collection Report Error:",
            error
        );

        res.status(500).json({
            message:
                "Failed to load fee collection report",
            error: error.message
        });
    }
});

export default router;