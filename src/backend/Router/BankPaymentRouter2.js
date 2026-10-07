import express from "express";
import db from "../db.js";
import './CompanyProfileRouter.js';

const router = express.Router();


// ======================================================
// GET NEXT VOUCHER NUMBER
// ======================================================
router.get("/bank-payment/next-vno", async (req, res) => {

    try {

        const [rows] = await db.query(`
            SELECT VNO
            FROM BANKPAYMENT
            
            ORDER BY VNO DESC
            LIMIT 1
        `);

        let nextNumber = 1;

        if (rows.length > 0 && rows[0].VNO) {

            const match = rows[0].VNO.match(/\d+$/);

            if (match) {
                nextNumber = parseInt(match[0]) + 1;
            }
        }

        const vno = `BP-${String(nextNumber).padStart(5, "0")}`;

        res.json({
            vno
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Unable to generate voucher number"
        });
    }
});

// Get Subsidary Account for drop Down

router.get("/subsidiary-accounts", async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT Sa_ID, SA_Name
            FROM subsidaryaccount
        `);

        res.json(rows);

    } catch (error) {
        console.error("Subsidiary Accounts Error:", error);

        res.status(500).json({
            message: "Unable to get Subsidary Accounts",
            error: error.message
        });
    }
});

router.get("/banks", async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT Sa_ID, SA_Name
            FROM subsidaryaccount 
            where type = "bank"
        `);

        res.json(rows);

    } catch (error) {
        console.error("Banks Accounts Error:", error);

        res.status(500).json({
            message: "Unable to get Banks Accounts",
            error: error.message
        });
    }
});


