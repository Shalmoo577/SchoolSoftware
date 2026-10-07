import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import Swal from "sweetalert2";

import {
    Card,
    Form,
    Input,
    InputNumber,
    Select,
    DatePicker,
    Button,
    Table,
    Space,
    Typography,
    Row,
    Col,
    Divider,
    Tag,
    message,
} from "antd";

import {
    ArrowLeftOutlined,
    PlusOutlined,
    DeleteOutlined,
    SaveOutlined,
    ReloadOutlined,
    PrinterOutlined,
    FilePdfOutlined,
} from "@ant-design/icons";

import {
    useNavigate,
    useParams,
} from "react-router-dom";


const { Title, Text } = Typography;

const API = "/api";


const createEmptyRow = () => ({
    key: `${Date.now()}-${Math.random()}`,
    subid: null,
    description: "",
    cheque_no: "",
    debit: 0,
    credit: 0,
});


const JournalVoucherEntry = () => {

    const navigate = useNavigate();

    const { vno } = useParams();

    const editMode = Boolean(vno);

    const [form] = Form.useForm();


    const [accounts, setAccounts] = useState([]);

    const [loadingAccounts, setLoadingAccounts] =
        useState(false);

    const [loadingVoucher, setLoadingVoucher] =
        useState(false);

    const [saving, setSaving] =
        useState(false);


    const [rows, setRows] = useState([
        createEmptyRow(),
    ]);


    // =========================================================
    // ACCOUNT OPTIONS
    // =========================================================

    const accountOptions = useMemo(() => {

        return accounts.map((account) => ({
            value: Number(account.Sa_ID),
            label: account.Sa_Name || "",
        }));

    }, [accounts]);


    // =========================================================
    // TOTALS
    // =========================================================

    const totals = useMemo(() => {

        const debit = rows.reduce(
            (total, row) =>
                total + Number(row.debit || 0),
            0
        );

        const credit = rows.reduce(
            (total, row) =>
                total + Number(row.credit || 0),
            0
        );

        return {
            debit,
            credit,
            difference: debit - credit,
        };

    }, [rows]);


    // =========================================================
    // LOAD ACCOUNTS
    // =========================================================

    const loadAccounts = async () => {

        try {

            setLoadingAccounts(true);

            const response = await axios.get(
                `${API}/journal-voucher/accounts`
            );

            const data =
                Array.isArray(response.data)
                    ? response.data
                    : [];

            setAccounts(data);

        } catch (error) {

            console.error(
                "JV ACCOUNTS ERROR:",
                error
            );

            message.error(
                error.response?.data?.message ||
                "Unable to load accounts."
            );

        } finally {

            setLoadingAccounts(false);

        }

    };


    // =========================================================
    // LOAD NEXT VOUCHER
    // =========================================================

    const loadNextVoucher = async () => {

        try {

            const response = await axios.get(
                `${API}/journal-voucher/next-vno`
            );

            form.setFieldsValue({

                vno:
                    response.data?.vno || "",

                date:
                    dayjs(),

                file_no:
                    "",

            });

        } catch (error) {

            console.error(
                "NEXT JV ERROR:",
                error
            );

            message.error(
                error.response?.data?.message ||
                "Unable to generate voucher number."
            );

        }

    };


    // =========================================================
    // LOAD EXISTING VOUCHER
    // =========================================================

    const loadVoucher = async () => {

        if (!vno) {
            return;
        }

        try {

            setLoadingVoucher(true);

            const response = await axios.get(
                `${API}/journal-voucher/${encodeURIComponent(vno)}`
            );

            console.log(
                "JV EDIT RESPONSE:",
                response.data
            );

            const voucher =
                Array.isArray(
                    response.data?.voucher
                )
                    ? response.data.voucher
                    : [];

            console.log(
                "JV EDIT VOUCHER:",
                voucher
            );


            if (!voucher.length) {

                message.error(
                    "Journal Voucher not found."
                );

                navigate(
                    "/journalvoucher"
                );

                return;

            }


            const firstRow =
                voucher[0];


            form.setFieldsValue({

                vno:
                    firstRow.VNO ||
                    vno,

                date:
                    firstRow.VDT
                        ? dayjs(firstRow.VDT)
                        : dayjs(),

                file_no:
                    firstRow.FILE_NO || "",

            });


            const formattedRows =
                voucher.map(
                    (item, index) => ({

                        key:
                            item.MASTER_ID ||
                            `${Date.now()}-${index}`,

                        subid:
                            item.SUBID !== null &&
                            item.SUBID !== undefined
                                ? Number(item.SUBID)
                                : null,

                        description:
                            item.NARRATION || "",

                        cheque_no:
                            item.CHQ_NO || "",

                        debit:
                            Number(
                                item.DEBIT || 0
                            ),

                        credit:
                            Number(
                                item.CREDIT || 0
                            ),

                    })
                );


            setRows(
                formattedRows
            );

        } catch (error) {

            console.error(
                "LOAD JV ERROR:",
                error
            );

            message.error(
                error.response?.data?.message ||
                "Unable to load Journal Voucher."
            );

        } finally {

            setLoadingVoucher(false);

        }

    };


    // =========================================================
    // INITIAL LOAD
    // =========================================================

    useEffect(() => {

        const initialize = async () => {

            await loadAccounts();

            if (editMode) {

                await loadVoucher();

            } else {

                await loadNextVoucher();

            }

        };

        initialize();

    }, [vno]);


    // =========================================================
    // ADD ROW
    // =========================================================

    const addRow = () => {

        setRows((previousRows) => {

            const lastRow =
                previousRows[
                    previousRows.length - 1
                ];

            const newRow =
                createEmptyRow();


            // Previous description/cheque copy
            newRow.description =
                lastRow?.description || "";

            newRow.cheque_no =
                lastRow?.cheque_no || "";


            return [
                ...previousRows,
                newRow,
            ];

        });

    };


    // =========================================================
    // DELETE ROW
    // =========================================================

    const deleteRow = (key) => {

        setRows((previousRows) => {

            if (
                previousRows.length <= 1
            ) {

                return [
                    createEmptyRow(),
                ];

            }

            return previousRows.filter(
                (row) =>
                    row.key !== key
            );

        });

    };


    // =========================================================
    // UPDATE ROW
    // =========================================================

    const updateRow = (
        key,
        field,
        value
    ) => {

        setRows((previousRows) =>

            previousRows.map((row) => {

                if (
                    row.key !== key
                ) {

                    return row;

                }


                const updated = {
                    ...row,
                    [field]: value,
                };


                if (
                    field === "debit" &&
                    Number(value || 0) > 0
                ) {

                    updated.credit = 0;

                }


                if (
                    field === "credit" &&
                    Number(value || 0) > 0
                ) {

                    updated.debit = 0;

                }


                return updated;

            })

        );

    };


    // =========================================================
    // RESET
    // =========================================================

    const resetForm = async () => {

        if (editMode) {

            await loadVoucher();

            return;

        }


        form.resetFields();


        setRows([
            createEmptyRow(),
        ]);


        form.setFieldsValue({
            date: dayjs(),
        });


        await loadNextVoucher();

    };


    // =========================================================
    // VALIDATE ROWS
    // =========================================================

    const validateRows = () => {

        for (
            let index = 0;
            index < rows.length;
            index++
        ) {

            const row =
                rows[index];


            const debit =
                Number(
                    row.debit || 0
                );


            const credit =
                Number(
                    row.credit || 0
                );


            if (
                row.subid === null ||
                row.subid === undefined ||
                row.subid === ""
            ) {

                message.error(
                    `Please select account in row ${index + 1}.`
                );

                return false;

            }


            if (
                debit <= 0 &&
                credit <= 0
            ) {

                message.error(
                    `Please enter Debit or Credit amount in row ${index + 1}.`
                );

                return false;

            }


            if (
                debit > 0 &&
                credit > 0
            ) {

                message.error(
                    `Row ${index + 1} cannot have both Debit and Credit.`
                );

                return false;

            }

        }


        return true;

    };


    // =========================================================
    // SAVE / UPDATE
    // =========================================================

    const handleSave = async () => {

        try {

            const values =
                await form.validateFields();


            if (!validateRows()) {
                return;
            }


            if (
                totals.debit <= 0 ||
                totals.credit <= 0
            ) {

                message.error(
                    "Debit and Credit amounts are required."
                );

                return;

            }


            if (
                Math.abs(
                    totals.debit -
                    totals.credit
                ) > 0.001
            ) {

                message.error(
                    "Total Debit and Total Credit must be equal."
                );

                return;

            }


            const payload = {

                vno:
                    values.vno,

                date:
                    values.date.format(
                        "YYYY-MM-DD"
                    ),

                file_no:
                    values.file_no || null,

                rows:
                    rows.map((row) => ({

                        subid:
                            Number(row.subid),

                        description:
                            row.description || "",

                        cheque_no:
                            row.cheque_no || "",

                        debit:
                            Number(
                                row.debit || 0
                            ),

                        credit:
                            Number(
                                row.credit || 0
                            ),

                    })),

            };


            setSaving(true);


            let response;


            if (editMode) {

                response =
                    await axios.put(
                        `${API}/journal-voucher/${encodeURIComponent(vno)}`,
                        payload
                    );

            } else {

                response =
                    await axios.post(
                        `${API}/journal-voucher`,
                        payload
                    );

            }


            await Swal.fire({

                icon: "success",

                title:
                    editMode
                        ? "Updated"
                        : "Saved",

                text:
                    response.data?.message ||
                    (
                        editMode
                            ? "Journal Voucher updated successfully."
                            : "Journal Voucher saved successfully."
                    ),

                confirmButtonText:
                    "OK",

            });


            navigate(
                "/journalvoucher"
            );

        } catch (error) {

            console.error(
                "SAVE JV ERROR:",
                error
            );


            if (
                error?.errorFields
            ) {

                return;

            }


            Swal.fire({

                icon: "error",

                title: "Error",

                text:
                    error.response?.data?.message ||
                    "Unable to save Journal Voucher.",

            });

        } finally {

            setSaving(false);

        }

    };


    // =========================================================
    // VIEW / PRINT / PDF
    // =========================================================

    const openVoucherView = (
        mode = "print"
    ) => {

        const voucherNo =
            form.getFieldValue(
                "vno"
            );


        if (!voucherNo) {

            message.error(
                "Voucher number not available."
            );

            return;

        }


        const date =
            form.getFieldValue(
                "date"
            );


        const dateText =
            date
                ? date.format(
                    "DD-MM-YYYY"
                )
                : dayjs().format(
                    "DD-MM-YYYY"
                );


        const fileName =
            `JournalVoucher_${voucherNo}_${dateText}`;


        if (
            mode === "pdf"
        ) {

            navigate(
                `/journalvoucherview/${encodeURIComponent(voucherNo)}?pdf=1&filename=${encodeURIComponent(fileName)}`
            );

            return;

        }


        navigate(
            `/journalvoucherview/${encodeURIComponent(voucherNo)}?print=1`
        );

    };


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
            title: "Account",

            dataIndex: "subid",

            width: 280,

            render: (
                _,
                record
            ) => (

                <Select

                    showSearch

                    allowClear

                    placeholder="Select Account"

                    value={
                        record.subid !== null &&
                        record.subid !== undefined
                            ? Number(
                                record.subid
                            )
                            : undefined
                    }

                    loading={
                        loadingAccounts
                    }

                    optionFilterProp="label"

                    style={{
                        width: "100%",
                    }}

                    options={
                        accountOptions
                    }

                    onChange={
                        (value) => {

                            updateRow(
                                record.key,
                                "subid",
                                value !== undefined &&
                                value !== null &&
                                value !== ""
                                    ? Number(value)
                                    : null
                            );

                        }
                    }

                />

            ),

        },


        {
            title: "Description",

            dataIndex:
                "description",

            width: 300,

            render: (
                _,
                record
            ) => (

                <Input

                    value={
                        record.description ||
                        ""
                    }

                    placeholder="Description"

                    onChange={
                        (event) => {

                            updateRow(
                                record.key,
                                "description",
                                event.target.value
                            );

                        }
                    }

                />

            ),

        },


        {
            title: "Cheque No.",

            dataIndex:
                "cheque_no",

            width: 150,

            render: (
                _,
                record
            ) => (

                <Input

                    value={
                        record.cheque_no ||
                        ""
                    }

                    placeholder="Cheque No."

                    onChange={
                        (event) => {

                            updateRow(
                                record.key,
                                "cheque_no",
                                event.target.value
                            );

                        }
                    }

                />

            ),

        },


        {
            title: "Debit",

            dataIndex:
                "debit",

            width: 150,

            align: "right",

            render: (
                _,
                record
            ) => (

                <InputNumber

                    value={
                        Number(
                            record.debit ||
                            0
                        )
                    }

                    min={0}

                    precision={2}

                    controls={false}

                    style={{
                        width: "100%",
                    }}

                    onChange={
                        (value) => {

                            updateRow(
                                record.key,
                                "debit",
                                Number(
                                    value || 0
                                )
                            );

                        }
                    }

                />

            ),

        },


        {
            title: "Credit",

            dataIndex:
                "credit",

            width: 150,

            align: "right",

            render: (
                _,
                record
            ) => (

                <InputNumber

                    value={
                        Number(
                            record.credit ||
                            0
                        )
                    }

                    min={0}

                    precision={2}

                    controls={false}

                    style={{
                        width: "100%",
                    }}

                    onChange={
                        (value) => {

                            updateRow(
                                record.key,
                                "credit",
                                Number(
                                    value || 0
                                )
                            );

                        }
                    }

                />

            ),

        },


        {
            title: "Action",

            width: 80,

            align: "center",

            render: (
                _,
                record
            ) => (

                <Button

                    danger

                    type="text"

                    icon={
                        <DeleteOutlined />
                    }

                    onClick={() =>
                        deleteRow(
                            record.key
                        )
                    }

                />

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
                background: "#f5f5f5",
                minHeight: "100vh",
            }}
        >

            <Card>

                <Row
                    align="middle"
                    justify="space-between"
                    gutter={[
                        16,
                        16
                    ]}
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
                                Back to History
                            </Button>


                            <Title
                                level={3}
                                style={{
                                    margin: 0,
                                }}
                            >
                                Journal Voucher
                            </Title>


                            <Tag color="blue">
                                {
                                    editMode
                                        ? "EDIT"
                                        : "NEW"
                                }
                            </Tag>

                        </Space>

                    </Col>


                    <Col>

                        <Space>

                            <Button
                                icon={
                                    <PlusOutlined />
                                }

                                onClick={
                                    addRow
                                }
                            >
                                Add Row
                            </Button>


                            <Button
                                icon={
                                    <ReloadOutlined />
                                }

                                onClick={
                                    resetForm
                                }
                            >
                                Reset
                            </Button>

                        </Space>

                    </Col>

                </Row>


                <Divider />


                <Form
                    form={form}
                    layout="vertical"
                >

                    <Row gutter={16}>

                        <Col
                            xs={24}
                            md={8}
                        >

                            <Form.Item
                                label="Voucher No."
                                name="vno"
                                rules={[
                                    {
                                        required: true,
                                        message:
                                            "Voucher number is required.",
                                    },
                                ]}
                            >

                                <Input
                                    readOnly
                                />

                            </Form.Item>

                        </Col>


                        <Col
                            xs={24}
                            md={8}
                        >

                            <Form.Item
                                label="Date"
                                name="date"
                                rules={[
                                    {
                                        required: true,
                                        message:
                                            "Date is required.",
                                    },
                                ]}
                            >

                                <DatePicker
                                    format="DD-MM-YYYY"
                                    style={{
                                        width: "100%",
                                    }}
                                />

                            </Form.Item>

                        </Col>


                        <Col
                            xs={24}
                            md={8}
                        >

                            <Form.Item
                                label="File No."
                                name="file_no"
                            >

                                <Input
                                    placeholder="File No."
                                />

                            </Form.Item>

                        </Col>

                    </Row>

                </Form>


                <Divider orientation="left">
                    Account Details
                </Divider>


                <Table

                    bordered

                    size="small"

                    pagination={false}

                    loading={
                        loadingVoucher ||
                        loadingAccounts
                    }

                    rowKey="key"

                    columns={
                        columns
                    }

                    dataSource={
                        rows
                    }

                    scroll={{
                        x: 1150,
                    }}

                    footer={() => (

                        <Row
                            justify="end"
                            gutter={30}
                        >

                            <Col>

                                <Text strong>
                                    Total Debit:{" "}
                                    {
                                        totals.debit.toFixed(
                                            2
                                        )
                                    }
                                </Text>

                            </Col>


                            <Col>

                                <Text strong>
                                    Total Credit:{" "}
                                    {
                                        totals.credit.toFixed(
                                            2
                                        )
                                    }
                                </Text>

                            </Col>


                            <Col>

                                <Text
                                    strong
                                    type={
                                        Math.abs(
                                            totals.difference
                                        ) < 0.001
                                            ? "success"
                                            : "danger"
                                    }
                                >
                                    Difference:{" "}
                                    {
                                        totals.difference.toFixed(
                                            2
                                        )
                                    }
                                </Text>

                            </Col>

                        </Row>

                    )}

                />


                <div
                    style={{
                        marginTop: 16,
                        textAlign: "right",
                    }}
                >

                    {
                        Math.abs(
                            totals.difference
                        ) < 0.001
                            ? (
                                <Tag color="green">
                                    Balanced
                                </Tag>
                            )
                            : (
                                <Tag color="red">
                                    Not Balanced
                                </Tag>
                            )
                    }

                </div>


                <Divider />


                <Row justify="end">

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
                                    <ReloadOutlined />
                                }

                                onClick={
                                    resetForm
                                }
                            >
                                Reset
                            </Button>


                            <Button
                                type="primary"
                                icon={
                                    <SaveOutlined />
                                }
                                loading={
                                    saving
                                }
                                onClick={
                                    handleSave
                                }
                            >
                                {
                                    editMode
                                        ? "Update"
                                        : "Save"
                                }
                            </Button>


                            <Button
                                icon={
                                    <PrinterOutlined />
                                }

                                onClick={() =>
                                    openVoucherView(
                                        "print"
                                    )
                                }
                            >
                                Print
                            </Button>


                            <Button
                                icon={
                                    <FilePdfOutlined />
                                }

                                onClick={() =>
                                    openVoucherView(
                                        "pdf"
                                    )
                                }
                            >
                                PDF
                            </Button>

                        </Space>

                    </Col>

                </Row>

            </Card>

        </div>

    );

};


export default JournalVoucherEntry;