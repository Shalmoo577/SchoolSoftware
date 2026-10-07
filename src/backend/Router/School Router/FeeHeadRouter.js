import express from "express";
import db from "../../db.js";

const router = express.Router();


/*
    GET ALL FEE HEADS
    /api/fee-heads
*/
router.get("/fee-heads", async (req, res) => {

    try {

        const [rows] = await db.query(`
            SELECT
                fh.fee_head_id,
                fh.fee_type_id,
                ft.name AS fee_type_name,
                fh.fee_head_name,
                fh.is_active,
                fh.created_at

            FROM fee_heads fh

            LEFT JOIN fee_types ft
                ON ft.id = fh.fee_type_id

            ORDER BY fh.fee_head_id DESC
        `);

        res.json(rows);

    } catch (error) {

        console.error(
            "GET FEE HEADS ERROR:",
            error
        );

        res.status(500).json({
            message: "Failed to load fee heads"
        });
    }
});



/*
    GET ACTIVE FEE TYPES
    /api/fee-types/active

    Used by Fee Heads dropdown.
*/
router.get("/fee-types/active", async (req, res) => {

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
            message: "Failed to load fee types"
        });
    }
});



/*
    ADD FEE HEAD
    POST /api/fee-heads
*/
router.post("/fee-heads", async (req, res) => {

    try {

        const {
            fee_type_id,
            fee_head_name
        } = req.body;


        // ==================================================
        // VALIDATION
        // ==================================================

        if (!fee_type_id || !fee_head_name) {

            return res.status(400).json({
                message:
                    "Fee Type and Fee Head Name are required"
            });
        }


        const feeHeadName =
            fee_head_name
                .trim()
                .toUpperCase();


        if (!feeHeadName) {

            return res.status(400).json({
                message:
                    "Fee Head Name is required"
            });
        }


        // ==================================================
        // CHECK FEE TYPE
        // ==================================================

        const [feeType] = await db.query(`
            SELECT
                id,
                name

            FROM fee_types

            WHERE id = ?
              AND is_active = 1

            LIMIT 1
        `, [
            fee_type_id
        ]);


        if (feeType.length === 0) {

            return res.status(400).json({
                message:
                    "Selected Fee Type is invalid or inactive"
            });
        }


        // ==================================================
        // DUPLICATE CHECK
        // ==================================================

        const [duplicate] = await db.query(`
            SELECT
                fee_head_id

            FROM fee_heads

            WHERE fee_head_name = ?

            LIMIT 1
        `, [
            feeHeadName
        ]);


        if (duplicate.length > 0) {

            return res.status(400).json({
                message:
                    "Fee Head already exists"
            });
        }


        // ==================================================
        // INSERT
        // ==================================================

        await db.query(`
            INSERT INTO fee_heads
            (
                fee_type_id,
                fee_head_name,
                is_active
            )

            VALUES (?, ?, 1)
        `, [
            fee_type_id,
            feeHeadName
        ]);


        res.status(201).json({
            message:
                "Fee Head saved successfully"
        });


    } catch (error) {

        console.error(
            "ADD FEE HEAD ERROR:",
            error
        );


        if (error.code === "ER_DUP_ENTRY") {

            return res.status(400).json({
                message:
                    "Fee Head already exists"
            });
        }


        res.status(500).json({
            message:
                error.sqlMessage ||
                "Failed to save fee head"
        });
    }
});



/*
    UPDATE FEE HEAD
    PUT /api/fee-heads/:id
*/
router.put("/fee-heads/:id", async (req, res) => {

    try {

        const { id } = req.params;

        const {
            fee_type_id,
            fee_head_name
        } = req.body;


        // ==================================================
        // VALIDATION
        // ==================================================

        if (!fee_type_id || !fee_head_name) {

            return res.status(400).json({
                message:
                    "Fee Type and Fee Head Name are required"
            });
        }


        const feeHeadName =
            fee_head_name
                .trim()
                .toUpperCase();


        if (!feeHeadName) {

            return res.status(400).json({
                message:
                    "Fee Head Name is required"
            });
        }


        // ==================================================
        // CHECK FEE TYPE
        // ==================================================

        const [feeType] = await db.query(`
            SELECT
                id

            FROM fee_types

            WHERE id = ?
              AND is_active = 1

            LIMIT 1
        `, [
            fee_type_id
        ]);


        if (feeType.length === 0) {

            return res.status(400).json({
                message:
                    "Selected Fee Type is invalid or inactive"
            });
        }


        // ==================================================
        // DUPLICATE CHECK
        // ==================================================

        const [duplicate] = await db.query(`
            SELECT
                fee_head_id

            FROM fee_heads

            WHERE fee_head_name = ?
              AND fee_head_id <> ?

            LIMIT 1
        `, [
            feeHeadName,
            id
        ]);


        if (duplicate.length > 0) {

            return res.status(400).json({
                message:
                    "Another Fee Head with this name already exists"
            });
        }


        // ==================================================
        // UPDATE
        // ==================================================

        const [result] = await db.query(`
            UPDATE fee_heads

            SET
                fee_type_id = ?,
                fee_head_name = ?

            WHERE fee_head_id = ?
        `, [
            fee_type_id,
            feeHeadName,
            id
        ]);


        if (result.affectedRows === 0) {

            return res.status(404).json({
                message:
                    "Fee Head not found"
            });
        }


        res.json({
            message:
                "Fee Head updated successfully"
        });


    } catch (error) {

        console.error(
            "UPDATE FEE HEAD ERROR:",
            error
        );


        if (error.code === "ER_DUP_ENTRY") {

            return res.status(400).json({
                message:
                    "Fee Head already exists"
            });
        }


        res.status(500).json({
            message:
                error.sqlMessage ||
                "Failed to update fee head"
        });
    }
});



/*
    CHANGE ACTIVE / INACTIVE
    PUT /api/fee-heads/:id/status
*/
router.put(
    "/fee-heads/:id/status",
    async (req, res) => {

        try {

            const { id } = req.params;
            const { is_active } = req.body;


            const [result] = await db.query(`
                UPDATE fee_heads

                SET is_active = ?

                WHERE fee_head_id = ?
            `, [
                is_active ? 1 : 0,
                id
            ]);


            if (result.affectedRows === 0) {

                return res.status(404).json({
                    message:
                        "Fee Head not found"
                });
            }


            res.json({
                message:
                    "Fee Head status updated successfully"
            });


        } catch (error) {

            console.error(
                "UPDATE FEE HEAD STATUS ERROR:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to update fee head status"
            });
        }
    }
);


export default router;