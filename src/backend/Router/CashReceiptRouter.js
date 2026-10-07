import express from "express";
import db from "../db.js";
import './CompanyProfileRouter.js';

const router = express.Router();


// ======================================================
// GET NEXT VOUCHER NUMBER
// ======================================================
router.get("/cash-receipt/next-vno", async (req, res) => {

    try {

        const [rows] = await db.query(`
            SELECT VNO
            FROM cashreceipt
            
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

        const vno = `CR-${String(nextNumber).padStart(5, "0")}`;

        res.json({
            vno
        });

    } catch (error) {

       // console.error(error);

        res.status(500).json({
            message: "Unable to generate voucher number"
        });
    }
});

// // Get Subsidary Account for drop Down

router.get("/subsidiary-accounts", async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT Sa_ID, SA_Name
            FROM subsidaryaccount
        `);

        res.json(rows);

    } catch (error) {
       // console.error("Subsidiary Accounts Error:", error);

        res.status(500).json({
            message: "Unable to get Subsidary Accounts",
            error: error.message
        });
    }
});

router.get("/cash", async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT Sa_ID, SA_Name
            FROM subsidaryaccount 
            where type = "cash"
        `);

        res.json(rows);

    } catch (error) {
        //console.error("Banks Accounts Error:", error);

        res.status(500).json({
            message: "Unable to get Banks Accounts",
            error: error.message
        });
    }
});


// // ======================================================
// // SAVE CASH Receipt
// // ======================================================
router.post("/cash-receipt", async (req, res) => {

    const connection = await db.getConnection();

    try {

        const {
            vno,
            post_date,
            voucher_date,
            sa_id,
            cash_sa_id,
            file_no,
            bill_no,
            narration,
            amount,
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

        if (!cash_sa_id) {
            return res.status(400).json({
                message: "Cash account is required"
            });
        }

        if (!amount || Number(amount) <= 0) {
            return res.status(400).json({
                message: "Amount must be greater than zero"
            });
        }

        // ----------------------------------------------
        // START TRANSACTION
        // ----------------------------------------------

        await connection.beginTransaction();

        // ----------------------------------------------
        // SAVE CASH PAYMENT
        // ----------------------------------------------

        const cashreceiptSQL = `
            INSERT INTO cashreceipt
            (
                vno,
                post_date,
                voucher_date,
                sa_id,
                cash_sa_id,
                file_no,
                bill_no,
                narration,
                amount,
                is_deleted
            )
            VALUES (?,?, ?, ?, ?, ?, ?, ?, ?, 0)
        `;


        await connection.execute(
            cashreceiptSQL,
            [
                vno,
                post_date,
                voucher_date,
                sa_id,
                cash_sa_id,
                file_no || null,
                bill_no || null,
                narration || null,
                Number(amount || 0),
                
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
                cash_sa_id,
                narration || null,
                bill_no || null,
                file_no || null,
                    0,
                    0,

                Number(amount || 0),   //debit
                0,                     //credit

                 0,
                0,
                0,
                Number(amount || 0),

                "CR"
            ]
        );


        // // ----------------------------------------------
        // // MASTER - CREDIT CASH ACCOUNT
        // // ----------------------------------------------

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
                0,
                0,

                
                0,                   //debt
                Number(amount || 0), //credit

                 0,
                0,
                0,
                Number(amount || 0),

                "CR"
            ]
        );
        
        // ----------------------------------------------
        // COMMIT
        // ----------------------------------------------

        await connection.commit();
        res.status(201).json({
            message: "CASH PAYMENT saved successfully",
            vno
        });


    } catch (error) {

        await connection.rollback();

        //console.error("CASH PAYMENT Save Error:", error);

        res.status(500).json({
            message: "Unable to save CASH PAYMENT",
            error: error.message
        });

    } finally {

        connection.release();
    }
});


// // ======================================================
// // GET DISTINCT CASH PAYMENT VOUCHERS
// // ======================================================
router.get("/cash-receipt-list", async (req, res) => {

    try {

        const sql = `
         select vno,	voucher_date,	file_no,	bill_no,	narration,	amount	from cashreceipt where IS_DELETED=0 ORDER BY vno DESC
        `;


        const [rows] = await db.query(sql);


        res.json(rows);
        
    } catch (error) {

        //console.error("CASH PAYMENT List Error:", error);

        res.status(500).json({
            message: "Unable to load CASH PAYMENT",
            error: error.message
        });
    }
});


// // ======================================================
// // GET ONE VOUCHER FOR EDIT
// // ======================================================
// //SELECT CR.CR_id, CR.post_date, CR.voucher_date, CR.chq_date, CR.sa_id, CR.dr, CR.bank_id, CR.chq_no, CR.file_no, CR.bill_no, CR.narration, CR.amount, CR.add_amount, CR.sub_amount, CR.less_amount, CR.net_amount FROM cashreceipt CR WHERE CR.vno = ?;
router.get("/cash-receipt/:vno", async (req, res) => {

    try {

        const { vno } = req.params;


        const sql = `
                SELECT
                CR.CR_id,
                CR.vno,
                CR.post_date,
                CR.voucher_date,
                CR.sa_id,
                CR.cash_sa_id,
                CR.file_no,
                CR.bill_no,
                CR.narration,
                CR.amount
                
            FROM cashreceipt CR

            WHERE CR.is_deleted = 0
            and CR.vno = ?

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

       // console.error(error);

        res.status(500).json({
            message: "Unable to load voucher",
            error: error.message
        });
    }
});


