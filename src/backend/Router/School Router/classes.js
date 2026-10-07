
import express from "express";
import db from  '../../db.js';

const router = express.Router();


// =====================================================
// GET CLASSES
// =====================================================

router.get("/classes", async (req, res) => {
    try {

        const { campus_id, section_id } = req.query;

        let sql = `
            SELECT
                c.class_id,
                c.campus_id,
                cp.name AS campus_name,
                cp.code AS campus_code,
                c.section_id,
                s.section_name,
                c.name,
                c.code,
                c.description,
                c.is_active,
                c.created_at

            FROM classes c

            LEFT JOIN campuses cp
                ON cp.campus_id = c.campus_id

            LEFT JOIN sections s
                ON s.section_id = c.section_id
        `;

        const params = [];

        if (campus_id && section_id) {

            sql += `
                WHERE c.campus_id = ?
                  AND c.section_id = ?
            `;

            params.push(
                Number(campus_id),
                Number(section_id)
            );
        }

        sql += `
            ORDER BY
                c.campus_id,
                c.section_id,
                c.class_id DESC
        `;

        const [rows] = await db.query(
            sql,
            params
        );

        res.status(200).json(rows);

    } catch (error) {

        console.error(
            "GET CLASSES ERROR:",
            error
        );

        res.status(500).json({
            message: "Failed to load classes"
        });
    }
});


// =====================================================
// SAVE CLASS
// =====================================================

router.post("/classes", async (req, res) => {

    try {

        let {

            campus_id,
            section_id,
            name,
            code,
            description,
            is_active

        } = req.body;


        campus_id =
            Number(campus_id);

        section_id =
            Number(section_id);


        name =
            name
                ?.trim()
                .toUpperCase();


        code =
            code
                ?.trim()
                .toUpperCase();


        description =
            description
                ?.trim()
                .toUpperCase();


        // =================================================
        // VALIDATION
        // =================================================

        if (!campus_id) {

            return res.status(400).json({

                message:
                    "Campus is required"

            });

        }


        if (!section_id) {

            return res.status(400).json({

                message:
                    "Section is required"

            });

        }


        if (!name) {

            return res.status(400).json({

                message:
                    "Class name is required"

            });

        }


        if (!code) {

            return res.status(400).json({

                message:
                    "Class code is required"

            });

        }


        // =================================================
        // CHECK CAMPUS
        // =================================================

        const [campusRows] =
            await db.query(`

                SELECT
                    campus_id

                FROM campuses

                WHERE campus_id = ?

                LIMIT 1

            `, [
                campus_id
            ]);


        if (
            campusRows.length === 0
        ) {

            return res.status(400).json({

                message:
                    "Selected campus does not exist"

            });

        }


        // =================================================
        // CHECK SECTION
        //
        // Section exists in sections table.
        // =================================================

        const [sectionRows] =
            await db.query(`

                SELECT
                    section_id,
                    section_name

                FROM sections

                WHERE section_id = ?

                  AND status = 'Active'

                LIMIT 1

            `, [
                section_id
            ]);


        if (
            sectionRows.length === 0
        ) {

            return res.status(400).json({

                message:
                    "Selected section does not exist or is inactive"

            });

        }


        // =================================================
        // DUPLICATE CLASS CODE
        // Same campus + same section + same code
        // =================================================

        const [existing] =
            await db.query(`

                SELECT
                    class_id

                FROM classes

                WHERE campus_id = ?

                  AND section_id = ?

                  AND code = ?

                LIMIT 1

            `, [
                campus_id,
                section_id,
                code
            ]);


        if (
            existing.length > 0
        ) {

            return res.status(400).json({

                message:
                    "Class code already exists in this campus and section"

            });

        }


        // =================================================
        // INSERT
        // =================================================

        const [result] =
            await db.query(`

                INSERT INTO classes
                (
                    campus_id,
                    section_id,
                    name,
                    code,
                    description,
                    is_active
                )

                VALUES
                (
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?
                )

            `, [

                campus_id,
                section_id,
                name,
                code,
                description || null,

                is_active === undefined
                    ? 1
                    : is_active
                        ? 1
                        : 0

            ]);


        res.status(201).json({

            message:
                "Class saved successfully",

            class_id:
                result.insertId

        });


    } catch (error) {

        console.error(
            "SAVE CLASS ERROR:",
            error
        );


        res.status(500).json({

            message:
                "Failed to save class"

        });

    }

});


