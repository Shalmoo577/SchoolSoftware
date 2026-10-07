
import express from "express";
import bcrypt from "bcrypt";
import db from '../db.js';

const router = express.Router();


/* =========================================================
   CHECK WHETHER ANY USER EXISTS
   ========================================================= */

router.get("/developer-setup/status", async (req, res) => {
    try {

        const [rows] = await db.query(`
            SELECT COUNT(*) AS total
            FROM users
        `);

        res.json({
            setup_required: Number(rows[0].total) === 0
        });

    } catch (error) {

        console.error(
            "Developer Setup Status Error:",
            error
        );

        res.status(500).json({
            message: "Unable to check setup status"
        });
    }
});


/* =========================================================
   CREATE FIRST DEVELOPER USER
   ========================================================= */

router.post("/developer-setup", async (req, res) => {

    try {

        const {
            name,
            email,
            password,
            campus_id
        } = req.body;


        /* ---------------------------------------------
           VALIDATION
        --------------------------------------------- */

        if (!name || !name.trim()) {
            return res.status(400).json({
                message: "Name is required"
            });
        }

        if (!email || !email.trim()) {
            return res.status(400).json({
                message: "Email is required"
            });
        }

        if (!password || password.length < 6) {
            return res.status(400).json({
                message:
                    "Password must be at least 6 characters"
            });
        }

        if (!campus_id) {
            return res.status(400).json({
                message: "Campus is required"
            });
        }


        /* ---------------------------------------------
           CHECK IF USERS ALREADY EXIST
        --------------------------------------------- */

        const [userCount] = await db.query(`
            SELECT COUNT(*) AS total
            FROM users
        `);


        if (Number(userCount[0].total) > 0) {

            return res.status(403).json({
                message:
                    "Developer setup has already been completed"
            });
        }


        /* ---------------------------------------------
           CHECK CAMPUS
        --------------------------------------------- */

        const [campusRows] = await db.query(`
            SELECT campus_id
            FROM campuses
            WHERE campus_id = ?
            LIMIT 1
        `, [campus_id]);


        if (campusRows.length === 0) {

            return res.status(400).json({
                message: "Invalid campus"
            });
        }


        /* ---------------------------------------------
           HASH PASSWORD
        --------------------------------------------- */

        const hashedPassword =
            await bcrypt.hash(password, 10);


        /* ---------------------------------------------
           CREATE FIRST USER
        --------------------------------------------- */

        const [result] = await db.query(`
            INSERT INTO users
            (
                campus_id,
                name,
                email,
                password,
                role
            )
            VALUES (?, ?, ?, ?, ?)
        `, [
            campus_id,
            name.trim(),
            email.trim().toLowerCase(),
            hashedPassword,
            "SUPER_ADMIN"
        ]);


        res.status(201).json({

            message:
                "Developer account created successfully",

            user_id: result.insertId

        });


    } catch (error) {

        console.error(
            "Developer Setup Error:",
            error
        );

        res.status(500).json({
            message:
                "Unable to create developer account"
        });
    }
});


export default router;
