
import express from "express";
import db from "../../db.js";

const router = express.Router();


// ============================================================
// GET ALL FEE STRUCTURES
// GET /api/fee-structures
// ============================================================

router.get("/fee-structures", async (req, res) => {

    try {

        const [rows] = await db.query(`
            SELECT
                fs.fee_structure_id,
                fs.academic_year_id,
                fs.class_id,
                fs.section_id,
                fs.campus_id,

                fs.fee_head_id,
                fh.fee_head_name,

                fs.amount,
                fs.is_active,
                fs.created_at

            FROM fee_structure fs

            INNER JOIN fee_heads fh
                ON fh.fee_head_id = fs.fee_head_id

            ORDER BY
                fs.academic_year_id DESC,
                fs.campus_id ASC,
                fs.class_id ASC,
                fs.section_id ASC,
                fh.fee_head_name ASC
        `);

        res.status(200).json(rows);

    } catch (error) {

        console.error(
            "GET FEE STRUCTURES ERROR:",
            error
        );

        res.status(500).json({
            message: "Failed to load fee structures",
            error: error.sqlMessage || error.message
        });
    }
});


// ============================================================
// GET ONE STRUCTURE
//
// GET /api/fee-structures/
//     :academicYearId/
//     :campusId/
//     :classId/
//     :sectionId
// ============================================================

router.get(
    "/fee-structures/:academicYearId/:campusId/:classId/:sectionId",
    async (req, res) => {

        try {

            const {
                academicYearId,
                campusId,
                classId,
                sectionId
            } = req.params;


            const [rows] = await db.query(`
                SELECT
                    fs.fee_structure_id,
                    fs.academic_year_id,
                    fs.campus_id,
                    fs.class_id,
                    fs.section_id,

                    fs.fee_head_id,
                    fh.fee_head_name,

                    fs.amount,
                    fs.is_active,
                    fs.created_at

                FROM fee_structure fs

                INNER JOIN fee_heads fh
                    ON fh.fee_head_id = fs.fee_head_id

                WHERE
                    fs.academic_year_id = ?
                    AND fs.campus_id = ?
                    AND fs.class_id = ?
                    AND fs.section_id = ?

                ORDER BY
                    fh.fee_head_name ASC
            `, [
                academicYearId,
                campusId,
                classId,
                sectionId
            ]);


            res.status(200).json(rows);

        } catch (error) {

            console.error(
                "GET SINGLE FEE STRUCTURE ERROR:",
                error
            );

            res.status(500).json({
                message: "Failed to load fee structure",
                error:
                    error.sqlMessage ||
                    error.message
            });
        }
    }
);


// ============================================================
// SAVE NEW FEE STRUCTURE
//
// POST /api/fee-structures
//
// Body:
//
// {
//     academic_year_id: 1,
//     campus_id: 2,
//     class_id: 3,
//     section_id: 5,
//     rows: [
//         {
//             fee_head_id: 1,
//             amount: 5000
//         }
//     ]
// }
// ============================================================

