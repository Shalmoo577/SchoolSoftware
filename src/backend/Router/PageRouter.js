import express from "express";
import db from '../db.js';

const router = express.Router();


/* =========================================================
   GET ALL PAGES
   ========================================================= */

router.get("/pages", async (req, res) => {
    try {

        const [rows] = await db.query(`
            SELECT
                page_id,
                page_name,
                page_key,
                route,
                is_active,
                created_at
            FROM pages
            ORDER BY page_name ASC
        `);

        res.json(rows);

    } catch (error) {

        console.error("Get Pages Error:", error);

        res.status(500).json({
            message: "Unable to load pages"
        });
    }
});


/* =========================================================
   GET SINGLE PAGE
   ========================================================= */

router.get("/pages/:id", async (req, res) => {
    try {

        const { id } = req.params;

        const [rows] = await db.query(`
            SELECT
                page_id,
                page_name,
                page_key,
                route,
                is_active,
                created_at
            FROM pages
            WHERE page_id = ?
            LIMIT 1
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Page not found"
            });
        }

        res.json(rows[0]);

    } catch (error) {

        console.error("Get Single Page Error:", error);

        res.status(500).json({
            message: "Unable to load page"
        });
    }
});


/* =========================================================
   CREATE / REGISTER NEW PAGE
   ========================================================= */

router.post("/pages", async (req, res) => {
    try {

        const {
            page_name,
            page_key,
            route,
            is_active = 1
        } = req.body;


        /* ---------------------------------------------
           VALIDATION
        --------------------------------------------- */

        if (!page_name || !page_name.trim()) {
            return res.status(400).json({
                message: "Page name is required"
            });
        }

        if (!page_key || !page_key.trim()) {
            return res.status(400).json({
                message: "Page key is required"
            });
        }

        if (!route || !route.trim()) {
            return res.status(400).json({
                message: "Route is required"
            });
        }


        /* ---------------------------------------------
           CHECK DUPLICATE PAGE KEY
        --------------------------------------------- */

        const [existingKey] = await db.query(`
            SELECT page_id
            FROM pages
            WHERE page_key = ?
            LIMIT 1
        `, [page_key.trim()]);


        if (existingKey.length > 0) {
            return res.status(409).json({
                message: "Page key already exists"
            });
        }


        /* ---------------------------------------------
           CHECK DUPLICATE ROUTE
        --------------------------------------------- */

        const [existingRoute] = await db.query(`
            SELECT page_id
            FROM pages
            WHERE route = ?
            LIMIT 1
        `, [route.trim()]);


        if (existingRoute.length > 0) {
            return res.status(409).json({
                message: "Route already exists"
            });
        }


        /* ---------------------------------------------
           INSERT PAGE
        --------------------------------------------- */

        const [result] = await db.query(`
            INSERT INTO pages
            (
                page_name,
                page_key,
                route,
                is_active
            )
            VALUES (?, ?, ?, ?)
        `, [
            page_name.trim(),
            page_key.trim(),
            route.trim(),
            is_active ? 1 : 0
        ]);


        res.status(201).json({
            message: "Page registered successfully",
            page_id: result.insertId
        });

    } catch (error) {

        console.error("Create Page Error:", error);

        res.status(500).json({
            message: "Unable to register page"
        });
    }
});


/* =========================================================
   UPDATE PAGE
   ========================================================= */

router.put("/pages/:id", async (req, res) => {
    try {

        const { id } = req.params;

        const {
            page_name,
            page_key,
            route,
            is_active
        } = req.body;


        /* ---------------------------------------------
           CHECK PAGE
        --------------------------------------------- */

        const [pageRows] = await db.query(`
            SELECT page_id
            FROM pages
            WHERE page_id = ?
            LIMIT 1
        `, [id]);


        if (pageRows.length === 0) {
            return res.status(404).json({
                message: "Page not found"
            });
        }


        /* ---------------------------------------------
           VALIDATION
        --------------------------------------------- */

        if (!page_name || !page_name.trim()) {
            return res.status(400).json({
                message: "Page name is required"
            });
        }

        if (!page_key || !page_key.trim()) {
            return res.status(400).json({
                message: "Page key is required"
            });
        }

        if (!route || !route.trim()) {
            return res.status(400).json({
                message: "Route is required"
            });
        }


        /* ---------------------------------------------
           CHECK DUPLICATE PAGE KEY
        --------------------------------------------- */

        const [existingKey] = await db.query(`
            SELECT page_id
            FROM pages
            WHERE page_key = ?
            AND page_id <> ?
            LIMIT 1
        `, [
            page_key.trim(),
            id
        ]);


        if (existingKey.length > 0) {
            return res.status(409).json({
                message: "Page key already exists"
            });
        }


        /* ---------------------------------------------
           CHECK DUPLICATE ROUTE
        --------------------------------------------- */

        const [existingRoute] = await db.query(`
            SELECT page_id
            FROM pages
            WHERE route = ?
            AND page_id <> ?
            LIMIT 1
        `, [
            route.trim(),
            id
        ]);


        if (existingRoute.length > 0) {
            return res.status(409).json({
                message: "Route already exists"
            });
        }


        /* ---------------------------------------------
           UPDATE
        --------------------------------------------- */

        await db.query(`
            UPDATE pages
            SET
                page_name = ?,
                page_key = ?,
                route = ?,
                is_active = ?
            WHERE page_id = ?
        `, [
            page_name.trim(),
            page_key.trim(),
            route.trim(),
            is_active ? 1 : 0,
            id
        ]);


        res.json({
            message: "Page updated successfully"
        });

    } catch (error) {

        console.error("Update Page Error:", error);

        res.status(500).json({
            message: "Unable to update page"
        });
    }
});


/* =========================================================
   DELETE PAGE
   ========================================================= */

router.delete("/pages/:id", async (req, res) => {
    try {

        const { id } = req.params;


        /* ---------------------------------------------
           CHECK PAGE
        --------------------------------------------- */

        const [pageRows] = await db.query(`
            SELECT page_id
            FROM pages
            WHERE page_id = ?
            LIMIT 1
        `, [id]);


        if (pageRows.length === 0) {
            return res.status(404).json({
                message: "Page not found"
            });
        }


        /* ---------------------------------------------
           DELETE PAGE
        --------------------------------------------- */

        await db.query(`
            DELETE FROM pages
            WHERE page_id = ?
        `, [id]);


        res.json({
            message: "Page deleted successfully"
        });

    } catch (error) {

        console.error("Delete Page Error:", error);

        res.status(500).json({
            message: "Unable to delete page"
        });
    }
});


export default router;