// ======================================================
// SAVE BANK PAYMENT
// ======================================================
router.post("/bank-payment", async (req, res) => {

    const connection = await db.getConnection();

    try {

        const {
            vno,
            post_date,
            voucher_date,
            chq_date,
            sa_id,
            bank_id,
            chq_no,
            file_no,
            bill_no,
            narration,
            amount,
            add_amount,
            sub_amount,
            less_amount,
            net_amount,
            add_amount_sa_id,
            less_amount_sa_id

        } = req.body;

    console.log("BACKEND add_amount:", add_amount);
    console.log("BACKEND add_amount_sa_id:", add_amount_sa_id);
    console.log("BACKEND Less_amount:", less_amount);
    console.log("BACKEND less_amount_sa_id:", less_amount_sa_id);

        // ----------------------------------------------
        // VALIDATION
        // ----------------------------------------------


        if (!vno) {
            return res.status(400).json({
                message: "Voucher number is required"
            });
        }

        if (!sa_id) {
            return res.status(400).json({
                message: "Subsidiary account is required"
            });
        }

        if (!bank_id) {
            return res.status(400).json({
                message: "Bank account is required"
            });
        }

        if (!amount || Number(amount) <= 0) {
            return res.status(400).json({
                message: "Amount must be greater than zero"
            });
        }

        if (Number(add_amount || 0) > 0 && !add_amount_sa_id) {
        return res.status(400).json({
        message: "Please select Add Amount account"
    });
}

        if (Number(less_amount || 0) > 0 && !less_amount_sa_id) {
        return res.status(400).json({
        message: "Please select Less Amount account"
    });
}


        const debitAmount = Number(net_amount || amount);


        // ----------------------------------------------
        // START TRANSACTION
        // ----------------------------------------------

        await connection.beginTransaction();


        // ----------------------------------------------
        // SAVE BANK PAYMENT
        // ----------------------------------------------

        const bankPaymentSQL = `
            INSERT INTO bankpayment
            (
                vno,
                post_date,
                voucher_date,
                chq_date,
                sa_id,
                dr,
                bank_id,
                chq_no,
                file_no,
                bill_no,
                narration,
                amount,
                add_amount,
                sub_amount,
                less_amount,
                net_amount,
                is_deleted
            )
            VALUES (?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
        `;


        await connection.execute(
            bankPaymentSQL,
            [
                vno,
                post_date,
                voucher_date,
                chq_date || null,
                sa_id,
                debitAmount,
                bank_id,
                chq_no || null,
                file_no || null,
                bill_no || null,
                narration || null,
                Number(amount || 0),
                Number(add_amount || 0),
                Number(sub_amount || 0),
                Number(less_amount || 0),
                debitAmount
            ]
        );


        // ----------------------------------------------
        // MASTER - DEBIT
        // ----------------------------------------------

        const masterSQL = `
            INSERT INTO master
            (
                VNO,
                VDT,
                PDT,
                SUBID,
                NARRATION,
                BILL_NO,
                FILE_NO,
                CHQ_NO,
                CHQ_DT,
                DEBIT,
                CREDIT,
                ADD_OTHER_AMOUNT,
                SUB_TOTAL,
                LESS_OTHER_AMOUNT,
                NET_AMOUNT,
                VOUCHER_TYPE,
                IS_DELETED
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
        `;


        await connection.execute(
            masterSQL,
            [
                vno,
                voucher_date,
                post_date,
                sa_id,
                narration || null,
                bill_no || null,
                file_no || null,
                chq_no || null,
                chq_date || null,

                Number(amount || 0),
                0,

                Number(add_amount || 0),
                Number(amount || 0),
                Number(less_amount || 0),
                debitAmount,

                "BP"
            ]
        );


        // ----------------------------------------------
        // MASTER - CREDIT BANK
        // ----------------------------------------------

        await connection.execute(
            masterSQL,
            [
                vno,
                voucher_date,
                post_date,
                bank_id,
                narration || null,
                bill_no || null,
                file_no || null,
                chq_no || null,
                chq_date || null,

                0,
                debitAmount,

                Number(add_amount || 0),
                Number(amount || 0),
                Number(less_amount || 0),
                debitAmount,

                "BP"
            ]
        );
    //--------------------------------------------------
    // if Less amount is not 0
    //---------------------------------------------------
    if (Number(less_amount || 0) > 0) 
    {
        const lessAmountMasterSQL = `
            INSERT INTO master
            (
                VNO,
                VDT,
                PDT,
                SUBID,
                NARRATION,
                BILL_NO,
                FILE_NO,
                CHQ_NO,
                CHQ_DT,
                DEBIT,
                CREDIT,
                ADD_OTHER_AMOUNT,
                SUB_TOTAL,
                LESS_OTHER_AMOUNT,
                NET_AMOUNT,
                VOUCHER_TYPE,
                IS_DELETED
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
        `;


        await connection.execute(
            lessAmountMasterSQL,
            [
                vno,
                voucher_date,
                post_date,
                less_amount_sa_id,
                narration || null,
                bill_no || null,
                file_no || null,
                chq_no || null,
                chq_date || null,

                0,                      //Debit
                Number(less_amount || 0), //Credit
                                       

                Number(add_amount || 0),
                Number(amount || 0),
                Number(less_amount || 0),
                debitAmount,

                "BP"
            ]
        );

    }
        // ----------------------------------------------
        // MASTER - DEBIT if Add Amount not 0
        // ----------------------------------------------
            if (Number(add_amount || 0) > 0) 
    {
        const addAmountMasterSQL = `
            INSERT INTO master
            (
                VNO,
                VDT,
                PDT,
                SUBID,
                NARRATION,
                BILL_NO,
                FILE_NO,
                CHQ_NO,
                CHQ_DT,
                DEBIT,
                CREDIT,
                ADD_OTHER_AMOUNT,
                SUB_TOTAL,
                LESS_OTHER_AMOUNT,
                NET_AMOUNT,
                VOUCHER_TYPE,
                IS_DELETED
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
        `;


        await connection.execute(
            addAmountMasterSQL,
            [
                vno,
                voucher_date,
                post_date,
                add_amount_sa_id,
                narration || null,
                bill_no || null,
                file_no || null,
                chq_no || null,
                chq_date || null,

                Number(add_amount || 0), //Debit
                0,                       //Credit

                Number(add_amount || 0),
                Number(amount || 0),
                Number(less_amount || 0),
                debitAmount,

                "BP"
            ]
        );

    }
        // ----------------------------------------------
        // COMMIT
        // ----------------------------------------------

        await connection.commit();


        res.status(201).json({
            message: "Bank payment saved successfully",
            vno
        });


    } catch (error) {

        await connection.rollback();

        console.error("Bank Payment Save Error:", error);

        res.status(500).json({
            message: "Unable to save bank payment",
            error: error.message
        });

    } finally {

        connection.release();
    }
});


