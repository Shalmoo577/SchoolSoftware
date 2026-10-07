import express from "express";
import db from "../../db.js";

const router = express.Router();


// =====================================================
// GET SUBJECTS
// =====================================================

router.get("/subjects", async (req, res) => {

    try {

        const [rows] = await db.query(`
            SELECT
                subject_id,
                name,
                code,
                description,
                is_active,
                created_at
            FROM subjects
            ORDER BY subject_id DESC
        `);

        res.status(200).json(rows);

    } catch (error) {

        console.error("GET SUBJECTS ERROR:", error);

        res.status(500).json({
            message: "Failed to load subjects"
        });
    }
});


// =====================================================
// SAVE SUBJECT
// =====================================================

router.post("/subjects", async (req, res) => {

    try {

        let {
            name,
            code,
            description,
            is_active
        } = req.body;


        name = name?.trim().toUpperCase();
        code = code?.trim().toUpperCase();
        description = description?.trim().toUpperCase();


        if (!name) {

            return res.status(400).json({
                message: "Subject name is required"
            });
        }


        if (!code) {

            return res.status(400).json({
                message: "Subject code is required"
            });
        }


        // Check duplicate code

        const [existingCode] = await db.query(
            `
            SELECT subject_id
            FROM subjects
            WHERE code = ?
            `,
            [code]
        );


        if (existingCode.length > 0) {

            return res.status(400).json({
                message: "Subject code already exists"
            });
        }


        const [result] = await db.query(
            `
            INSERT INTO subjects
            (
                name,
                code,
                description,
                is_active
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                name,
                code,
                description || null,
                is_active === undefined
                    ? 1
                    : is_active ? 1 : 0
            ]
        );


        res.status(201).json({

            message: "Subject saved successfully",

            subject_id: result.insertId

        });


    } catch (error) {

        console.error("SAVE SUBJECT ERROR:", error);

        res.status(500).json({
            message: "Failed to save subject"
        });
    }
});


// =====================================================
// UPDATE SUBJECT
// =====================================================

router.put("/subjects/:subject_id", async (req, res) => {

    try {

        const { subject_id } = req.params;


        let {
            name,
            code,
            description,
            is_active
        } = req.body;


        name = name?.trim().toUpperCase();
        code = code?.trim().toUpperCase();
        description = description?.trim().toUpperCase();


        if (!name) {

            return res.status(400).json({
                message: "Subject name is required"
            });
        }


        if (!code) {

            return res.status(400).json({
                message: "Subject code is required"
            });
        }


        // Check duplicate code
        // excluding current subject

        const [existingCode] = await db.query(
            `
            SELECT subject_id
            FROM subjects
            WHERE code = ?
            AND subject_id <> ?
            `,
            [code, subject_id]
        );


        if (existingCode.length > 0) {

            return res.status(400).json({
                message: "Subject code already exists"
            });
        }


        const [result] = await db.query(
            `
            UPDATE subjects
            SET
                name = ?,
                code = ?,
                description = ?,
                is_active = ?
            WHERE subject_id = ?
            `,
            [
                name,
                code,
                description || null,
                is_active ? 1 : 0,
                subject_id
            ]
        );


        if (result.affectedRows === 0) {

            return res.status(404).json({
                message: "Subject not found"
            });
        }


        res.status(200).json({

            message: "Subject updated successfully"

        });


    } catch (error) {

        console.error("UPDATE SUBJECT ERROR:", error);

        res.status(500).json({
            message: "Failed to update subject"
        });
    }
});


// =====================================================
// DEACTIVATE SUBJECT
// =====================================================

router.delete("/subjects/:subject_id", async (req, res) => {

    try {

        const { subject_id } = req.params;


        const [result] = await db.query(
            `
            UPDATE subjects
            SET is_active = 0
            WHERE subject_id = ?
            `,
            [subject_id]
        );


        if (result.affectedRows === 0) {

            return res.status(404).json({
                message: "Subject not found"
            });
        }


        res.status(200).json({

            message: "Subject deactivated successfully"

        });


    } catch (error) {

        console.error("DEACTIVATE SUBJECT ERROR:", error);

        res.status(500).json({
            message: "Failed to deactivate subject"
        });
    }
});


// =====================================================
// ACTIVATE SUBJECT
// =====================================================

router.put("/subjects/:subject_id/activate", async (req, res) => {

    try {

        const { subject_id } = req.params;


        const [result] = await db.query(
            `
            UPDATE subjects
            SET is_active = 1
            WHERE subject_id = ?
            `,
            [subject_id]
        );


        if (result.affectedRows === 0) {

            return res.status(404).json({
                message: "Subject not found"
            });
        }


        res.status(200).json({

            message: "Subject activated successfully"

        });


    } catch (error) {

        console.error("ACTIVATE SUBJECT ERROR:", error);

        res.status(500).json({
            message: "Failed to activate subject"
        });
    }
});


export default router;