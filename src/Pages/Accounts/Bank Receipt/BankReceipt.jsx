import React, {useRef, useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { SearchOutlined } from "@ant-design/icons";
import {
    Card,
    Row,
    Col,
    Form,
    Input,
    InputNumber,
    Select,
    DatePicker,
    Button,
    Table,
    Space,
    AutoComplete
} from "antd";

import dayjs from "dayjs";

import { number } from "framer-motion";

const BankReceipt = () => {

    const [form] = Form.useForm();

    const [vno, setVno] = useState("");

    const [tableData, setTableData] = useState([]);

    const [subsidiaryAccounts, setSubsidiaryAccounts] = useState([]);

    const [getSa , setGetSa] = useState([]);

    const [banks, setBanks] = useState([]);

    const [loading, setLoading] = useState(false);

    const [tableLoading, setTableLoading] = useState(false);

    const [editingVno, setEditingVno] = useState(null);

    const [showAddAccount, setShowAddAccount] = useState(false);
    const [showLessAccount, setShowLessAccount] = useState(false);

    const [addAmountSAId, setAddAmountSAId] = useState(null);
    const [lessAmountSAId, setLessAmountSAId] = useState(null);

    const [searchCheque, setSearchCheque] = useState("");

    const [searchVoucher, setSearchVoucher] = useState("");

    const addAccountRef = useRef(null);
    const addAccountToLess = useRef(null);
    const lessToAccount = useRef(null);
    const lessAccounttoSave = useRef(null);
    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {

        loadNextVoucher();
        loadTable();
        loadAccounts();
        

    }, []);

    /// Search by Chq Number
    const filteredData = tableData.filter((item) =>
        String(item.vno || "")
        .toLowerCase()
        .includes(searchVoucher.toLowerCase())
);
    const filteredDataVoucher = tableData.filter((item) =>
        String(item.chq_no || "")
        .toLowerCase()
        .includes(searchCheque.toLowerCase())
);
    // =====================================================
    // GET NEXT VOUCHER
    // =====================================================

    const loadNextVoucher = async () => {

        try {

            const response = await axios.get(
                "/api/bank-receipt/next-vno"
            );

            setVno(response.data.vno);

        } catch (error) {

            console.error(error);

            Swal.fire(
                "Error",
                "Unable to generate voucher number",
                "error"
            );
        }
    };


    // =====================================================
    // LOAD ACCOUNTS
    // =====================================================

    const loadAccounts = async () => {

        try {

            const saResponse = await axios.get(
                "/api/subsidiary-accounts"
            );

            const bankResponse = await axios.get(
                "/api/banks"
            );

            setGetSa(
                saResponse.data
            );

            setBanks(
                bankResponse.data
            );

        } catch (error) {

            console.error(
                "Account loading error:",
                error
            );
        }
    };


    // =====================================================
    // LOAD TABLE
    // =====================================================

    const loadTable = async () => {

        try {

            setTableLoading(true);

            const response = await axios.get(
                "/api/bank-receipt-list"
            );
            console.log(response);
            setTableData(response.data);

        } catch (error) {

            console.error(error);

            Swal.fire(
                "Error",
                "Unable to load BANK RECEIPT vouchers",
                "error"
            );

        } finally {

            setTableLoading(false);
        }
    };


    // =====================================================
    // AMOUNT CALCULATION
    // =====================================================

    const calculateNetAmount = () => {

        const amount =
            Number(form.getFieldValue("amount")) || 0;

        const addAmount =
            Number(form.getFieldValue("add_amount")) || 0;

        // const subAmount =
        //     Number(form.getFieldValue("sub_amount")) || 0;

        const lessAmount =
            Number(form.getFieldValue("less_amount")) || 0;

        const subAmount = 
        amount+addAmount;

        const netAmount =
            // amount + addAmount + subAmount - lessAmount;
            subAmount-lessAmount;


        form.setFieldValue(
            "net_amount",
            netAmount
        );

        form.setFieldValue(
            "sub_amount",
            subAmount
        );
    };


    // =====================================================
    // SAVE / UPDATE
    // =====================================================

    const handleSubmit = async (values) => {
        console.log("VALUES:", values);
        try {

            setLoading(true);


            const payload = {

                vno: vno,

                post_date:
                    values.post_date
                        ? values.post_date.format("YYYY-MM-DD")
                        : null,

                voucher_date:
                    values.voucher_date
                        ? values.voucher_date.format("YYYY-MM-DD")
                        : null,

                chq_date:
                    values.chq_date
                        ? values.chq_date.format("YYYY-MM-DD")
                        : null,

                sa_id:
                    values.sa_id,

                bank_id:
                    values.bank_id,

                chq_no:
                    values.chq_no || "",

                file_no:
                    values.file_no || "",

                bill_no:
                    values.bill_no || "",

                narration:
                    values.narration || "",

                amount:
                    Number(values.amount || 0),

                add_amount:
                    Number(values.add_amount || 0),

                add_amount_sa_id:
                    values.add_amount_sa_id,    

                sub_amount:
                    Number(values.sub_amount || 0),

                less_amount:
                    Number(values.less_amount || 0),

                   less_amount_sa_id:
                    values.less_amount_sa_id,    
                    
                net_amount:
                    Number(values.net_amount || 0)
                
            };


            // =============================================
            // UPDATE
            // =============================================

            if (editingVno) {

                await axios.put(
                    `/api/bank-receipt/${editingVno}`,
                    payload
                );


                await Swal.fire(
                    "Updated",
                    "BANK RECEIPT updated successfully",
                    "success"
                );

            }

            // =============================================
            // SAVE
            // =============================================

            else {

                await axios.post(
                    "/api/bank-receipt",
                    payload
                );


                await Swal.fire(
                    "Saved",
                    "BANK RECEIPT saved successfully",
                    "success"
                );
            }


            resetForm();

            loadTable();


        } catch (error) {

            console.error(
                "Save/Update error:",
                error
            );

            Swal.fire(
                "Error",
                error.response?.data?.message ||
                "Unable to save BANK RECEIPT",
                "error"
            );

        } finally {

            setLoading(false);
        }
    };


    // =====================================================
    // EDIT
    // =====================================================

    const handleEdit = async (record) => {

        try {

            const response = await axios.get(
        `/api/bank-receipt/${record.vno}`
            
    );
                    
            const item = response.data;
            
            console.log("Fetching Data for update", item);

            // Keep voucher highlighted / editing
            setEditingVno(record.vno);

            setVno(record.vno);

            
            form.setFieldsValue({
            
                //   chq_no:
                //     item.chq_no || "",

                post_date:
                    item.post_date
                        ? dayjs(item.post_date)
                        : null,

                voucher_date:
                    item.voucher_date
                        ? dayjs(item.voucher_date)
                        : null,

                chq_date:
                    item.chq_date
                        ? dayjs(item.chq_date)
                        : null,

                sa_id:
                    item.sa_id,

                bank_id:
                    item.bank_id,

                chq_no:
                    item.chq_no || "",

                file_no:
                    item.file_no || "",

                bill_no:
                    item.bill_no || "",

                narration:
                    item.narration || "",

                amount:
                    Number(item.amount || 0),

                add_amount:
                    Number(item.add_amount || 0),

                add_amount_sa_id: item.saMasterAddAccount,
                

                sub_amount:
                    Number(item.sub_amount || 0),

                less_amount:
                    Number(item.less_amount || 0),

                
                less_amount_sa_id: item.saMasterLessAccount,

                net_amount:
                    Number(item.net_amount || 0)
            });
 
    if (Number(record.add_amount || 0) > 0) {

        setShowAddAccount(true);

    } else {

        setShowAddAccount(false);

        // Clear old selected account
        form.setFieldValue("add_amount_sa_id", null);
    }

        if (Number(record.less_amount || 0) > 0) {

        setShowLessAccount(true);

    } else {

        setShowLessAccount(false);

        // Clear old selected account
        form.setFieldValue("less_amount_sa_id", null);
    }

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });


        } catch (error) {

            console.error(error);

            Swal.fire(
                "Error",
                "Unable to load voucher",
                "error"
            );
        }
    };


    // =====================================================
    // DELETE
    // =====================================================

    const handleDelete = async (record) => {

    const vno = record.vno;

    const result = await Swal.fire({

        title: "Delete Voucher?",

        text: `Voucher ${vno} will be deleted.`,

        icon: "warning",

        showCancelButton: true,

        confirmButtonText: "Delete",

        cancelButtonText: "Cancel"
    });


    if (!result.isConfirmed) {
        return;
    }


    try {

        await axios.delete(
            `/api/bank-receipt/${vno}`
        );


        await Swal.fire(
            "Deleted",
            "BANK RECEIPT deleted successfully",
            "success"
        );


        if (editingVno === vno) {
            resetForm();
        }


        loadTable();


    } catch (error) {

        console.error("Delete Error:", error);

        Swal.fire(
            "Error",
            error.response?.data?.message ||
            "Unable to delete voucher",
            "error"
        );
    }
};
// Print 
const handlePrint = async (record) => {
    try {

        const [voucherResponse, companyResponse] = await Promise.all([
            axios.get(
                `/api/bank-receipt/print/${record.vno}`
            ),
            axios.get(
                "/api/company-profile"
            )
        ]);

        const voucher = voucherResponse.data.voucher;
        const accounts = voucherResponse.data.accounts;

        const company = companyResponse.data;

        console.log("COMPANY:", company);
        console.log("VOUCHER:", voucher);
        console.log("ACCOUNTS:", accounts);

        const printWindow = window.open(
            "",
            "_blank",
            "width=900,height=700"
        );

        if (!printWindow) {
            Swal.fire(
                "Popup Blocked",
                "Please allow popups for this website.",
                "warning"
            );
            return;
        }

        // Account rows
        const accountRows = accounts.map((account) => {

            const debit = Number(account.DEBIT || 0);
            const credit = Number(account.CREDIT || 0);

            return `
                <tr>

                    <td>
                        ${account.SA_Name || ""}
                    </td>

                    <td class="amount">
                        ${
                            debit > 0
                                ? debit.toLocaleString()
                                : ""
                        }
                    </td>

                    <td class="amount">
                        ${
                            credit > 0
                                ? credit.toLocaleString()
                                : ""
                        }
                    </td>

                </tr>
            `;

        }).join("");


        // Open print document
        printWindow.document.write(`

            <html>

            <head>

                <title>
                    BANK RECEIPT Voucher - ${voucher.vno}
                </title>

                <style>

                    * {
                        box-sizing: border-box;
                    }

                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 30px;
                        color: #000;
                        background: #000;
                    }

                    .voucher {
                        width: 800px;
                        max-width: 100%;
                        margin: auto;
                        border: 1px solid #000;
                        padding: 25px;
                    }

                    .header {
                        text-align: center;
                        margin-bottom: 25px;
                    }

                    .company {
                        font-size: 34px;
                        font-weight: bold;
                        margin-bottom: 8px;
                    }

                    .title {
                        font-size: 20px;
                        font-weight: bold;
                        text-decoration: underline;
                        margin-top: 8px;
                    }

                    .info {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 0;
                        border: 1px solid #000;
                        margin-bottom: 15px;
                    }

                    .info-row {
                        display: flex;
                        padding: 8px;
                        // border-bottom: 1px solid #000;
                    }

                    .info-row:nth-child(odd) {
                        border-right: 1px solid #000;
                    }

                    .label {
                        font-weight: bold;
                        width: 110px;
                    }

                    .value {
                        flex: 1;
                    }

                    .full-row {
                        grid-column: 1 / 3;
                        border-right: none !important;
                    }

                    .narration {
                        border: 1px solid #000000;
                        padding: 10px;
                        min-height: 55px;
                        margin-bottom: 15px;
                    }

                    .narration-label {
                        font-weight: bold;
                        margin-bottom: 5px;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                    }

                    th {
                        border: 1px solid #000;
                        padding: 9px;
                        text-align: center;
                        background: #f2f2f2;
                    }

                    td {
                        border: 1px solid #000;
                        padding: 9px;
                    }

                    .amount {
                        text-align: right;
                        width: 150px;
                    }

                    .total td {
                        font-weight: bold;
                    }

                    .signatures {
                        display: flex;
                        justify-content: space-between;
                        margin-top: 80px;
                    }

                    .signature {
                        width: 180px;
                        text-align: center;
                        border-top: 1px solid #000;
                        padding-top: 7px;
                        
                    }

                    @media print {

                        body {
                            padding: 0;
                        }

                        .voucher {
                            width: 100%;
                            border: 1px solid #000;
                        }

                        @page {
                            size: A4;
                            margin: 10mm;
                            margin-top:6px;
                        }

                    }

                </style>

            </head>


            <body>

                <div class="voucher">

                    <!-- HEADER -->

                    <div class="header">

                        <div class="header">

    <div class="company">
        ${company.company_name || ""}
    </div>

    <div class="company-info">
        ${company.address || ""}
    </div>

    <div class="company-info">
        Phone: ${company.phone || ""}
        ${company.email ? ` | Email: ${company.email}` : ""}
    </div>

    ${
        company.website
            ? `<div class="company-info">${company.website}</div>`
            : ""
    }

    <div class="title">
        BANK RECEIPT VOUCHER
    </div>

</div>


                    <!-- VOUCHER INFORMATION -->

                    <div class="info">

                        <div class="info-row">

                            <span class="label">
                                Voucher No:
                            </span>

                            <span class="value">
                                ${voucher.vno || ""}
                            </span>

                        </div>


                        <div class="info-row">

                            <span class="label">
                                Voucher Date:
                            </span>

                            <span class="value">
                                ${formatPrintDate(voucher.voucher_date)}
                            </span>

                        </div>


                        <div class="info-row">

                            <span class="label">
                                Cheque No:
                            </span>

                            <span class="value">
                                ${voucher.chq_no || ""}
                            </span>

                        </div>


                        <div class="info-row">

                            <span class="label">
                                Cheque Date:
                            </span>

                            <span class="value">
                                ${formatPrintDate(voucher.chq_date)}
                            </span>

                        </div>


                        <div class="info-row">

                            <span class="label">
                                File No:
                            </span>

                            <span class="value">
                                ${voucher.file_no || ""}
                            </span>

                        </div>


                        <div class="info-row">

                            <span class="label">
                                Bill No:
                            </span>

                            <span class="value">
                                ${voucher.bill_no || ""}
                            </span>

                        </div>

                    </div>


                    <!-- NARRATION -->

                    <div class="narration">

                        <div class="narration-label">
                            Narration:
                        </div>

                        ${voucher.narration || ""}

                    </div>


                    <!-- ACCOUNT TABLE -->

                    <table>

                        <thead>

                            <tr>

                                <th>
                                    Account
                                </th>

                                <th>
                                    Debit
                                </th>

                                <th>
                                    Credit
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            ${accountRows}


                            <tr class="total">

                                <td>
                                    TOTAL
                                </td>

                                <td class="amount">

                                    ${accounts
                                        .reduce(
                                            (sum, item) =>
                                                sum + Number(item.DEBIT || 0),
                                            0
                                        )
                                        .toLocaleString()
                                    }

                                </td>

                                <td class="amount">

                                    ${accounts
                                        .reduce(
                                            (sum, item) =>
                                                sum + Number(item.CREDIT || 0),
                                            0
                                        )
                                        .toLocaleString()
                                    }

                                </td>

                            </tr>

                        </tbody>

                    </table>


                    <!-- SIGNATURES -->

                    <div class="signatures">

                        <div class="signature">
                            Prepared By
                        </div>

                        <div class="signature">
                            Checked By
                        </div>

                        <div class="signature">
                            Approved By
                        </div>

                    </div>

                </div>


                <script>

                    window.onload = function () {

                        window.print();

                    };

                </script>


            </body>

            </html>

        `);

        printWindow.document.close();

    } catch (error) {

        console.error("Print error:", error);

        Swal.fire(
            "Error",
            error.response?.data?.message ||
            "Unable to print voucher",
            "error"
        );

    }

};