// ======================================================
// GET DISTINCT BANK PAYMENT VOUCHERS
// ======================================================
router.get("/list", async (req, res) => {

    try {

        const sql = `
            SELECT
    bp.bp_id,
    bp.vno,
    bp.post_date,
    bp.voucher_date,
    bp.chq_date,
    bp.sa_id,
    bp.bank_id,
    bp.chq_no,
    bp.file_no,
    bp.bill_no,
    bp.narration,
    bp.amount,
    bp.add_amount,
    bp.sub_amount,

    MAX(CASE
        WHEN m.ADD_OTHER_AMOUNT > 0
        THEN m.SUBID
    END) AS saMasterAddAccount,

    MAX(CASE
        WHEN m.LESS_OTHER_AMOUNT > 0
        THEN m.SUBID
    END) AS saMasterLessAccount,

    bp.less_amount,
    bp.net_amount

FROM bankpayment bp

LEFT JOIN master m
    ON m.VNO = bp.vno
    AND m.IS_DELETED = 0

WHERE bp.is_deleted = 0
GROUP BY
    bp.bp_id,
    bp.vno,
    bp.post_date,
    bp.voucher_date,
    bp.chq_date,
    bp.sa_id,
    bp.bank_id,
    bp.chq_no,
    bp.file_no,
    bp.bill_no,
    bp.narration,
    bp.amount,
    bp.add_amount,
    bp.sub_amount,
    bp.less_amount,
    bp.net_amount

ORDER BY bp.vno DESC;
        `;


        const [rows] = await db.query(sql);

        res.json(rows);
        
    } catch (error) {

        console.error("Bank Payment List Error:", error);

        res.status(500).json({
            message: "Unable to load bank payments",
            error: error.message
        });
    }
});


// ======================================================
// GET ONE VOUCHER FOR EDIT
// ======================================================
//SELECT bp.bp_id, bp.post_date, bp.voucher_date, bp.chq_date, bp.sa_id, bp.dr, bp.bank_id, bp.chq_no, bp.file_no, bp.bill_no, bp.narration, bp.amount, bp.add_amount, bp.sub_amount, bp.less_amount, bp.net_amount FROM bankpayment bp WHERE bp.vno = ?;
router.get("/bank-payment/:vno", async (req, res) => {

    try {

        const { vno } = req.params;


        const sql = `
                SELECT
                bp.bp_id,
                bp.vno,
                bp.post_date,
                bp.voucher_date,
                bp.chq_date,
                bp.sa_id,
                bp.bank_id,
                bp.chq_no,
                bp.file_no,
                bp.bill_no,
                bp.narration,
                bp.amount,
                bp.add_amount,
                bp.sub_amount,

                MAX(
                CASE
                    WHEN m.ADD_OTHER_AMOUNT > 0
                        AND m.DEBIT = m.ADD_OTHER_AMOUNT
                    THEN m.SUBID
                END
            ) AS saMasterAddAccount,

                MAX(
                CASE
                    WHEN m.LESS_OTHER_AMOUNT > 0
                        AND m.CREDIT = m.LESS_OTHER_AMOUNT
                    THEN m.SUBID
                END
            ) AS saMasterLessAccount,

                bp.less_amount,
                bp.net_amount

            FROM bankpayment bp

            LEFT JOIN master m
                ON m.VNO = bp.vno
                AND m.IS_DELETED = 0

            WHERE bp.is_deleted = 0
            and bp.vno = ?

            GROUP BY
                bp.bp_id,
                bp.vno,
                bp.post_date,
                bp.voucher_date,
                bp.chq_date,
                bp.sa_id,
                bp.bank_id,
                bp.chq_no,
                bp.file_no,
                bp.bill_no,
                bp.narration,
                bp.amount,
                bp.add_amount,
                bp.sub_amount,
                bp.less_amount,
                bp.net_amount

            ORDER BY bp.vno DESC;            
                    `;


        const [rows] = await db.query(sql, [vno]);
            

        if (rows.length === 0) {

            return res.status(404).json({
                message: "Voucher not found"
            });
        }


        res.json({
            vno,
            ...rows[0]
        });


    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Unable to load voucher",
            error: error.message
        });
    }
});

