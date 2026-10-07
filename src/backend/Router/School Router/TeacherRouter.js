import express from "express";
import db from "../../db.js";

const router = express.Router();


// =====================================================
// GET ALL TEACHERS
// =====================================================

router.get("/teachers", async (req, res) => {

    try {

        const { campus_id, section_id } = req.query;

        if (!campus_id || !section_id) {
            return res.status(400).json({
                message: "Campus and section are required"
            });
        }

        const [rows] = await db.query(`
            SELECT
                teacher_id,
                campus_id,
                section_id,
                name,
                code,
                phone,
                email,
                designation,
                is_active,
                created_at
            FROM teachers
            WHERE campus_id = ?
              AND section_id = ?
            ORDER BY teacher_id DESC
        `, [
            campus_id,
            section_id
        ]);

        res.status(200).json(rows);

    } catch (error) {

        console.error("GET TEACHERS ERROR:", error);

        res.status(500).json({
            message: "Failed to load teachers"
        });
    }
});


// =====================================================
// GET ACTIVE TEACHERS
// =====================================================

router.get("/teachers/active", async (req, res) => {

    try {

        const [rows] = await db.query(`
            SELECT
                teacher_id,
                name,
                code,
                phone,
                email,
                designation
            FROM teachers
            WHERE is_active = 1
            ORDER BY name ASC
        `);

        res.status(200).json(rows);

    } catch (error) {

        console.error(
            "GET ACTIVE TEACHERS ERROR:",
            error
        );

        res.status(500).json({
            message: "Failed to load active teachers"
        });
    }
});


// =====================================================
// GET SINGLE TEACHER
// =====================================================

router.get("/teachers/:teacher_id", async (req, res) => {

    try {

        const { teacher_id } = req.params;

        const [rows] = await db.query(
            `
            SELECT
                teacher_id,
                name,
                code,
                phone,
                email,
                designation,
                is_active,
                created_at
            FROM teachers
            WHERE teacher_id = ?
            `,
            [teacher_id]
        );

        if (rows.length === 0) {

            return res.status(404).json({
                message: "Teacher not found"
            });
        }

        res.status(200).json(rows[0]);

    } catch (error) {

        console.error(
            "GET TEACHER ERROR:",
            error
        );

        res.status(500).json({
            message: "Failed to load teacher"
        });
    }
});


// =====================================================
// SAVE TEACHER
// =====================================================

