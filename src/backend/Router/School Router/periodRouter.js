import express from "express";
import db from "../../db.js";

const router = express.Router();


// =====================================================
// GET USER INFO
// =====================================================

const getUserInfo = async (user_id) => {

    if (!user_id) {
        return null;
    }

    const [rows] = await db.query(
        `
        SELECT
            user_id,
            campus_id,
            section_id,
            role,
            is_developer
        FROM users
        WHERE user_id = ?
        LIMIT 1
        `,
        [user_id]
    );

    return rows[0] || null;
};


// =====================================================
// CHECK ADMIN
// =====================================================

const isAdminUser = (user) => {

    const role = String(
        user?.role || ""
    ).toUpperCase();

    return (
        Number(user?.is_developer) === 1 ||
        role === "SUPER_ADMIN" ||
        role === "CAMPUS_ADMIN"
    );
};
// =====================================================
// GET PERIODS
// =====================================================

router.get("/periods", async (req, res) => {
    try {

        const {
            campus_id,
            section_id
        } = req.query;


        // =================================================
        // GET LOGGED-IN USER
        // =================================================
        //
        // Preferred:
        // req.user.id
        //
        // Temporary compatibility:
        // req.query.user_id
        //
        // Once JWT middleware is confirmed on this router,
        // req.user.id should be used.
        // =================================================

        const loggedInUserId =
            req.user?.id ||
            req.user?.user_id ||
            req.query.user_id;


        if (!loggedInUserId) {

            return res.status(401).json({
                success: false,
                message: "User authentication is required"
            });

        }


        // =================================================
        // GET USER INFORMATION
        // =================================================

        const user = await getUserInfo(loggedInUserId);


        if (!user) {

            return res.status(401).json({
                success: false,
                message: "User not found"
            });

        }


        // =================================================
        // CHECK ADMIN
        // =================================================

        const admin = isAdminUser(user);


        // =================================================
        // BASE QUERY
        // =================================================

        let sql = `
            SELECT

                p.period_id,

                p.campus_id,

                cp.name AS campus_name,

                cp.code AS campus_code,

                p.section_id,

                s.section_name,

                p.period_no,

                p.title,

                TIME_FORMAT(
                    p.start_time,
                    '%H:%i'
                ) AS start_time,

                TIME_FORMAT(
                    p.end_time,
                    '%H:%i'
                ) AS end_time,

                p.period_type,

                p.is_active,

                p.created_at,

                p.updated_at

            FROM periods p

            LEFT JOIN campuses cp
                ON cp.campus_id = p.campus_id

            LEFT JOIN sections s
                ON s.section_id = p.section_id

            WHERE 1 = 1
        `;


        const params = [];


        // =================================================
        // NORMAL USER
        // =================================================
        //
        // Normal users can ONLY see their assigned campus.
        //
        // section_id is NOT mandatory here.
        //
        // This is important for CAMPUS_ADMIN because
        // CAMPUS_ADMIN normally belongs to a campus,
        // not to one specific section.
        // =================================================

        if (!admin) {

            if (!user.campus_id) {

                return res.status(403).json({
                    success: false,
                    message:
                        "User campus is not assigned"
                });

            }


            // Force user's own campus.
            // Ignore any campus_id supplied by frontend.

            sql += `
                AND p.campus_id = ?
            `;

            params.push(
                user.campus_id
            );


            // Optional section filter.
            //
            // If frontend sends section_id,
            // normal user can filter within their campus.

            if (section_id) {

                sql += `
                    AND p.section_id = ?
                `;

                params.push(
                    section_id
                );

            }

        }


        // =================================================
        // ADMIN / SUPER ADMIN
        // =================================================

        else {

            // -------------------------------------------------
            // Optional campus filter
            // -------------------------------------------------

            if (campus_id) {

                sql += `
                    AND p.campus_id = ?
                `;

                params.push(
                    campus_id
                );

            }


            // -------------------------------------------------
            // Optional section filter
            // -------------------------------------------------

            if (section_id) {

                sql += `
                    AND p.section_id = ?
                `;

                params.push(
                    section_id
                );

            }

        }


        // =================================================
        // ONLY ACTIVE PERIODS
        // =================================================
        //
        // If you want inactive periods to also appear in
        // admin management screens, remove this condition.
        //
        // For timetable display, active periods are normally
        // what we need.
        // =================================================

        sql += `
            AND p.is_active = 1
        `;


        // =================================================
        // ORDER
        // =================================================

        sql += `
            ORDER BY

                p.campus_id,

                p.section_id,

                p.period_no
        `;


        // =================================================
        // EXECUTE QUERY
        // =================================================

        const [rows] = await db.query(
            sql,
            params
        );


        // =================================================
        // RESPONSE
        // =================================================

        return res.status(200).json({

            success: true,

            periods: rows,

            count: rows.length

        });


    } catch (error) {

        console.error(
            "GET PERIODS ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to load periods"

        });

    }
});


// =====================================================
// SAVE PERIOD
// =====================================================

