
import express from "express";
import db from "../../db.js";

const router = express.Router();


// ======================================================
// GET ALL ACADEMIC YEARS
// ======================================================
router.get("/academic-years", async (req, res) => {
    try {

        const [rows] = await db.query(`
            SELECT
                academic_year_id,
                year_name,
                start_date,
                end_date,
                is_current,
                created_at
            FROM academic_years
            ORDER BY start_date DESC
        `);

        res.json(rows);

    } catch (error) {

        console.error("GET ACADEMIC YEARS ERROR:", error);

        res.status(500).json({
            message: "Failed to load academic years"
        });
    }
});


// ======================================================
// GET CURRENT ACADEMIC YEAR
// ======================================================
router.get("/academic-year/current", async (req, res) => {
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
            LIMIT 1
        `);

        if (rows.length === 0) {
            return res.status(404).json({
                message: "No current academic year found"
            });
        }

        res.json(rows[0]);

    } catch (error) {

        console.error("GET CURRENT ACADEMIC YEAR ERROR:", error);

        res.status(500).json({
            message: "Failed to load current academic year"
        });
    }
});


// ======================================================
// ADD ACADEMIC YEAR
// ======================================================
router.post("/academic-years", async (req, res) => {
    try {

        const {
            year_name,
            start_date,
            end_date
        } = req.body;

        if (!year_name || !start_date || !end_date) {
            return res.status(400).json({
                message: "Academic year, start date and end date are required"
            });
        }

        // Check duplicate
        const [existing] = await db.query(
            `
            SELECT academic_year_id
            FROM academic_years
            WHERE year_name = ?
            `,
            [year_name.trim()]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                message: "Academic year already exists"
            });
        }

        const [result] = await db.query(
            `
            INSERT INTO academic_years
            (
                year_name,
                start_date,
                end_date,
                is_current
            )
            VALUES (?, ?, ?, 0)
            `,
            [
                year_name.trim(),
                start_date,
                end_date
            ]
        );

        res.status(201).json({
            message: "Academic year added successfully",
            academic_year_id: result.insertId
        });

    } catch (error) {

        console.error("ADD ACADEMIC YEAR ERROR:", error);

        res.status(500).json({
            message: "Failed to add academic year"
        });
    }
});


// ======================================================
// UPDATE ACADEMIC YEAR
// ======================================================
router.put("/academic-years/:id", async (req, res) => {
    try {

        const { id } = req.params;

        const {
            year_name,
            start_date,
            end_date
        } = req.body;

        if (!year_name || !start_date || !end_date) {
            return res.status(400).json({
                message: "Academic year, start date and end date are required"
            });
        }

        const [existing] = await db.query(
            `
            SELECT academic_year_id
            FROM academic_years
            WHERE year_name = ?
            AND academic_year_id <> ?
            `,
            [
                year_name.trim(),
                id
            ]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                message: "Academic year already exists"
            });
        }

        await db.query(
            `
            UPDATE academic_years
            SET
                year_name = ?,
                start_date = ?,
                end_date = ?
            WHERE academic_year_id = ?
            `,
            [
                year_name.trim(),
                start_date,
                end_date,
                id
            ]
        );

        res.json({
            message: "Academic year updated successfully"
        });

    } catch (error) {

        console.error("UPDATE ACADEMIC YEAR ERROR:", error);

        res.status(500).json({
            message: "Failed to update academic year"
        });
    }
});


// ======================================================
// MAKE CURRENT ACADEMIC YEAR
// ======================================================
router.put("/academic-years/:id/current", async (req, res) => {

    const connection = await db.getConnection();

    try {

        const { id } = req.params;

        await connection.beginTransaction();

        // First make every year inactive
        await connection.query(`
            UPDATE academic_years
            SET is_current = 0
        `);

        // Then make selected year current
        const [result] = await connection.query(
            `
            UPDATE academic_years
            SET is_current = 1
            WHERE academic_year_id = ?
            `,
            [id]
        );

        if (result.affectedRows === 0) {

            await connection.rollback();

            return res.status(404).json({
                message: "Academic year not found"
            });
        }

        await connection.commit();

        res.json({
            message: "Current academic year changed successfully"
        });

    } catch (error) {

        await connection.rollback();

        console.error(
            "MAKE CURRENT ACADEMIC YEAR ERROR:",
            error
        );

        res.status(500).json({
            message: "Failed to change current academic year"
        });

    } finally {

        connection.release();
    }
});


export default router;

