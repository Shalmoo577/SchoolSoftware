import express from "express";
import db from '../db.js';

const router = express.Router();


/* =========================================================
   GET USER PERMISSIONS
   ========================================================= */

router.get("/permissions/:userId", async (req, res) => {
    try {

        const { userId } = req.params;

        const [rows] = await db.query(`
            SELECT
                p.page_id,
                p.page_name,
                p.page_key,
                p.route,
                p.is_active,

                COALESCE(upp.permission_id, 0) AS permission_id,
                COALESCE(upp.can_view, 0) AS can_view,
                COALESCE(upp.can_add, 0) AS can_add,
                COALESCE(upp.can_edit, 0) AS can_edit,
                COALESCE(upp.can_delete, 0) AS can_delete,
                COALESCE(upp.can_print, 0) AS can_print,

                COALESCE(upp.is_main_menu, 0) AS is_main_menu,
                COALESCE(upp.can_view_main_menu, 1) AS can_view_main_menu

            FROM pages p

            LEFT JOIN user_page_permissions upp
                ON upp.page_id = p.page_id
                AND upp.user_id = ?

            WHERE p.is_active = 1

            ORDER BY p.page_name ASC
        `, [userId]);

        res.json(rows);

    } catch (error) {

        console.error("Get User Permissions Error:", error);

        res.status(500).json({
            message: "Unable to load user permissions"
        });
    }
});


/* =========================================================
   SAVE / UPDATE USER PERMISSIONS
   ========================================================= */

router.put("/permissions/:userId", async (req, res) => {

    const connection = await db.getConnection();

    try {

        const { userId } = req.params;

        const { permissions } = req.body;


        /* ---------------------------------------------
           VALIDATION
        --------------------------------------------- */

        if (!Array.isArray(permissions)) {
            return res.status(400).json({
                message: "Permissions must be an array"
            });
        }


        /* ---------------------------------------------
           CHECK USER
        --------------------------------------------- */

        const [userRows] = await connection.query(`
            SELECT user_id
            FROM users
            WHERE user_id = ?
            LIMIT 1
        `, [userId]);


        if (userRows.length === 0) {

            return res.status(404).json({
                message: "User not found"
            });
        }


        /* ---------------------------------------------
           START TRANSACTION
        --------------------------------------------- */

        await connection.beginTransaction();


        /* ---------------------------------------------
           SAVE EACH PAGE PERMISSION
        --------------------------------------------- */

        for (const item of permissions) {

            const pageId = Number(item.page_id);

            if (!pageId) {
                continue;
            }


            const canView = item.can_view ? 1 : 0;
            const canAdd = item.can_add ? 1 : 0;
            const canEdit = item.can_edit ? 1 : 0;
            const canDelete = item.can_delete ? 1 : 0;
            const canPrint = item.can_print ? 1 : 0;

            const isMainMenu = item.is_main_menu ? 1 : 0;
            const canViewMainMenu = item.can_view_main_menu ? 1 : 0;

            /* -----------------------------------------
               CHECK IF PERMISSION ALREADY EXISTS
            ----------------------------------------- */

            const [existing] = await connection.query(`
                SELECT permission_id
                FROM user_page_permissions
                WHERE user_id = ?
                AND page_id = ?
                LIMIT 1
            `, [
                userId,
                pageId
            ]);


            if (existing.length > 0) {

                /* -------------------------------------
                   UPDATE
                ------------------------------------- */

                await connection.query(`
                    UPDATE user_page_permissions
                    SET
                        can_view = ?,
                        can_add = ?,
                        can_edit = ?,
                        can_delete = ?,
                        can_print = ?,
                        is_main_menu = ?,
                        can_view_main_menu = ?
                    WHERE user_id = ?
                    AND page_id = ?
                `, [
                    canView,
                    canAdd,
                    canEdit,
                    canDelete,
                    canPrint,
                    isMainMenu,
                    canViewMainMenu,
                    userId,
                    pageId
                ]);

            } else {

                /* -------------------------------------
                   INSERT
                ------------------------------------- */

                await connection.query(`
                    INSERT INTO user_page_permissions
                    (
                        user_id,
                        page_id,
                        can_view,
                        can_add,
                        can_edit,
                        can_delete,
                        can_print,
                        is_main_menu,
                        can_view_main_menu
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    userId,
                    pageId,
                    canView,
                    canAdd,
                    canEdit,
                    canDelete,
                    canPrint,
                    isMainMenu,
                    canViewMainMenu
                ]);
            }
        }


        /* ---------------------------------------------
           COMMIT
        --------------------------------------------- */

        await connection.commit();


        res.json({
            message: "Permissions saved successfully"
        });


    } catch (error) {

        await connection.rollback();

        console.error("Save User Permissions Error:", error);

        res.status(500).json({
            message: "Unable to save permissions"
        });

    } finally {

        connection.release();
    }
});


/* =========================================================
   DELETE USER PAGE PERMISSION
   ========================================================= */

router.delete(
    "/permissions/:userId/:pageId",
    async (req, res) => {

        try {

            const {
                userId,
                pageId
            } = req.params;


            await db.query(`
                DELETE FROM user_page_permissions
                WHERE user_id = ?
                AND page_id = ?
            `, [
                userId,
                pageId
            ]);


            res.json({
                message: "Permission removed successfully"
            });


        } catch (error) {

            console.error(
                "Delete Permission Error:",
                error
            );

            res.status(500).json({
                message: "Unable to remove permission"
            });
        }
    }
);

/* =========================================================
   GET USERS FOR PERMISSION MANAGEMENT
   ========================================================= */

router.get("/permission-users", async (req, res) => {
    try {

        const [rows] = await db.query(`
            SELECT
                user_id,
                name,
                email,
                role,
                campus_id
            FROM users
            ORDER BY name ASC
        `);

        res.json(rows);

    } catch (error) {

        console.error(
            "Get Permission Users Error:",
            error
        );

        res.status(500).json({
            message: "Unable to load users"
        });
    }
});


export default router;