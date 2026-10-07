import express from "express";
import bcrypt from "bcrypt";
import db from '../db.js';

const router = express.Router();

/* =========================================================
   LOGIN
   ========================================================= */

router.post("/login", async (req, res) => {

    try {

        const { email, password } = req.body;

        /* -----------------------------
           VALIDATION
        ----------------------------- */

        if (!email || !password) {

            return res.status(400).json({
                message: "Email and password are required"
            });

        }


        /* -----------------------------
           FIND USER
        ----------------------------- */

        const [rows] = await db.query(
    `
    SELECT
        u.user_id,
        u.campus_id,
        c.name AS campus_name,
        u.section_id,
        sec.section_name,
        u.name,
        u.email,
        u.password,
        u.role,
        u.is_developer
    FROM users u

    LEFT JOIN campuses c
        ON u.campus_id = c.campus_id

    LEFT JOIN sections sec
        ON u.section_id = sec.section_id

    WHERE u.email = ?
    LIMIT 1
    `,
    [email]
);


        if (rows.length === 0) {

            return res.status(401).json({
                message: "Invalid email or password"
            });

        }


        const user = rows[0];


        /* -----------------------------
           CHECK PASSWORD
        ----------------------------- */

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );


        if (!passwordMatch) {

            return res.status(401).json({
                message: "Invalid email or password"
            });

        }


        /* -----------------------------
           SUCCESS
        ----------------------------- */

        return res.json({

             message: "Login successful",
    user: {
        user_id: user.user_id,
        campus_id: user.campus_id,
        campus_name: user.campus_name,

        section_id: user.section_id,
        section_name: user.section_name,

        name: user.name,
        email: user.email,
        role: user.role,
        is_developer: user.is_developer
            }

        });

    } catch (error) {

        console.error(
            "Login Error:",
            error
        );

        return res.status(500).json({
            message: "Server error during login"
        });

    }

});


export default router;