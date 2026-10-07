
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    Card,
    Form,
    Input,
    Button,
    Table,
    Space,
    Popconfirm,
    Switch,
    message,
    Tag
} from "antd";

const DeveloperPages = () => {

    const [form] = Form.useForm();

    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);


    /* =========================================================
       LOAD PAGES
       ========================================================= */

    const loadPages = async () => {

        try {

            setLoading(true);

            const response = await axios.get(
                "/api/pages"
            );

            setPages(response.data);

        } catch (error) {

            console.error("Load Pages Error:", error);

            message.error(
                error.response?.data?.message ||
                "Unable to load pages"
            );

        } finally {

            setLoading(false);
        }
    };


    /* =========================================================
       INITIAL LOAD
       ========================================================= */

    useEffect(() => {

        loadPages();

    }, []);


    /* =========================================================
       SAVE PAGE
       ========================================================= */

    const handleSubmit = async (values) => {

        try {

            setSaving(true);

            if (editingId) {

                await axios.put(
                    `/api/pages/${editingId}`,
                    values
                );

                message.success(
                    "Page updated successfully"
                );

            } else {

                await axios.post(
                    "/api/pages",
                    values
                );

                message.success(
                    "Page registered successfully"
                );
            }


            form.resetFields();
            setEditingId(null);

            loadPages();

        } catch (error) {

            console.error("Save Page Error:", error);

            message.error(
                error.response?.data?.message ||
                "Unable to save page"
            );

        } finally {

            setSaving(false);
        }
    };


    /* =========================================================
       EDIT
       ========================================================= */

    const handleEdit = (record) => {

        setEditingId(record.page_id);

        form.setFieldsValue({
            page_name: record.page_name,
            page_key: record.page_key,
            route: record.route,
            is_active: record.is_active === 1
        });

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };


    /* =========================================================
       CANCEL EDIT
       ========================================================= */

    const handleCancel = () => {

        setEditingId(null);

        form.resetFields();
    };


    /* =========================================================
       DELETE
       ========================================================= */

    const handleDelete = async (id) => {

        try {

            await axios.delete(
                `/api/pages/${id}`
            );

            message.success(
                "Page deleted successfully"
            );

            loadPages();

        } catch (error) {

            console.error(
                "Delete Page Error:",
                error
            );

            message.error(
                error.response?.data?.message ||
                "Unable to delete page"
            );
        }
    };


    /* =========================================================
       COLUMNS
       ========================================================= */

    const columns = [

        {
            title: "#",
            key: "index",
            width: 60,

            render: (_, __, index) =>
                index + 1
        },

        {
            title: "Page Name",
            dataIndex: "page_name",
            key: "page_name"
        },

        {
            title: "Page Key",
            dataIndex: "page_key",
            key: "page_key",

            render: (value) => (
                <Tag color="blue">
                    {value}
                </Tag>
            )
        },

        {
            title: "Route",
            dataIndex: "route",
            key: "route"
        },

        {
            title: "Status",
            dataIndex: "is_active",
            key: "is_active",

            render: (value) =>
                value === 1 ? (
                    <Tag color="green">
                        Active
                    </Tag>
                ) : (
                    <Tag color="red">
                        Inactive
                    </Tag>
                )
        },

        {
            title: "Actions",
            key: "actions",

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


                    <Popconfirm
                        title="Delete this page?"
                        description="Page permissions will also be removed."
                        okText="Yes"
                        cancelText="No"
                        onConfirm={() =>
                            handleDelete(
                                record.page_id
                            )
                        }
                    >

                        <Button
                            danger
                            size="small"
                        >
                            Delete
                        </Button>

                    </Popconfirm>

                </Space>
            )
        }
    ];


    /* =========================================================
       RETURN
       ========================================================= */

    return (

        <div
            style={{
                padding: 20
            }}
        >

            <Card
                title={
                    editingId
                        ? "Edit Page"
                        : "Register New Page"
                }
            >

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{
                        is_active: true
                    }}
                >

                    <Form.Item
                        label="Page Name"
                        name="page_name"
                        rules={[
                            {
                                required: true,
                                message:
                                    "Please enter page name"
                            }
                        ]}
                    >

                        <Input
                            placeholder="e.g. Student"
                        />

                    </Form.Item>


                    <Form.Item
                        label="Page Key"
                        name="page_key"
                        rules={[
                            {
                                required: true,
                                message:
                                    "Please enter page key"
                            }
                        ]}
                    >

                        <Input
                            placeholder="e.g. STUDENT"
                        />

                    </Form.Item>


                    <Form.Item
                        label="React Route"
                        name="route"
                        rules={[
                            {
                                required: true,
                                message:
                                    "Please enter route"
                            }
                        ]}
                    >

                        <Input
                            placeholder="e.g. /students"
                        />

                    </Form.Item>


                    <Form.Item
                        label="Active"
                        name="is_active"
                        valuePropName="checked"
                    >

                        <Switch />

                    </Form.Item>


                    <Space>

                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={saving}
                        >
                            {editingId
                                ? "Update Page"
                                : "Register Page"}
                        </Button>


                        {editingId && (

                            <Button
                                onClick={
                                    handleCancel
                                }
                            >
                                Cancel
                            </Button>

                        )}

                    </Space>

                </Form>

            </Card>


            <Card
                title="Registered Pages"
                style={{
                    marginTop: 20
                }}
            >

                <Table
                    rowKey="page_id"
                    columns={columns}
                    dataSource={pages}
                    loading={loading}
                    bordered
                    pagination={{
                        pageSize: 10
                    }}
                />

            </Card>

        </div>
    );
};


export default DeveloperPages;
