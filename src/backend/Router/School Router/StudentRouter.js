import express from "express";
import db from "../../db.js";

const router = express.Router();


// ======================================================
// GET NEXT ADMISSION NUMBER
// ======================================================

router.get("/students/next-admission-no", async (req, res) => {

    try {

        const year = new Date().getFullYear();

        const [rows] = await db.query(
            `
            SELECT admission_no
            FROM students
            WHERE admission_no LIKE ?
            ORDER BY student_id DESC
            LIMIT 1
            `,
            [`${year}-%`]
        );


        let nextNumber = 1;


        if (rows.length > 0) {

            const lastAdmissionNo =
                rows[0].admission_no;

            const parts =
                lastAdmissionNo.split("-");

            if (parts.length === 2) {

                const lastNumber =
                    parseInt(parts[1], 10);

                if (!isNaN(lastNumber)) {

                    nextNumber =
                        lastNumber + 1;

                }

            }

        }


        const admissionNo =
            `${year}-${String(nextNumber).padStart(4, "0")}`;


        res.json({
            admission_no: admissionNo
        });


    } catch (error) {

        console.error(
            "GET NEXT ADMISSION NO ERROR:",
            error
        );

        res.status(500).json({
            message:
                "Failed to generate admission number"
        });

    }

});


// ======================================================
// GET ALL STUDENTS
// ======================================================

router.get("/students", async (req, res) => {
console.log("========== STUDENTS API HIT ==========");
    console.log("STUDENT FILTER:", req.query);
    try {
        const {
            campus_id,
            section_id,
            role
        } = req.query;

        let sql = `
            SELECT
                s.student_id,
                s.admission_no,
                s.student_name,
                s.father_name,
                s.date_of_birth,
                s.gender,
                s.campus_id,

                cp.name AS campus_name,

                s.class_id,
                c.name AS class_name,

                s.section_id,
                sec.section_name,

                s.admission_date,
                s.student_phone,
                s.father_phone,
                s.guardian_name,
                s.guardian_phone,
                s.address,
                s.previous_school,
                s.photo,
                s.student_status,
                s.remarks,
                s.created_at,
                s.updated_at

            FROM students s

            LEFT JOIN campuses cp
                ON s.campus_id = cp.campus_id

            LEFT JOIN classes c
                ON s.class_id = c.class_id

            LEFT JOIN sections sec
                ON s.section_id = sec.section_id
        `;

        const conditions = [];
        const params = [];

        // SUPER_ADMIN can see everything
        if (role !== "SUPER_ADMIN") {

            if (campus_id) {
                conditions.push("s.campus_id = ?");
                params.push(campus_id);
            }

            // Non-admin users only their section
            if (
                role !== "CAMPUS_ADMIN" &&
                section_id
            ) {
                conditions.push("s.section_id = ?");
                params.push(section_id);
            }
        }

        if (conditions.length > 0) {
            sql += `
                WHERE ${conditions.join(" AND ")}
            `;
        }

        sql += `
            ORDER BY s.student_id DESC
        `;

        const [rows] = await db.query(sql, params);

        res.json(rows);

    } catch (error) {
        console.error("GET STUDENTS ERROR:", error);

        res.status(500).json({
            message: "Failed to load students",
            error: error.sqlMessage || error.message
        });
    }
});


// ======================================================
// GET CLASSES
// ======================================================

router.get("/student-classes", async (req, res) => {

    try {

        const [rows] = await db.query(`
            SELECT
                class_id,
                name
            FROM classes
            WHERE is_active = 1
            ORDER BY name
        `);

        res.json(rows);

    } catch (error) {

        console.error(
            "GET STUDENT CLASSES ERROR:",
            error
        );

        res.status(500).json({
            message:
                "Failed to load classes"
        });

    }

});


// ======================================================
// GET SECTIONS
// ======================================================