router.post(
    "/fee-structures",
    async (req, res) => {

        const connection =
            await db.getConnection();

        try {

            const {
                academic_year_id,
                campus_id,
                section_id,
                class_id,
                rows
            } = req.body;


            // ==================================================
            // BASIC VALIDATION
            // ==================================================

            if (
                !academic_year_id ||
                !campus_id ||
                 !section_id||
                 !class_id
            ) {

                return res.status(400).json({
                    message:
                        "Academic Year, Class, Campus and Section are required"
                });
            }


            if (
                !Array.isArray(rows) ||
                rows.length === 0
            ) {

                return res.status(400).json({
                    message:
                        "At least one fee head is required"
                });
            }


            // ==================================================
            // CHECK DUPLICATE FEE HEADS
            // ==================================================

            const feeHeadIds =
                rows.map(
                    row =>
                        Number(row.fee_head_id)
                );


            const uniqueFeeHeadIds =
                new Set(feeHeadIds);


            if (
                uniqueFeeHeadIds.size !==
                feeHeadIds.length
            ) {

                return res.status(400).json({
                    message:
                        "A fee head cannot be added more than once"
                });
            }


            // ==================================================
            // VALIDATE CAMPUS
            // ==================================================

            const [campus] =
                await connection.query(`
                    SELECT
                        campus_id

                    FROM campuses

                    WHERE
                        campus_id = ?

                    LIMIT 1
                `, [
                    campus_id
                ]);


            if (campus.length === 0) {

                return res.status(400).json({
                    message:
                        "Invalid Campus"
                });
            }


            // ==================================================
            // VALIDATE SECTION
            // ==================================================

            const [section] =
                await connection.query(`
                    SELECT
                        section_id
                        

                    FROM sections

                    WHERE
                        section_id = ?

                    LIMIT 1
                `, [
                    section_id
               
                ]);


            if (section.length === 0) {

                return res.status(400).json({
                    message:
                        "Invalid Section for selected Class"
                });
            }


            // ==================================================
            // CHECK EXISTING STRUCTURE
            // ==================================================

            const [existing] =
                await connection.query(`
                    SELECT
                        fee_structure_id

                    FROM fee_structure

                    WHERE
                        academic_year_id = ?
                        AND campus_id = ?
                        AND class_id = ?
                        AND section_id = ?

                    LIMIT 1
                `, [
                    academic_year_id,
                    campus_id,
                    class_id,
                    section_id
                ]);


            if (existing.length > 0) {

                return res.status(400).json({
                    message:
                        "Fee structure already exists for this Academic Year, Campus, Class and Section"
                });
            }


            // ==================================================
            // START TRANSACTION
            // ==================================================

            await connection.beginTransaction();


            // ==================================================
            // INSERT FEE STRUCTURE
            // ==================================================

            for (const row of rows) {

                if (
                    !row.fee_head_id ||
                    row.amount === undefined ||
                    row.amount === null
                ) {

                    throw new Error(
                        "Fee Head and Amount are required"
                    );
                }


                const amount =
                    Number(row.amount);


                if (
                    Number.isNaN(amount) ||
                    amount < 0
                ) {

                    throw new Error(
                        "Invalid fee amount"
                    );
                }


                // ==============================================
                // VALIDATE FEE HEAD
                // ==============================================

                const [feeHead] =
                    await connection.query(`
                        SELECT
                            fee_head_id

                        FROM fee_heads

                        WHERE
                            fee_head_id = ?
                            AND is_active = 1

                        LIMIT 1
                    `, [
                        row.fee_head_id
                    ]);


                if (feeHead.length === 0) {

                    throw new Error(
                        `Invalid or inactive Fee Head: ${row.fee_head_id}`
                    );
                }


                // ==============================================
                // INSERT
                // ==============================================

                await connection.query(`
                    INSERT INTO fee_structure
                    (
                        academic_year_id,
                        campus_id,
                        class_id,
                        section_id,
                        fee_head_id,
                        amount,
                        is_active
                    )
                    VALUES (?, ?, ?, ?, ?, ?, 1)
                `, [
                    academic_year_id,
                    campus_id,
                    class_id,
                    section_id,
                    row.fee_head_id,
                    amount
                ]);
            }


            // ==================================================
            // COMMIT
            // ==================================================

            await connection.commit();


            res.status(201).json({
                message:
                    "Fee Structure saved successfully"
            });


        } catch (error) {

            await connection.rollback();

            console.error(
                "SAVE FEE STRUCTURE ERROR:",
                error
            );

            res.status(500).json({
                message:
                    error.sqlMessage ||
                    error.message ||
                    "Failed to save fee structure"
            });

        } finally {

            connection.release();
        }
    }
);


// ============================================================
// UPDATE FEE STRUCTURE
//
// PUT /api/fee-structures/
//     :academicYearId/
//     :campusId/
//     :classId/
//     :sectionId
//
// Old rows are deleted and new rows inserted.
// ============================================================

