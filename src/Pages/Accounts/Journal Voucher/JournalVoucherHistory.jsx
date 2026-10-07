import React, {
    useEffect,
    useMemo,
    useState,
} from "react";

import axios from "axios";
import dayjs from "dayjs";

import {
    Card,
    Table,
    Button,
    Space,
    Input,
    DatePicker,
    Row,
    Col,
    Typography,
    Tag,
    Empty,
    message,
} from "antd";

import {
    PlusOutlined,
    ReloadOutlined,
    EditOutlined,
    EyeOutlined,
    PrinterOutlined,
    FilePdfOutlined,
    SearchOutlined,
} from "@ant-design/icons";

import {
    useNavigate,
} from "react-router-dom";


const {
    Title,
    Text,
} = Typography;


const API =
    "/api";


const JournalVoucherHistory = () => {

    const navigate =
        useNavigate();


    const [
        vouchers,
        setVouchers,
    ] = useState([]);


    const [
        loading,
        setLoading,
    ] = useState(false);


    const [
        searchText,
        setSearchText,
    ] = useState("");


    const [
        selectedDate,
        setSelectedDate,
    ] = useState(null);


    // =========================================================
    // LOAD HISTORY
    // =========================================================

    const loadHistory = async () => {

        try {

            setLoading(true);


            const params = {};


            if (
                searchText.trim()
            ) {

                params.search =
                    searchText.trim();

            }


            if (
                selectedDate
            ) {

                const date =
                    selectedDate.format(
                        "YYYY-MM-DD"
                    );

                params.date_from =
                    date;

                params.date_to =
                    date;

            }


            const response =
                await axios.get(
                    `${API}/journal-vouchers`,
                    {
                        params,
                    }
                );


            const data =
                Array.isArray(
                    response.data
                )
                    ? response.data
                    : [];


            setVouchers(
                data
            );

        } catch (error) {

            console.error(
                "JV HISTORY ERROR:",
                error
            );

            message.error(
                error.response?.data?.message ||
                "Unable to load Journal Voucher history."
            );

            setVouchers([]);

        } finally {

            setLoading(false);

        }

    };


    // =========================================================
    // INITIAL LOAD
    // =========================================================

    useEffect(() => {

        loadHistory();

    }, []);


    // =========================================================
    // FILTER BUTTON
    // =========================================================

    const handleSearch = () => {

        loadHistory();

    };


    // =========================================================
    // CLEAR
    // =========================================================

    const handleClear = () => {

        setSearchText("");

        setSelectedDate(null);


        setTimeout(() => {

            loadHistory();

        }, 0);

    };


    // =========================================================
    // VIEW
    // =========================================================

    const handleView = (
        voucherNo
    ) => {

        navigate(
            `/journalvoucherview/${encodeURIComponent(voucherNo)}`
        );

    };


    // =========================================================
    // EDIT
    // =========================================================

    const handleEdit = (
        voucherNo
    ) => {

        navigate(
            `/journalvoucherentry/${encodeURIComponent(voucherNo)}`
        );

    };


    // =========================================================
    // PRINT
    // =========================================================

    const handlePrint = (
        voucher
    ) => {

        if (!voucher?.VNO) {
            return;
        }


        navigate(
            `/journalvoucherview/${encodeURIComponent(voucher.VNO)}?print=1`
        );

    };


    // =========================================================
    // PDF
    // =========================================================

    const handlePdf = (
        voucher
    ) => {

        if (!voucher?.VNO) {
            return;
        }


        const dateText =
            voucher.VDT
                ? dayjs(
                    voucher.VDT
                ).format(
                    "DD-MM-YYYY"
                )
                : dayjs().format(
                    "DD-MM-YYYY"
                );


        const fileName =
            `JournalVoucher_${voucher.VNO}_${dateText}`;


        navigate(
            `/journalvoucherview/${encodeURIComponent(voucher.VNO)}?pdf=1&filename=${encodeURIComponent(fileName)}`
        );

    };


    // =========================================================
    // SUMMARY
    // =========================================================

    const summary = useMemo(() => {

        const totalDebit =
            vouchers.reduce(
                (sum, row) =>
                    sum +
                    Number(
                        row.TOTAL_DEBIT ||
                        0
                    ),
                0
            );


        const totalCredit =
            vouchers.reduce(
                (sum, row) =>
                    sum +
                    Number(
                        row.TOTAL_CREDIT ||
                        0
                    ),
                0
            );


        return {
            count:
                vouchers.length,

            totalDebit,

            totalCredit,

        };

    }, [vouchers]);


    // =========================================================
    // TABLE COLUMNS
    // =========================================================

    const columns = [

        {
            title: "#",

            width: 55,

            align: "center",

            render: (
                _,
                __,
                index
            ) =>
                index + 1,

        },


        {
            title: "Voucher No.",

            dataIndex:
                "VNO",

            width: 160,

            render: (value) => (

                <Button
                    type="link"
                    style={{
                        padding: 0,
                        fontWeight: 600,
                    }}

                    onClick={() =>
                        handleView(
                            value
                        )
                    }
                >
                    {value}
                </Button>

            ),

        },


        {
            title: "Date",

            dataIndex:
                "VDT",

            width: 120,

            render: (value) => {

                if (!value) {
                    return "";
                }


                const date =
                    dayjs(value);


                return date.isValid()
                    ? date.format(
                        "DD-MM-YYYY"
                    )
                    : value;

            },

        },


        {
            title: "File No.",

            dataIndex:
                "FILE_NO",

            width: 100,

            render: (value) =>
                value || "",

        },


        {
            title: "Accounts",

            dataIndex:
                "ACCOUNTS",

            width: 320,

            ellipsis: true,

            render: (value) =>
                value || "",

        },


        {
            title: "Rows",

            dataIndex:
                "ROW_COUNT",

            width: 80,

            align: "center",

        },


        {
            title: "Total Debit",

            dataIndex:
                "TOTAL_DEBIT",

            width: 140,

            align: "right",

            render: (value) =>

                Number(
                    value || 0
                ).toFixed(2),

        },


        {
            title: "Total Credit",

            dataIndex:
                "TOTAL_CREDIT",

            width: 140,

            align: "right",

            render: (value) =>

                Number(
                    value || 0
                ).toFixed(2),

        },


        {
            title: "Status",

            width: 100,

            align: "center",

            render: (_, record) => {

                const debit =
                    Number(
                        record.TOTAL_DEBIT ||
                        0
                    );


                const credit =
                    Number(
                        record.TOTAL_CREDIT ||
                        0
                    );


                const balanced =
                    Math.abs(
                        debit -
                        credit
                    ) < 0.001;


                return (

                    <Tag
                        color={
                            balanced
                                ? "green"
                                : "red"
                        }
                    >
                        {
                            balanced
                                ? "Balanced"
                                : "Unbalanced"
                        }
                    </Tag>

                );

            },

        },


        {
            title: "Action",

            width: 220,

            fixed: "right",

            render: (_, record) => (

                <Space size="small">

                    <Button
                        size="small"
                        icon={
                            <EyeOutlined />
                        }

                        onClick={() =>
                            handleView(
                                record.VNO
                            )
                        }
                    >
                        View
                    </Button>


                    <Button
                        size="small"
                        icon={
                            <EditOutlined />
                        }

                        onClick={() =>
                            handleEdit(
                                record.VNO
                            )
                        }
                    >
                        Edit
                    </Button>


                    <Button
                        size="small"
                        icon={
                            <PrinterOutlined />
                        }

                        onClick={() =>
                            handlePrint(
                                record
                            )
                        }
                    >
                        Print
                    </Button>


                    <Button
                        size="small"
                        icon={
                            <FilePdfOutlined />
                        }

                        onClick={() =>
                            handlePdf(
                                record
                            )
                        }
                    >
                        PDF
                    </Button>

                </Space>

            ),

        },

    ];


    // =========================================================
    // RENDER
    // =========================================================

    return (

        <div
            style={{
                padding: 16,
                minHeight: "100vh",
                background: "#f5f5f5",
            }}
        >

            <Card>

                {/* =================================================
                    HEADER
                ================================================= */}

                <Row
                    justify="space-between"
                    align="middle"
                    gutter={[
                        16,
                        16
                    ]}
                >

                    <Col>

                        <Title
                            level={3}
                            style={{
                                margin: 0,
                            }}
                        >
                            Journal Voucher History
                        </Title>

                    </Col>


                    <Col>

                        <Space>

                            <Button
                                icon={
                                    <ReloadOutlined />
                                }

                                loading={
                                    loading
                                }

                                onClick={
                                    loadHistory
                                }
                            >
                                Refresh
                            </Button>


                            <Button
                                type="primary"
                                icon={
                                    <PlusOutlined />
                                }

                                onClick={() =>
                                    navigate(
                                        "/journalvoucherentry"
                                    )
                                }
                            >
                                New Journal Voucher
                            </Button>

                        </Space>

                    </Col>

                </Row>


                {/* =================================================
                    FILTERS
                ================================================= */}

                <Row
                    gutter={[
                        12,
                        12
                    ]}
                    style={{
                        marginTop: 20,
                        marginBottom: 16,
                    }}
                >

                    <Col
                        xs={24}
                        md={9}
                    >

                        <Input
                            allowClear

                            prefix={
                                <SearchOutlined />
                            }

                            placeholder={
                                "Search Voucher No., File No. or Account"
                            }

                            value={
                                searchText
                            }

                            onChange={
                                (event) =>
                                    setSearchText(
                                        event.target.value
                                    )
                            }

                            onPressEnter={
                                handleSearch
                            }

                        />

                    </Col>


                    <Col
                        xs={24}
                        md={6}
                    >

                        <DatePicker
                            allowClear
                            format="DD-MM-YYYY"
                            placeholder="Voucher Date"
                            style={{
                                width: "100%",
                            }}

                            value={
                                selectedDate
                            }

                            onChange={
                                setSelectedDate
                            }

                        />

                    </Col>


                    <Col>

                        <Space>

                            <Button
                                type="primary"
                                icon={
                                    <SearchOutlined />
                                }

                                onClick={
                                    handleSearch
                                }
                            >
                                Search
                            </Button>


                            <Button
                                onClick={
                                    handleClear
                                }
                            >
                                Clear
                            </Button>

                        </Space>

                    </Col>

                </Row>


                {/* =================================================
                    SUMMARY
                ================================================= */}

                <Row
                    gutter={16}
                    style={{
                        marginBottom: 14,
                    }}
                >

                    <Col>

                        <Tag color="blue">
                            Vouchers:{" "}
                            {summary.count}
                        </Tag>

                    </Col>


                    <Col>

                        <Tag color="green">
                            Debit:{" "}
                            {
                                summary.totalDebit.toFixed(
                                    2
                                )
                            }
                        </Tag>

                    </Col>


                    <Col>

                        <Tag color="purple">
                            Credit:{" "}
                            {
                                summary.totalCredit.toFixed(
                                    2
                                )
                            }
                        </Tag>

                    </Col>

                </Row>


                {/* =================================================
                    TABLE
                ================================================= */}

                <Table

                    bordered

                    size="small"

                    loading={
                        loading
                    }

                    columns={
                        columns
                    }

                    dataSource={
                        vouchers
                    }

                    rowKey={
                        (record) =>
                            record.VNO
                    }

                    pagination={{
                        pageSize: 20,
                        showSizeChanger: true,
                        showTotal:
                            (
                                total,
                                range
                            ) =>
                                `${range[0]}-${range[1]} of ${total}`,
                    }}

                    scroll={{
                        x: 1350,
                    }}

                    locale={{
                        emptyText: (
                            <Empty
                                description={
                                    "No Journal Vouchers Found"
                                }
                            />
                        ),
                    }}

                />

            </Card>

        </div>

    );

};


export default JournalVoucherHistory;