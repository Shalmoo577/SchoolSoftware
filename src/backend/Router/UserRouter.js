import express from "express";
import bcrypt from "bcrypt";
import db from '../db.js';

const router = express.Router();


// ===============================
// GET ALL USERS
// ===============================
router.get("/users", async (req, res) => {

    try {

        const [rows] = await db.query(`
            SELECT
                u.user_id,
                u.campus_id,
                u.section_id,
                sec.section_name,
                u.name,
                u.email,
                u.role,
                u.is_developer,
                u.phone,
                u.created_at,
                c.name AS campus_name
            FROM users u
            LEFT JOIN campuses c
            ON u.campus_id = c.campus_id

            INNER JOIN sections sec
            ON sec.section_id = u.section_id
            
                ORDER BY u.user_id DESC
        `);

        res.json(rows);

    } catch (error) {

        console.error("Get Users Error:", error);

        res.status(500).json({
            message: "Failed to load users"
        });
    }
});


router.get("/section", async (req, res) => {

    try {

        const [rows] = await db.query(`
            SELECT
                section_id,
                section_name
            from sections
        `);

        res.json(rows);

    } catch (error) {

        console.error("Get Section Error:", error);

        res.status(500).json({
            message: "Failed to load Section"
        });
    }
});


// ===============================
// GET SINGLE USER
// ===============================
router.get("/users/:id", async (req, res) => {

    try {

        const { id } = req.params;

        const [rows] = await db.query(`
            SELECT
                user_id,
                campus_id,
                section_id,
                name,
                email,
                role,
                is_developer,
                phone,
                created_at
            FROM users
            WHERE user_id = ?
            LIMIT 1
        `, [id]);

        if (rows.length === 0) {

            return res.status(404).json({
                message: "User not found"
            });
        }

        res.json(rows[0]);

    } catch (error) {

        console.error("Get User Error:", error);

        res.status(500).json({
            message: "Failed to load user"
        });
    }
});


// ===============================
// CREATE USER
// ===============================
router.post("/users", async (req, res) => {

    try {

        const {
            name,
            email,
            password,
            campus_id,
            section_id,
            role,
            phone
        } = req.body;


        // ===============================
        // VALIDATION
        // ===============================

        if (
            !name ||
            !email ||
            !password ||
            !campus_id ||
            !section_id ||
            !role
        ) {

            return res.status(400).json({
                message: "Name, email, password, campus, section and role are required"
            });
        }


        if (password.length < 6) {

            return res.status(400).json({
                message: "Password must be at least 6 characters"
            });
        }


        // ===============================
        // CHECK EMAIL
        // ===============================

        const [existingUser] = await db.query(
            `
            SELECT user_id
            FROM users
            WHERE email = ?
            LIMIT 1
            `,
            [email]
        );


        if (existingUser.length > 0) {

            return res.status(400).json({
                message: "Email already exists"
            });
        }


        // ===============================
        // CHECK CAMPUS
        // ===============================

        const [campus] = await db.query(
            `
            SELECT campus_id
            FROM campuses
            WHERE campus_id = ?
            LIMIT 1
            `,
            [campus_id]
        );


        if (campus.length === 0) {

            return res.status(400).json({
                message: "Invalid campus"
            });
        }


        // ===============================
        // HASH PASSWORD
        // ===============================

        const hashedPassword = await bcrypt.hash(
            password,
            10
        );


        // ===============================
        // INSERT USER
        // ===============================

        const [result] = await db.query(
            `
            INSERT INTO users
            (
                campus_id,
                section_id,
                name,
                email,
                password,
                role,
                is_developer,
                phone
            )
            VALUES (?, ?, ?, ?, ?, ?, 0, ?)
            `,
            [
                campus_id,
                section_id,
                name,
                email,
                hashedPassword,
                role,
                phone || null
            ]
        );


        res.status(201).json({
            message: "User created successfully",
            user_id: result.insertId
        });


    } catch (error) {

        console.error("Create User Error:", error);

        res.status(500).json({
            message: "Failed to create user"
        });
    }
});


// ===============================
// UPDATE USER
// ===============================
router.put("/users/:id", async (req, res) => {

    try {

        const { id } = req.params;

        const {
            name,
            email,
            password,
            campus_id,
            section_id,
            role,
            phone
        } = req.body;


        if (
            !name ||
            !email ||
            !campus_id ||
            !section_id ||
            !role
        ) {

            return res.status(400).json({
                message: "Name, email, campus, section and role are required"
            });
        }


        // ===============================
        // CHECK EMAIL
        // ===============================

        const [existingUser] = await db.query(
            `
            SELECT user_id
            FROM users
            WHERE email = ?
            AND user_id != ?
            LIMIT 1
            `,
            [email, id]
        );


        if (existingUser.length > 0) {

            return res.status(400).json({
                message: "Email already exists"
            });
        }


        // ===============================
        // UPDATE WITH PASSWORD
        // ===============================

        if (password && password.trim() !== "") {

            if (password.length < 6) {

                return res.status(400).json({
                    message: "Password must be at least 6 characters"
                });
            }

            const hashedPassword = await bcrypt.hash(
                password,
                10
            );

            await db.query(
                `
                UPDATE users
                SET
                    campus_id = ?,
                    section_id = ?,
                    name = ?,
                    email = ?,
                    password = ?,
                    role = ?,
                    phone = ?
                WHERE user_id = ?
                `,
                [
                    campus_id,
                    section_id,
                    name,
                    email,
                    hashedPassword,
                    role,
                    phone || null,
                    id
                ]
            );

        } else {

            // ===============================
            // UPDATE WITHOUT PASSWORD
            // ===============================

            await db.query(
                `
                UPDATE users
                SET
                    campus_id = ?,
                    section_id =?,
                    name = ?,
                    email = ?,
                    role = ?,
                    phone = ?
                WHERE user_id = ?
                `,
                [
                    campus_id,
                    section_id,
                    name,
                    email,
                    role,
                    phone || null,
                    id
                ]
            );
        }


        res.json({
            message: "User updated successfully"
        });


    } catch (error) {

        console.error("Update User Error:", error);

        res.status(500).json({
            message: "Failed to update user"
        });
    }
});


// ===============================
// DELETE USER
// ===============================
router.delete("/users/:id", async (req, res) => {

    try {

        const { id } = req.params;


        // Developer user ko delete nahi karna
        const [developer] = await db.query(
            `
            SELECT is_developer
            FROM users
            WHERE user_id = ?
            LIMIT 1
            `,
            [id]
        );


        if (developer.length === 0) {

            return res.status(404).json({
                message: "User not found"
            });
        }


        if (Number(developer[0].is_developer) === 1) {

            return res.status(403).json({
                message: "Developer user cannot be deleted"
            });
        }


        await db.query(
            `
            DELETE FROM users
            WHERE user_id = ?
            `,
            [id]
        );


        res.json({
            message: "User deleted successfully"
        });


    } catch (error) {

        console.error("Delete User Error:", error);

        res.status(500).json({
            message: "Failed to delete user"
        });
    }
});


export default router;