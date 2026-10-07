import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

import {
    Card,
    Form,
    Input,
    Select,
    Button,
    Table,
    Space,
    Typography,
    message,
} from "antd";

import {
    PlusOutlined,
    ReloadOutlined,
} from "@ant-design/icons";

const { Title } = Typography;

const HOA = () => {

    const [form] = Form.useForm();

    const [hoaData, setHoaData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // =====================================================
    // GET HOA LIST
    // =====================================================

    const GetHoaList = async () => {

        try {

            setLoading(true);

            const response = await axios.get(
                "/api/hoa"
            );

            setHoaData(response.data || []);

        } catch (error) {

            console.error("HOA FETCH ERROR:", error);

            message.error(
                error.response?.data?.message ||
                "Unable to load Head of Accounts."
            );

        } finally {

            setLoading(false);

        }
    };

    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {

        GetHoaList();

    }, []);

    // =====================================================
    // SAVE HOA
    // =====================================================

    const saveHoa = async (values) => {

        try {

            setSaving(true);

            const payload = {
                tb_hoaname: values.tb_hoaname.trim(),
                tb_type: values.tb_type,
            };

            console.log("Sending to server:", payload);

            const response = await axios.post(
                "/api/Saving_Hoa",
                payload
            );

            Swal.fire({
                icon: "success",
                title: "Saved Successfully!",
                text: response.data.message,
                showConfirmButton: false,
                timer: 1500,
            });

            // Clear form
            form.resetFields();

            // Refresh table
            GetHoaList();

        } catch (error) {

            console.error("SAVE HOA ERROR:", error);
            console.error("Server error:", error.response?.data);

            Swal.fire({
                icon: "error",
                title: "Save Failed",
                text:
                    error.response?.data?.message ||
                    "Unable to save Head of Account.",
            });

        } finally {

            setSaving(false);

        }
    };

    // =====================================================
    // RESET FORM
    // =====================================================

    const handleReset = async () => {

        const result = await Swal.fire({

            icon: "warning",

            title: "Are you sure?",

            text: "All entered data will be cleared.",

            showCancelButton: true,

            confirmButtonText: "Yes, clear it",

            cancelButtonText: "No, keep it",

            confirmButtonColor: "#d33",

            cancelButtonColor: "#3085d6",

        });

        if (result.isConfirmed) {

            form.resetFields();

            message.success("Form cleared.");

        }
    };

    // =====================================================
    // TABLE COLUMNS
    // =====================================================

    const columns = [

        {
            title: "S.No",
            key: "serial",
            width: 80,

            render: (_, __, index) => index + 1,
        },

        {
            title: "HOA ID",
            dataIndex: "HOA_ID",
            key: "HOA_ID",
            width: 100,
        },

        {
            title: "Head of Account Name",
            dataIndex: "HOA_NAME",
            key: "HOA_NAME",
        },

        {
            title: "Type",
            dataIndex: "TYPE",
            key: "TYPE",

            render: (type) => {

                if (type === "Balance Sheet") {

                    return (
                        <span
                            style={{
                                padding: "4px 10px",
                                borderRadius: 5,
                                background: "#e6f4ff",
                                color: "#1677ff",
                            }}
                        >
                            Balance Sheet
                        </span>
                    );

                }

                if (type === "Profit & Loss") {

                    return (
                        <span
                            style={{
                                padding: "4px 10px",
                                borderRadius: 5,
                                background: "#fff7e6",
                                color: "#d46b08",
                            }}
                        >
                            Profit & Loss
                        </span>
                    );

                }

                return type || "-";
            },
        },
    ];

    return (

        <div
            style={{
                width: "100%",
                padding: "20px",
            }}
        >

            {/* =====================================================
                FORM CARD
            ====================================================== */}

            <Card
                style={{
                    width: "100%",
                    marginBottom: 20,
                }}
            >

                <Title
                    level={3}
                    style={{
                        marginTop: 0,
                        marginBottom: 25,
                    }}
                >
                    Head of Account
                </Title>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={saveHoa}
                    autoComplete="off"
                >

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "20px",
                        }}
                    >

                        {/* HOA NAME */}

                        <Form.Item
                            label="Name of Head Account"
                            name="tb_hoaname"
                            rules={[
                                {
                                    required: true,
                                    message:
                                        "Please enter Head of Account name.",
                                },
                                {
                                    whitespace: true,
                                    message:
                                        "Head of Account name cannot be empty.",
                                },
                            ]}
                        >

                            <Input
                                placeholder="Enter HOA Name"
                                size="large"
                            />

                        </Form.Item>

                        {/* TYPE */}

                        <Form.Item
                            label="Type"
                            name="tb_type"
                            rules={[
                                {
                                    required: true,
                                    message:
                                        "Please select account type.",
                                },
                            ]}
                        >

                            <Select
                                placeholder="Select Type"
                                size="large"
                                options={[
                                    {
                                        value: "Balance Sheet",
                                        label: "Balance Sheet",
                                    },
                                    {
                                        value: "Profit & Loss",
                                        label: "Profit & Loss",
                                    },
                                ]}
                            />

                        </Form.Item>

                    </div>

                    {/* BUTTONS */}

                    <Form.Item
                        style={{
                            marginBottom: 0,
                            marginTop: 10,
                        }}
                    >

                        <Space>

                            <Button
                                type="primary"
                                htmlType="submit"
                                icon={<PlusOutlined />}
                                loading={saving}
                                size="large"
                            >
                                Save
                            </Button>

                            <Button
                                danger
                                type="default"
                                icon={<ReloadOutlined />}
                                onClick={handleReset}
                                size="large"
                            >
                                Cancel
                            </Button>

                        </Space>

                    </Form.Item>

                </Form>

            </Card>

            {/* =====================================================
                HOA TABLE
            ====================================================== */}

            <Card>

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 16,
                    }}
                >

                    <Title
                        level={4}
                        style={{
                            margin: 0,
                        }}
                    >
                        Head of Accounts List
                    </Title>

                    <Button
                        icon={<ReloadOutlined />}
                        onClick={GetHoaList}
                        loading={loading}
                    >
                        Refresh
                    </Button>

                </div>

                <Table
                    rowKey="HOA_ID"
                    columns={columns}
                    dataSource={hoaData}
                    loading={loading}
                    bordered
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        pageSizeOptions: [
                            "10",
                            "20",
                            "50",
                            "100",
                        ],
                        showTotal: (total) =>
                            `Total ${total} accounts`,
                    }}
                    locale={{
                        emptyText: "No Head of Accounts found.",
                    }}
                />

            </Card>

        </div>
    );
};

export default HOA;