const formatPrintDate = (date) => {
    if (!date) return "";

    const d = new Date(date);

    if (isNaN(d.getTime())) return "";

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
};
    // =====================================================
    // RESET / CANCEL
    // =====================================================

    const resetForm = () => {

        form.resetFields();

        setEditingVno(null);

        loadNextVoucher();

        setShowAddAccount(false);
        setShowLessAccount(false);

        form.setFieldsValue({

            post_date: dayjs(),

            voucher_date: dayjs(),

            chq_date: dayjs(),

            amount: 0,

            add_amount: 0,

            sub_amount: 0,

            less_amount: 0,

            net_amount: 0
        });
    };


    // =====================================================
    // TABLE COLUMNS
    // =====================================================

    const columns = [

        {
            title: "Voucher #",
            dataIndex: "vno",
            key: "vno",
            width: 100,
        },

        // {
        //     title: "Post Date",
        //     dataIndex: "post_date",
        //     key: "post_date",
        //     width: 120,

        //     render: (date) => {

        //         if (!date) return "";

        //         return dayjs(date).format(
        //             "DD-MM-YYYY"
        //         );
        //     }
        // },

        {
            title: "Voucher Date",
            dataIndex: "voucher_date",
            key: "voucher_date",
            width: 120,

            render: (date) => {

                if (!date) return "";

                return dayjs(date).format(
                    "DD-MM-YYYY"
                );
            }
        },

        {
            title: "Cheque No",
            dataIndex: "chq_no",
            key: "chq_no",
            width: 170,
        },

        {
            title: "Bill No",
            dataIndex: "bill_no",
            key: "bill_no",
            width: 150,
            
        },

        {
            title: "Amount",
            dataIndex: "net_amount",
            key: "net_amount",
            width: 130,
            align: "center",

            render: (amount) => {

                return Number(
                    amount || 0
                ).toLocaleString();
            }
        },

        {
            title: "Narration",
            dataIndex: "narration",
            key: "narration"
        },

        {
            title: "Action",
            key: "action",
            width: 140,

            fixed: "right",

            render: (_, record) => (

                <Space>

                    <Button
                        type="primary"
                        size="small"
                        onClick={() =>
                            handleEdit(record)
                        }
                    >
                        Edit
                    </Button>


                    <Button
                        danger
                        size="small"
                        onClick={() =>
                            handleDelete(record)
                        }
                    >
                        Delete
                    </Button>
                    
                    <Button
                        type="primary"
                        size="small"
                        onClick={() => handlePrint(record)}
                    >
                        Print
                    </Button>

                </Space>
            )
        }
    ];


    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div
            style={{
                padding: "20px",
                background: "#f5f5f5",
                minHeight: "100vh"
            }}
        >

            {/* =================================================
                FORM
            ================================================= */}

            <Card
                title={
                    editingVno
                        ? `Edit BANK RECEIPT - ${vno}`
                        : `BANK RECEIPT - ${vno}`
                }

                style={{
                    marginBottom: "20px"
                }}
            >

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}

                    initialValues={{
                        post_date: dayjs(),
                        voucher_date: dayjs(),
                        chq_date: dayjs(),
                        amount: 0,
                        add_amount: 0,
                        sub_amount: 0,
                        less_amount: 0,
                        net_amount: 0
                    }}
                >

                    {/* =========================================
                        FIRST ROW
                    ========================================= */}

                    <Row gutter={16}>

                        <Col
                            xs={12}
                            sm={6}
                            md={3}
                        >

                            <Form.Item
                                label="Voucher No"
                            >

                                <Input
                                    value={vno}
                                    disabled
                                />

                            </Form.Item>

                        </Col>

                        {/* // Post Date Hidden */}
                        {/* <Col
                            xs={24}
                            sm={12}
                            md={6}
                        > */}
                            
                            <Form.Item
                                hidden
                                label="Post Date"
                                name="post_date"
                                
                                rules={[
                                    {
                                        required: true,
                                        
                                        message:
                                            "Please select post date"
                                    }
                                ]}
                            >

                                <DatePicker
                                    
                                    format="DD-MM-YYYY"
                                    style={{
                                        width: "100%",
                                        
                                    }}
                                />

                            </Form.Item>

                        {/* </Col> */}

                        {/* voucher date */}
                        <Col
                            xs={24}
                            sm={12}
                            md={6}
                        >

                            <Form.Item
                                label="Voucher Date"
                                name="voucher_date"

                                rules={[
                                    {
                                        required: true,
                                        message:
                                            "Please select voucher date"
                                    }
                                ]}
                            >

                                <DatePicker
                                    format="DD-MM-YYYY"
                                    style={{
                                        width: "100%"
                                    }}
                                />

                            </Form.Item>

                        </Col>

                        {/* cheq date */}
                        <Col
                            xs={24}
                            sm={12}
                            md={6}
                        >

                            <Form.Item
                                label="Cheque Date"
                                name="chq_date"
                                
                                      rules={[
                                    {
                                        required: true,
                                        message:
                                            "Please select Chq date"
                                    }
                                ]}
                            >

                                <DatePicker
                                    format="DD-MM-YYYY"
                                    style={{
                                        width: "100%"
                                    }}
                                />

                            </Form.Item>

                        </Col>
                        
                        {/* file no */}
                        <Col
                            xs={25}
                            md={9}
                        >

                            <Form.Item
                                label="File No"
                                name="file_no"
                            >

                                <Input />

                            </Form.Item>

                        </Col>
                    </Row>


                    {/* =========================================
                        ACCOUNT ROW
                    ========================================= */}

                    <Row gutter={16}>
                        {/* // Party Debit   */}
                        <Col
                            xs={24}
                            md={8}
                        >

                            <Form.Item
                                label="Debit Account"
                                name="sa_id"

                                rules={[
                                    {
                                        required: true,
                                        message:
                                            "Please select debit account"
                                    }
                                ]}
                            >

                                <Select
                                    showSearch
                                    placeholder="Select debit account"

                                    optionFilterProp="label"

                                    options={
                                        getSa.map(
                                            item => ({
                                                value:
                                                    item.Sa_ID,

                                                label:
                                                    item.SA_Name
                                         })
                                        )
                                    }
                                />

                            </Form.Item>

                        </Col>

                        {/* //Bank Account */}
                        <Col
                            xs={24}
                            md={8}
                        >

                            <Form.Item
                                label="Bank Account"
                                name="bank_id"

                                rules={[
                                    {
                                        required: true,
                                        message:
                                            "Please select bank"
                                    }
                                ]}
                            >

                                <Select
                                    showSearch
                                    placeholder="Select bank"

                                    optionFilterProp="label"

                                    options={
                                        banks.map(
                                            item => ({
                                                value:
                                                    item.Sa_ID,

                                                label:
                                                    item.SA_Name
                                            })
                                        )
                                    }
                                />

                            </Form.Item>

                        </Col>

                        {/* //chq no */}
                        <Col
                            xs={24}
                            md={8}
                        >

                            <Form.Item
                                label="Cheque No"
                                name="chq_no"
                            >

                                <Input
                                    placeholder="Cheque number"
                                />

                            </Form.Item>

                        </Col>

                    </Row>


                    {/* =========================================
                        REFERENCE ROW
                    ========================================= */}

                    <Row gutter={16}>
                        {/* // bill no */}
                        <Col
                            xs={24}
                            md={8}
                        >

                            <Form.Item
                                label="Bill No"
                                name="bill_no"
                            >

                                <Input />

                            </Form.Item>

                        </Col>

                        

                        {/* Naration */}
                        <Col
                            xs={36}
                            md={16}
                        >

                            <Form.Item
                                label="Narration"
                                name="narration"
                            >

                                <Input />

                            </Form.Item>

                        </Col>

                    </Row>


                    {/* =========================================
                        AMOUNT ROW
                    ========================================= */}

                    <Row gutter={16}>

                        <Col
                            xs={24}
                            sm={12}
                            md={4}
                        >

                            <Form.Item
                                label="Amount"
                                name="amount"
                                
                            >

                                <InputNumber
                                    min={0}
                                    control={false}
                                    style={{
                                        width: "100%"
                                    }}

                                    onChange={
                                        calculateNetAmount
                                    }
                                />

                            </Form.Item>

                        </Col>


                        <Col
                            xs={24}
                            sm={12}
                            md={4}
                        >

                            <Form.Item
                                label="Add Amount"
                                name="add_amount"
                                control={false}
                            >

                                <InputNumber
                                    min={0}
                                    onKeyDown={(e)=>{
                                        if(e.key === "Tab") {

                                            const value = e.target.value;

                                            if(value && parseFloat(value) > 0)
                                                setShowAddAccount(true);
                                            setTimeout(()=>{
                                                addAccountRef.current?.focus();;
                                            },100);
                                        }
                                        
                                    }}
                                      onChange={(value) => {

                                        // Keep your calculation
                                        calculateNetAmount(value);

                                        // If Add Amount is removed/zero
                                        if (!value || Number(value) <= 0) {

                                            // Remove selected account
                                            form.setFieldValue("add_amount_sa_id", null);

                                            // Hide account Select
                                            setShowAddAccount(false);
                                        }
                                    }}
                                    style={{
                                        width: "100%"
                                    }}

                                    // onChange={
                                    // calculateNetAmount
                                    // }
                                />

                            </Form.Item>

                        </Col>


                        <Col
                            xs={24}
                            sm={12}
                            md={4}
                        >

                            <Form.Item
                                label="Sub Amount"
                                name="sub_amount"
                                control={false}
                                readOnly
                            >

                                <InputNumber
                                    disabled
                                    min={0}
                                    style={{
                                        width: "100%"
                                    }}

                                    onChange={
                                        calculateNetAmount
                                    }
                                />

                            </Form.Item>

                        </Col>


                        <Col
                            xs={24}
                            sm={12}
                            md={4}
                        >

                            <Form.Item
                                label="Less Amount"
                                name="less_amount"
                                control={false}
                                >

                                <InputNumber
                                   ref={addAccountToLess}
                                    onKeyDown={(e)=>{
                                        if(e.key === "Tab") {

                                            const value = e.target.value;

                                            if(value && parseFloat(value) > 0)
                                                setShowLessAccount(true);
                                            setTimeout(()=>{
                                                lessToAccount.current?.focus();;
                                            },100);
                                        }
                                        
                                    }}
                                      onChange={(value) => {

                                        // Keep your calculation
                                        calculateNetAmount(value);

                                        // If Add Amount is removed/zero
                                        if (!value || Number(value) <= 0) {

                                            // Remove selected account
                                            form.setFieldValue("less_amount_sa_id", null);

                                            // Hide account Select
                                            setShowLessAccount(false);
                                        }
                                    }}
                                    style={{
                                        width: "100%"
                                    }}

                                    // onChange={
                                    // calculateNetAmount
                                    // }
                                />


                            </Form.Item>

                        </Col>


                        <Col
                            xs={24}
                            sm={12}
                            md={4}
                        >

                            <Form.Item
                                label="Net Amount"
                                name="net_amount"
                                control={false}
                                readonly
                            >

                                <InputNumber
                                    disabled
                                    style={{
                                        width: "100%"
                                    }}
                                />

                            </Form.Item>

                        </Col>

                    </Row>
 {/* =========================================
            Add and Less Accounts
     ========================================= */}

                    <Row gutter={16}>
                        {/* // Party Debit   */}
                        <Col
                            xs={24}
                            md={8}
                        >
        {showAddAccount && (
            <Form.Item
                label="Add Amount Account"
                name="add_amount_sa_id"
                
                onKeyDown={(e)=>{
                      if(e.key === "Tab") {
                
                setTimeout(()=>{
                    addAccountToLess.current?.focus();;
                },100);
            }
        }}
                rules={[
                    {
                        required: true,
                        message: "Please select account"
                    }
                ]}
    >
    <Select
     ref={addAccountRef}
     
                                    showSearch
                                    placeholder="Select debit account"

                                    optionFilterProp="label"

                                    options={
                                        getSa.map(
                                            item => ({
                                                value:
                                                    item.Sa_ID,

                                                label:
                                                    item.SA_Name
                                         })
                                        )
                                    }
                                />
                                
                    </Form.Item>
                )}

                        </Col>

                        {/* //Bank Account */}
                        <Col
                            xs={24}
                            md={8}
                        >
{showLessAccount && (
            <Form.Item
                label="Less Amount Account"
                name="less_amount_sa_id"
                onKeyDown={(e)=>{
                if(e.key === "Tab") {
                
                // setTimeout(()=>{
                //     addAccountToLess.current?.focus();;
                // },100);
            }
        }}
                rules={[
                    {
                        required: true,
                        message: "Please select account"
                    }
                ]}
    >
    <Select
     ref={lessToAccount}
     
                                    showSearch
                                    placeholder="Select debit account"

                                    optionFilterProp="label"

                                    options={
                                        getSa.map(
                                            item => ({
                                                value:
                                                    item.Sa_ID,

                                                label:
                                                    item.SA_Name
                                         })
                                        )
                                    }
                                />
                                
                    </Form.Item>
                )}
                  
                        </Col>


                    </Row>

                    {/* =========================================
                        BUTTONS
                    ========================================= */}

                    <Form.Item>

                        <Space>

                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                            >

                                {editingVno
                                    ? "Update"
                                    : "Save"}

                            </Button>


                            <Button
                                onClick={resetForm}
                            >

                                {editingVno
                                    ? "Cancel"
                                    : "Reset"}

                            </Button>

                        </Space>

                    </Form.Item>

                </Form>

            </Card>


            {/* =================================================
                VOUCHER TABLE
            ================================================= */}

            <Card
   title={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>BANK RECEIPT Vouchers</span>
            <Input
             prefix={<SearchOutlined />}
                placeholder="Search By Voucher #"
                value={searchVoucher}
                onChange={(e) => setSearchVoucher(e.target.value)}
                allowClear
                style={{ width: 220 }}
            />
            <Input
             prefix={<SearchOutlined />}
                placeholder="Search Cheque No"
                value={searchCheque}
                onChange={(e) => setSearchCheque(e.target.value)}
                allowClear
                style={{ width: 220 }}
            />
        </div>
    }
>

                <Table
                    
                    bordered

                    loading={tableLoading}

                    columns={columns}

                    dataSource={filteredData}

                    rowKey="VNO"

                    // pagination = {true}

                    tableLayout="auto"
                    scroll={{
                        x: "max-content"
                    }}

                    pagination={{
                        pageSize: 20,

                        showSizeChanger: true,

                        showTotal: (
                            total,
                            range
                        ) =>
                            `${range[0]}-${range[1]} of ${total}`
                    }}

                    // Highlight currently editing voucher
                    rowClassName={(record) => {

                        if (
                            editingVno &&
                            record.VNO === editingVno
                        ) {

                            return "bank-receipt-editing-row";
                        }

                        return "";
                    }}
                />

            </Card>

        </div>
    );
};

export default BankReceipt;