router.put(
    "/fee-structures/:academicYearId/:campusId/:classId/:sectionId",
    async (req, res) => {

        const connection =
            await db.getConnection();

        try {

            const {
                academicYearId,
                campusId,
                classId,
                sectionId
            } = req.params;


            const {
                rows
            } = req.body;


            // ==================================================
            // VALIDATION
            // ==================================================

            if (
                !academicYearId ||
                !campusId ||
                !classId ||
                !sectionId
            ) {

                return res.status(400).json({
                    message:
                        "Academic Year, Campus, Class and Section are required"
                });
            }


            if (
                !Array.isArray(rows) ||
                rows.length === 0
            ) {

                return res.status(400).json({
                    message:
                        "At least one fee head is required"
                });
            }


            // ==================================================
            // CHECK DUPLICATE FEE HEADS
            // ==================================================

            const feeHeadIds =
                rows.map(
                    row =>
                        Number(row.fee_head_id)
                );


            const uniqueFeeHeadIds =
                new Set(feeHeadIds);


            if (
                uniqueFeeHeadIds.size !==
                feeHeadIds.length
            ) {

                return res.status(400).json({
                    message:
                        "A fee head cannot be added more than once"
                });
            }


            // ==================================================
            // VALIDATE CAMPUS
            // ==================================================

            const [campus] =
                await connection.query(`
                    SELECT
                        campus_id

                    FROM campuses

                    WHERE
                        campus_id = ?

                    LIMIT 1
                `, [
                    campusId
                ]);


            if (campus.length === 0) {

                return res.status(400).json({
                    message:
                        "Invalid Campus"
                });
            }


            // ==================================================
            // VALIDATE SECTION
            // ==================================================

            const [section] =
                await connection.query(`
                    SELECT
                        section_id,
                        class_id

                    FROM sections

                    WHERE
                        section_id = ?
                        AND class_id = ?

                    LIMIT 1
                `, [
                    sectionId,
                    classId
                ]);


            if (section.length === 0) {

                return res.status(400).json({
                    message:
                        "Invalid Section for selected Class"
                });
            }


            // ==================================================
            // START TRANSACTION
            // ==================================================

            await connection.beginTransaction();


            // ==================================================
            // DELETE OLD STRUCTURE
            // ==================================================

            await connection.query(`
                DELETE FROM fee_structure

                WHERE
                    academic_year_id = ?
                    AND campus_id = ?
                    AND class_id = ?
                    AND section_id = ?
            `, [
                academicYearId,
                campusId,
                classId,
                sectionId
            ]);


            // ==================================================
            // INSERT NEW STRUCTURE
            // ==================================================

            for (const row of rows) {

                if (
                    !row.fee_head_id ||
                    row.amount === undefined ||
                    row.amount === null
                ) {

                    throw new Error(
                        "Fee Head and Amount are required"
                    );
                }


                const amount =
                    Number(row.amount);


                if (
                    Number.isNaN(amount) ||
                    amount < 0
                ) {

                    throw new Error(
                        "Invalid fee amount"
                    );
                }


                // ==============================================
                // VALIDATE FEE HEAD
                // ==============================================

                const [feeHead] =
                    await connection.query(`
                        SELECT
                            fee_head_id

                        FROM fee_heads

                        WHERE
                            fee_head_id = ?
                            AND is_active = 1

                        LIMIT 1
                    `, [
                        row.fee_head_id
                    ]);


                if (feeHead.length === 0) {

                    throw new Error(
                        `Invalid or inactive Fee Head: ${row.fee_head_id}`
                    );
                }


                // ==============================================
                // INSERT
                // ==============================================

                await connection.query(`
                    INSERT INTO fee_structure
                    (
                        academic_year_id,
                        campus_id,
                        class_id,
                        section_id,
                        fee_head_id,
                        amount,
                        is_active
                    )
                    VALUES (?, ?, ?, ?, ?, ?, 1)
                `, [
                    academicYearId,
                    campusId,
                    classId,
                    sectionId,
                    row.fee_head_id,
                    amount
                ]);
            }


            // ==================================================
            // COMMIT
            // ==================================================

            await connection.commit();


            res.status(200).json({
                message:
                    "Fee Structure updated successfully"
            });


        } catch (error) {

            await connection.rollback();

            console.error(
                "UPDATE FEE STRUCTURE ERROR:",
                error
            );

            res.status(500).json({
                message:
                    error.sqlMessage ||
                    error.message ||
                    "Failed to update fee structure"
            });

        } finally {

            connection.release();
        }
    }
);


// ============================================================
// DELETE FEE STRUCTURE
//
// DELETE /api/fee-structures/
//     :academicYearId/
//     :campusId/
//     :classId/
//     :sectionId
// ============================================================

router.delete(
    "/fee-structures/:academicYearId/:campusId/:classId/:sectionId",
    async (req, res) => {

        try {

            const {
                academicYearId,
                campusId,
                classId,
                sectionId
            } = req.params;


            const [result] =
                await db.query(`
                    DELETE FROM fee_structure

                    WHERE
                        academic_year_id = ?
                        AND campus_id = ?
                        AND class_id = ?
                        AND section_id = ?
                `, [
                    academicYearId,
                    campusId,
                    classId,
                    sectionId
                ]);


            if (
                result.affectedRows === 0
            ) {

                return res.status(404).json({
                    message:
                        "Fee Structure not found"
                });
            }


            res.status(200).json({
                message:
                    "Fee Structure deleted successfully"
            });


        } catch (error) {

            console.error(
                "DELETE FEE STRUCTURE ERROR:",
                error
            );

            res.status(500).json({
                message:
                    error.sqlMessage ||
                    error.message ||
                    "Failed to delete fee structure"
            });
        }
    }
);


export default router;
