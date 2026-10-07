import express from "express";
import db from "../../../backend/db.js";

const router = express.Router();


// =====================================================
// GENERAL ACCOUNTS
// =====================================================
router.get("/general-accounts", async (req, res) => {
    try {

        const sql = `
            SELECT
                ga.General_Account_Id,
                ga.General_Account_Name
            FROM Generalaccount ga
            LEFT JOIN controlaccounts c
                ON c.controlaccountid = ga.Control_Account_Id
            ORDER BY ga.General_Account_Name
        `;

        const [rows] = await db.query(sql);

        res.json(rows);

    } catch (error) {

        console.error(
            "GENERAL ACCOUNTS FETCH ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
});


// =====================================================
// SAVE SUBSIDIARY ACCOUNT
// =====================================================
router.post("/SaveSA", async (req, res) => {

    console.log("Received data:", req.body);

    try {

        const {
            tb_generalaccount,
            tb_subsidaryaccount,
            tb_type,
            tb_dr,
            tb_cr,
            tb_remarks,

            // CASH
            campus_id,
            section_id,

            // BANK
            bank_name,
            account_title,
            account_number,
            iban,
            branch_name,
            branch_code

        } = req.body;


        // =====================================================
        // NORMALIZE TYPE
        // =====================================================

        const accountType =
            String(tb_type || "")
                .trim()
                .toUpperCase();


        // =====================================================
        // BASIC VALIDATION
        // =====================================================

        if (!tb_generalaccount) {

            return res.status(400).json({
                success: false,
                message: "General Account is required."
            });

        }


        if (!tb_subsidaryaccount ||
            !String(tb_subsidaryaccount).trim()) {

            return res.status(400).json({
                success: false,
                message: "Subsidiary Account is required."
            });

        }


        if (!accountType) {

            return res.status(400).json({
                success: false,
                message: "Account Type is required."
            });

        }


        // =====================================================
        // ACCOUNT TYPE VALIDATION
        // =====================================================

        if (!["CASH", "BANK", "NONE"].includes(accountType)) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid Account Type. Use Cash, Bank or None."
            });

        }


        // =====================================================
        // CASH VALIDATION
        // =====================================================

        if (accountType === "CASH") {

            if (!campus_id) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Campus is required for Cash account."
                });

            }


            if (!section_id) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Section is required for Cash account."
                });

            }

        }


        // =====================================================
        // BANK VALIDATION
        // =====================================================

        if (accountType === "BANK") {

            if (!bank_name ||
                !String(bank_name).trim()) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Bank Name is required."
                });

            }


            if (!account_title ||
                !String(account_title).trim()) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Account Title is required."
                });

            }


            if (!account_number ||
                !String(account_number).trim()) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Account Number is required."
                });

            }

        }


        // =====================================================
        // INSERT
        // =====================================================

        const sql = `
            INSERT INTO subsidaryaccount
            (
                Ga_ID,
                SA_Name,
                Type,

                campus_id,
                section_id,

                bank_name,
                account_title,
                account_number,
                iban,
                branch_name,
                branch_code,

                Opening_Debit,
                Opening_Credit,
                Remarks
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;


        const values = [

            Number(tb_generalaccount),

            String(tb_subsidaryaccount).trim(),

            accountType,

            // CASH
            accountType === "CASH"
                ? Number(campus_id)
                : null,

            accountType === "CASH"
                ? Number(section_id)
                : null,


            // BANK
            accountType === "BANK"
                ? String(bank_name).trim()
                : null,

            accountType === "BANK"
                ? String(account_title).trim()
                : null,

            accountType === "BANK"
                ? String(account_number).trim()
                : null,

            accountType === "BANK"
                ? String(iban || "").trim() || null
                : null,

            accountType === "BANK"
                ? String(branch_name || "").trim() || null
                : null,

            accountType === "BANK"
                ? String(branch_code || "").trim() || null
                : null,


            // OPENING BALANCE
            Number(tb_dr || 0),

            Number(tb_cr || 0),

            // DB column is NOT NULL
            String(tb_remarks || "").trim()

        ];


        const [result] =
            await db.query(sql, values);


        console.log(
            "SUBSIDIARY ACCOUNT INSERT:",
            result
        );


        res.status(200).json({
            success: true,
            message: "Saved Successfully",
            id: result.insertId
        });


    } catch (error) {

        console.error(
            "========== SUBSIDIARY ACCOUNT SAVE ERROR =========="
        );

        console.error(error);

        console.error(
            "MESSAGE:",
            error.message
        );

        console.error(
            "CODE:",
            error.code
        );

        console.error(
            "===================================================="
        );


        res.status(500).json({
            success: false,
            message: error.message,
            code: error.code
        });

    }

});


// =====================================================
// UPDATE SUBSIDIARY ACCOUNT
// =====================================================
router.put(
    "/subsidary-accounts/:id",
    async (req, res) => {

        try {

            const { id } = req.params;

            const {
                tb_generalaccount,
                tb_subsidaryaccount,
                tb_type,
                tb_dr,
                tb_cr,
                tb_remarks,

                // CASH
                campus_id,
                section_id,

                // BANK
                bank_name,
                account_title,
                account_number,
                iban,
                branch_name,
                branch_code

            } = req.body;


            // =====================================================
            // NORMALIZE TYPE
            // =====================================================

            const accountType =
                String(tb_type || "")
                    .trim()
                    .toUpperCase();


            // =====================================================
            // BASIC VALIDATION
            // =====================================================

            if (!tb_generalaccount) {

                return res.status(400).json({
                    success: false,
                    message:
                        "General Account is required."
                });

            }


            if (!tb_subsidaryaccount ||
                !String(tb_subsidaryaccount).trim()) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Subsidiary Account is required."
                });

            }


            if (!accountType) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Account Type is required."
                });

            }


            if (!["CASH", "BANK", "NONE"].includes(accountType)) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid Account Type. Use Cash, Bank or None."
                });

            }


            // =====================================================
            // CASH VALIDATION
            // =====================================================

            if (accountType === "CASH") {

                if (!campus_id) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Campus is required for Cash account."
                    });

                }


                if (!section_id) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Section is required for Cash account."
                    });

                }

            }


            // =====================================================
            // BANK VALIDATION
            // =====================================================

            if (accountType === "BANK") {

                if (!bank_name ||
                    !String(bank_name).trim()) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Bank Name is required."
                    });

                }


                if (!account_title ||
                    !String(account_title).trim()) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Account Title is required."
                    });

                }


                if (!account_number ||
                    !String(account_number).trim()) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Account Number is required."
                    });

                }

            }


            // =====================================================
            // UPDATE
            // =====================================================

            const sql = `
                UPDATE subsidaryaccount
                SET

                    Ga_ID = ?,
                    SA_Name = ?,
                    Type = ?,

                    campus_id = ?,
                    section_id = ?,

                    bank_name = ?,
                    account_title = ?,
                    account_number = ?,
                    iban = ?,
                    branch_name = ?,
                    branch_code = ?,

                    Opening_Debit = ?,
                    Opening_Credit = ?,
                    Remarks = ?

                WHERE Sa_ID = ?
            `;


            const values = [

                Number(tb_generalaccount),

                String(tb_subsidaryaccount).trim(),

                accountType,


                // CASH
                accountType === "CASH"
                    ? Number(campus_id)
                    : null,

                accountType === "CASH"
                    ? Number(section_id)
                    : null,


                // BANK
                accountType === "BANK"
                    ? String(bank_name).trim()
                    : null,

                accountType === "BANK"
                    ? String(account_title).trim()
                    : null,

                accountType === "BANK"
                    ? String(account_number).trim()
                    : null,

                accountType === "BANK"
                    ? String(iban || "").trim() || null
                    : null,

                accountType === "BANK"
                    ? String(branch_name || "").trim() || null
                    : null,

                accountType === "BANK"
                    ? String(branch_code || "").trim() || null
                    : null,


                // OPENING BALANCE
                Number(tb_dr || 0),

                Number(tb_cr || 0),

                String(tb_remarks || "").trim(),

                Number(id)

            ];


            const [result] =
                await db.query(sql, values);


            if (result.affectedRows === 0) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Subsidiary Account not found."
                });

            }


            res.json({
                success: true,
                message:
                    "Subsidiary Account Updated Successfully."
            });


        } catch (error) {

            console.error(
                "SUBSIDIARY ACCOUNT UPDATE ERROR:",
                error
            );


            res.status(500).json({
                success: false,
                message: error.message
            });

        }

    }
);


// =====================================================
// FETCH SUBSIDIARY ACCOUNTS
// =====================================================
router.get("/table", async (req, res) => {

    try {

        const sql = `
            SELECT

                sa.Sa_ID,
                sa.Ga_ID,

                ga.General_Account_Name,

                sa.SA_Name,
                sa.Type,

                sa.campus_id,
                sa.section_id,

                cp.name AS campus_name,
                sec.section_name,

                sa.bank_name,
                sa.account_title,
                sa.account_number,
                sa.iban,
                sa.branch_name,
                sa.branch_code,

                sa.Opening_Debit AS dr,
                sa.Opening_Credit AS cr,

                sa.Remarks AS remarks

            FROM subsidaryaccount sa

            LEFT JOIN Generalaccount ga
                ON ga.General_Account_Id = sa.Ga_ID

            LEFT JOIN campuses cp
                ON cp.campus_id = sa.campus_id

            LEFT JOIN sections sec
                ON sec.section_id = sa.section_id

            ORDER BY sa.Sa_ID DESC
        `;


        const [rows] =
            await db.query(sql);


        res.json(rows);


    } catch (error) {

        console.error(
            "SUBSIDIARY ACCOUNT FETCH ERROR:",
            error
        );


        res.status(500).json({
            success: false,
            message: error.message
        });

    }

});


export default router;