router.post("/teachers", async (req, res) => {

    try {

        let {
            campus_id,
            section_id,
            name,
            code,
            phone,
            email,
            designation,
            is_active
        } = req.body;

        campus_id = Number(campus_id);
        section_id = Number(section_id);

        name = name?.trim().toUpperCase();
        code = code?.trim().toUpperCase();
        phone = phone?.trim();
        email = email?.trim().toLowerCase();
        designation = designation?.trim().toUpperCase();

        // =============================================
        // VALIDATION
        // =============================================

        if (!campus_id || !section_id) {

            return res.status(400).json({
                message: "Campus and section are required"
            });
        }

        if (!name) {

            return res.status(400).json({
                message: "Teacher name is required"
            });
        }

        if (!code) {

            return res.status(400).json({
                message: "Teacher code is required"
            });
        }

        // =============================================
        // DUPLICATE CODE
        // Same code can exist in another campus/section
        // =============================================

        const [existingCode] = await db.query(`
            SELECT teacher_id
            FROM teachers
            WHERE code = ?
              AND campus_id = ?
              AND section_id = ?
        `, [
            code,
            campus_id,
            section_id
        ]);

        if (existingCode.length > 0) {

            return res.status(400).json({
                message:
                    "Teacher code already exists in this campus and section"
            });
        }

        // =============================================
        // DUPLICATE EMAIL
        // =============================================

        if (email) {

            const [existingEmail] = await db.query(`
                SELECT teacher_id
                FROM teachers
                WHERE email = ?
                  AND campus_id = ?
                  AND section_id = ?
            `, [
                email,
                campus_id,
                section_id
            ]);

            if (existingEmail.length > 0) {

                return res.status(400).json({
                    message:
                        "Teacher email already exists in this campus and section"
                });
            }
        }

        // =============================================
        // INSERT
        // =============================================

        const [result] = await db.query(`
            INSERT INTO teachers
            (
                campus_id,
                section_id,
                name,
                code,
                phone,
                email,
                designation,
                is_active
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            campus_id,
            section_id,
            name,
            code,
            phone || null,
            email || null,
            designation || null,
            is_active === undefined
                ? 1
                : is_active ? 1 : 0
        ]);

        res.status(201).json({

            message: "Teacher saved successfully",

            teacher_id: result.insertId

        });

    } catch (error) {

        console.error("SAVE TEACHER ERROR:", error);

        res.status(500).json({
            message: "Failed to save teacher"
        });
    }
});

// =====================================================
// UPDATE TEACHER
// =====================================================

router.put(
    "/teachers/:teacher_id",
    async (req, res) => {

        try {

            const { teacher_id } = req.params;

            let {
                campus_id,
                section_id,
                name,
                code,
                phone,
                email,
                designation,
                is_active
            } = req.body;

            campus_id = Number(campus_id);
            section_id = Number(section_id);

            name = name?.trim().toUpperCase();
            code = code?.trim().toUpperCase();
            phone = phone?.trim();
            email = email?.trim().toLowerCase();
            designation = designation?.trim().toUpperCase();

            if (!campus_id || !section_id) {

                return res.status(400).json({
                    message: "Campus and section are required"
                });
            }

            if (!name) {

                return res.status(400).json({
                    message: "Teacher name is required"
                });
            }

            if (!code) {

                return res.status(400).json({
                    message: "Teacher code is required"
                });
            }

            // =========================================
            // DUPLICATE CODE
            // =========================================

            const [existingCode] = await db.query(`
                SELECT teacher_id
                FROM teachers
                WHERE code = ?
                  AND campus_id = ?
                  AND section_id = ?
                  AND teacher_id <> ?
            `, [
                code,
                campus_id,
                section_id,
                teacher_id
            ]);

            if (existingCode.length > 0) {

                return res.status(400).json({
                    message:
                        "Teacher code already exists in this campus and section"
                });
            }

            // =========================================
            // DUPLICATE EMAIL
            // =========================================

            if (email) {

                const [existingEmail] = await db.query(`
                    SELECT teacher_id
                    FROM teachers
                    WHERE email = ?
                      AND campus_id = ?
                      AND section_id = ?
                      AND teacher_id <> ?
                `, [
                    email,
                    campus_id,
                    section_id,
                    teacher_id
                ]);

                if (existingEmail.length > 0) {

                    return res.status(400).json({
                        message:
                            "Teacher email already exists in this campus and section"
                    });
                }
            }

            // =========================================
            // UPDATE
            // =========================================

            const [result] = await db.query(`
                UPDATE teachers
                SET
                    campus_id = ?,
                    section_id = ?,
                    name = ?,
                    code = ?,
                    phone = ?,
                    email = ?,
                    designation = ?,
                    is_active = ?
                WHERE teacher_id = ?
            `, [
                campus_id,
                section_id,
                name,
                code,
                phone || null,
                email || null,
                designation || null,
                is_active ? 1 : 0,
                teacher_id
            ]);

            if (result.affectedRows === 0) {

                return res.status(404).json({
                    message: "Teacher not found"
                });
            }

            res.status(200).json({
                message: "Teacher updated successfully"
            });

        } catch (error) {

            console.error(
                "UPDATE TEACHER ERROR:",
                error
            );

            res.status(500).json({
                message: "Failed to update teacher"
            });
        }
    }
);


// =====================================================
// DEACTIVATE TEACHER
// =====================================================

router.delete(
    "/teachers/:teacher_id",
    async (req, res) => {

        try {

            const { teacher_id } =
                req.params;


            const [result] = await db.query(
                `
                UPDATE teachers
                SET is_active = 0
                WHERE teacher_id = ?
                `,
                [teacher_id]
            );


            if (result.affectedRows === 0) {

                return res.status(404).json({
                    message:
                        "Teacher not found"
                });
            }


            res.status(200).json({
                message:
                    "Teacher deactivated successfully"
            });


        } catch (error) {

            console.error(
                "DEACTIVATE TEACHER ERROR:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to deactivate teacher"
            });
        }
    }
);


// =====================================================
// ACTIVATE TEACHER
// =====================================================

router.put(
    "/teachers/:teacher_id/activate",
    async (req, res) => {

        try {

            const { teacher_id } =
                req.params;


            const [result] = await db.query(
                `
                UPDATE teachers
                SET is_active = 1
                WHERE teacher_id = ?
                `,
                [teacher_id]
            );


            if (result.affectedRows === 0) {

                return res.status(404).json({
                    message:
                        "Teacher not found"
                });
            }


            res.status(200).json({
                message:
                    "Teacher activated successfully"
            });


        } catch (error) {

            console.error(
                "ACTIVATE TEACHER ERROR:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to activate teacher"
            });
        }
    }
);


export default router;
