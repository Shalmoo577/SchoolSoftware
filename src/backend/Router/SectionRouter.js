
import express from "express";
import db from "../db.js";

const router = express.Router();

// ======================================================
// GET ALL SECTIONS
// ======================================================
router.get("/sections", async (req, res) => {
    try {

        const { campus_id } = req.query;

        let sql = `
            SELECT
                s.section_id,
                s.campus_id,
                c.name AS campus_name,
                s.section_name,
                s.room_number,
                s.capacity,
                s.status
            FROM sections s
            LEFT JOIN campuses c
                ON c.campus_id = s.campus_id
        `;

        const params = [];

        if (campus_id) {
            sql += ` WHERE s.campus_id = ? `;
            params.push(campus_id);
        }

        sql += `
            ORDER BY
                s.campus_id ASC,
                s.section_name ASC
        `;

        const [rows] = await db.query(sql, params);

        res.json(rows);

    } catch (error) {

        console.error("GET SECTIONS ERROR:", error);

        res.status(500).json({
            message: "Failed to load sections"
        });
    }
});


// ======================================================
// GET SINGLE SECTION
// ======================================================
router.get("/sections/:id", async (req, res) => {

    try {

        const { id } = req.params;

        const [rows] = await db.query(
            `
            SELECT
                s.section_id,
                s.campus_id,
                c.name AS campus_name,
                s.section_name,
                s.room_number,
                s.capacity,
                s.status
            FROM sections s
            LEFT JOIN campuses c
                ON c.campus_id = s.campus_id
            WHERE s.section_id = ?
            `,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Section not found"
            });
        }

        res.json(rows[0]);

    } catch (error) {

        console.error("GET SECTION ERROR:", error);

        res.status(500).json({
            message: "Failed to load section"
        });
    }
});


// ======================================================
// CREATE SECTION
// ======================================================
router.post("/sections", async (req, res) => {

    try {

        const {
            campus_id,
            section_name,
            room_number,
            capacity,
            status
        } = req.body;

        // ----------------------------------------------
        // REQUIRED VALIDATION
        // ----------------------------------------------
        if (!campus_id) {
            return res.status(400).json({
                message: "Campus is required"
            });
        }

        if (!section_name || !section_name.trim()) {
            return res.status(400).json({
                message: "Section name is required"
            });
        }

        // ----------------------------------------------
        // CHECK CAMPUS
        // ----------------------------------------------
        const [campusRows] = await db.query(
            `
            SELECT campus_id
            FROM campuses
            WHERE campus_id = ?
            `,
            [campus_id]
        );

        if (campusRows.length === 0) {
            return res.status(400).json({
                message: "Invalid campus"
            });
        }

        // ----------------------------------------------
        // DUPLICATE CHECK
        // Same section name in same campus
        // ----------------------------------------------
        const [duplicateRows] = await db.query(
            `
            SELECT section_id
            FROM sections
            WHERE campus_id = ?
              AND UPPER(TRIM(section_name)) = UPPER(TRIM(?))
            LIMIT 1
            `,
            [campus_id, section_name]
        );

        if (duplicateRows.length > 0) {
            return res.status(400).json({
                message: "This section already exists in this campus"
            });
        }

        // ----------------------------------------------
        // INSERT
        // ----------------------------------------------
        const [result] = await db.query(
            `
            INSERT INTO sections
            (
                campus_id,
                section_name,
                room_number,
                capacity,
                status
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                campus_id,
                section_name.trim().toUpperCase(),
                room_number?.trim() || null,
                capacity || 40,
                status || "Active"
            ]
        );

        res.status(201).json({
            message: "Section created successfully",
            section_id: result.insertId
        });

    } catch (error) {

        console.error("CREATE SECTION ERROR:", error);

        res.status(500).json({
            message: "Failed to create section"
        });
    }
});


// ======================================================
// UPDATE SECTION
// ======================================================
router.put("/sections/:id", async (req, res) => {

    try {

        const { id } = req.params;

        const {
            campus_id,
            section_name,
            room_number,
            capacity,
            status
        } = req.body;

        // ----------------------------------------------
        // REQUIRED VALIDATION
        // ----------------------------------------------
        if (!campus_id) {
            return res.status(400).json({
                message: "Campus is required"
            });
        }

        if (!section_name || !section_name.trim()) {
            return res.status(400).json({
                message: "Section name is required"
            });
        }

        // ----------------------------------------------
        // CHECK SECTION
        // ----------------------------------------------
        const [existingRows] = await db.query(
            `
            SELECT section_id
            FROM sections
            WHERE section_id = ?
            `,
            [id]
        );

        if (existingRows.length === 0) {
            return res.status(404).json({
                message: "Section not found"
            });
        }

        // ----------------------------------------------
        // DUPLICATE CHECK
        // Exclude current section
        // ----------------------------------------------
        const [duplicateRows] = await db.query(
            `
            SELECT section_id
            FROM sections
            WHERE campus_id = ?
              AND UPPER(TRIM(section_name)) = UPPER(TRIM(?))
              AND section_id != ?
            LIMIT 1
            `,
            [campus_id, section_name, id]
        );

        if (duplicateRows.length > 0) {
            return res.status(400).json({
                message: "This section already exists in this campus"
            });
        }

        // ----------------------------------------------
        // UPDATE
        // ----------------------------------------------
        await db.query(
            `
            UPDATE sections
            SET
                campus_id = ?,
                section_name = ?,
                room_number = ?,
                capacity = ?,
                status = ?
            WHERE section_id = ?
            `,
            [
                campus_id,
                section_name.trim().toUpperCase(),
                room_number?.trim() || null,
                capacity || 40,
                status || "Active",
                id
            ]
        );

        res.json({
            message: "Section updated successfully"
        });

    } catch (error) {

        console.error("UPDATE SECTION ERROR:", error);

        res.status(500).json({
            message: "Failed to update section"
        });
    }
});


// ======================================================
// CHANGE STATUS
// ======================================================
router.patch("/sections/:id/status", async (req, res) => {

    try {

        const { id } = req.params;
        const { status } = req.body;

        if (!["Active", "Inactive"].includes(status)) {
            return res.status(400).json({
                message: "Invalid status"
            });
        }

        const [result] = await db.query(
            `
            UPDATE sections
            SET status = ?
            WHERE section_id = ?
            `,
            [status, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Section not found"
            });
        }

        res.json({
            message: `Section ${status.toLowerCase()} successfully`
        });

    } catch (error) {

        console.error("CHANGE SECTION STATUS ERROR:", error);

        res.status(500).json({
            message: "Failed to change section status"
        });
    }
});


export default router;

