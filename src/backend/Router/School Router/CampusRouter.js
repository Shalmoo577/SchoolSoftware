import express from "express";
import db from "../../db.js";

const router = express.Router();


// ===============================
// GET ALL CAMPUSES
// ===============================
router.get("/campuses", async (req, res) => {
    try {

        const [rows] = await db.query(`
            SELECT
               campus_id,
                name,
                code,
                address,
                phone,
                created_at
            FROM campuses
            ORDER BY campus_id DESC
        `);

        res.status(200).json(rows);

    } catch (error) {

        console.error("GET CAMPUSES ERROR:", error);

        res.status(500).json({
            message: "Failed to load campuses"
        });
    }
});


// ===============================
// SAVE CAMPUS
// ===============================
router.post("/campuses", async (req, res) => {

    try {

        let {
            name,
            code,
            address,
            phone
        } = req.body;

        // Remove extra spaces
        name = name?.trim().toUpperCase();
        code = code?.trim().toUpperCase();
        address = address?.trim().toUpperCase();
        phone = phone?.trim();

        if (!name || !code) {

            return res.status(400).json({
                message: "Campus name and code are required"
            });
        }

        // Check duplicate code
        const [existing] = await db.query(
            `SELECT campus_id FROM campuses WHERE code = ?`,
            [code]
        );

        if (existing.length > 0) {

            return res.status(400).json({
                message: "Campus code already exists"
            });
        }

        const [result] = await db.query(
            `
            INSERT INTO campuses
            (name, code, address, phone)
            VALUES (?, ?, ?, ?)
            `,
            [
                name,
                code,
                address || null,
                phone || null
            ]
        );

        res.status(201).json({
            message: "Campus saved successfully",
            campus_id: result.insertcampus_id
        });

    } catch (error) {

        console.error("SAVE CAMPUS ERROR:", error);

        res.status(500).json({
            message: "Failed to save campus"
        });
    }
});


// ===============================
// UPDATE CAMPUS
// ===============================
router.put("/campuses/:campus_id", async (req, res) => {

    try {

        const { campus_id } = req.params;
            console.log("id=" , campus_id);
        let {
            name,
            code,
            address,
            phone
        } = req.body;

        name = name?.trim().toUpperCase();
        code = code?.trim().toUpperCase();
        address = address?.trim().toUpperCase();
        phone = phone?.trim();

        if (!name || !code) {

            return res.status(400).json({
                message: "Campus name and code are required"
            });
        }

        // Check duplicate code except current campus
        const [existing] = await db.query(
            `
            SELECT campus_id
            FROM campuses
            WHERE code = ?
            AND campus_id <> ?
            `,
            [code, campus_id]
        );

        if (existing.length > 0) {

            return res.status(400).json({
                message: "Campus code already exists"
            });
        }

        const [result] = await db.query(
            `
            UPDATE campuses
            SET
                name = ?,
                code = ?,
                address = ?,
                phone = ?
            WHERE campus_id = ?
            `,
            [
                name,
                code,
                address || null,
                phone || null,
                campus_id
            ]
        );

        if (result.affectedRows === 0) {

            return res.status(404).json({
                message: "Campus not found"
            });
        }

        res.status(200).json({
            message: "Campus updated successfully"
        });

    } catch (error) {

        console.error("UPDATE CAMPUS ERROR:", error);

        res.status(500).json({
            message: "Failed to update campus"
        });
    }
});


export default router;