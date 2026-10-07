import axios from "axios";
import React, { useEffect, useState } from "react";
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
    Tag,
    message,
} from "antd";

import {
    PlusOutlined,
    EditOutlined,
    ReloadOutlined,
    CloseOutlined,
} from "@ant-design/icons";

const { Title } = Typography;

const ControlAccount = () => {

    const [form] = Form.useForm();

    // =====================================================
    // STATES
    // =====================================================

    const [hoaData, setHoaData] = useState([]);
    const [controlAccounts, setControlAccounts] = useState([]);

    const [editId, setEditId] = useState(null);

    const [hoaLoading, setHoaLoading] = useState(false);
    const [tableLoading, setTableLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // =====================================================
    // FETCH HOA
    // =====================================================

    const GetHoaList = async () => {

        try {

            setHoaLoading(true);

            const response = await axios.get(
                "/api/hoa"
            );

            setHoaData(response.data || []);

        } catch (error) {

            console.error(
                "Error fetching HOA:",
                error
            );

            message.error(
                error.response?.data?.message ||
                "Unable to load Head of Accounts."
            );

        } finally {

            setHoaLoading(false);

        }
    };

    // =====================================================
    // FETCH CONTROL ACCOUNTS
    // =====================================================

    const fetchControlAccountsData = async () => {

        try {

            setTableLoading(true);

            const response = await axios.get(
                "/api/control-accounts"
            );

            setControlAccounts(
                response.data || []
            );

        } catch (error) {

            console.error(
                "Error fetching control accounts:",
                error
            );

            message.error(
                error.response?.data?.message ||
                "Unable to load Control Accounts."
            );

        } finally {

            setTableLoading(false);

        }
    };

    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {

        GetHoaList();
        fetchControlAccountsData();

    }, []);

    // =====================================================
    // EDIT
    // =====================================================

    const handleEdit = (item) => {

        setEditId(item.ControlAccountID);

        form.setFieldsValue({
            tb_hoa: String(item.hoa_id),
            tb_controlaccount:
                item.ControlAccountName,
        });

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    // =====================================================
    // CANCEL EDIT
    // =====================================================

    const cancelEdit = () => {

        setEditId(null);

        form.resetFields();

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
    // SAVE / UPDATE
    // =====================================================

    const handleSubmit = async (values) => {

        try {

            setSaving(true);

            let response;

            const payload = {

                tb_hoa: values.tb_hoa,

                tb_controlaccount:
                    values.tb_controlaccount.trim(),

            };

            // =================================================
            // UPDATE
            // =================================================

            if (editId) {

                response = await axios.put(
                    `/api/Updatecontrol-accounts/${editId}`,
                    payload
                );

            }

            // =================================================
            // SAVE
            // =================================================

            else {

                response = await axios.post(
                    "/api/SavingControlAccount",
                    payload
                );

            }

            Swal.fire({

                icon: "success",

                title: editId
                    ? "Updated Successfully!"
                    : "Saved Successfully!",

                text: response.data.message,

                showConfirmButton: false,

                timer: 1800,

            });

            // Clear form

            form.resetFields();

            // Exit edit mode

            setEditId(null);

            // Refresh table

            fetchControlAccountsData();

        } catch (error) {

            console.error(
                "SAVE / UPDATE ERROR:",
                error
            );

            Swal.fire({

                icon: "error",

                title: editId
                    ? "Update Failed"
                    : "Save Failed",

                text:
                    error.response?.data?.message ||
                    "Something went wrong.",

            });

        } finally {

            setSaving(false);

        }

    };

    // =====================================================
    // TABLE COLUMNS
    // =====================================================

    const columns = [

        {
            title: "#",

            key: "serial",

            width: 70,

            align: "center",

            render: (_, __, index) => (

                <Tag color="blue">

                    {index + 1}

                </Tag>

            ),
        },

        {
            title: "Head of Account",

            dataIndex: "hoa_name",

            key: "hoa_name",

            render: (value) => (

                <strong>

                    {value || "-"}

                </strong>

            ),
        },

        {
            title: "Control Account",

            dataIndex: "ControlAccountName",

            key: "ControlAccountName",

            render: (value) => (

                <span>

                    {value || "-"}

                </span>

            ),
        },

        {
            title: "Action",

            key: "action",

            width: 120,

            align: "center",

            render: (_, record) => (

                <Button

                    type={
                        editId ===
                        record.ControlAccountID
                            ? "primary"
                            : "default"
                    }

                    icon={<EditOutlined />}

                    onClick={(e) => {

                        e.stopPropagation();

                        handleEdit(record);

                    }}

                >

                    Edit

                </Button>

            ),
        },

    ];

    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div
            style={{
                width: "100%",
                padding: "20px",
            }}
        >

            {/* =================================================
                FORM CARD
            ================================================= */}

            <Card
                style={{
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

                    Control Account

                </Title>

                <Form

                    form={form}

                    layout="vertical"

                    onFinish={handleSubmit}

                    autoComplete="off"

                >

                    <div
                        style={{
                            display: "grid",

                            gridTemplateColumns:
                                "1fr 1fr",

                            gap: "20px",
                        }}
                    >

                        {/* =====================================
                            HOA
                        ====================================== */}

                        <Form.Item

                            label="Select Head of Account"

                            name="tb_hoa"

                            rules={[
                                {
                                    required: true,

                                    message:
                                        "Please select Head of Account.",
                                },
                            ]}

                        >

                            <Select

                                size="large"

                                placeholder="Select Head of Account"

                                loading={hoaLoading}

                                showSearch

                                optionFilterProp="label"

                                options={hoaData.map(
                                    (item) => ({

                                        value:
                                            String(
                                                item.HOA_ID
                                            ),

                                        label:
                                            item.HOA_NAME,

                                    })
                                )}

                            />

                        </Form.Item>

                        {/* =====================================
                            CONTROL ACCOUNT
                        ====================================== */}

                        <Form.Item

                            label="Name of Control Account"

                            name="tb_controlaccount"

                            rules={[
                                {
                                    required: true,

                                    message:
                                        "Please insert Control Account.",
                                },

                                {
                                    whitespace: true,

                                    message:
                                        "Control Account cannot be empty.",
                                },
                            ]}

                        >

                            <Input

                                size="large"

                                placeholder="Control Account"

                            />

                        </Form.Item>

                    </div>

                    {/* =====================================
                        BUTTONS
                    ====================================== */}

                    <Form.Item
                        style={{
                            marginBottom: 0,
                            marginTop: 10,
                        }}
                    >

                        <Space>

                            <Button

                                type={
                                    editId
                                        ? "primary"
                                        : "primary"
                                }

                                danger={false}

                                htmlType="submit"

                                loading={saving}

                                icon={
                                    editId
                                        ? <EditOutlined />
                                        : <PlusOutlined />
                                }

                                size="large"

                            >

                                {editId
                                    ? "Update"
                                    : "Save"}

                            </Button>

                            <Button

                                danger

                                type="default"

                                icon={
                                    editId
                                        ? <CloseOutlined />
                                        : <ReloadOutlined />
                                }

                                size="large"

                                onClick={
                                    editId
                                        ? cancelEdit
                                        : handleReset
                                }

                            >

                                {editId
                                    ? "Cancel Edit"
                                    : "Cancel"}

                            </Button>

                        </Space>

                    </Form.Item>

                </Form>

            </Card>

            {/* =================================================
                TABLE CARD
            ================================================= */}

            <Card>

                {/* =============================================
                    TABLE HEADER
                ============================================== */}

                <div
                    style={{
                        display: "flex",

                        justifyContent:
                            "space-between",

                        alignItems: "center",

                        marginBottom: 16,
                    }}
                >

                    <div>

                        <Title
                            level={4}
                            style={{
                                margin: 0,
                            }}
                        >

                            Control Accounts

                        </Title>

                        <span
                            style={{
                                color: "#888",
                            }}
                        >

                            {controlAccounts.length}
                            {" "}
                            Accounts

                        </span>

                    </div>

                    <Button

                        icon={
                            <ReloadOutlined />
                        }

                        onClick={
                            fetchControlAccountsData
                        }

                        loading={tableLoading}

                    >

                        Refresh

                    </Button>

                </div>

                {/* =============================================
                    TABLE
                ============================================== */}

                <Table

                    rowKey="ControlAccountID"

                    columns={columns}

                    dataSource={controlAccounts}

                    loading={tableLoading}

                    bordered

                    size="middle"

                    onRow={(record) => ({

                        onClick: () =>
                            handleEdit(record),

                        style: {
                            cursor: "pointer",
                        },

                    })}

                    rowClassName={(record) =>

                        editId ===
                        record.ControlAccountID

                            ? "ant-table-row-selected"

                            : ""

                    }

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

                        emptyText:
                            "No Control Accounts saved yet.",

                    }}

                />

            </Card>

        </div>

    );

};

export default ControlAccount;
