import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

import {
    Button,
    Form,
    Input,
    Modal,
    Select,
    Space,
    Table,
    Tag
} from "antd";

import {
    EditOutlined,
    PlusOutlined
} from "@ant-design/icons";

import "./FeeHeads.css";

const API = "/api";

const FeeHeads = () => {

    const [form] = Form.useForm();

    const [feeHeads, setFeeHeads] = useState([]);
    const [feeTypes, setFeeTypes] = useState([]);

    const [loading, setLoading] = useState(false);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [search, setSearch] = useState("");


    // =====================================================
    // LOAD FEE HEADS
    // =====================================================

    const loadFeeHeads = async () => {

        try {

            setLoading(true);

            const response =
                await axios.get(`${API}/fee-heads`);

            setFeeHeads(response.data);

        } catch (error) {

            console.error(error);

            Swal.fire(
                "Error",
                "Failed to load fee heads",
                "error"
            );

        } finally {

            setLoading(false);

        }
    };


    // =====================================================
    // LOAD FEE TYPES
    // =====================================================

    const loadFeeTypes = async () => {

        try {

            const response =
                await axios.get(
                    `${API}/fee-types/active`
                );

            setFeeTypes(response.data);

        } catch (error) {

            console.error(error);

            Swal.fire(
                "Error",
                "Failed to load Fee Types",
                "error"
            );
        }
    };


    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {

        loadFeeHeads();
        loadFeeTypes();

    }, []);


    // =====================================================
    // OPEN ADD
    // =====================================================

    const openAdd = () => {

        setEditingId(null);

        form.resetFields();

        setModalOpen(true);
    };


    // =====================================================
    // OPEN EDIT
    // =====================================================

    const openEdit = (record) => {

        setEditingId(record.fee_head_id);

        form.setFieldsValue({

            fee_type_id:
                record.fee_type_id,

            fee_head_name:
                record.fee_head_name

        });

        setModalOpen(true);
    };


    // =====================================================
    // SAVE
    // =====================================================

    const handleSave = async () => {

        try {

            const values =
                await form.validateFields();


            const data = {

                fee_type_id:
                    values.fee_type_id,

                fee_head_name:
                    values.fee_head_name
                        ?.trim()
                        .toUpperCase()

            };


            // =================================================
            // UPDATE
            // =================================================

            if (editingId) {

                await axios.put(
                    `${API}/fee-heads/${editingId}`,
                    data
                );

                await Swal.fire(
                    "Updated",
                    "Fee Head updated successfully",
                    "success"
                );

            }

            // =================================================
            // INSERT
            // =================================================

            else {

                await axios.post(
                    `${API}/fee-heads`,
                    data
                );

                await Swal.fire(
                    "Saved",
                    "Fee Head saved successfully",
                    "success"
                );

            }


            setModalOpen(false);

            form.resetFields();

            setEditingId(null);

            loadFeeHeads();


        } catch (error) {

            // Ant Design validation
            if (error?.errorFields) {
                return;
            }

            console.error(error);

            Swal.fire(
                "Error",
                error?.response?.data?.message ||
                "Something went wrong",
                "error"
            );
        }
    };


    // =====================================================
    // ACTIVE / INACTIVE
    // =====================================================

    const changeStatus = async (record) => {

        const newStatus =
            record.is_active === 1 ? 0 : 1;


        const result = await Swal.fire({

            title:
                newStatus
                    ? "Activate Fee Head?"
                    : "Deactivate Fee Head?",

            text:
                record.fee_head_name,

            icon: "question",

            showCancelButton: true,

            confirmButtonText: "Yes"

        });


        if (!result.isConfirmed) {
            return;
        }


        try {

            await axios.put(
                `${API}/fee-heads/${record.fee_head_id}/status`,
                {
                    is_active: newStatus
                }
            );

            loadFeeHeads();

        } catch (error) {

            console.error(error);

            Swal.fire(
                "Error",
                "Failed to update status",
                "error"
            );
        }
    };


    // =====================================================
    // SEARCH
    // =====================================================

    const filteredData =
        feeHeads.filter((item) => {

            const text = `
                ${item.fee_head_name || ""}
                ${item.fee_type_name || ""}
            `.toLowerCase();

            return text.includes(
                search.toLowerCase()
            );
        });


    // =====================================================
    // TABLE COLUMNS
    // =====================================================

    const columns = [

        {
            title: "#",
            width: 60,

            render: (_, __, index) =>
                index + 1
        },


        {
            title: "Fee Type",
            dataIndex: "fee_type_name"
        },


        {
            title: "Fee Head",
            dataIndex: "fee_head_name"
        },


        {
            title: "Status",
            dataIndex: "is_active",

            render: (value) => (

                value === 1

                    ? (
                        <Tag color="green">
                            ACTIVE
                        </Tag>
                    )

                    : (
                        <Tag color="red">
                            INACTIVE
                        </Tag>
                    )
            )
        },


        {
            title: "Action",

            render: (_, record) => (

                <Space>

                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() =>
                            openEdit(record)
                        }
                    >
                        Edit
                    </Button>


                    <Button
                        danger={
                            record.is_active === 1
                        }
                        onClick={() =>
                            changeStatus(record)
                        }
                    >
                        {
                            record.is_active === 1
                                ? "Deactivate"
                                : "Activate"
                        }
                    </Button>

                </Space>
            )
        }

    ];


    // =====================================================
    // RETURN
    // =====================================================

    return (

        <div className="fee-head-page">


            {/* HEADER */}

            <div className="fee-head-header">

                <h2>
                    Fee Heads
                </h2>


                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={openAdd}
                >
                    Add Fee Head
                </Button>

            </div>


            {/* SEARCH */}

            <div className="fee-head-toolbar">

                <Input
                    placeholder="Search Fee Type or Fee Head..."
                    value={search}
                    onChange={(e) =>
                        setSearch(e.target.value)
                    }
                    allowClear
                />

            </div>


            {/* TABLE */}

            <Table
                rowKey="fee_head_id"
                columns={columns}
                dataSource={filteredData}
                loading={loading}
                bordered
                pagination={{
                    pageSize: 10
                }}
            />


            {/* MODAL */}

            <Modal

                title={
                    editingId
                        ? "Edit Fee Head"
                        : "Add Fee Head"
                }

                open={modalOpen}

                onCancel={() => {

                    setModalOpen(false);

                    form.resetFields();

                    setEditingId(null);

                }}

                onOk={handleSave}

                okText={
                    editingId
                        ? "Update"
                        : "Save"
                }

                destroyOnClose
            >

                <Form
                    form={form}
                    layout="vertical"
                >


                    {/* FEE TYPE */}

                    <Form.Item
                        name="fee_type_id"
                        label="Fee Type"
                        rules={[
                            {
                                required: true,
                                message:
                                    "Please select Fee Type"
                            }
                        ]}
                    >

                        <Select
                            placeholder="Select Fee Type"
                            showSearch
                            optionFilterProp="label"

                            options={
                                feeTypes.map(
                                    (type) => ({

                                        value:
                                            type.id,

                                        label:
                                            type.name

                                    })
                                )
                            }
                        />

                    </Form.Item>


                    {/* FEE HEAD */}

                    <Form.Item
                        name="fee_head_name"
                        label="Fee Head"
                        rules={[
                            {
                                required: true,
                                message:
                                    "Please enter Fee Head"
                            }
                        ]}
                    >

                        <Input
                            placeholder="e.g. MONTHLY TUITION FEE"

                            onChange={(e) =>
                                form.setFieldValue(
                                    "fee_head_name",
                                    e.target.value.toUpperCase()
                                )
                            }
                        />

                    </Form.Item>


                </Form>

            </Modal>

        </div>
    );
};

export default FeeHeads;