router.post("/periods", async (req, res) => {

    try {

        let {
            user_id,
            campus_id,
            section_id,
            period_no,
            title,
            start_time,
            end_time,
            period_type,
            is_active
        } = req.body;


        // =================================================
        // USER
        // =================================================

        const user =
            await getUserInfo(user_id);


        if (!user) {

            return res.status(401).json({
                message: "User not found"
            });

        }


        const admin =
            isAdminUser(user);


        // =================================================
        // NORMAL USER SCOPE
        // =================================================

        if (!admin) {

            campus_id =
                user.campus_id;

            section_id =
                user.section_id;


            if (!campus_id || !section_id) {

                return res.status(400).json({
                    message:
                        "User campus and section are not assigned"
                });

            }

        }


        title =
            title?.trim().toUpperCase();


        // =================================================
        // VALIDATION
        // =================================================

        if (!campus_id) {

            return res.status(400).json({
                message:
                    "Campus is required"
            });

        }


        if (!section_id) {

            return res.status(400).json({
                message:
                    "Section is required"
            });

        }


        if (!period_no) {

            return res.status(400).json({
                message:
                    "Period number is required"
            });

        }


        if (!title) {

            return res.status(400).json({
                message:
                    "Period title is required"
            });

        }


        if (!start_time) {

            return res.status(400).json({
                message:
                    "Start time is required"
            });

        }


        if (!end_time) {

            return res.status(400).json({
                message:
                    "End time is required"
            });

        }


        if (start_time >= end_time) {

            return res.status(400).json({
                message:
                    "End time must be after start time"
            });

        }


        // =================================================
        // CHECK CAMPUS
        // =================================================

        const [campus] =
            await db.query(
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
                message:
                    "Campus not found"
            });

        }


        // =================================================
        // CHECK SECTION
        // =================================================

        const [section] =
            await db.query(
                `
                SELECT
                    section_id,
                    campus_id
                FROM sections
                WHERE section_id = ?
                AND campus_id = ?
                LIMIT 1
                `,
                [
                    section_id,
                    campus_id
                ]
            );


        if (section.length === 0) {

            return res.status(400).json({
                message:
                    "Section does not belong to selected campus"
            });

        }


        // =================================================
        // DUPLICATE PERIOD
        // =================================================

        const [existing] =
            await db.query(
                `
                SELECT period_id
                FROM periods
                WHERE campus_id = ?
                AND section_id = ?
                AND period_no = ?
                AND is_active = 1
                LIMIT 1
                `,
                [
                    campus_id,
                    section_id,
                    period_no
                ]
            );


        if (existing.length > 0) {

            return res.status(400).json({
                message:
                    "This period number already exists for this campus and section"
            });

        }


        // =================================================
        // INSERT
        // =================================================

        const [result] =
            await db.query(
                `
                INSERT INTO periods
                (
                    campus_id,
                    section_id,
                    period_no,
                    title,
                    start_time,
                    end_time,
                    period_type,
                    is_active
                )

                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    campus_id,
                    section_id,
                    period_no,
                    title,
                    start_time,
                    end_time,
                    period_type || "SUBJECT",
                    is_active === false
                        ? 0
                        : 1
                ]
            );


        res.status(201).json({

            message:
                "Period saved successfully",

            period_id:
                result.insertId

        });


    } catch (error) {

        console.error(
            "SAVE PERIOD ERROR:",
            error
        );

        res.status(500).json({
            message:
                "Failed to save period"
        });

    }

});


// =====================================================
// UPDATE PERIOD
// =====================================================

router.put(
    "/periods/:period_id",
    async (req, res) => {

        try {

            const {
                period_id
            } = req.params;


            let {
                user_id,
                campus_id,
                section_id,
                period_no,
                title,
                start_time,
                end_time,
                period_type,
                is_active
            } = req.body;


            // =================================================
            // USER
            // =================================================

            const user =
                await getUserInfo(user_id);


            if (!user) {

                return res.status(401).json({
                    message:
                        "User not found"
                });

            }


            const admin =
                isAdminUser(user);


            // =================================================
            // CHECK EXISTING PERIOD
            // =================================================

            const [oldRows] =
                await db.query(
                    `
                    SELECT
                        period_id,
                        campus_id,
                        section_id
                    FROM periods
                    WHERE period_id = ?
                    LIMIT 1
                    `,
                    [period_id]
                );


            if (oldRows.length === 0) {

                return res.status(404).json({
                    message:
                        "Period not found"
                });

            }


            const oldPeriod =
                oldRows[0];


            // =================================================
            // NORMAL USER SCOPE
            // =================================================

            if (!admin) {

                if (
                    oldPeriod.campus_id !==
                    user.campus_id ||

                    oldPeriod.section_id !==
                    user.section_id
                ) {

                    return res.status(403).json({
                        message:
                            "You cannot update this period"
                    });

                }


                campus_id =
                    user.campus_id;

                section_id =
                    user.section_id;

            }


            title =
                title?.trim().toUpperCase();


            // =================================================
            // VALIDATION
            // =================================================

            if (!campus_id) {

                return res.status(400).json({
                    message:
                        "Campus is required"
                });

            }


            if (!section_id) {

                return res.status(400).json({
                    message:
                        "Section is required"
                });

            }


            if (!period_no) {

                return res.status(400).json({
                    message:
                        "Period number is required"
                });

            }


            if (!title) {

                return res.status(400).json({
                    message:
                        "Period title is required"
                });

            }


            if (!start_time || !end_time) {

                return res.status(400).json({
                    message:
                        "Start and end time are required"
                });

            }


            if (start_time >= end_time) {

                return res.status(400).json({
                    message:
                        "End time must be after start time"
                });

            }


            // =================================================
            // CHECK SECTION
            // =================================================

            const [section] =
                await db.query(
                    `
                    SELECT section_id
                    FROM sections
                    WHERE section_id = ?
                    AND campus_id = ?
                    LIMIT 1
                    `,
                    [
                        section_id,
                        campus_id
                    ]
                );


            if (section.length === 0) {

                return res.status(400).json({
                    message:
                        "Section does not belong to selected campus"
                });

            }


            // =================================================
            // DUPLICATE
            // =================================================

            const [existing] =
                await db.query(
                    `
                    SELECT period_id
                    FROM periods
                    WHERE campus_id = ?
                    AND section_id = ?
                    AND period_no = ?
                    AND period_id <> ?
                    AND is_active = 1
                    LIMIT 1
                    `,
                    [
                        campus_id,
                        section_id,
                        period_no,
                        period_id
                    ]
                );


            if (existing.length > 0) {

                return res.status(400).json({
                    message:
                        "This period number already exists for this campus and section"
                });

            }


            // =================================================
            // UPDATE
            // =================================================

            const [result] =
                await db.query(
                    `
                    UPDATE periods

                    SET
                        campus_id = ?,
                        section_id = ?,
                        period_no = ?,
                        title = ?,
                        start_time = ?,
                        end_time = ?,
                        period_type = ?,
                        is_active = ?

                    WHERE period_id = ?
                    `,
                    [
                        campus_id,
                        section_id,
                        period_no,
                        title,
                        start_time,
                        end_time,
                        period_type || "SUBJECT",
                        is_active ? 1 : 0,
                        period_id
                    ]
                );


            if (
                result.affectedRows === 0
            ) {

                return res.status(404).json({
                    message:
                        "Period not found"
                });

            }


            res.status(200).json({

                message:
                    "Period updated successfully"

            });


        } catch (error) {

            console.error(
                "UPDATE PERIOD ERROR:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to update period"
            });

        }

    }
);


// =====================================================
// DEACTIVATE
// =====================================================

router.delete(
    "/periods/:period_id",
    async (req, res) => {

        try {

            const {
                period_id
            } = req.params;

            const {
                user_id
            } = req.query;


            const user =
                await getUserInfo(user_id);


            if (!user) {

                return res.status(401).json({
                    message:
                        "User not found"
                });

            }


            const admin =
                isAdminUser(user);


            let sql = `
                UPDATE periods
                SET is_active = 0
                WHERE period_id = ?
            `;

            const params = [
                period_id
            ];


            if (!admin) {

                sql += `
                    AND campus_id = ?
                    AND section_id = ?
                `;

                params.push(
                    user.campus_id,
                    user.section_id
                );

            }


            const [result] =
                await db.query(
                    sql,
                    params
                );


            if (
                result.affectedRows === 0
            ) {

                return res.status(404).json({
                    message:
                        "Period not found or you do not have access"
                });

            }


            res.status(200).json({

                message:
                    "Period deactivated successfully"

            });


        } catch (error) {

            console.error(
                "DEACTIVATE PERIOD ERROR:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to deactivate period"
            });

        }

    }
);


// =====================================================
// ACTIVATE
// =====================================================

router.put(
    "/periods/:period_id/activate",
    async (req, res) => {

        try {

            const {
                period_id
            } = req.params;

            const {
                user_id
            } = req.query;


            const user =
                await getUserInfo(user_id);


            if (!user) {

                return res.status(401).json({
                    message:
                        "User not found"
                });

            }


            const admin =
                isAdminUser(user);


            let sql = `
                UPDATE periods
                SET is_active = 1
                WHERE period_id = ?
            `;

            const params = [
                period_id
            ];


            if (!admin) {

                sql += `
                    AND campus_id = ?
                    AND section_id = ?
                `;

                params.push(
                    user.campus_id,
                    user.section_id
                );

            }


            const [result] =
                await db.query(
                    sql,
                    params
                );


            if (
                result.affectedRows === 0
            ) {

                return res.status(404).json({
                    message:
                        "Period not found or you do not have access"
                });

            }


            res.status(200).json({

                message:
                    "Period activated successfully"

            });


        } catch (error) {

            console.error(
                "ACTIVATE PERIOD ERROR:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to activate period"
            });

        }

    }
);


export default router;