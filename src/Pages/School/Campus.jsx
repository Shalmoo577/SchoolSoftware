import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import './School.css';
import {
    Form,
    Input,
    Button,
    Table,
    Space,
    Card
} from "antd";

import {
    SaveOutlined,
    EditOutlined,
    CloseOutlined,
    SearchOutlined
} from "@ant-design/icons";


const Campus = () => {

    const [form] = Form.useForm();

    const [campuses, setCampuses] = useState([]);

    const [loading, setLoading] = useState(false);

    const [editingId, setEditingId] = useState(null);

    const [searchText, setSearchText] = useState("");


    // ============================
    // LOAD DATA
    // ============================

    const loadCampuses = async () => {

        try {

            setLoading(true);

            const response = await axios.get(
                "/api/campuses"
            );

            setCampuses(response.data);

        } catch (error) {

            console.error(error);

            Swal.fire(
                "Error",
                "Unable to load campus data",
                "error"
            );

        } finally {

            setLoading(false);
        }
    };


    useEffect(() => {

        loadCampuses();

    }, []);


    // ============================
    // SAVE / UPDATE
    // ============================

    const handleSubmit = async (values) => {

        try {

            setLoading(true);

            const data = {
                name: values.name?.trim().toUpperCase(),
                code: values.code?.trim().toUpperCase(),
                address: values.address?.trim().toUpperCase(),
                phone: values.phone?.trim()
            };


            // UPDATE

            if (editingId) {

                await axios.put(
                    `/api/campuses/${editingId}`,
                    data
                );

                Swal.fire({
                    icon: "success",
                    title: "Updated",
                    text: "Campus updated successfully",
                    timer: 1500,
                    showConfirmButton: false
                });

            }

            // SAVE

            else {

                await axios.post(
                    "/api/campuses",
                    data
                );

                Swal.fire({
                    icon: "success",
                    title: "Saved",
                    text: "Campus saved successfully",
                    timer: 1500,
                    showConfirmButton: false
                });

            }


            // RESET

            form.resetFields();

            setEditingId(null);

            loadCampuses();

        } catch (error) {

            console.error(error);

            Swal.fire(
                "Error",
                error.response?.data?.message ||
                "Something went wrong",
                "error"
            );

        } finally {

            setLoading(false);
        }
    };


    // ============================
    // EDIT
    // ============================

    const handleEdit = (record) => {

        setEditingId(record.campus_id);

        form.setFieldsValue({

            name: record.name || "",
            code: record.code || "",
            address: record.address || "",
            phone: record.phone || ""

        });

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };


    // ============================
    // CANCEL
    // ============================

    const handleCancel = () => {

        form.resetFields();

        setEditingId(null);

    };


    // ============================
    // SEARCH
    // ============================

    const filteredData = campuses.filter((item) => {

        const search = searchText.toLowerCase();

        return (

            item.name?.toLowerCase().includes(search) ||

            item.code?.toLowerCase().includes(search) ||

            item.address?.toLowerCase().includes(search) ||

            item.phone?.toLowerCase().includes(search)

        );
    });


    // ============================
    // TABLE COLUMNS
    // ============================

    const columns = [

        {
            title: "#",
            key: "serial",
            width: 60,

            render: (_, record, index) => index + 1
        },


        {
            title: "Campus Name",
            dataIndex: "name",
            key: "name",

            sorter: (a, b) =>
                a.name.localeCompare(b.name)
        },


        {
            title: "Code",
            dataIndex: "code",
            key: "code",
            width: 120
        },


        {
            title: "Address",
            dataIndex: "address",
            key: "address"
        },


        {
            title: "Phone",
            dataIndex: "phone",
            key: "phone",
            width: 150
        },


        {
            title: "Created At",
            dataIndex: "created_at",
            key: "created_at",
            width: 180,

            render: (value) => {

                if (!value) return "";

                return new Date(value).toLocaleString();

            }
        },


        {
            title: "Action",
            key: "action",
            width: 100,

            render: (_, record) => (

                <Button
                    type="primary"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() =>
                        handleEdit(record)
                    }
                >
                    Edit
                </Button>

            )
        }

    ];


    return (

        <div
            style={{
                padding: "20px"
            }}
        >

            {/* ================================= */}
            {/* FORM */}
            {/* ================================= */}

            <Card
                title={
                    editingId
                        ? "Update Campus"
                        : "Campus"
                }
                style={{
                    marginBottom: 20
                }}
            >

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                >

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "2fr 1fr 2fr 1.5fr",
                            gap: "15px"
                        }}
                    >

                        {/* CAMPUS NAME */}

                        <Form.Item
                            label="Campus Name"
                            name="name"
                            rules={[
                                {
                                    required: true,
                                    message:
                                        "Please enter campus name"
                                }
                            ]}
                        >

                            <Input
                                placeholder="Enter campus name"
                                onChange={(e) =>
                                    form.setFieldValue(
                                        "name",
                                        e.target.value.toUpperCase()
                                    )
                                }
                            />

                        </Form.Item>


                        {/* CODE */}

                        <Form.Item
                            label="Code"
                            name="code"
                            rules={[
                                {
                                    required: true,
                                    message:
                                        "Please enter code"
                                }
                            ]}
                        >

                            <Input
                                placeholder="Code"
                                onChange={(e) =>
                                    form.setFieldValue(
                                        "code",
                                        e.target.value.toUpperCase()
                                    )
                                }
                            />

                        </Form.Item>


                        {/* ADDRESS */}

                        <Form.Item
                            label="Address"
                            name="address"
                        >

                            <Input
                                placeholder="Address"
                                onChange={(e) =>
                                    form.setFieldValue(
                                        "address",
                                        e.target.value.toUpperCase()
                                    )
                                }
                            />

                        </Form.Item>


                        {/* PHONE */}

                        <Form.Item
                            label="Phone"
                            name="phone"
                        >

                            <Input
                                placeholder="Phone"
                            />

                        </Form.Item>

                    </div>


                    {/* BUTTONS */}

                    <Space>

                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            icon={<SaveOutlined />}
                        >

                            {editingId
                                ? "Update"
                                : "Save"}

                        </Button>


                        {editingId && (

                            <Button
                                danger
                                icon={<CloseOutlined />}
                                onClick={handleCancel}
                            >
                                Cancel
                            </Button>

                        )}

                    </Space>

                </Form>

            </Card>


            {/* ================================= */}
            {/* TABLE */}
            {/* ================================= */}

            <Card
                title="Campus List"
            >

                {/* SEARCH */}

                <div
                    style={{
                        marginBottom: 15,
                        display: "flex",
                        justifyContent: "flex-end"
                    }}
                >

                    <Input
                        prefix={
                            <SearchOutlined />
                        }
                        placeholder="Search campus..."
                        value={searchText}
                        onChange={(e) =>
                            setSearchText(
                                e.target.value
                            )
                        }
                        allowClear
                        style={{
                            width: 300
                        }}
                    />

                </div>


                <Table
                    rowKey="id"

                    columns={columns}

                    dataSource={filteredData}

                    loading={loading}

                    bordered

                    scroll={{
                        x: 1000
                    }}

                    pagination={{
                        pageSize: 10,

                        showSizeChanger: true,

                        pageSizeOptions: [
                            "5",
                            "10",
                            "20",
                            "50"
                        ],

                        showTotal: (total, range) =>
                            `${range[0]}-${range[1]} of ${total} campuses`
                    }}

                    rowClassName={(record) =>
                        record.campus_id === editingId
                            ? "editing-row"
                            : ""
                    }

                />

            </Card>

        </div>
    );
};


export default Campus;