router.get("/student-sections", async (req, res) => {

    try {

        const [rows] = await db.query(`
            SELECT
                section_id,
                section_name,
                room_number,
                capacity,
                status
            FROM sections
            WHERE status = 'Active'
            ORDER BY section_name
        `);

        res.json(rows);

    } catch (error) {

        console.error(
            "GET STUDENT SECTIONS ERROR:",
            error
        );

        res.status(500).json({
            message:
                "Failed to load sections"
        });

    }

});

router.get("/student-campuses", async (req, res) => {

    try {

        const [rows] = await db.query(`
            SELECT
                campus_id,
                name
          
            FROM campuses
            
        `);

        res.json(rows);

    } catch (error) {

        console.error(
            "GET Campus ERROR:",
            error
        );

        res.status(500).json({
            message:
                "Failed to load sections"
        });

    }

});

// ======================================================
// ADD STUDENT
// ======================================================


router.post("/students", async (req, res) => {
    try {

        const {
            user_id,
            campus_id,
            student_name,
            father_name,
            date_of_birth,
            gender,
            class_id,
            section_id,
            admission_date,
            student_phone,
            father_phone,
            guardian_name,
            guardian_phone,
            address,
            previous_school,
            photo,
            student_status,
            remarks
        } = req.body;


        // ==========================================
        // REQUIRED FIELDS
        // ==========================================

        if (!student_name || !father_name || !class_id || !section_id) {

            return res.status(400).json({
                message:
                    "Student Name, Father Name, Class and Section are required"
            });
        }


        // ==========================================
        // GET CURRENT ACADEMIC YEAR
        // ==========================================

        const [academicYears] = await db.query(`
            SELECT academic_year_id, year_name
            FROM academic_years
            WHERE is_current = 1
            LIMIT 1
        `);


        if (academicYears.length === 0) {

            return res.status(400).json({
                message:
                    "No current academic year is set. Please set a current academic year first."
            });
        }


        const academicYearId =
            academicYears[0].academic_year_id;

        const academicYearName =
            academicYears[0].year_name;


        // ==========================================
        // GENERATE ADMISSION NUMBER
        // ==========================================

        const yearPrefix =
            academicYearName.substring(0, 4);


        const [lastStudent] = await db.query(
            `
            SELECT admission_no
            FROM students
            WHERE academic_year_id = ?
            ORDER BY student_id DESC
            LIMIT 1
            `,
            [academicYearId]
        );


        let nextNumber = 1;


        if (lastStudent.length > 0) {

            const lastAdmissionNo =
                lastStudent[0].admission_no;

            const parts =
                lastAdmissionNo.split("-");


            if (parts.length === 2) {

                const lastNumber =
                    parseInt(parts[1], 10);

                if (!isNaN(lastNumber)) {
                    nextNumber = lastNumber + 1;
                }
            }
        }


        const admissionNo =
            `${yearPrefix}-${String(nextNumber).padStart(4, "0")}`;


        // ==========================================
        // INSERT STUDENT
        // ==========================================

        const [result] = await db.query(`
            INSERT INTO students (
                admission_no,
                 user_id,
                campus_id,
                student_name,
                father_name,
                date_of_birth,
                gender,
                class_id,
                section_id,
                academic_year_id,
                admission_date,
                student_phone,
                father_phone,
                guardian_name,
                guardian_phone,
                address,
                previous_school,
                photo,
                student_status,
                remarks
            )
            VALUES (?, ? , ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [

            admissionNo,
             user_id,
            campus_id,
            student_name
                ?.trim()
                .toUpperCase(),

            father_name
                ?.trim()
                .toUpperCase(),

            date_of_birth || null,

            gender || "Male",

            class_id,

            section_id,

            academicYearId,

            admission_date || null,

            student_phone
                ?.trim()
                .toUpperCase() || null,

            father_phone
                ?.trim()
                .toUpperCase() || null,

            guardian_name
                ?.trim()
                .toUpperCase() || null,

            guardian_phone
                ?.trim()
                .toUpperCase() || null,

            address
                ?.trim()
                .toUpperCase() || null,

            previous_school
                ?.trim()
                .toUpperCase() || null,

            photo || null,

            student_status || "Active",

            remarks
                ?.trim()
                .toUpperCase() || null
        ]);


        // ==========================================
        // SUCCESS
        // ==========================================

        res.status(201).json({

            message: "Student saved successfully",

            student_id: result.insertId,

            admission_no: admissionNo,

            academic_year_id: academicYearId,

            academic_year: academicYearName
        });


    } catch (error) {

        console.error(
            "ADD STUDENT ERROR:",
            error
        );


        if (error.code === "ER_DUP_ENTRY") {

            return res.status(400).json({
                message:
                    "Admission No already exists"
            });
        }


        res.status(500).json({

            message:
                error.sqlMessage ||
                "Failed to save student"
        });
    }
});




// ======================================================
// UPDATE STUDENT
// ======================================================

router.put("/students/:id", async (req, res) => {

    try {

        const { id } =
            req.params;


        const {
            admission_no,
            student_name,
            father_name,
            date_of_birth,
            gender,
            class_id,
            section_id,
            admission_date,
            student_phone,
            father_phone,
            guardian_name,
            guardian_phone,
            address,
            previous_school,
            photo,
            student_status,
            remarks
        } = req.body;


        if (
            !admission_no ||
            !student_name ||
            !father_name
        ) {

            return res.status(400).json({
                message:
                    "Admission No, Student Name and Father Name are required"
            });

        }


        await db.query(`
            UPDATE students
            SET
                admission_no = ?,
                student_name = ?,
                father_name = ?,
                date_of_birth = ?,
                gender = ?,
                class_id = ?,
                section_id = ?,
                admission_date = ?,
                student_phone = ?,
                father_phone = ?,
                guardian_name = ?,
                guardian_phone = ?,
                address = ?,
                previous_school = ?,
                photo = ?,
                student_status = ?,
                remarks = ?
            WHERE student_id = ?
        `, [

            admission_no
                ?.trim()
                .toUpperCase(),

            student_name
                ?.trim()
                .toUpperCase(),

            father_name
                ?.trim()
                .toUpperCase(),

            date_of_birth || null,

            gender || "Male",

            class_id,

            section_id,

            admission_date || null,

            student_phone
                ?.trim() || null,

            father_phone
                ?.trim() || null,

            guardian_name
                ?.trim()
                .toUpperCase() || null,

            guardian_phone
                ?.trim() || null,

            address
                ?.trim()
                .toUpperCase() || null,

            previous_school
                ?.trim()
                .toUpperCase() || null,

            photo || null,

            student_status || "Active",

            remarks
                ?.trim()
                .toUpperCase() || null,

            id

        ]);


        res.json({
            message:
                "Student updated successfully"
        });


    } catch (error) {

        console.error(
            "UPDATE STUDENT ERROR:",
            error
        );


        if (
            error.code === "ER_DUP_ENTRY"
        ) {

            return res.status(400).json({
                message:
                    "Admission No already exists"
            });

        }


        res.status(500).json({
            message:
                "Failed to update student"
        });

    }

});


// ======================================================
// UPDATE STUDENT STATUS
// ======================================================

router.put("/students/:id/status", async (req, res) => {

    try {

        const { id } =
            req.params;

        const { student_status } =
            req.body;


        if (
            ![
                "Active",
                "Inactive",
                "Left"
            ].includes(student_status)
        ) {

            return res.status(400).json({
                message:
                    "Invalid student status"
            });

        }


        await db.query(
            `
            UPDATE students
            SET student_status = ?
            WHERE student_id = ?
            `,
            [
                student_status,
                id
            ]
        );


        res.json({
            message:
                "Student status updated successfully"
        });


    } catch (error) {

        console.error(
            "UPDATE STUDENT STATUS ERROR:",
            error
        );


        res.status(500).json({
            message:
                "Failed to update student status"
        });

    }

});


export default router;