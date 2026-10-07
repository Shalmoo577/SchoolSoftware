import express from "express";
import db from "../db.js";

const router = express.Router();


// ======================================================
// SAVE HEAD OF ACCOUNT
// ======================================================

router.post("/Saving_Hoa", async (req, res) => {

    try {

        const {
            tb_hoaname,
            tb_type
        } = req.body;

        if (!tb_hoaname || !tb_hoaname.trim()) {

            return res.status(400).json({
                success: false,
                message: "Head of Account name is required."
            });

        }

        if (!tb_type) {

            return res.status(400).json({
                success: false,
                message: "Account type is required."
            });

        }

        const sql = `
            INSERT INTO hoa
            (
                HOA_NAME,
                TYPE
            )
            VALUES (?, ?)
        `;

        const values = [
            tb_hoaname.trim(),
            tb_type
        ];

        const [result] = await db.query(
            sql,
            values
        );

        res.status(200).json({

            success: true,

            message: "Data Saved Successfully",

            id: result.insertId

        });

    } catch (error) {

        console.error(
            "========== HOA SAVE ERROR =========="
        );

        console.error(error);

        res.status(500).json({

            success: false,

            message:
                error.message ||
                "Database error while saving HOA.",

            code: error.code

        });

    }

});


// ======================================================
// GET HEAD OF ACCOUNT LIST
// ======================================================

router.get("/hoa", async (req, res) => {

    try {

        const sql = `
            SELECT
                HOA_ID,
                HOA_NAME,
                TYPE
            FROM hoa
            ORDER BY HOA_ID asc
        `;

        const [rows] = await db.query(sql);

        res.status(200).json(rows);

    } catch (error) {

        console.error(
            "HOA FETCH ERROR:",
            error
        );

        res.status(500).json({

            success: false,

            message: "Database error",

            error: error.message

        });

    }

});


export default router;
