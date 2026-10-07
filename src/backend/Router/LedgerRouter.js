import express from "express";
import db from "../db.js"

const router = express.Router();

/*
    GET ALL SUBSIDIARY ACCOUNTS
    Used for Ledger account dropdown
*/
router.get("/ledger-accounts", async (req, res) => {
    try {
        const sql = `
            SELECT
                Sa_ID,
                SA_Name,
                Type,
                Opening_Debit,
                Opening_Credit
            FROM subsidaryaccount
            ORDER BY SA_Name ASC
        `;

        const [rows] = await db.query(sql);

        res.status(200).json(rows);

    } catch (error) {
        console.error("Ledger Accounts Error:", error);
        res.status(500).json({
            message: "Failed to load ledger accounts",
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
/*
    GET LEDGER

    Query parameters:

    account_id
    from_date
    to_date
    voucher_type
    vno
    narration
*/
router.get("/ledger", async (req, res) => {

    try {

        const {
            account_id,
            from_date,
            to_date,
            voucher_type,
            vno,
            narration
        } = req.query;


        // Account is required
        if (!account_id) {
            return res.status(400).json({
                message: "Please select an account"
            });
        }


        /*
            Get selected account information
        */
        const accountSql = `
            SELECT
                Sa_ID,
                SA_Name,
                Type,
                COALESCE(Opening_Debit, 0) AS Opening_Debit,
                COALESCE(Opening_Credit, 0) AS Opening_Credit
            FROM subsidaryaccount
            WHERE Sa_ID = ?
        `;

        const [accountRows] = await db.query(
            accountSql,
            [account_id]
        );


        if (accountRows.length === 0) {
            return res.status(404).json({
                message: "Account not found"
            });
        }


        const account = accountRows[0];


        /*
            ------------------------------------------
            OPENING BALANCE
            ------------------------------------------

            Opening balance from subsidiary account
            +
            transactions before From Date
        */

        let openingDebit = Number(account.Opening_Debit) || 0;
        let openingCredit = Number(account.Opening_Credit) || 0;


        if (from_date) {

            const openingTransactionSql = `
                SELECT
                    COALESCE(SUM(DEBIT), 0) AS Debit,
                    COALESCE(SUM(CREDIT), 0) AS Credit
                FROM master
                WHERE SUBID = ?
                  AND IS_DELETED = 0
                  AND VDT < ?
            `;

            const [openingRows] = await db.query(
                openingTransactionSql,
                [account_id, from_date]
            );


            if (openingRows.length > 0) {

                openingDebit += Number(openingRows[0].Debit) || 0;
                openingCredit += Number(openingRows[0].Credit) || 0;

            }
        }


        /*
            Opening balance

            Debit - Credit
        */
        const openingBalance = openingDebit - openingCredit;


        /*
            ------------------------------------------
            LEDGER TRANSACTIONS
            ------------------------------------------
        */

        let sql = `
            SELECT
                m.MASTER_ID,
                m.VNO,
                m.VDT,
                m.PDT,
                m.SUBID,
                s.SA_Name,
                m.NARRATION,
                m.BILL_NO,
                m.FILE_NO,
                m.CHQ_NO,
                m.CHQ_DT,
                m.DEBIT,
                m.CREDIT,
                m.VOUCHER_TYPE
            FROM master m

            LEFT JOIN subsidaryaccount s
                ON m.SUBID = s.Sa_ID

            WHERE m.SUBID = ?
              AND m.IS_DELETED = 0
        `;


        const params = [account_id];


        /*
            From date
        */
        if (from_date) {
            sql += ` AND DATE(m.VDT) >= ? `;
            params.push(from_date);
        }


        /*
            To date
        */
        if (to_date) {
            sql += ` AND DATE(m.VDT) <= ? `;
            params.push(to_date);
        }


        /*
            Voucher type
        */
        if (voucher_type && voucher_type !== "ALL") {
            sql += ` AND m.VOUCHER_TYPE = ? `;
            params.push(voucher_type);
        }


        /*
            Voucher number
        */
        if (vno) {
            sql += ` AND m.VNO LIKE ? `;
            params.push(`%${vno}%`);
        }


        /*
            Narration
        */
        if (narration) {
            sql += ` AND m.NARRATION LIKE ? `;
            params.push(`%${narration}%`);
        }


        /*
            Sort transactions
        */
        sql += `
            ORDER BY
                m.VDT ASC,
                m.MASTER_ID ASC
        `;


        const [rows] = await db.query(sql, params);


        /*
            ------------------------------------------
            RUNNING BALANCE
            ------------------------------------------
        */

        let balance = openingBalance;


        const ledgerRows = rows.map(row => {

            const debit = Number(row.DEBIT) || 0;
            const credit = Number(row.CREDIT) || 0;

            balance += debit - credit;


            return {
                MASTER_ID: row.MASTER_ID,
                VNO: row.VNO,
                VDT: row.VDT,
                PDT: row.PDT,
                SUBID: row.SUBID,
                SA_Name: row.SA_Name,
                NARRATION: row.NARRATION,
                BILL_NO: row.BILL_NO,
                FILE_NO: row.FILE_NO,
                CHQ_NO: row.CHQ_NO,
                CHQ_DT: row.CHQ_DT,
                DEBIT: debit,
                CREDIT: credit,
                BALANCE: balance,
                VOUCHER_TYPE: row.VOUCHER_TYPE
            };

        });


        /*
            ------------------------------------------
            TOTALS
            ------------------------------------------
        */

        const totalDebit = ledgerRows.reduce(
            (total, row) => total + row.DEBIT,
            0
        );


        const totalCredit = ledgerRows.reduce(
            (total, row) => total + row.CREDIT,
            0
        );


        /*
            Closing balance
        */
        const closingBalance =
            openingBalance + totalDebit - totalCredit;


        /*
            Response
        */
        res.status(200).json({

            account: {
                Sa_ID: account.Sa_ID,
                SA_Name: account.SA_Name,
                Type: account.Type
            },

            opening: {
                debit: openingDebit,
                credit: openingCredit,
                balance: openingBalance
            },

            transactions: ledgerRows,

            totals: {
                debit: totalDebit,
                credit: totalCredit
            },

            closingBalance

        });


    } catch (error) {

        console.error("Ledger Error:", error);

        res.status(500).json({
            message: "Failed to load ledger",
            error: error.message
        });

    }

});


/*
    GET VOUCHER TYPES

    Used for Voucher Type filter
*/
router.get("/ledger-voucher-types", async (req, res) => {

    try {

        const sql = `
            SELECT DISTINCT VOUCHER_TYPE
            FROM master
            WHERE IS_DELETED = 0
              AND VOUCHER_TYPE IS NOT NULL
              AND VOUCHER_TYPE <> ''
            ORDER BY VOUCHER_TYPE ASC
        `;

        const [rows] = await db.query(sql);

        res.status(200).json(rows);

    } catch (error) {

        console.error("Ledger Voucher Types Error:", error);

        res.status(500).json({
            message: "Failed to load voucher types",
            error: error.message
        });

    }

});


export default router;