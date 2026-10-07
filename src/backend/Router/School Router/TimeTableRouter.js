import express from "express";
import db from "../../db.js";

const router = express.Router();


// =====================================================
// HELPER
// GET USER INFORMATION
// =====================================================

const getUserInfo = async (user_id) => {

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
// HELPER
// CHECK FULL ACCESS
// =====================================================

const isFullAccessUser = (user) => {

    return (
        user?.role === "SUPER_ADMIN" ||
        user?.role === "CAMPUS_ADMIN" ||
        Number(user?.is_developer) === 1
    );

};


// =====================================================
// HELPER
// GET PERIOD TYPE
//
// CLASS
// BREAK
// ACTIVITY
// =====================================================

const getPeriodInfo = async (period_no) => {

    const [rows] = await db.query(
        `
        SELECT
            period_no,
            title,
            start_time,
            end_time,
            period_type,
            activity_name
        FROM periods
        WHERE period_no = ?
        LIMIT 1
        `,
        [period_no]
    );

    return rows[0] || null;
};


// =====================================================
// HELPER
// NORMALIZE PERIOD TYPE
// =====================================================

const normalizePeriodType = (period) => {

    const type = String(
        period?.period_type ||
        period?.type ||
        ""
    ).toUpperCase().trim();


    if (type === "BREAK") {
        return "BREAK";
    }


    if (type === "ACTIVITY") {
        return "ACTIVITY";
    }


    if (type === "CLASS") {
        return "CLASS";
    }


    // -------------------------------------------------
    // BACKWARD COMPATIBILITY
    // -------------------------------------------------

    const title = String(
        period?.title || ""
    ).toUpperCase();


    if (title.includes("BREAK")) {
        return "BREAK";
    }


    if (title.includes("ACTIVITY")) {
        return "ACTIVITY";
    }


    return "CLASS";
};


// =====================================================
// HELPER
// CHECK CLASS BELONGS TO CAMPUS + SECTION
// =====================================================

const getValidClass = async (
    class_id,
    campus_id,
    section_id
) => {

    const [rows] = await db.query(
        `
        SELECT
            class_id,
            name,
            code,
            campus_id,
            section_id,
            is_active
        FROM classes
        WHERE class_id = ?
        AND campus_id = ?
        AND section_id = ?
        AND is_active = 1
        LIMIT 1
        `,
        [
            class_id,
            campus_id,
            section_id
        ]
    );

    return rows[0] || null;
};


// =====================================================
// HELPER
// CHECK TEACHER BELONGS TO CAMPUS + SECTION
//
// IMPORTANT:
// This assumes teachers table has campus_id + section_id.
// =====================================================

const getValidTeacher = async (
    teacher_id,
    campus_id,
    section_id
) => {

    const [rows] = await db.query(
        `
        SELECT
            teacher_id,
            name,
            campus_id,
            section_id
        FROM teachers
        WHERE teacher_id = ?
        AND campus_id = ?
        AND section_id = ?
        LIMIT 1
        `,
        [
            teacher_id,
            campus_id,
            section_id
        ]
    );

    return rows[0] || null;
};


// =====================================================
// GET TIMETABLES
// =====================================================

router.get("/timetables", async (req, res) => {

    try {

        const {
            user_id,
            campus_id,
            section_id,
            class_id,
            academic_year
        } = req.query;


        // =================================================
        // USER ID
        // =================================================

        if (!user_id) {

            return res.status(400).json({
                message: "User ID is required"
            });

        }


        // =================================================
        // GET LOGIN USER
        // =================================================

        const user = await getUserInfo(user_id);


        if (!user) {

            return res.status(401).json({
                message: "User not found"
            });

        }


        const fullAccess = isFullAccessUser(user);


        // =================================================
        // BUILD WHERE
        // =================================================

        const where = [];
        const params = [];


        // =================================================
        // NORMAL USER
        // =================================================

        if (!fullAccess) {

            if (!user.campus_id || !user.section_id) {

                return res.status(403).json({
                    message:
                        "Your account is not assigned to a campus and section"
                });

            }


            where.push("t.campus_id = ?");
            params.push(user.campus_id);


            where.push("c.section_id = ?");
            params.push(user.section_id);

        }


        // =================================================
        // ADMIN / DEVELOPER FILTER
        // =================================================

        if (fullAccess) {

            if (campus_id) {

                where.push("t.campus_id = ?");
                params.push(campus_id);

            }


            if (section_id) {

                where.push("c.section_id = ?");
                params.push(section_id);

            }


            if (class_id) {

                where.push("t.class_id = ?");
                params.push(class_id);

            }

        }


        // =================================================
        // ACADEMIC YEAR
        // =================================================

        if (academic_year) {

            where.push("t.academic_year = ?");
            params.push(academic_year);

        }


        // =================================================
        // WHERE SQL
        // =================================================

        const whereSQL =
            where.length > 0
                ? `WHERE ${where.join(" AND ")}`
                : "";


        // =================================================
        // GET DATA
        // =================================================

        const [rows] = await db.query(
            `
            SELECT

                t.timetable_id,

                t.class_id,
                c.name AS class_name,
                c.code AS class_code,

                c.section_id,
                sec.section_name,

                t.subject_id,
                s.name AS subject_name,
                s.code AS subject_code,

                t.teacher_id,
                te.name AS teacher_name,

                t.campus_id,
                cp.name AS campus_name,

                t.day,

                t.period_no,

                t.start_time,

                t.end_time,

                t.activity_name,

                t.academic_year,

                t.created_at,

                t.updated_at,

                p.title AS period_title,

                p.period_type,

                p.activity_name AS period_activity_name

            FROM timetables t

            LEFT JOIN classes c
                ON c.class_id = t.class_id

            LEFT JOIN sections sec
                ON sec.section_id = c.section_id

            LEFT JOIN subjects s
                ON s.subject_id = t.subject_id

            LEFT JOIN teachers te
                ON te.teacher_id = t.teacher_id

            LEFT JOIN campuses cp
                ON cp.campus_id = t.campus_id

            LEFT JOIN periods p
                ON p.period_no = t.period_no

            ${whereSQL}

            ORDER BY

                t.class_id,

                FIELD(
                    t.day,
                    'Monday',
                    'Tuesday',
                    'Wednesday',
                    'Thursday',
                    'Friday',
                    'Saturday',
                    'Sunday'
                ),

                t.period_no

            `,
            params
        );


        // =================================================
        // ADD NORMALIZED PERIOD TYPE
        // =================================================

        const result = rows.map(row => ({

            ...row,

            campus_name:
                row.campus_name ||
                row.camname ||
                "",

            activity_name:
                row.activity_name ||
                row.period_activity_name ||
                null,

            period_type:
                normalizePeriodType({
                    period_type: row.period_type,
                    title: row.period_title
                })

        }));


        res.status(200).json(result);


    } catch (error) {

        console.error(
            "GET TIMETABLE ERROR:",
            error
        );


        res.status(500).json({

            message:
                "Failed to load timetables",

            error:
                error.message

        });

    }

});


// =====================================================
// SAVE TIMETABLE
// =====================================================

router.post("/timetables", async (req, res) => {

    try {

        const {

            user_id,

            class_id,

            section_id,

            subject_id,

            teacher_id,

            campus_id,

            day,

            period_no,

            start_time,

            end_time,

            academic_year,

            activity_name

        } = req.body;


        // =================================================
        // USER ID
        // =================================================

        if (!user_id) {

            return res.status(400).json({
                message: "User ID is required"
            });

        }


        // =================================================
        // BASIC REQUIRED
        // =================================================

        if (!class_id) {

            return res.status(400).json({
                message: "Class is required"
            });

        }


        if (!campus_id) {

            return res.status(400).json({
                message: "Campus is required"
            });

        }


        if (!section_id) {

            return res.status(400).json({
                message: "Section is required"
            });

        }


        if (!day) {

            return res.status(400).json({
                message: "Day is required"
            });

        }


        if (!period_no) {

            return res.status(400).json({
                message: "Period is required"
            });

        }


        // =================================================
        // GET LOGIN USER
        // =================================================

        const user = await getUserInfo(user_id);


        if (!user) {

            return res.status(401).json({
                message: "User not found"
            });

        }


        const fullAccess = isFullAccessUser(user);


        // =================================================
        // NORMAL USER AUTHORIZATION
        // =================================================

        if (!fullAccess) {

            if (
                Number(campus_id) !==
                    Number(user.campus_id) ||

                Number(section_id) !==
                    Number(user.section_id)
            ) {

                return res.status(403).json({

                    message:
                        "You can only create timetable for your assigned campus and section"

                });

            }

        }


        // =================================================
        // GET PERIOD
        // =================================================

        const period = await getPeriodInfo(
            period_no
        );


        if (!period) {

            return res.status(400).json({

                message:
                    "Selected period does not exist"

            });

        }


        const periodType =
            normalizePeriodType(period);


        // =================================================
        // VALIDATE PERIOD DATA
        // =================================================

        if (
            periodType === "CLASS"
        ) {

            if (!subject_id) {

                return res.status(400).json({

                    message:
                        "Subject is required for a class period"

                });

            }


            if (!teacher_id) {

                return res.status(400).json({

                    message:
                        "Teacher is required for a class period"

                });

            }

        }


        if (
            periodType === "ACTIVITY"
        ) {

            const activity =
                String(
                    activity_name || ""
                ).trim();


            if (!activity) {

                return res.status(400).json({

                    message:
                        "Activity name is required"

                });

            }

        }


        // =================================================
        // BREAK MUST NOT HAVE SUBJECT / TEACHER
        // =================================================

        let finalSubjectId = null;
        let finalTeacherId = null;
        let finalActivityName = null;


        if (
            periodType === "CLASS"
        ) {

            finalSubjectId =
                subject_id;

            finalTeacherId =
                teacher_id;

        }


        if (
            periodType === "ACTIVITY"
        ) {

            finalActivityName =
                String(
                    activity_name || ""
                ).trim();

        }


        // =================================================
        // CHECK CLASS
        // =================================================

        const validClass =
            await getValidClass(
                class_id,
                campus_id,
                section_id
            );


        if (!validClass) {

            return res.status(400).json({

                message:
                    "Selected class does not belong to selected campus and section"

            });

        }


        // =================================================
        // CHECK TEACHER
        // ONLY CLASS PERIOD
        // =================================================

        if (
            periodType === "CLASS"
        ) {

            const validTeacher =
                await getValidTeacher(
                    teacher_id,
                    campus_id,
                    section_id
                );


            if (!validTeacher) {

                return res.status(400).json({

                    message:
                        "Selected teacher does not belong to selected campus and section"

                });

            }

        }


        // =================================================
        // CHECK DUPLICATE / CLASS CONFLICT
        //
        // Academic year included.
        // =================================================

        const [classConflict] =
            await db.query(
                `
                SELECT
                    timetable_id
                FROM timetables
                WHERE class_id = ?
                AND campus_id = ?
                AND day = ?
                AND period_no = ?

                AND (
                    academic_year = ?
                    OR (
                        academic_year IS NULL
                        AND ? IS NULL
                    )
                )

                LIMIT 1
                `,
                [
                    class_id,
                    campus_id,
                    day,
                    period_no,
                    academic_year || null,
                    academic_year || null
                ]
            );


        if (
            classConflict.length > 0
        ) {

            return res.status(400).json({

                message:
                    "This class already has a timetable entry in this period"

            });

        }


        // =================================================
        // TEACHER CONFLICT
        //
        // Only CLASS periods
        // =================================================

        if (
            periodType === "CLASS"
        ) {

            const [teacherConflict] =
                await db.query(
                    `
                    SELECT
                        timetable_id
                    FROM timetables
                    WHERE teacher_id = ?
                    AND campus_id = ?
                    AND day = ?
                    AND period_no = ?

                    AND (
                        academic_year = ?
                        OR (
                            academic_year IS NULL
                            AND ? IS NULL
                        )
                    )

                    LIMIT 1
                    `,
                    [
                        teacher_id,
                        campus_id,
                        day,
                        period_no,
                        academic_year || null,
                        academic_year || null
                    ]
                );


            if (
                teacherConflict.length > 0
            ) {

                return res.status(400).json({

                    message:
                        "This teacher is already assigned in this period"

                });

            }

        }


        // =================================================
        // INSERT
        // =================================================

        const [result] =
            await db.query(
                `
                INSERT INTO timetables
                (
                    class_id,
                    subject_id,
                    teacher_id,
                    campus_id,
                    day,
                    period_no,
                    start_time,
                    end_time,
                    activity_name,
                    academic_year
                )

                VALUES
                (
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?
                )
                `,
                [
                    class_id,

                    finalSubjectId,

                    finalTeacherId,

                    campus_id,

                    day,

                    period_no,

                    start_time ||
                        period.start_time ||
                        null,

                    end_time ||
                        period.end_time ||
                        null,

                    finalActivityName,

                    academic_year ||
                        null
                ]
            );


        // =================================================
        // RESPONSE
        // =================================================

        res.status(201).json({

            message:
                "Timetable saved successfully",

            id:
                result.insertId

        });


    } catch (error) {

        console.error(
            "SAVE TIMETABLE ERROR:",
            error
        );


        res.status(500).json({

            message:
                "Failed to save timetable",

            error:
                error.message

        });

    }

});


// =====================================================
// UPDATE TIMETABLE
// =====================================================

router.put(
    "/timetables/:timetable_id",
    async (req, res) => {

        try {

            const {
                timetable_id
            } = req.params;


            const {

                user_id,

                class_id,

                section_id,

                subject_id,

                teacher_id,

                campus_id,

                day,

                period_no,

                start_time,

                end_time,

                academic_year,

                activity_name

            } = req.body;


            // =================================================
            // USER ID
            // =================================================

            if (!user_id) {

                return res.status(400).json({

                    message:
                        "User ID is required"

                });

            }


            // =================================================
            // BASIC REQUIRED
            // =================================================

            if (!class_id) {

                return res.status(400).json({

                    message:
                        "Class is required"

                });

            }


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


            if (!day) {

                return res.status(400).json({

                    message:
                        "Day is required"

                });

            }


            if (!period_no) {

                return res.status(400).json({

                    message:
                        "Period is required"

                });

            }


            // =================================================
            // GET LOGIN USER
            // =================================================

            const user =
                await getUserInfo(
                    user_id
                );


            if (!user) {

                return res.status(401).json({

                    message:
                        "User not found"

                });

            }


            const fullAccess =
                isFullAccessUser(user);


            // =================================================
            // GET EXISTING RECORD
            // =================================================

            const [existingRows] =
                await db.query(
                    `
                    SELECT

                        t.timetable_id,

                        t.campus_id,

                        t.class_id,

                        c.section_id

                    FROM timetables t

                    LEFT JOIN classes c
                        ON c.class_id =
                            t.class_id

                    WHERE t.timetable_id = ?

                    LIMIT 1
                    `,
                    [
                        timetable_id
                    ]
                );


            if (
                existingRows.length === 0
            ) {

                return res.status(404).json({

                    message:
                        "Timetable not found"

                });

            }


            const existing =
                existingRows[0];


            // =================================================
            // NORMAL USER AUTHORIZATION
            // =================================================

            if (!fullAccess) {

                if (

                    Number(
                        existing.campus_id
                    ) !==
                    Number(
                        user.campus_id
                    )

                    ||

                    Number(
                        existing.section_id
                    ) !==
                    Number(
                        user.section_id
                    )

                ) {

                    return res.status(403).json({

                        message:
                            "You cannot update this timetable"

                    });

                }


                if (

                    Number(campus_id) !==
                    Number(user.campus_id)

                    ||

                    Number(section_id) !==
                    Number(user.section_id)

                ) {

                    return res.status(403).json({

                        message:
                            "You can only update timetable for your assigned campus and section"

                    });

                }

            }


            // =================================================
            // GET PERIOD
            // =================================================

            const period =
                await getPeriodInfo(
                    period_no
                );


            if (!period) {

                return res.status(400).json({

                    message:
                        "Selected period does not exist"

                });

            }


            const periodType =
                normalizePeriodType(
                    period
                );


            // =================================================
            // PERIOD VALIDATION
            // =================================================

            if (
                periodType === "CLASS"
            ) {

                if (!subject_id) {

                    return res.status(400).json({

                        message:
                            "Subject is required for a class period"

                    });

                }


                if (!teacher_id) {

                    return res.status(400).json({

                        message:
                            "Teacher is required for a class period"

                    });

                }

            }


            if (
                periodType === "ACTIVITY"
            ) {

                const activity =
                    String(
                        activity_name || ""
                    ).trim();


                if (!activity) {

                    return res.status(400).json({

                        message:
                            "Activity name is required"

                    });

                }

            }


            // =================================================
            // FINAL VALUES
            // =================================================

            let finalSubjectId =
                null;

            let finalTeacherId =
                null;

            let finalActivityName =
                null;


            if (
                periodType === "CLASS"
            ) {

                finalSubjectId =
                    subject_id;

                finalTeacherId =
                    teacher_id;

            }


            if (
                periodType === "ACTIVITY"
            ) {

                finalActivityName =
                    String(
                        activity_name || ""
                    ).trim();

            }


            // =================================================
            // CHECK CLASS
            // =================================================

            const validClass =
                await getValidClass(
                    class_id,
                    campus_id,
                    section_id
                );


            if (!validClass) {

                return res.status(400).json({

                    message:
                        "Selected class does not belong to selected campus and section"

                });

            }


            // =================================================
            // CHECK TEACHER
            // =================================================

            if (
                periodType === "CLASS"
            ) {

                const validTeacher =
                    await getValidTeacher(
                        teacher_id,
                        campus_id,
                        section_id
                    );


                if (!validTeacher) {

                    return res.status(400).json({

                        message:
                            "Selected teacher does not belong to selected campus and section"

                    });

                }

            }


            // =================================================
            // CLASS CONFLICT
            // =================================================

            const [classConflict] =
                await db.query(
                    `
                    SELECT
                        timetable_id
                    FROM timetables

                    WHERE class_id = ?

                    AND campus_id = ?

                    AND day = ?

                    AND period_no = ?

                    AND (
                        academic_year = ?
                        OR (
                            academic_year IS NULL
                            AND ? IS NULL
                        )
                    )

                    AND timetable_id <> ?

                    LIMIT 1
                    `,
                    [

                        class_id,

                        campus_id,

                        day,

                        period_no,

                        academic_year || null,

                        academic_year || null,

                        timetable_id

                    ]
                );


            if (
                classConflict.length > 0
            ) {

                return res.status(400).json({

                    message:
                        "This class already has a timetable entry in this period"

                });

            }


            // =================================================
            // TEACHER CONFLICT
            // =================================================

            if (
                periodType === "CLASS"
            ) {

                const [teacherConflict] =
                    await db.query(
                        `
                        SELECT
                            timetable_id
                        FROM timetables

                        WHERE teacher_id = ?

                        AND campus_id = ?

                        AND day = ?

                        AND period_no = ?

                        AND (
                            academic_year = ?
                            OR (
                                academic_year IS NULL
                                AND ? IS NULL
                            )
                        )

                        AND timetable_id <> ?

                        LIMIT 1
                        `,
                        [

                            teacher_id,

                            campus_id,

                            day,

                            period_no,

                            academic_year || null,

                            academic_year || null,

                            timetable_id

                        ]
                    );


                if (
                    teacherConflict.length > 0
                ) {

                    return res.status(400).json({

                        message:
                            "This teacher is already assigned in this period"

                    });

                }

            }


            // =================================================
            // UPDATE
            // =================================================

            const [result] =
                await db.query(
                    `
                    UPDATE timetables

                    SET

                        class_id = ?,

                        subject_id = ?,

                        teacher_id = ?,

                        campus_id = ?,

                        day = ?,

                        period_no = ?,

                        start_time = ?,

                        end_time = ?,

                        activity_name = ?,

                        academic_year = ?

                    WHERE timetable_id = ?
                    `,
                    [

                        class_id,

                        finalSubjectId,

                        finalTeacherId,

                        campus_id,

                        day,

                        period_no,

                        start_time ||
                            period.start_time ||
                            null,

                        end_time ||
                            period.end_time ||
                            null,

                        finalActivityName,

                        academic_year ||
                            null,

                        timetable_id

                    ]
                );


            if (
                result.affectedRows === 0
            ) {

                return res.status(404).json({

                    message:
                        "Timetable not found"

                });

            }


            res.status(200).json({

                message:
                    "Timetable updated successfully"

            });


        } catch (error) {

            console.error(
                "UPDATE TIMETABLE ERROR:",
                error
            );


            res.status(500).json({

                message:
                    "Failed to update timetable",

                error:
                    error.message

            });

        }

    }
);


// =====================================================
// DELETE TIMETABLE
// =====================================================

router.delete(
    "/timetables/:timetable_id",
    async (req, res) => {

        try {

            const {
                timetable_id
            } = req.params;


            const {
                user_id
            } = req.query;


            // =================================================
            // USER ID
            // =================================================

            if (!user_id) {

                return res.status(400).json({

                    message:
                        "User ID is required"

                });

            }


            // =================================================
            // GET USER
            // =================================================

            const user =
                await getUserInfo(
                    user_id
                );


            if (!user) {

                return res.status(401).json({

                    message:
                        "User not found"

                });

            }


            const fullAccess =
                isFullAccessUser(user);


            // =================================================
            // GET EXISTING TIMETABLE
            // =================================================

            const [existingRows] =
                await db.query(
                    `
                    SELECT

                        t.timetable_id,

                        t.campus_id,

                        c.section_id

                    FROM timetables t

                    LEFT JOIN classes c
                        ON c.class_id =
                            t.class_id

                    WHERE t.timetable_id = ?

                    LIMIT 1
                    `,
                    [
                        timetable_id
                    ]
                );


            if (
                existingRows.length === 0
            ) {

                return res.status(404).json({

                    message:
                        "Timetable not found"

                });

            }


            const existing =
                existingRows[0];


            // =================================================
            // NORMAL USER AUTHORIZATION
            // =================================================

            if (!fullAccess) {

                if (

                    Number(
                        existing.campus_id
                    ) !==
                    Number(
                        user.campus_id
                    )

                    ||

                    Number(
                        existing.section_id
                    ) !==
                    Number(
                        user.section_id
                    )

                ) {

                    return res.status(403).json({

                        message:
                            "You cannot delete this timetable"

                    });

                }

            }


            // =================================================
            // DELETE
            // =================================================

            const [result] =
                await db.query(
                    `
                    DELETE FROM timetables

                    WHERE timetable_id = ?
                    `,
                    [
                        timetable_id
                    ]
                );


            if (
                result.affectedRows === 0
            ) {

                return res.status(404).json({

                    message:
                        "Timetable not found"

                });

            }


            res.status(200).json({

                message:
                    "Timetable deleted successfully"

            });


        } catch (error) {

            console.error(
                "DELETE TIMETABLE ERROR:",
                error
            );


            res.status(500).json({

                message:
                    "Failed to delete timetable",

                error:
                    error.message

            });

        }

    }
);


export default router;