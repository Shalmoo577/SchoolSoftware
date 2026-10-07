import express from "express";
import db from "../../db.js";

const router = express.Router();

/*
===========================================================
GET OUTSTANDING FEE REPORT

FILTERS:
    academic_year_id
    fee_month
    class_id
    section_id
    search

ONLY SHOW:
    UNPAID
    PARTIAL

BALANCE:
    net_amount - paid_amount
===========================================================
*/

router.get("/outstanding-fee-report", async (req, res) => {

    try {

        const {
            academic_year_id,
            fee_month,
            class_id,
            section_id,
            campus_id,
            search
        } = req.query;


        let conditions = [];
        let params = [];


        /*
        -------------------------------------------------------
        ONLY OUTSTANDING FEES
        -------------------------------------------------------
        */

        conditions.push(`
            sf.status IN ('UNPAID', 'PARTIAL')
        `);

        conditions.push(`
            (sf.net_amount - sf.paid_amount) > 0
        `);


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
        FEE MONTH
        -------------------------------------------------------
        */

        // if (fee_month ) {

        //     conditions.push(`
        //         DATE_FORMAT(sf.fee_month, '%Y-%m')
        //         =
        //         DATE_FORMAT(?, '%Y-%m')
        //     `);

        //     params.push(fee_month);
        // }
// Month sirf tab filter karein jab specific month select ho
if (fee_month && fee_month !== "ALL") {
    conditions.push("fee_month = ?");
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
        CAMPUSES
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
        SEARCH
        -------------------------------------------------------
        */

        if (search && search.trim() !== "") {

            conditions.push(`
                (
                    s.admission_no LIKE ?
                    OR s.student_name LIKE ?
                    OR s.father_name LIKE ?
                    OR sf.challan_no LIKE ?
                )
            `);

            const searchValue = `%${search.trim()}%`;

            params.push(
                searchValue,
                searchValue,
                searchValue,
                searchValue
            );
        }


        const whereClause = `
            WHERE ${conditions.join(" AND ")}
        `;


        /*
        -------------------------------------------------------
        MAIN REPORT QUERY
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

                sf.campus_id,

                cam.name,

                sec.section_name,

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

                sf.remarks

            FROM student_fees sf

            INNER JOIN students s
                ON s.student_id = sf.student_id

            INNER JOIN academic_years ay
                ON ay.academic_year_id =
                   sf.academic_year_id

            INNER JOIN classes c
                ON c.class_id = sf.class_id

            INNER JOIN campuses cam
                ON cam.campus_id = sf.campus_id

            LEFT JOIN sections sec
                ON sec.section_id =
                   sf.section_id

            ${whereClause}

            ORDER BY
                sf.fee_month DESC,
                c.name ASC,
                s.admission_no ASC

        `, params);


        /*
        -------------------------------------------------------
        TOTALS
        -------------------------------------------------------
        */

        let totalNet = 0;
        let totalPaid = 0;
        let totalBalance = 0;


        rows.forEach(row => {

            totalNet += Number(
                row.net_amount || 0
            );

            totalPaid += Number(
                row.paid_amount || 0
            );

            totalBalance += Number(
                row.balance_amount || 0
            );

        });


        res.json({

            rows,

            totals: {

                total_net: totalNet,

                total_paid: totalPaid,

                total_balance: totalBalance

            }

        });


    } catch (error) {

        console.error(
            "OUTSTANDING FEE REPORT ERROR:",
            error
        );

        res.status(500).json({

            message:
                "Failed to load outstanding fee report",

            error:
                error.sqlMessage ||
                error.message

        });

    }

});

router.get("/campuses", async (req, res) => {
    
    try {
        const [rows] = await db.query(`
            SELECT
                campus_id, 
                name
                from campuses
            
        `);

        res.json(rows);

    } catch (error) {
        console.error("GET CAMPUSES ERROR:", error);

        res.status(500).json({
            message: "Failed to load fee Campus"
        });
    }
});


// router.get("/outstanding-fee-report", async (req, res) => {

//     try {

//         const {
//             academic_year_id,
//             fee_month,
//             class_id,
//             section_id,

//             search
//         } = req.query;


//         let conditions = [];
//         let params = [];


//         /*
//         -------------------------------------------------------
//         ONLY OUTSTANDING FEES
//         -------------------------------------------------------
//         */

//         conditions.push(`
//             sf.status IN ('UNPAID', 'PARTIAL')
//         `);

//         conditions.push(`
//             (sf.net_amount - sf.paid_amount) > 0
//         `);


//         /*
//         -------------------------------------------------------
//         ACADEMIC YEAR
//         -------------------------------------------------------
//         */

//         if (academic_year_id) {

//             conditions.push(`
//                 sf.academic_year_id = ?
//             `);

//             params.push(academic_year_id);
//         }


//         /*
//         -------------------------------------------------------
//         FEE MONTH
//         -------------------------------------------------------
//         */

//         if (fee_month) {

//             conditions.push(`
//                 DATE_FORMAT(sf.fee_month, '%Y-%m')
//                 =
//                 DATE_FORMAT(?, '%Y-%m')
//             `);

//             params.push(fee_month);
//         }


//         /*
//         -------------------------------------------------------
//         CLASS
//         -------------------------------------------------------
//         */

//         if (class_id) {

//             conditions.push(`
//                 sf.class_id = ?
//             `);

//             params.push(class_id);
//         }


//         /*
//         -------------------------------------------------------
//         SECTION
//         -------------------------------------------------------
//         */

//         if (section_id) {

//             conditions.push(`
//                 sf.section_id = ?
//             `);

//             params.push(section_id);
//         }



//         /*
//         -------------------------------------------------------
//         SEARCH
//         -------------------------------------------------------
//         */

//         if (search && search.trim() !== "") {

//             conditions.push(`
//                 (
//                     s.admission_no LIKE ?
//                     OR s.student_name LIKE ?
//                     OR s.father_name LIKE ?
//                     OR sf.challan_no LIKE ?
//                 )
//             `);

//             const searchValue = `%${search.trim()}%`;

//             params.push(
//                 searchValue,
//                 searchValue,
//                 searchValue,
//                 searchValue
//             );
//         }


//         const whereClause = `
//             WHERE ${conditions.join(" AND ")}
//         `;


//         /*
//         -------------------------------------------------------
//         MAIN REPORT QUERY
//         -------------------------------------------------------
//         */

//         const [rows] = await db.query(`

//             SELECT

//                 sf.student_fee_id,

//                 sf.student_id,

//                 sf.academic_year_id,

//                 ay.year_name AS academic_year,

//                 sf.class_id,

//                 c.name AS class_name,

//                 sf.section_id,


//                 sec.section_name,

//                 s.admission_no,

//                 s.student_name,

//                 s.father_name,

//                 sf.fee_month,

//                 sf.challan_no,

//                 sf.issue_date,

//                 sf.due_date,

//                 sf.total_amount,

//                 sf.discount_amount,

//                 sf.fine_amount,

//                 sf.net_amount,

//                 sf.paid_amount,

//                 (
//                     sf.net_amount - sf.paid_amount
//                 ) AS balance_amount,

//                 sf.status,

//                 sf.remarks

//             FROM student_fees sf

//             INNER JOIN students s
//                 ON s.student_id = sf.student_id

//             INNER JOIN academic_years ay
//                 ON ay.academic_year_id =
//                    sf.academic_year_id

//             INNER JOIN classes c
//                 ON c.class_id = sf.class_id



//             LEFT JOIN sections sec
//                 ON sec.section_id =
//                    sf.section_id

//             ${whereClause}

//             ORDER BY
//                 sf.fee_month DESC,
//                 c.name ASC,
//                 s.admission_no ASC

//         `, params);


//         /*
//         -------------------------------------------------------
//         TOTALS
//         -------------------------------------------------------
//         */

//         let totalNet = 0;
//         let totalPaid = 0;
//         let totalBalance = 0;


//         rows.forEach(row => {

//             totalNet += Number(
//                 row.net_amount || 0
//             );

//             totalPaid += Number(
//                 row.paid_amount || 0
//             );

//             totalBalance += Number(
//                 row.balance_amount || 0
//             );

//         });


//         res.json({

//             rows,

//             totals: {

//                 total_net: totalNet,

//                 total_paid: totalPaid,

//                 total_balance: totalBalance

//             }

//         });


//     } catch (error) {

//         console.error(
//             "OUTSTANDING FEE REPORT ERROR:",
//             error
//         );

//         res.status(500).json({

//             message:
//                 "Failed to load outstanding fee report",

//             error:
//                 error.sqlMessage ||
//                 error.message

//         });

//     }

// });


export default router;