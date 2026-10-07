import express from "express";
import db from "../../backend/db.js"

const router = express.Router();

//Getting Hoa Data
router.get("/hoa", async (req, res) => {
    try {

        const sql = `
            SELECT HOA_ID, HOA_NAME
            FROM HOA
        `;

        const [rows] = await db.query(sql);

        res.status(200).json(rows);

    } catch (error) {

        console.error("HOA FETCH ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Database error",
            error: error.message
        });
    }
});

/// Fetching Data for Table
router.get("/control-accounts", async (req, res) => {
    try {

        const sql = `
            SELECT
                ca.ControlAccountID,
                ca.hoa_id,
                h.hoa_name,
                ca.ControlAccountName
            FROM controlaccounts ca
            LEFT JOIN HOA h
                ON h.hoa_id = ca.hoa_id
            ORDER BY ca.ControlAccountID DESC
        `;

        const [rows] = await db.query(sql);

        res.json(rows);

    } catch (error) {

        console.error("CONTROL ACCOUNT FETCH ERROR:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
/// for edit Control Account
router.put("/Updatecontrol-accounts/:id", async (req, res) => {

    try {

        const { id } = req.params;

        const {
            tb_hoa,
            tb_controlaccount
        } = req.body;


        if (!tb_hoa) {

            return res.status(400).json({
                success: false,
                message: "HOA is required."
            });

        }


        if (!tb_controlaccount || !tb_controlaccount.trim()) {

            return res.status(400).json({
                success: false,
                message: "Control Account Name is required."
            });

        }


        const sql = `
            UPDATE controlaccounts

            SET
                hoa_id = ?,
                ControlAccountName = ?

            WHERE ControlAccountID = ?
        `;


        const [result] = await db.query(
            sql,
            [
                tb_hoa,
                tb_controlaccount.trim(),
                id
            ]
        );


        if (result.affectedRows === 0) {

            return res.status(404).json({
                success: false,
                message: "Control Account not found."
            });

        }


        res.json({
            success: true,
            message: "Control Account Updated Successfully."
        });


    } catch (error) {

        console.error(
            "CONTROL ACCOUNT UPDATE ERROR:",
            error
        );


        res.status(500).json({
            success: false,
            message: error.message
        });

    }

});
// Saving Control Account
router.post("/SavingControlAccount", async (req, res) => {
    console.log("Received data:", req.body);

    try {
        const {tb_hoa, tb_controlaccount } = req.body;

        const sql = `
            INSERT INTO controlaccounts (hoa_id, ControlAccountName)
            VALUES (?, ?)
        `;

        const values = [tb_hoa, tb_controlaccount];

        const [result] = await db.query(sql, values);

        console.log("Insert Result:", result);

        res.status(200).json({
            success: true,
            message: "Saved Successfully",
            id: result.insertId
        });

    } catch (error) {

        console.error("========== ERROR ==========");
        console.error(error);
        console.error("MESSAGE:", error.message);
        console.error("CODE:", error.code);
        console.error("===========================");

        res.status(500).json({
            success: false,
            message: error.message,
            code: error.code
        });
    }
});




export default router
 