// ======================================================
// UPDATE BANK PAYMENT
// ======================================================
router.put("/bank-payment/:vno", async (req, res) => {

    const connection = await db.getConnection();

    try {

        const { vno } = req.params;
        console.log("UPDATE VNO:", vno);
   
        const {
            post_date,  
            voucher_date,
            chq_date,
            sa_id,
            bank_id,
            chq_no,
            file_no,
            bill_no,
            narration,
            amount,
            add_amount,
            sub_amount,
            less_amount,
            net_amount,
            add_amount_sa_id,
            less_amount_sa_id

        } = req.body;

                
        // ----------------------------------------------
        // VALIDATION
        // ----------------------------------------------

        if (!vno) {
            return res.status(400).json({
                message: "Voucher number is required"
            });
        }

        if (!sa_id) {
            return res.status(400).json({
                message: "Subsidiary account is required"
            });
        }

        if (!bank_id) {
            return res.status(400).json({
                message: "Bank account is required"
            });
        }

        if (!amount || Number(amount) <= 0) {
            return res.status(400).json({
                message: "Amount must be greater than zero"
            });
        }

        // Add Amount account required only when Add Amount > 0
        if (Number(add_amount || 0) > 0 && !add_amount_sa_id) {
            return res.status(400).json({
                message: "Please select Add Amount account"
            });
        }
        
        if (Number(less_amount || 0) > 0 && !less_amount_sa_id) {
            return res.status(400).json({
                message: "Please select Less Amount account"
            });
        }


        const debitAmount = Number(net_amount || amount);


        await connection.beginTransaction();


        // ----------------------------------------------
        // UPDATE BANK PAYMENT 
        // ----------------------------------------------

        const [updateResult] = await connection.execute(
            `
            UPDATE bankpayment
            SET
                post_date = ?,
                voucher_date = ?,
                chq_date = ?,
                sa_id = ?,
                dr = ?,
                bank_id = ?,
                chq_no = ?,
                file_no = ?,
                bill_no = ?,
                narration = ?,
                amount = ?,
                add_amount = ?,
                sub_amount = ?,
                less_amount = ?,
                net_amount = ?
                
            WHERE vno = ?
            AND is_deleted = 0
            `,
            [
                post_date,
                voucher_date,
                chq_date || null,
                sa_id,
                debitAmount,
                bank_id,
                chq_no || null,
                file_no || null,
                bill_no || null,
                narration || null,

                Number(amount || 0),
                Number(add_amount || 0),
                Number(sub_amount || 0),
                Number(less_amount || 0),
                debitAmount,

                

                vno
            ]
        );

        
        if (updateResult.affectedRows === 0) {

            await connection.rollback();

            return res.status(404).json({
                message: "Bank payment voucher not found"
            });
        }


        // ----------------------------------------------
        // DELETE OLD MASTER LINES
        // ----------------------------------------------

        await connection.execute(
            `
            UPDATE master
            SET IS_DELETED = 1
            WHERE VNO = ?
            AND VOUCHER_TYPE = 'BP'
            AND IS_DELETED = 0
            `,
            [vno]
        );


        // ----------------------------------------------
        // MASTER SQL 
        // ----------------------------------------------

        const masterSQL = `
            INSERT INTO master
            (
                VNO,
                VDT,
                PDT,
                SUBID,
                NARRATION,
                BILL_NO,
                FILE_NO,
                CHQ_NO,
                CHQ_DT,
                DEBIT,
                CREDIT,
                ADD_OTHER_AMOUNT,
                SUB_TOTAL,
                LESS_OTHER_AMOUNT,
                NET_AMOUNT,
                VOUCHER_TYPE,
                IS_DELETED
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'BP', 0)
        `;


        // ----------------------------------------------
        // MAIN SA DEBIT 1
        // ----------------------------------------------

        await connection.execute(
            masterSQL,
            [
                vno,
                voucher_date,
                post_date,
                sa_id,

                narration || null,
                bill_no || null,
                file_no || null,
                chq_no || null,
                chq_date || null,

                // MAIN ACCOUNT GETS ORIGINAL AMOUNT
                Number(amount || 0), //Debit
                0,                  // Credit

                Number(add_amount || 0),
                Number(amount || 0),
                Number(less_amount || 0),
                debitAmount
            ]
        );


        // ----------------------------------------------
        // ADD AMOUNT DEBIT 2 
        // ----------------------------------------------

        if (Number(add_amount || 0) > 0) {

            await connection.execute(
                masterSQL,
                [
                    vno,
                    voucher_date,
                    post_date,
                    add_amount_sa_id,

                    narration || null,
                    bill_no || null,
                    file_no || null,
                    chq_no || null,
                    chq_date || null,

                    // ADD AMOUNT ACCOUNT GETS ADD AMOUNT
                    Number(add_amount || 0), // Debit
                    0,                      //  Credit

                    Number(add_amount || 0),
                    Number(amount || 0),
                    Number(less_amount || 0),
                    debitAmount
                ]
            );
        }


        // ----------------------------------------------
        // BANK CREDIT 3 Bank Credit
        // ----------------------------------------------

        await connection.execute(
            masterSQL,
            [
                vno,
                voucher_date,
                post_date,
                bank_id,

                narration || null,
                bill_no || null,
                file_no || null,
                chq_no || null,
                chq_date || null,

                0,                  //Debit
                debitAmount,        // Credit

                Number(add_amount || 0),
                Number(amount || 0),
                Number(less_amount || 0),
                debitAmount
            ]
        );

                // ----------------------------------------------
        // less AMOUNT credit 4 less Amount
        // ----------------------------------------------

        if (Number(less_amount || 0) > 0) {

            await connection.execute(
                masterSQL,
                [
                    vno,
                    voucher_date,
                    post_date,
                    less_amount_sa_id,
                    narration || null,
                    bill_no || null,
                    file_no || null,
                    chq_no || null,
                    chq_date || null,

                    0,                        // Debit
                    Number(less_amount || 0), // Credit
                   

                    Number(add_amount || 0),
                    Number(amount || 0),
                    Number(less_amount || 0),
                    debitAmount
                ]
            );
        }


        await connection.commit();


        res.json({
            message: "Bank payment updated successfully"
        });


    } catch (error) {

        await connection.rollback();

        console.error("Bank Payment Update Error:", error);

        res.status(500).json({
            message: "Unable to update bank payment",
            error: error.message
        });

    } finally {

        connection.release();
    }
});