// // ======================================================
// // UPDATE CASH PAYMENT
// // ======================================================
router.put("/cash-receipt/:vno", async (req, res) => {

    const connection = await db.getConnection();

    try {

        const { vno } = req.params;
        //console.log("UPDATE VNO:", vno);
   
        const {
            
            post_date,
            voucher_date,
            sa_id,
            cash_sa_id,
            file_no,
            bill_no,
            narration,
            amount
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

        if (!cash_sa_id) {
            return res.status(400).json({
                message: "Cash account is required"
            });
        }

        if (!amount || Number(amount) <= 0) {
            return res.status(400).json({
                message: "Amount must be greater than zero"
            });
        }

        await connection.beginTransaction();
        // ----------------------------------------------
        // UPDATE CASH PAYMENT 
        // ----------------------------------------------

        const [updateResult] = await connection.execute(
        
            `
    UPDATE cashreceipt
    SET
        post_date = ?,
        voucher_date = ?,
        sa_id = ?,
        cash_sa_id = ?,
        file_no = ?,
        bill_no = ?,
        narration = ?,
        amount = ?
    WHERE vno = ?
    AND is_deleted = 0            `,

            [
           post_date,
    voucher_date,
    sa_id,
    cash_sa_id,
    file_no,
    bill_no,
    narration,
    amount,
    vno
            ]
        );

        
        if (updateResult.affectedRows === 0) {

            await connection.rollback();

            return res.status(404).json({
                message: "CASH PAYMENT voucher not found"
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
            AND VOUCHER_TYPE = 'CR'
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
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
        `;


        await connection.execute(
            masterSQL,
            [  
                 vno,
                voucher_date,
                post_date,
                cash_sa_id,
                narration || null,
                bill_no || null,
                file_no || null,
                    0,
                    0,

                Number(amount || 0),   //debit
                0,                     //credit

                 0,
                0,
                0,
                Number(amount || 0),

                "CR"
            ]
        );


        // // ----------------------------------------------
        // // MASTER - CREDIT CASH ACCOUNT
        // // ----------------------------------------------

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
                0,
                0,

                
                0,                   //debt
                Number(amount || 0), //credit

                 0,
                0,
                0,
                Number(amount || 0),

                "CR"
            ]
        );
        

        await connection.commit();


        res.json({
            message: "CASH PAYMENT updated successfully"
        });


    } catch (error) {

        await connection.rollback();

       // console.error("CASH PAYMENT Update Error:", error);

        res.status(500).json({
            message: "Unable to update CASH PAYMENT",
            error: error.message
        });

    } finally {

        connection.release();
    }
});


// // ======================================================
// // DELETE CASH PAYMENT
// // ======================================================
router.delete("/cash-receipt/:vno", async (req, res) => {

    const connection = await db.getConnection();

    try {

        const { vno } = req.params;

        await connection.beginTransaction();


        // =========================================
        // CASH PAYMENT Soft Delete
        // =========================================
        const [CashResult] = await connection.execute(
            `
            UPDATE cashreceipt
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
            AND VOUCHER_TYPE = 'CR'
            AND IS_DELETED = 0
            `,
            [vno]
        );


        // =========================================
        // Check whether voucher existed
        // =========================================
        if (CashResult.affectedRows === 0) {

            await connection.rollback();

            return res.status(404).json({
                message: `Voucher ${vno} not found or already deleted`
            });
        }


        await connection.commit();


        res.status(200).json({
            message: "CASH PAYMENT deleted successfully",
            vno: vno
        });


    } catch (error) {

        await connection.rollback();

       

        res.status(500).json({
            message: "Unable to delete CASH PAYMENT",
            error: error.message
        });

    } finally {

        connection.release();
    }
});

// //// Print Voucher
router.get("/cash-receipt/print/:vno", async (req, res) => {
    try {
        const { vno } = req.params;

        // Get voucher information
        const voucherSQL = `
            SELECT
                CR.vno,
                CR.voucher_date,               
                CR.file_no,
                CR.bill_no,
                CR.narration,
                CR.amount
            FROM cashreceipt CR
            WHERE CR.vno = ?
              AND CR.is_deleted = 0
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
              AND m.VOUCHER_TYPE = 'CR'
              AND m.IS_DELETED = 0
            ORDER BY m.DEBIT DESC, m.CREDIT DESC
        `;

        const [masterRows] = await db.query(masterSQL, [vno]);
            
        res.json({
            voucher: voucherRows[0],
            accounts: masterRows
        });

    } catch (error) {
        

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
       // console.error("Company Profile Error:", error);

        res.status(500).json({
            message: "Unable to load company profile"
        });
    }
});
export default router;