// =====================================================
// UPDATE CLASS
// =====================================================

router.put(
    "/classes/:class_id",
    async (req, res) => {

        try {

            const {
                class_id
            } = req.params;


            let {

                campus_id,
                section_id,
                name,
                code,
                description,
                is_active

            } = req.body;


            campus_id =
                Number(campus_id);

            section_id =
                Number(section_id);


            name =
                name
                    ?.trim()
                    .toUpperCase();


            code =
                code
                    ?.trim()
                    .toUpperCase();


            description =
                description
                    ?.trim()
                    .toUpperCase();


            // =================================================
            // VALIDATION
            // =================================================

            if (
                !campus_id ||
                !section_id ||
                !name ||
                !code
            ) {

                return res.status(400).json({

                    message:
                        "Campus, section, class name and code are required"

                });

            }


            // =================================================
            // CHECK SECTION
            // =================================================

            const [sectionRows] =
                await db.query(`

                    SELECT
                        section_id

                    FROM sections

                    WHERE section_id = ?

                      AND status = 'Active'

                    LIMIT 1

                `, [
                    section_id
                ]);


            if (
                sectionRows.length === 0
            ) {

                return res.status(400).json({

                    message:
                        "Selected section does not exist or is inactive"

                });

            }


            // =================================================
            // DUPLICATE
            // =================================================

            const [existing] =
                await db.query(`

                    SELECT
                        class_id

                    FROM classes

                    WHERE campus_id = ?

                      AND section_id = ?

                      AND code = ?

                      AND class_id <> ?

                    LIMIT 1

                `, [

                    campus_id,
                    section_id,
                    code,
                    class_id

                ]);


            if (
                existing.length > 0
            ) {

                return res.status(400).json({

                    message:
                        "Class code already exists in this campus and section"

                });

            }


            // =================================================
            // UPDATE
            // =================================================

            const [result] =
                await db.query(`

                    UPDATE classes

                    SET

                        campus_id = ?,

                        section_id = ?,

                        name = ?,

                        code = ?,

                        description = ?,

                        is_active = ?

                    WHERE class_id = ?

                `, [

                    campus_id,
                    section_id,
                    name,
                    code,
                    description || null,

                    is_active
                        ? 1
                        : 0,

                    class_id

                ]);


            if (
                result.affectedRows === 0
            ) {

                return res.status(404).json({

                    message:
                        "Class not found"

                });

            }


            res.status(200).json({

                message:
                    "Class updated successfully"

            });


        } catch (error) {

            console.error(
                "UPDATE CLASS ERROR:",
                error
            );


            res.status(500).json({

                message:
                    "Failed to update class"

            });

        }

    }
);


// =====================================================
// DEACTIVATE
// =====================================================

router.delete(
    "/classes/:class_id",
    async (req, res) => {

        try {

            const {
                class_id
            } = req.params;


            const [result] =
                await db.query(`

                    UPDATE classes

                    SET
                        is_active = 0

                    WHERE class_id = ?

                `, [
                    class_id
                ]);


            if (
                result.affectedRows === 0
            ) {

                return res.status(404).json({

                    message:
                        "Class not found"

                });

            }


            res.status(200).json({

                message:
                    "Class deactivated successfully"

            });


        } catch (error) {

            console.error(
                "DEACTIVATE CLASS ERROR:",
                error
            );


            res.status(500).json({

                message:
                    "Failed to deactivate class"

            });

        }

    }
);


// =====================================================
// ACTIVATE
// =====================================================

router.put(
    "/classes/:class_id/activate",
    async (req, res) => {

        try {

            const {
                class_id
            } = req.params;


            const [result] =
                await db.query(`

                    UPDATE classes

                    SET
                        is_active = 1

                    WHERE class_id = ?

                `, [
                    class_id
                ]);


            if (
                result.affectedRows === 0
            ) {

                return res.status(404).json({

                    message:
                        "Class not found"

                });

            }


            res.status(200).json({

                message:
                    "Class activated successfully"

            });


        } catch (error) {

            console.error(
                "ACTIVATE CLASS ERROR:",
                error
            );


            res.status(500).json({

                message:
                    "Failed to activate class"

            });

        }

    }
);


export default router;
