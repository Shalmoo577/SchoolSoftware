
import express from "express";
import db from "../../db.js";

const Router = express.Router();


// ==========================================================
// GET ALL FEE TYPES
// GET /api/fee-types
// ==========================================================

Router.get("/fee-types", async (req, res) => {
    try {

        const [rows] = await db.query(`
            SELECT
                id,
                name,
                description,
                is_active,
                created_at

            FROM fee_types

            ORDER BY id DESC
        `);

        res.json(rows);

    } catch (error) {

        console.error(
            "GET FEE TYPES ERROR:",
            error
        );

        res.status(500).json({
            message: "Failed to load fee types",
            error: error.message,
        });
    }
});


// ==========================================================
// GET ACTIVE FEE TYPES
// GET /api/fee-types/active
// ==========================================================

Router.get("/fee-types/active", async (req, res) => {
    try {

        const [rows] = await db.query(`
            SELECT
                id,
                name

            FROM fee_types

            WHERE is_active = 1

            ORDER BY name
        `);

        res.json(rows);

    } catch (error) {

        console.error(
            "GET ACTIVE FEE TYPES ERROR:",
            error
        );

        res.status(500).json({
            message: "Failed to load active fee types",
            error: error.message,
        });
    }
});


// ==========================================================
// CREATE FEE TYPE
// POST /api/fee-types
// ==========================================================

Router.post("/fee-types", async (req, res) => {
    try {

        const {
            name,
            description,
            is_active,
        } = req.body;


        if (!name || !name.trim()) {
            return res.status(400).json({
                message: "Fee type name is required",
            });
        }


        const feeName =
            name.trim().toUpperCase();


        // --------------------------------------------------
        // DUPLICATE CHECK
        // --------------------------------------------------

        const [duplicate] = await db.query(`
            SELECT id

            FROM fee_types

            WHERE name = ?

            LIMIT 1
        `, [feeName]);


        if (duplicate.length > 0) {
            return res.status(400).json({
                message:
                    "This fee type already exists",
            });
        }


        // --------------------------------------------------
        // INSERT
        // --------------------------------------------------

        const [result] = await db.query(`
            INSERT INTO fee_types
            (
                name,
                description,
                is_active
            )

            VALUES (?, ?, ?)
        `, [
            feeName,

            description
                ? description.trim().toUpperCase()
                : null,

            is_active ?? 1,
        ]);


        res.status(201).json({
            message:
                "Fee type saved successfully",

            id: result.insertId,
        });

    } catch (error) {

        console.error(
            "CREATE FEE TYPE ERROR:",
            error
        );

        res.status(500).json({
            message:
                "Failed to save fee type",

            error: error.message,
        });
    }
});


// ==========================================================
// UPDATE FEE TYPE
// PUT /api/fee-types/:id
// ==========================================================

Router.put("/fee-types/:id", async (req, res) => {
    try {

        const { id } = req.params;

        const {
            name,
            description,
            is_active,
        } = req.body;


        if (!name || !name.trim()) {
            return res.status(400).json({
                message:
                    "Fee type name is required",
            });
        }


        const feeName =
            name.trim().toUpperCase();


        // --------------------------------------------------
        // CHECK DUPLICATE
        // --------------------------------------------------

        const [duplicate] = await db.query(`
            SELECT id

            FROM fee_types

            WHERE name = ?
              AND id <> ?

            LIMIT 1
        `, [
            feeName,
            id,
        ]);


        if (duplicate.length > 0) {
            return res.status(400).json({
                message:
                    "Another fee type with this name already exists",
            });
        }


        // --------------------------------------------------
        // UPDATE
        // --------------------------------------------------

        const [result] = await db.query(`
            UPDATE fee_types

            SET
                name = ?,
                description = ?,
                is_active = ?

            WHERE id = ?
        `, [
            feeName,

            description
                ? description.trim().toUpperCase()
                : null,

            is_active ?? 1,

            id,
        ]);


        if (result.affectedRows === 0) {
            return res.status(404).json({
                message:
                    "Fee type not found",
            });
        }


        res.json({
            message:
                "Fee type updated successfully",
        });

    } catch (error) {

        console.error(
            "UPDATE FEE TYPE ERROR:",
            error
        );

        res.status(500).json({
            message:
                "Failed to update fee type",

            error: error.message,
        });
    }
});


// ==========================================================
// DELETE FEE TYPE
// DELETE /api/fee-types/:id
// ==========================================================

Router.delete("/fee-types/:id", async (req, res) => {
    try {

        const { id } = req.params;


        const [result] = await db.query(`
            DELETE FROM fee_types

            WHERE id = ?
        `, [id]);


        if (result.affectedRows === 0) {
            return res.status(404).json({
                message:
                    "Fee type not found",
            });
        }


        res.json({
            message:
                "Fee type deleted successfully",
        });

    } catch (error) {

        console.error(
            "DELETE FEE TYPE ERROR:",
            error
        );


        // Foreign-key protection
        if (error.code === "ER_ROW_IS_REFERENCED_2") {
            return res.status(400).json({
                message:
                    "This fee type is already used in a fee structure and cannot be deleted",
            });
        }


        res.status(500).json({
            message:
                "Failed to delete fee type",

            error: error.message,
        });
    }
});


export default Router;
