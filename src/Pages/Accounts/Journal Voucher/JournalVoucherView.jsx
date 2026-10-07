import React, {
    useEffect,
    useRef,
    useState,
} from "react";

import axios from "axios";
import dayjs from "dayjs";

import {
    Table,
    Typography,
    Divider,
    Spin,
    Button,
    Card,
    Space,
    Row,
    Col,
    Tag,
    message,
} from "antd";

import {
    ArrowLeftOutlined,
    PrinterOutlined,
    FilePdfOutlined,
    EditOutlined,
} from "@ant-design/icons";

import {
    useNavigate,
    useParams,
    useSearchParams,
} from "react-router-dom";


const {
    Title,
    Text,
} = Typography;


const API =
    "/api";


const JournalVoucherView = () => {

    const {
        vno,
    } = useParams();


    const navigate =
        useNavigate();


    const [
        searchParams,
    ] = useSearchParams();


    const [
        voucher,
        setVoucher,
    ] = useState([]);


    const [
        loading,
        setLoading,
    ] = useState(true);


    const [
        printing,
        setPrinting,
    ] = useState(false);


    const printStarted =
        useRef(false);

    // =========================================================
    // LOAD VOUCHER
    // =========================================================

    const loadVoucher = async () => {

        if (!vno) {
            return;
        }

        try {

            setLoading(true);

            const response =
                await axios.get(
                    `${API}/journal-voucher/${encodeURIComponent(vno)}`
                );

            console.log(
                "JV VIEW RESPONSE:",
                response.data
            );


            const data =
                Array.isArray(
                    response.data?.voucher
                )
                    ? response.data.voucher
                    : [];


            setVoucher(data);


            if (!data.length) {

                message.error(
                    "Journal Voucher not found."
                );

            }

        } catch (error) {

            console.error(
                "VIEW JV ERROR:",
                error
            );


            message.error(
                error.response?.data?.message ||
                "Unable to load Journal Voucher."
            );

        } finally {

            setLoading(false);

        }

    };


    // =========================================================
    // INITIAL LOAD
    // =========================================================

    useEffect(() => {

        printStarted.current = false;

        loadVoucher();

    }, [vno]);


    // =========================================================
    // PRINT FUNCTION
    // =========================================================

    const startPrint = () => {

        if (printStarted.current) {
            return;
        }


        printStarted.current = true;

        setPrinting(true);


        console.log(
            "JV PRINT STARTING..."
        );


        /*
         * Give React/browser enough time to
         * finish rendering the complete voucher.
         */

        setTimeout(() => {

            window.focus();


            /*
             * Double requestAnimationFrame makes
             * sure browser has painted the page.
             */

            requestAnimationFrame(() => {

                requestAnimationFrame(() => {

                    console.log(
                        "WINDOW.PRINT()"
                    );


                    window.print();


                    setPrinting(false);

                });

            });

        }, 500);

    };


    // =========================================================
    // AUTO PRINT
    // =========================================================

    useEffect(() => {

        if (loading) {
            return;
        }


        if (!voucher.length) {
            return;
        }


        const printMode =
            searchParams.get("print") === "1";


        const pdfMode =
            searchParams.get("pdf") === "1";


        console.log(
            "JV PRINT CHECK:",
            {
                loading,
                voucherLength:
                    voucher.length,
                printMode,
                pdfMode,
                vno,
            }
        );


        if (
            !printMode &&
            !pdfMode
        ) {

            return;

        }


        const filename =
            searchParams.get(
                "filename"
            ) ||
            `Journal_Voucher_${vno}_${dayjs().format("DD-MM-YYYY")}`;


        document.title =
            filename;


        /*
         * Important:
         * Wait until the actual voucher DOM
         * has been rendered.
         */

        const timer =
            setTimeout(() => {

                startPrint();

            }, 1000);


        return () => {

            clearTimeout(timer);

        };

    }, [
        loading,
        voucher.length,
        vno,
        searchParams,
    ]);


    // =========================================================
    // MANUAL PRINT
    // =========================================================

    const handlePrint = () => {

        printStarted.current = false;

        startPrint();

    };


    // =========================================================
    // EDIT
    // =========================================================

    const handleEdit = () => {

        navigate(
            `/journalvoucherentry/${encodeURIComponent(vno)}`
        );

    };


    // =========================================================
    // DATA
    // =========================================================

    const firstRow =
        voucher[0] || {};


    const voucherDate =
        firstRow.VDT
            ? dayjs(
                firstRow.VDT
            ).format(
                "DD-MM-YYYY"
            )
            : "";


    const fileNo =
        firstRow.FILE_NO ||
        "";


    const totalDebit =
        voucher.reduce(
            (total, row) =>
                total +
                Number(
                    row.DEBIT || 0
                ),
            0
        );


    const totalCredit =
        voucher.reduce(
            (total, row) =>
                total +
                Number(
                    row.CREDIT || 0
                ),
            0
        );


    const difference =
        totalDebit -
        totalCredit;


    // =========================================================
    // TABLE COLUMNS
    // =========================================================

    const columns = [

        {
            title: "#",

            width: 50,

            align: "center",

            render: (
                _,
                __,
                index
            ) =>
                index + 1,

        },


        {
            title: "Account",

            dataIndex:
                "Sa_Name",

            width: 230,

            render: (value) =>
                value || "",

        },


        {
            title: "Description",

            dataIndex:
                "NARRATION",

            width: 300,

            render: (value) =>
                value || "",

        },


        {
            title: "Cheque No.",

            dataIndex:
                "CHQ_NO",

            width: 120,

            render: (value) =>
                value || "",

        },


        {
            title: "Debit",

            dataIndex:
                "DEBIT",

            width: 130,

            align: "right",

            render: (value) =>
                Number(
                    value || 0
                ).toFixed(2),

        },


        {
            title: "Credit",

            dataIndex:
                "CREDIT",

            width: 130,

            align: "right",

            render: (value) =>
                Number(
                    value || 0
                ).toFixed(2),

        },

    ];


    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {

        return (

            <div
                style={{
                    minHeight: "70vh",
                    display: "flex",
                    justifyContent:
                        "center",
                    alignItems:
                        "center",
                }}
            >

                <Spin
                    size="large"
                />

            </div>

        );

    }


    // =========================================================
    // RENDER
    // =========================================================

    return (

        <div
            className="journal-voucher-view"
        >

            <Card
                className="print-card"
                bordered={false}
            >

                {/* =================================================
                    ACTIONS
                ================================================= */}

                <div className="no-print">

                    <Row
                        justify="space-between"
                        align="middle"
                    >

                        <Col>

                            <Space>

                                <Button
                                    icon={
                                        <ArrowLeftOutlined />
                                    }
                                    onClick={() =>
                                        navigate(
                                            "/journalvoucher"
                                        )
                                    }
                                >
                                    Back
                                </Button>


                                <Button
                                    icon={
                                        <EditOutlined />
                                    }
                                    onClick={
                                        handleEdit
                                    }
                                >
                                    Edit
                                </Button>

                            </Space>

                        </Col>


                        <Col>

                            <Space>

                                <Button
                                    type="primary"
                                    icon={
                                        <PrinterOutlined />
                                    }
                                    loading={
                                        printing
                                    }
                                    onClick={
                                        handlePrint
                                    }
                                >
                                    Print
                                </Button>


                                <Button
                                    icon={
                                        <FilePdfOutlined />
                                    }
                                    loading={
                                        printing
                                    }
                                    onClick={
                                        handlePrint
                                    }
                                >
                                    PDF
                                </Button>

                            </Space>

                        </Col>

                    </Row>

                </div>


                <Divider
                    className="no-print"
                />


                {/* =================================================
                    HEADER
                ================================================= */}

                <div
                    className="voucher-header"
                >

                    <Title
                        level={2}
                        style={{
                            textAlign:
                                "center",
                            marginBottom: 4,
                        }}
                    >
                        JOURNAL VOUCHER
                    </Title>


                    <div
                        style={{
                            textAlign:
                                "center",
                        }}
                    >

                        <Tag color="blue">
                            {vno}
                        </Tag>

                    </div>


                    <Divider />


                    <Row>

                        <Col span={8}>

                            <Text strong>
                                Voucher No:
                            </Text>

                            <br />

                            <Text>
                                {vno}
                            </Text>

                        </Col>


                        <Col
                            span={8}
                            style={{
                                textAlign:
                                    "center",
                            }}
                        >

                            <Text strong>
                                Date:
                            </Text>

                            <br />

                            <Text>
                                {voucherDate}
                            </Text>

                        </Col>


                        <Col
                            span={8}
                            style={{
                                textAlign:
                                    "right",
                                     paddingRight: 20,
                            }}
                        >

                            <Text strong>
                                File No:
                            </Text>

                            <br />

                            <Text>
                                {fileNo}
                            </Text>

                        </Col>

                    </Row>

                </div>


                <Divider />


                {/* =================================================
                    TABLE
                ================================================= */}

                <Table
                    className="voucher-table"
                    bordered
                    size="small"
                    pagination={false}
                    rowKey={(
                        record,
                        index
                    ) =>
                        record.MASTER_ID ||
                        index
                    }
                    columns={
                        columns
                    }
                    dataSource={
                        voucher
                    }
                />


                {/* =================================================
                    TOTAL
                ================================================= */}

                <Row
                    justify="end"
                    style={{
                        marginTop: 10,
                    }}
                >

                    <Col
                        xs={24}
                        md={9}
                    >

                        <div
                            className="total-box"
                        >

                            <Row
                                justify="space-between"
                            >

                                <Text strong>
                                    Total Debit
                                </Text>

                                <Text strong>
                                    {
                                        totalDebit.toFixed(
                                            2
                                        )
                                    }
                                </Text>

                            </Row>


                            <Row
                                justify="space-between"
                            >

                                <Text strong>
                                    Total Credit
                                </Text>

                                <Text strong>
                                    {
                                        totalCredit.toFixed(
                                            2
                                        )
                                    }
                                </Text>

                            </Row>


                            <Divider
                                style={{
                                    margin:
                                        "6px 0",
                                }}
                            />


                            <Row
                                justify="space-between"
                            >

                                <Text strong>
                                    Difference
                                </Text>

                                <Text
                                    strong
                                    type={
                                        Math.abs(
                                            difference
                                        ) < 0.001
                                            ? "success"
                                            : "danger"
                                    }
                                >
                                    {
                                        difference.toFixed(
                                            2
                                        )
                                    }
                                </Text>

                            </Row>

                        </div>

                    </Col>

                </Row>


                {/* =================================================
                    NARRATION
                ================================================= */}

                <div
                    style={{
                        marginTop: 25,
                    }}
                >

                    <Text strong>
                        Narration:
                    </Text>


                    <div
                        style={{
                            marginTop: 6,
                            minHeight: 30,
                        }}
                    >

                        {
                            firstRow.NARRATION ||
                            ""
                        }

                    </div>

                </div>


                {/* =================================================
                    SIGNATURES
                ================================================= */}

                <div
                    className="signature-area"
                >

                    <div>
                        Prepared By
                    </div>


                    <div>
                        Checked By
                    </div>


                    <div>
                        Approved By
                    </div>

                </div>

            </Card>


            {/* =====================================================
                PRINT CSS
            ===================================================== */}

           <style>
    {`

        /* =====================================================
           SCREEN
        ===================================================== */

        .journal-voucher-view {
            min-height: 100vh;
            background: #f5f5f5;
            padding: 24px;
        }


        .print-card {
            width: 100%;
            max-width: 1100px;
            margin: 0 auto;
            background: #fff;
        }


        .voucher-header {
            width: 100%;
        }


        .voucher-table {
            width: 100%;
        }


        .voucher-table .ant-table {
            font-size: 12px;
        }


        .voucher-table
        .ant-table-thead
        > tr
        > th {

            text-align: center;
            font-weight: 700;
            white-space: nowrap;

        }


        .voucher-table
        .ant-table-tbody
        > tr
        > td {

            padding: 6px 8px;

        }


        .total-box {

            border:
                1px solid #d9d9d9;

            padding:
                10px 14px;

            background:
                #fff;

        }


        .signature-area {

            margin-top: 65px;

            display: flex;

            justify-content:
                space-between;

            align-items:
                flex-start;

            gap: 60px;

            padding:
                0 30px;

        }


        .signature-area > div {

            width: 180px;

            text-align: center;

            border-top:
                1px solid #000;

            padding-top:
                6px;

        }


        /* =====================================================
           PRINT
        ===================================================== */

        @media print 
        {

            /* -------------------------------------------------
               PAGE
            ------------------------------------------------- */

            @page {

                size: A4 portrait;

                margin: 10mm;

            }


            /* -------------------------------------------------
               REMOVE BODY SPACE
            ------------------------------------------------- */

            html,
            body {

                margin: 0 !important;

                padding: 0 !important;

                width: 100% !important;

                min-height: 0 !important;

                background:
                    #fff !important;

            }


            /* -------------------------------------------------
               HIDE EVERYTHING FIRST
               This hides Navbar, Sidebar, MyAdmin,
               Username, Logo, etc.
            ------------------------------------------------- */

            body * {

                visibility:
                    hidden !important;

            }


            /* -------------------------------------------------
               SHOW ONLY JOURNAL VOUCHER
            ------------------------------------------------- */

            .journal-voucher-view,
            .journal-voucher-view * {

                visibility:
                    visible !important;

            }


            /* -------------------------------------------------
               MOVE JOURNAL VOUCHER TO TOP
            ------------------------------------------------- */

            .journal-voucher-view {

                position:
                    absolute !important;

                left:
                    0 !important;

                top:
                    0 !important;

                width:
                    100% !important;

                min-height:
                    auto !important;

                margin:
                    0 !important;

                padding:
                    0 !important;

                background:
                    #fff !important;

            }


            /* -------------------------------------------------
               CARD
            ------------------------------------------------- */

            .print-card {

                position:
                    relative !important;

                width:
                    100% !important;

                max-width:
                    none !important;

                margin:
                    0 !important;

                padding:
                    0 !important;

                border:
                    none !important;

                box-shadow:
                    none !important;

                background:
                    #fff !important;

            }


            /* -------------------------------------------------
               ANT CARD BODY
            ------------------------------------------------- */

            .print-card
            .ant-card-body {

                padding:
                    0 !important;

                margin:
                    0 !important;

            }


            /* -------------------------------------------------
               HIDE ACTIONS
            ------------------------------------------------- */

            .no-print {

                display:
                    none !important;

                visibility:
                    hidden !important;

            }


            /* -------------------------------------------------
               TITLE
            ------------------------------------------------- */

            .voucher-header h1,
            .voucher-header h2,
            .voucher-header h3 {

                color:
                    #000 !important;

            }


            /* -------------------------------------------------
               TABLE
            ------------------------------------------------- */

            .voucher-table {

                width:
                    100% !important;

                margin:
                    0 !important;

            }


            .voucher-table .ant-table {

                width:
                    100% !important;

                font-size:
                    10px !important;

                background:
                    #fff !important;

            }


            .voucher-table
            .ant-table-container {

                width:
                    100% !important;

            }


            .voucher-table
            .ant-table-content {

                overflow:
                    visible !important;

            }


            .voucher-table
            table {

                width:
                    100% !important;

                table-layout:
                    fixed !important;

            }


            /* -------------------------------------------------
               TABLE HEADER
            ------------------------------------------------- */

            .voucher-table
            .ant-table-thead
            > tr
            > th {

                padding:
                    5px 4px !important;

                font-size:
                    10px !important;

                font-weight:
                    700 !important;

                color:
                    #000 !important;

                background:
                    #fff !important;

                border:
                    1px solid #000 !important;

                text-align:
                    center !important;

            }


            /* -------------------------------------------------
               TABLE BODY
            ------------------------------------------------- */

            .voucher-table
            .ant-table-tbody
            > tr
            > td {

                padding:
                    5px 4px !important;

                font-size:
                    10px !important;

                color:
                    #000 !important;

                background:
                    #fff !important;

                border:
                    1px solid #000 !important;

                vertical-align:
                    middle !important;

            }


            /* -------------------------------------------------
               TABLE ROWS
            ------------------------------------------------- */

            .voucher-table
            .ant-table-tbody
            > tr {

                page-break-inside:
                    avoid !important;

            }


            /* -------------------------------------------------
               TOTAL BOX
            ------------------------------------------------- */

            .total-box {

                width:
                    100% !important;

                border:
                    1px solid #000 !important;

                padding:
                    8px 12px !important;

                background:
                    #fff !important;

                color:
                    #000 !important;

            }


            /* -------------------------------------------------
               TOTAL TEXT
            ------------------------------------------------- */

            .total-box
            .ant-typography {

                color:
                    #000 !important;

                font-size:
                    10px !important;

            }


            /* -------------------------------------------------
               NARRATION
            ------------------------------------------------- */

            .journal-voucher-view
            .ant-typography {

                color:
                    #000 !important;

            }


            /* -------------------------------------------------
               DIVIDERS
            ------------------------------------------------- */

            .journal-voucher-view
            .ant-divider {

                border-color:
                    #000 !important;

                margin:
                    7px 0 !important;

            }


            /* -------------------------------------------------
               TAG
            ------------------------------------------------- */

            .journal-voucher-view
            .ant-tag {

                color:
                    #000 !important;

                background:
                    #fff !important;

                border:
                    1px solid #000 !important;

            }


            /* -------------------------------------------------
               SIGNATURES
            ------------------------------------------------- */

            .signature-area {

                margin-top:
                    45px !important;

                display:
                    flex !important;

                justify-content:
                    space-between !important;

                gap:
                    40px !important;

                padding:
                    0 20px !important;

                page-break-inside:
                    avoid !important;

            }


            .signature-area > div {

                width:
                    160px !important;

                text-align:
                    center !important;

                border-top:
                    1px solid #000 !important;

                padding-top:
                    6px !important;

                font-size:
                    10px !important;

                color:
                    #000 !important;

            }


            /* -------------------------------------------------
               REMOVE ANT DESIGN SHADOWS
            ------------------------------------------------- */

            .ant-card,
            .ant-table,
            .ant-table-container {

                box-shadow:
                    none !important;

            }


            /* -------------------------------------------------
               NO SCROLLBARS
            ------------------------------------------------- */

            .ant-table-body,
            .ant-table-content {

                overflow:
                    visible !important;

                max-height:
                    none !important;

            }


            /* -------------------------------------------------
               AVOID PAGE BREAKS
            ------------------------------------------------- */

            .voucher-header {

                page-break-inside:
                    avoid !important;

            }


            .total-box {

                page-break-inside:
                    avoid !important;

            }


            /* -------------------------------------------------
               PRINT COLORS
            ------------------------------------------------- */

            * {

                -webkit-print-color-adjust:
                    exact !important;

                print-color-adjust:
                    exact !important;

            }

        }

    `}
</style>

        </div>

    );

};


export default JournalVoucherView;