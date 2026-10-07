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

const CashReceipt = () => {

    const [form] = Form.useForm();

    const [vno, setVno] = useState("");

    const [tableData, setTableData] = useState([]);

    const [subsidiaryAccounts, setSubsidiaryAccounts] = useState([]);

    const [getSa , setGetSa] = useState([]);

    const [cashAccount, setCashAccount] = useState([]);

    const [loading, setLoading] = useState(false);

    const [tableLoading, setTableLoading] = useState(false);

    const [editingVno, setEditingVno] = useState(null);


    const [searchFileNo, setSearchFileNo] = useState("");

    const [searchVoucher, setSearchVoucher] = useState("");

   
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
        String(item.file_no || "")
        .toLowerCase()
        .includes(searchFileNo.toLowerCase())
);
    // =====================================================
    // GET NEXT VOUCHER
    // =====================================================

    const loadNextVoucher = async () => {

        try {

            const response = await axios.get(
                "/api/cash-receipt/next-vno"
            );

            setVno(response.data.vno);

        } catch (error) {

           // console.error(error);

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

            const cashResponse = await axios.get(
                "/api/cash"
            );

            setGetSa(
                saResponse.data
            );

            setCashAccount(
                cashResponse.data
            );

        } catch (error) {

            // console.error(
            //     "Account loading error:",
            //     error
            // );
        }
    };


    // =====================================================
    // LOAD TABLE
    // =====================================================

    const loadTable = async () => {

        try {

            setTableLoading(true);

            const response = await axios.get(
                "/api/cash-receipt-list"
            );
            
          //  console.log("Getting Cash Receipt List", response);
            
            setTableData(response.data);

        } catch (error) {

           // console.error(error);

            Swal.fire(
                "Error",
                "Unable to load Cash Receipt vouchers",
                "error"
            );

        } finally {

            setTableLoading(false);
        }
    };


    // =====================================================
    // SAVE / UPDATE
    // =====================================================

    const handleSubmit = async (values) => {

        //console.log("VALUES:", values);

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

                sa_id:
                    values.sa_id,

                cash_sa_id:
                    values.cash_sa_id,

                
                file_no:
                    values.file_no || "",

                bill_no:
                    values.bill_no || "",

                narration:
                    values.narration || "",

                amount:
                    Number(values.amount || 0),

                
            };


            // =============================================
            // UPDATE
            // =============================================

            if (editingVno) {

                await axios.put(
                    `/api/cash-receipt/${editingVno}`,
                    payload
                );


                await Swal.fire(
                    "Updated",
                    "Cash Receipt updated successfully",
                    "success"
                );

            }

            // =============================================
            // SAVE
            // =============================================

            else {

                await axios.post(
                    "/api/cash-receipt",
                    payload
                );


                await Swal.fire(
                    "Saved",
                    "Cash Receipt saved successfully",
                    "success"
                );
            }


            resetForm();

            loadTable();


        } catch (error) {

            // console.error(
            //     "Save/Update error:",
            //     error
            // );

            Swal.fire(
                "Error",
                error.response?.data?.message ||
                "Unable to save Cash RECEIPT",
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
            resetForm();
            const response = await axios.get(
        `/api/cash-receipt/${record.vno}`
            
    );
                    
            const item = response.data;
            
            // console.log("Fetching Data for update", item);

            // Keep voucher highlighted / editing
            setEditingVno(record.vno);

            setVno(record.vno);
            
            form.setFieldsValue({
            
                 
                post_date:
                    item.post_date
                        ? dayjs(item.post_date)
                        : null,

                voucher_date:
                    item.voucher_date
                        ? dayjs(item.voucher_date)
                        : null,

            

                sa_id:
                    item.sa_id,

                cash_sa_id:
                    item.cash_sa_id,

                file_no:
                    item.file_no || "",

                bill_no:
                    item.bill_no || "",

                narration:
                    item.narration || "",

                amount:
                    Number(item.amount || 0),

            });
 
        } catch (error) {

            // console.error(error);

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
            `/api/cash-receipt/${vno}`
        );


        await Swal.fire(
            "Deleted",
            "Cash Receipt deleted successfully",
            "success"
        );


        if (editingVno === vno) {
            resetForm();
        }


        loadTable();


    } catch (error) {

        // console.error("Delete Error:", error);

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
                `/api/cash-receipt/print/${record.vno}`
            ),
            axios.get(
                "/api/company-profile"
            )
        ]);

        const voucher = voucherResponse.data.voucher;
        const accounts = voucherResponse.data.accounts;

        const company = companyResponse.data;

        // console.log("COMPANY:", company);
        // console.log("VOUCHER:", voucher);
        // console.log("ACCOUNTS:", accounts);

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
                    Cash Receipt Voucher - ${voucher.vno}
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
        CASH RECEIPT VOUCHER
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

        // console.error("Print error:", error);

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

        form.setFieldsValue({

            post_date: dayjs(),

            voucher_date: dayjs(),

            amount: 0,

        });
    };


    // =====================================================
    // FORM COLUMNS
    // =====================================================

    const columns = [

        {
            title: "Voucher #",
            dataIndex: "vno",
            key: "vno",
            width: 100,
        },

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
            title: "File No",
            dataIndex: "file_no",
            key: "file_no",
            width: 150,
            
        },

                {
            title: "Bill No",
            dataIndex: "bill_no",
            key: "bill_no",
            width: 150,
            
        },
        {
            title: "Narration",
            dataIndex: "narration",
            key: "narration"
        },
        {
            title: "Amount",
            dataIndex: "amount",
            key: "amount",
            width: 130,
            align: "center",

            render: (amount) => {

                return Number(
                    amount || 0
                ).toLocaleString();
            }
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
                        ? `Edit Cash Receipt - ${vno}`
                        : `Cash Receipt - ${vno}`
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
                        amount: 0,
                        
                    }}
                >

                    {/* =========================================
                        FIRST ROW
                    ========================================= */}

                    <Row gutter={16}>

                        <Col
                            xs={24}
                            md={8}
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
                            md={8}
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

                        
                         {/* file no */}
                        <Col
                            xs={24}
                            md={8}
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
                     
                        {/* //Cash Account */}
                        <Col
                            xs={24}
                            md={8}
                        >

                            <Form.Item
                                label="Cash Account"
                                name="cash_sa_id"

                                rules={[
                                    {
                                        required: true,
                                        message:
                                            "Please Select Cash Account"
                                    }
                                ]}
                            >

                                <Select
                                    showSearch
                                    placeholder="Select Cash Account"

                                    optionFilterProp="label"

                                    options={
                                        cashAccount.map(
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

                           {/* // Party Debit   */}
                        <Col
                            xs={24}
                            md={8}
                        >

                            <Form.Item
                                label="Credit Account"
                                name="sa_id"

                                rules={[
                                    {
                                        required: true,
                                        message:
                                            "Please select Party Account"
                                    }
                                ]}
                            >

                                <Select
                                    showSearch
                                    placeholder="Select Party Account"

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
                        
                    </Row>


                    {/* =========================================
                        REFERENCE ROW
                    ========================================= */}

                    <Row gutter={16}>
                        {/* Naration */}
                        <Col
                           span={24}
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
                            
                            md={8}
                        >

                            <Form.Item
                                label="Amount"
                                name="amount"
                                
                            >

                                <InputNumber
                                    min={0}
                                    controls={false}
                                    style={{
                                        width: "100%"
                                    }}

                                />

                            </Form.Item>

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
            <span>Cah Payment Vouchers</span>
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
                placeholder="Search by File No"
                value={searchFileNo}
                onChange={(e) => setSearchFileNo(e.target.value)}
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

                            return "cash-receipt-editing-row";
                        }

                        return "";
                    }}
                />

            </Card>

        </div>
    );
};

export default CashReceipt;