// ======================================================
// DELETE BANK PAYMENT
// ======================================================
router.delete("/bank-payment/:vno", async (req, res) => {

    const connection = await db.getConnection();

    try {

        const { vno } = req.params;

        await connection.beginTransaction();


        // =========================================
        // Bank Payment Soft Delete
        // =========================================
        const [bankResult] = await connection.execute(
            `
            UPDATE bankpayment
            SET is_deleted = 1
            WHERE is_deleted = 0
            AND vno = ?
            `,
            [vno]
        );


        // =========================================
        // Master Soft Delete
        // =========================================
        const [masterResult] = await connection.execute(
            `
            UPDATE master
            SET IS_DELETED = 1
            WHERE VNO = ?
            AND VOUCHER_TYPE = 'BP'
            AND IS_DELETED = 0
            `,
            [vno]
        );


        // =========================================
        // Check whether voucher existed
        // =========================================
        if (bankResult.affectedRows === 0) {

            await connection.rollback();

            return res.status(404).json({
                message: `Voucher ${vno} not found or already deleted`
            });
        }


        await connection.commit();


        res.status(200).json({
            message: "Bank payment deleted successfully",
            vno: vno
        });


    } catch (error) {

        await connection.rollback();

        console.error("Delete Error:", error);

        res.status(500).json({
            message: "Unable to delete bank payment",
            error: error.message
        });

    } finally {

        connection.release();
    }
});

//// Print Voucher
router.get("/bank-payment/print/:vno", async (req, res) => {
    try {
        const { vno } = req.params;

        // Get voucher information
        const voucherSQL = `
            SELECT
                bp.vno,
                bp.voucher_date,
                bp.chq_date,
                bp.chq_no,
                bp.file_no,
                bp.bill_no,
                bp.narration,
                bp.amount,
                bp.add_amount,
                bp.sub_amount,
                bp.less_amount,
                bp.net_amount
            FROM bankpayment bp
            WHERE bp.vno = ?
              AND bp.is_deleted = 0
        `;

        const [voucherRows] = await db.query(voucherSQL, [vno]);

        if (voucherRows.length === 0) {
            return res.status(404).json({
                message: "Voucher not found"
            });
        }

        // Get accounting entries + account names
        const masterSQL = `
            SELECT
                m.SUBID,
                m.DEBIT,
                m.CREDIT,
                sa.SA_Name
            FROM master m
            LEFT JOIN subsidaryaccount sa
                ON sa.Sa_ID = m.SUBID
            WHERE m.VNO = ?
              AND m.VOUCHER_TYPE = 'BP'
              AND m.IS_DELETED = 0
            ORDER BY m.DEBIT DESC, m.CREDIT DESC
        `;

        const [masterRows] = await db.query(masterSQL, [vno]);

        res.json({
            voucher: voucherRows[0],
            accounts: masterRows
        });

    } catch (error) {
        console.error("Print voucher error:", error);

        res.status(500).json({
            message: "Unable to load voucher for printing",
            error: error.message
        });
    }
});

router.get("/company-profile", async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                id,
                company_name,
                address,
                phone,
                email,
                website,
                logo
            FROM company_profile
            LIMIT 1
        `);

        res.json(rows[0] || {});

    } catch (error) {
        console.error("Company Profile Error:", error);

        res.status(500).json({
            message: "Unable to load company profile"
        });
    }
});
export default router;