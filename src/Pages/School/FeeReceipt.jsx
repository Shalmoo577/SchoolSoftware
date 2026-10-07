
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import Swal from "sweetalert2";

import {
    Button,
    Card,
    Col,
    DatePicker,
    Divider,
    Form,
    Input,
    InputNumber,
    Modal,
    Row,
    Select,
    Space,
    Table,
    Tag
} from "antd";

import {
    DollarOutlined,
    SearchOutlined,
    SaveOutlined,
    ClearOutlined,
    HistoryOutlined
} from "@ant-design/icons";

const API = "/api";

const FeeReceipt = () => {

    const [form] = Form.useForm();

    const [receiptNo, setReceiptNo] = useState("");
    const [studentFees, setStudentFees] = useState([]);
    const [banks, setBanks] = useState([]);

    const [selectedFee, setSelectedFee] = useState(null);

    const [loadingFees, setLoadingFees] = useState(false);
    const [saving, setSaving] = useState(false);

    const [search, setSearch] = useState("");

    const [historyVisible, setHistoryVisible] = useState(false);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const paymentMethod = Form.useWatch("payment_method", form);
    const amountPaid = Form.useWatch("amount_paid", form);

    const [classes, setClasses] = useState([]);
    const [loadingClasses, setLoadingClasses] = useState(false);
    const [selectedClassId, setSelectedClassId] = useState(null);

    const [userInfo, setUserInfo] = useState({
    user_id: null,
    campus_id: null,
    campus_name: "",
    section_id: null,
    section_name: ""
});
useEffect(() => {

    const storedUser =
        JSON.parse(localStorage.getItem("user") || "{}");

    setUserInfo({
        user_id: storedUser?.user_id || null,
        campus_id: storedUser?.campus_id || null,
        campus_name: storedUser?.campus_name || "",
        section_id: storedUser?.section_id || null,
        section_name: storedUser?.section_name || ""
    });

}, []);


const loadClasses = async () => {

    try {

        if (
            !userInfo.campus_id ||
            !userInfo.section_id
        ) {
            setClasses([]);
            return;
        }

        setLoadingClasses(true);

        const response = await axios.get(
            `${API}/class-fee-voucher/classes`,
            {
                params: {
                    campus_id: userInfo.campus_id,
                    section_id: userInfo.section_id
                }
            }
        );

        setClasses(
            Array.isArray(response.data)
                ? response.data
                : []
        );

    } catch (error) {

        console.error(
            "LOAD CLASSES ERROR:",
            error
        );

        setClasses([]);

        Swal.fire(
            "Error",
            "Unable to load classes.",
            "error"
        );

    } finally {

        setLoadingClasses(false);
    }
};



    /* =========================================================
       LOAD NEXT RECEIPT NUMBER
    ========================================================= */

    const loadNextReceiptNo = async () => {

        try {

            const response = await axios.get(
                `${API}/fee-receipts/next-receipt-no`
            );

            setReceiptNo(response.data.receipt_no);

        } catch (error) {

            console.error(error);

            Swal.fire(
                "Error",
                "Unable to generate receipt number.",
                "error"
            );
        }
    };


    /* =========================================================
       LOAD STUDENT FEES
    ========================================================= */

  const loadStudentFees = async () => {
    try {

        if (
            !userInfo.campus_id ||
            !userInfo.section_id ||
            !selectedClassId
        ) {
            setStudentFees([]);
            return;
        }

        setLoadingFees(true);

        const response = await axios.get(
            `${API}/fee-receipts/student-fees`,
            {
                params: {
                    search: search.trim(),
                    campus_id: Number(userInfo.campus_id),
                    section_id: Number(userInfo.section_id),
                    class_id: Number(selectedClassId)
                }
            }
        );

        setStudentFees(
            Array.isArray(response.data)
                ? response.data
                : []
        );

    } catch (error) {

        console.error(
            "LOAD STUDENT FEES ERROR:",
            error
        );

        Swal.fire(
            "Error",
            error.response?.data?.message ||
            "Unable to load student fees.",
            "error"
        );

    } finally {
        setLoadingFees(false);
    }
};

useEffect(() => {

    if (
        userInfo.campus_id &&
        userInfo.section_id
    ) {
        loadClasses();
    }

}, [
    userInfo.campus_id,
    userInfo.section_id
]);
    /* =========================================================
       LOAD BANKS
    ========================================================= */

    const loadBanks = async () => {

        try {

            const response = await axios.get(
                `${API}/banks`
            );
  console.log("BANK API RESPONSE:", response.data);

            setBanks(response.data);

        } catch (error) {

            console.error(error);

            Swal.fire(
                "Error",
                "Unable to load banks.",
                "error"
            );
        }
    };


    /* =========================================================
       INITIAL LOAD
    ========================================================= */

    useEffect(() => {

        loadNextReceiptNo();
        // loadStudentFees();
        loadBanks();

        form.setFieldsValue({
            payment_date: dayjs(),
            payment_method: "CASH",
            amount_paid: 0
        });

    }, []);


    /* =========================================================
       SEARCH
    ========================================================= */

 useEffect(() => {

    if (
        !userInfo.campus_id ||
        !userInfo.section_id ||
        !selectedClassId
    ) {
        setStudentFees([]);
        return;
    }

    const timer = setTimeout(() => {
        loadStudentFees();
    }, 400);

    return () => clearTimeout(timer);

}, [
    search,
    userInfo.campus_id,
    userInfo.section_id,
    selectedClassId
]);


    /* =========================================================
       SELECT FEE
    ========================================================= */

    const selectFee = async (record) => {

        try {

            const response = await axios.get(
                `${API}/fee-receipts/fee/${record.student_fee_id}`
            );

            const fee = response.data;

            setSelectedFee(fee);

            form.setFieldsValue({
                amount_paid: Number(fee.balance),
                payment_method: "CASH",
                bank_id: undefined,
                reference_no: ""
            });

        } catch (error) {

            console.error(error);

            Swal.fire(
                "Error",
                "Unable to load student fee.",
                "error"
            );
        }
    };


    /* =========================================================
       CLEAR FORM
    ========================================================= */

    const clearForm = () => {

        setSelectedFee(null);

        form.resetFields();

        form.setFieldsValue({
            payment_date: dayjs(),
            payment_method: "CASH",
            amount_paid: 0
        });

        loadNextReceiptNo();
    };


    /* =========================================================
       SAVE PAYMENT
    ========================================================= */

    const savePayment = async (values) => {

        if (!selectedFee) {

            Swal.fire(
                "Select Student",
                "Please select a student fee first.",
                "warning"
            );

            return;
        }

        const paid = Number(values.amount_paid || 0);
        const balance = Number(selectedFee.balance || 0);

        if (paid <= 0) {

            Swal.fire(
                "Invalid Amount",
                "Payment amount must be greater than zero.",
                "warning"
            );

            return;
        }

        if (paid > balance) {

            Swal.fire(
                "Invalid Amount",
                `Payment cannot be greater than balance ${balance.toFixed(2)}.`,
                "warning"
            );

            return;
        }


        const result = await Swal.fire({
            title: "Save Payment?",
            text: `Receive ${paid.toFixed(2)} from ${selectedFee.student_name}?`,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Yes, Save"
        });

        if (!result.isConfirmed) {
            return;
        }


        try {

            setSaving(true);

            const payload = {
                receipt_no: receiptNo,

                student_fee_id:
                    selectedFee.student_fee_id,

                student_id:
                    selectedFee.student_id,

                payment_date:
                    values.payment_date.format("YYYY-MM-DD"),

                payment_method:
                    values.payment_method,

                bank_id:
                    values.payment_method === "BANK"
                        ? values.bank_id
                        : null,

                reference_no:
                    values.reference_no || null,

                amount_paid:
                    paid,

                remarks:
                    values.remarks || null
            };


            const response = await axios.post(
                `${API}/fee-receipts`,
                payload
            );


            Swal.fire(
                "Saved",
                response.data.message,
                "success"
            );


            form.setFieldsValue({
                amount_paid: 0
            });

            setSelectedFee(null);

            await loadNextReceiptNo();
            await loadStudentFees();


        } catch (error) {

            console.error(error);

            Swal.fire(
                "Error",
                error.response?.data?.message ||
                "Unable to save payment.",
                "error"
            );

        } finally {

            setSaving(false);
        }
    };


    /* =========================================================
       PAYMENT HISTORY
    ========================================================= */

    const showHistory = async (record) => {

        try {

            setLoadingHistory(true);
            setHistoryVisible(true);

            const response = await axios.get(
                `${API}/fee-receipts/history/${record.student_fee_id}`
            );

            setPaymentHistory(response.data);

        } catch (error) {

            console.error(error);

            Swal.fire(
                "Error",
                "Unable to load payment history.",
                "error"
            );

        } finally {

            setLoadingHistory(false);
        }
    };


    /* =========================================================
       CALCULATIONS
    ========================================================= */

    const currentBalance = useMemo(() => {

        if (!selectedFee) {
            return 0;
        }

        return Number(selectedFee.balance || 0);

    }, [selectedFee]);


    const remainingAfterPayment = useMemo(() => {

        const paid = Number(amountPaid || 0);

        return Math.max(
            0,
            currentBalance - paid
        );

    }, [currentBalance, amountPaid]);


    /* =========================================================
       FEE TABLE
    ========================================================= */

    const feeColumns = [

        {
            title: "Challan No.",
            dataIndex: "challan_no",
            key: "challan_no"
        },

        {
            title: "Admission No.",
            dataIndex: "admission_no",
            key: "admission_no"
        },

        {
            title: "Student",
            dataIndex: "student_name",
            key: "student_name"
        },

        {
            title: "Father",
            dataIndex: "father_name",
            key: "father_name"
        },

        {
            title: "Class",
            dataIndex: "class_name",
            key: "class_name"
        },

        {
            title: "Section",
            dataIndex: "section_name",
            key: "section_name"
        },

        {
            title: "Month",
            dataIndex: "fee_month",
            key: "fee_month",

            render: (value) =>
                value
                    ? dayjs(value).format("MMMM YYYY")
                    : ""
        },

        {
            title: "Net",
            dataIndex: "net_amount",
            key: "net_amount",

            align: "right",

            render: (value) =>
                Number(value).toFixed(2)
        },

        {
            title: "Paid",
            dataIndex: "paid_amount",
            key: "paid_amount",

            align: "right",

            render: (value) =>
                Number(value).toFixed(2)
        },

        {
            title: "Balance",
            dataIndex: "balance",
            key: "balance",

            align: "right",

            render: (value) => (
                <strong>
                    {Number(value).toFixed(2)}
                </strong>
            )
        },

        {
            title: "Status",
            dataIndex: "status",
            key: "status",

            render: (status) => {

                let color = "orange";

                if (status === "PARTIAL") {
                    color = "gold";
                }

                if (status === "UNPAID") {
                    color = "red";
                }

                return (
                    <Tag color={color}>
                        {status}
                    </Tag>
                );
            }
        },

        {
            title: "Action",
            key: "action",

            render: (_, record) => (

                <Space>

                    <Button
                        type="primary"
                        icon={<DollarOutlined />}
                        onClick={() =>
                            selectFee(record)
                        }
                    >
                        Pay
                    </Button>

                    <Button
                        icon={<HistoryOutlined />}
                        onClick={() =>
                            showHistory(record)
                        }
                    >
                        History
                    </Button>

                </Space>
            )
        }
    ];


    /* =========================================================
       HISTORY COLUMNS
    ========================================================= */

    const historyColumns = [

        {
            title: "Receipt No.",
            dataIndex: "receipt_no"
        },

        {
            title: "Payment Date",
            dataIndex: "payment_date",

            render: (value) =>
                value
                    ? dayjs(value).format("DD-MM-YYYY")
                    : ""
        },

        {
            title: "Method",
            dataIndex: "payment_method",

            render: (value) => (
                <Tag
                    color={
                        value === "CASH"
                            ? "green"
                            : "blue"
                    }
                >
                    {value}
                </Tag>
            )
        },

        {
            title: "Reference",
            dataIndex: "reference_no"
        },

        {
            title: "Amount",
            dataIndex: "amount_paid",

            align: "right",

            render: (value) =>
                Number(value).toFixed(2)
        },

        {
            title: "Remarks",
            dataIndex: "remarks"
        }
    ];


    return (
        <div style={{ padding: 20 }}>

            {/* =================================================
                PAYMENT FORM
            ================================================= */}

            <Card
                title="Student Fee Receipt"
                bordered
            >

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={savePayment}
                >

                    <Row gutter={16}>

                        <Col xs={24} md={6}>

                            <Form.Item label="Receipt No.">

                                <Input
                                    value={receiptNo}
                                    readOnly
                                    style={{
                                        fontWeight: "bold"
                                    }}
                                />

                            </Form.Item>

                        </Col>


                        <Col xs={24} md={6}>

                            <Form.Item
                                name="payment_date"
                                label="Payment Date"
                                rules={[
                                    {
                                        required: true,
                                        message:
                                            "Payment date is required"
                                    }
                                ]}
                            >

                                <DatePicker
                                    style={{
                                        width: "100%"
                                    }}
                                    format="DD-MM-YYYY"
                                />

                            </Form.Item>

                        </Col>

                        <Col xs={24} md={6}>

    <Form.Item label="Class">

        <Select
            placeholder="Select Class"
            value={selectedClassId}
            loading={loadingClasses}
            showSearch
            allowClear
            optionFilterProp="label"
            options={classes.map(item => ({
                value: Number(item.class_id),
                label: item.name
            }))}
            onChange={(value) => {

                setSelectedClassId(
                    value ? Number(value) : null
                );

                setSearch("");
            }}
        />

    </Form.Item>

</Col>


                        <Col xs={24} md={12}>

                            <Form.Item label="Selected Student">

                                <Input
                                    readOnly
                                    value={
                                        selectedFee
                                            ? `${selectedFee.student_name} - ${selectedFee.admission_no}`
                                            : ""
                                    }
                                    placeholder="Select a fee from the list below"
                                />

                            </Form.Item>

                        </Col>

                    </Row>


                    {selectedFee && (

                        <>

                            <Divider />

                            <Row gutter={16}>

                                <Col xs={24} md={4}>

                                    <Form.Item label="Class">

                                        <Input
                                            value={
                                                selectedFee.class_name
                                            }
                                            readOnly
                                        />

                                    </Form.Item>

                                </Col>


                                <Col xs={24} md={4}>

                                    <Form.Item label="Section">

                                        <Input
                                            value={
                                                selectedFee.section_name
                                            }
                                            readOnly
                                        />

                                    </Form.Item>

                                </Col>


                                <Col xs={24} md={4}>

                                    <Form.Item label="Fee Month">

                                        <Input
                                            value={
                                                dayjs(
                                                    selectedFee.fee_month
                                                ).format(
                                                    "MMMM YYYY"
                                                )
                                            }
                                            readOnly
                                        />

                                    </Form.Item>

                                </Col>


                                <Col xs={24} md={4}>

                                    <Form.Item label="Net Amount">

                                        <InputNumber
                                            value={
                                                Number(
                                                    selectedFee.net_amount
                                                )
                                            }
                                            readOnly
                                            style={{
                                                width: "100%"
                                            }}
                                        />

                                    </Form.Item>

                                </Col>


                                <Col xs={24} md={4}>

                                    <Form.Item label="Already Paid">

                                        <InputNumber
                                            value={
                                                Number(
                                                    selectedFee.paid_amount
                                                )
                                            }
                                            readOnly
                                            style={{
                                                width: "100%"
                                            }}
                                        />

                                    </Form.Item>

                                </Col>


                                <Col xs={24} md={4}>

                                    <Form.Item label="Balance">

                                        <InputNumber
                                            value={
                                                currentBalance
                                            }
                                            readOnly
                                            style={{
                                                width: "100%",
                                                fontWeight: "bold"
                                            }}
                                        />

                                    </Form.Item>

                                </Col>

                            </Row>


                            <Row gutter={16}>

                                <Col xs={24} md={6}>

                                    <Form.Item
                                        name="payment_method"
                                        label="Payment Method"
                                        rules={[
                                            {
                                                required: true,
                                                message:
                                                    "Select payment method"
                                            }
                                        ]}
                                    >

                                        <Select>

                                            <Select.Option value="CASH">
                                                CASH
                                            </Select.Option>

                                            <Select.Option value="BANK">
                                                BANK
                                            </Select.Option>

                                        </Select>

                                    </Form.Item>

                                </Col>


                                {paymentMethod === "BANK" && (

                                    <Col xs={24} md={6}>

                                       <Form.Item
    name="bank_id"
    label="Bank"
>
    <Select
        placeholder="Select Bank"
        allowClear
        showSearch
        optionFilterProp="label"
        options={banks.map((bank) => ({
            value: bank.Sa_ID,
            label: bank.SA_Name
        }))}
    />
</Form.Item>

                                    </Col>

                                )}


                                <Col xs={24} md={6}>

                                    <Form.Item
                                        name="reference_no"
                                        label="Reference No."
                                    >

                                        <Input
                                            placeholder="Cheque / Transaction No."
                                        />

                                    </Form.Item>

                                </Col>


                                <Col xs={24} md={6}>

                                    <Form.Item
                                        name="amount_paid"
                                        label="Amount Paid"
                                        rules={[
                                            {
                                                required: true,
                                                message:
                                                    "Enter payment amount"
                                            }
                                        ]}
                                    >

                                        <InputNumber
                                            min={0}
                                            precision={2}
                                            style={{
                                                width: "100%"
                                            }}
                                        />

                                    </Form.Item>

                                </Col>

                            </Row>


                            <Row gutter={16}>

                                <Col xs={24} md={12}>

                                    <Form.Item
                                        name="remarks"
                                        label="Remarks"
                                    >

                                        <Input.TextArea
                                            rows={2}
                                            placeholder="Optional remarks"
                                        />

                                    </Form.Item>

                                </Col>


                                <Col xs={24} md={12}>

                                    <Card
                                        size="small"
                                        title="Payment Summary"
                                    >

                                        <Row
                                            justify="space-between"
                                        >

                                            <span>
                                                Current Balance
                                            </span>

                                            <strong>
                                                {currentBalance.toFixed(2)}
                                            </strong>

                                        </Row>

                                        <Row
                                            justify="space-between"
                                            style={{
                                                marginTop: 8
                                            }}
                                        >

                                            <span>
                                                This Payment
                                            </span>

                                            <strong>
                                                {Number(
                                                    amountPaid || 0
                                                ).toFixed(2)}
                                            </strong>

                                        </Row>

                                        <Divider
                                            style={{
                                                margin: "10px 0"
                                            }}
                                        />

                                        <Row
                                            justify="space-between"
                                        >

                                            <span>
                                                Remaining Balance
                                            </span>

                                            <strong>
                                                {remainingAfterPayment.toFixed(2)}
                                            </strong>

                                        </Row>

                                    </Card>

                                </Col>

                            </Row>


                            <Space>

                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    icon={<SaveOutlined />}
                                    loading={saving}
                                >
                                    Save Payment
                                </Button>

                                <Button
                                    icon={<ClearOutlined />}
                                    onClick={clearForm}
                                >
                                    Clear
                                </Button>

                            </Space>

                        </>
                    )}

                </Form>

            </Card>


            {/* =================================================
                SEARCH / STUDENT FEE LIST
            ================================================= */}

            <Card
                title="Outstanding Student Fees"
                style={{
                    marginTop: 20
                }}
            >

                <Input
                    prefix={<SearchOutlined />}
                    placeholder="Search Admission No., Student, Father or Challan No."
                    value={search}
                    onChange={(e) =>
                        setSearch(e.target.value)
                    }
                    allowClear
                    style={{
                        maxWidth: 500,
                        marginBottom: 16
                    }}
                />


                <Table
                    rowKey="student_fee_id"
                    columns={feeColumns}
                    dataSource={studentFees}
                    loading={loadingFees}
                    bordered
                    scroll={{
                        x: "max-content"
                    }}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true
                    }}
                />

            </Card>


            {/* =================================================
                PAYMENT HISTORY MODAL
            ================================================= */}

            <Modal
                title="Payment History"
                open={historyVisible}
                onCancel={() =>
                    setHistoryVisible(false)
                }
                footer={[
                    <Button
                        key="close"
                        onClick={() =>
                            setHistoryVisible(false)
                        }
                    >
                        Close
                    </Button>
                ]}
                width={900}
            >

                <Table
                    rowKey="fee_receipt_id"
                    columns={historyColumns}
                    dataSource={paymentHistory}
                    loading={loadingHistory}
                    pagination={false}
                    bordered
                    scroll={{
                        x: "max-content"
                    }}
                />

            </Modal>

        </div>
    );
};

export default FeeReceipt;
