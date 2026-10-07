
import React, {
    useEffect,
    useState
} from "react";

import axios from "axios";
import Swal from "sweetalert2";

import {
    Form,
    Input,
    Button,
    Select,
    DatePicker,
    Table,
    Space,
    Modal,
    Row,
    Col,
    Card,
    Tag
} from "antd";

import dayjs from "dayjs";

import "./Student.css";
const user = JSON.parse(localStorage.getItem("user"));

const isAdmin =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "CAMPUS_ADMIN";

const Student = () => {

    const [form] = Form.useForm();
    const [statusForm] = Form.useForm();


    const [students, setStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);

    const [loading, setLoading] = useState(false);

    const [editingId, setEditingId] = useState(null);

    const [searchText, setSearchText] = useState("");

    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [statusStudent, setStatusStudent] = useState(null);

    const [statusLoading, setStatusLoading] = useState(false);
    const [campuses, setCampuses] = useState([]);

// =====================================================
// LOAD ALL DATA
// =====================================================

const loadData = async () => {

    try {

        setLoading(true);

        const user = JSON.parse(
            localStorage.getItem("user")
        );

        console.log("LOGGED USER:", user);

        const [
            studentResponse,
            classResponse,
            sectionResponse,
            campusesResponse
        ] = await Promise.all([

            axios.get(
                "/api/students",
                {
                    params: {
                        campus_id: user?.campus_id,
                        section_id: user?.section_id,
                        role: user?.role
                    }
                }
            ),

            axios.get(
                "/api/student-classes"
            ),

            axios.get(
                "/api/student-sections"
            ),

            axios.get(
                "/api/student-campuses"
            )

        ]);

        console.log(
            "STUDENT RESPONSE:",
            studentResponse.data
        );

        setStudents(
            studentResponse.data
        );

        setClasses(
            classResponse.data
        );

        setSections(
            sectionResponse.data
        );

        setCampuses(
            campusesResponse.data
        );

    } catch (error) {

        console.error(error);

        Swal.fire(
            "Error",
            "Unable to load student data",
            "error"
        );

    } finally {

        setLoading(false);

    }

};
    


    useEffect(() => {

        loadData();
        

    }, []);

useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) return;

    form.setFieldsValue({
        campus_id: user.campus_id,
        section_id: user.section_id
    });
}, [form]);
    // =====================================================
    // GET NEXT ADMISSION NUMBER
    // =====================================================

    const loadNextAdmissionNo = async () => {

        try {

            const response =
                await axios.get(
                    "/api/students/next-admission-no"
                );


            form.setFieldValue(
                "admission_no",
                response.data.admission_no
            );


        } catch (error) {

            console.error(
                "NEXT ADMISSION NO ERROR:",
                error
            );

            Swal.fire(
                "Error",
                "Unable to generate admission number",
                "error"
            );

        }

    };


    // =====================================================
    // INITIAL FORM
    // =====================================================

    useEffect(() => {

        if (!editingId) {

            form.setFieldsValue({

                gender: "Male",

                student_status: "Active"

            });

        }

    }, [form, editingId]);


    // =====================================================
    // RESET
    // =====================================================

const resetForm = () => {

    const user = JSON.parse(localStorage.getItem("user"));

    form.resetFields();

    setEditingId(null);

    form.setFieldsValue({
        gender: "Male",
        student_status: "Active",

        campus_id: user?.campus_id,
        section_id: user?.section_id,
    });

    loadNextAdmissionNo();
};

    // =====================================================
    // SAVE / UPDATE
    // =====================================================

    const handleSubmit = async (values) => {

            try {

            const user = JSON.parse(
            localStorage.getItem("user") || "{}"
        );

            const data = {

             user_id: user?.user_id,
            campus_id: user?.campus_id,    

                student_name:
                    values.student_name
                        ?.trim()
                        .toUpperCase(),

                father_name:
                    values.father_name
                        ?.trim()
                        .toUpperCase(),

                date_of_birth:
                    values.date_of_birth
                        ? values.date_of_birth.format(
                            "YYYY-MM-DD"
                        )
                        : null,

                gender:
                    values.gender || "Male",

                class_id:
                    values.class_id,

                section_id:
                    values.section_id,

                admission_date:
                    values.admission_date
                        ? values.admission_date.format(
                            "YYYY-MM-DD"
                        )
                        : null,

                student_phone:
                    values.student_phone
                        ?.trim() || null,

                father_phone:
                    values.father_phone
                        ?.trim() || null,

                guardian_name:
                    values.guardian_name
                        ?.trim()
                        .toUpperCase() || null,

                guardian_phone:
                    values.guardian_phone
                        ?.trim() || null,

                address:
                    values.address
                        ?.trim()
                        .toUpperCase() || null,

                previous_school:
                    values.previous_school
                        ?.trim()
                        .toUpperCase() || null,

                student_status:
                    values.student_status ||
                    "Active",

                remarks:
                    values.remarks
                        ?.trim()
                        .toUpperCase() || null

            };


            // =================================================
            // UPDATE
            // =================================================
if (editingId) {

    data.admission_no =
        values.admission_no
            ?.trim()
            .toUpperCase();

    await axios.put(
        `/api/students/${editingId}`,
        data
    );
       await Swal.fire(
        "Update",
         `Student Update successfully`,
        "success"
    );
    loadData();

} else {

    const response = await axios.post(
        "/api/students",
        data
    );


    await Swal.fire(
        "Saved",
        `Student updated successfully\nAdmission No: ${response.data.admission_no || data.admission_no}`,
        "success"
    );
    loadData();
}


            resetForm();

            await loadData();


        } catch (error) {

            console.error(error);

            Swal.fire(

                "Error",

                error.response?.data?.message ||
                "Unable to save student",

                "error"

            );

        }

    };


    // =====================================================
    // EDIT
    // =====================================================

    const handleEdit = (record) => {

        setEditingId(
            record.student_id
        );


        form.setFieldsValue({

            admission_no:
                record.admission_no,

            student_name:
                record.student_name,

            father_name:
                record.father_name,

            date_of_birth:
                record.date_of_birth
                    ? dayjs(
                        record.date_of_birth
                    )
                    : null,

            gender:
                record.gender,

            class_id:
                record.class_id,

            section_id:
                record.section_id,

            admission_date:
                record.admission_date
                    ? dayjs(
                        record.admission_date
                    )
                    : null,

            student_phone:
                record.student_phone,

            father_phone:
                record.father_phone,

            guardian_name:
                record.guardian_name,

            guardian_phone:
                record.guardian_phone,

            address:
                record.address,

            previous_school:
                record.previous_school,

            student_status:
                record.student_status,

            remarks:
                record.remarks

        });


        setTimeout(() => {

            window.scrollTo({

                top: 0,

                behavior: "smooth"

            });

        }, 100);

    };


    // =====================================================
    // OPEN STATUS MODAL
    // =====================================================

    const openStatusModal = (record) => {

        setStatusStudent(record);

        statusForm.setFieldsValue({

            student_status:
                record.student_status

        });

        setStatusModalOpen(true);

    };


    // =====================================================
    // CLOSE STATUS MODAL
    // =====================================================

    const closeStatusModal = () => {

        setStatusModalOpen(false);

        setStatusStudent(null);

        statusForm.resetFields();

    };


    // =====================================================
    // UPDATE STATUS
    // =====================================================

    const handleStatusUpdate = async (values) => {

        if (!statusStudent) {

            return;

        }


        try {

            setStatusLoading(true);


            await axios.put(

                `/api/students/${statusStudent.student_id}/status`,

                {
                    student_status:
                        values.student_status
                }

            );


            closeStatusModal();


            await Swal.fire(

                "Updated",

                "Student status updated successfully",

                "success"

            );


            await loadData();


        } catch (error) {

            console.error(error);

            Swal.fire(

                "Error",

                error.response?.data?.message ||
                "Unable to update student status",

                "error"

            );

        } finally {

            setStatusLoading(false);

        }

    };


    // =====================================================
    // SELECTED CLASS
    // =====================================================

    const selectedClassId =
        Form.useWatch(
            "class_id",
            form
        );


    // =====================================================
    // FILTER SECTIONS
    // =====================================================

    // const filteredSections =
    //     sections.filter(

    //         section =>

    //             Number(section.class_id) ===
    //             Number(selectedClassId)

    //     );


    // =====================================================
    // SEARCH
    // =====================================================

    const filteredStudents =
        students.filter(
            student => {

                const search =
                    searchText
                        .toLowerCase()
                        .trim();


                return (

                    student.admission_no
                        ?.toLowerCase()
                        .includes(search)

                    ||

                    student.student_name
                        ?.toLowerCase()
                        .includes(search)

                    ||

                    student.father_name
                        ?.toLowerCase()
                        .includes(search)

                    ||

                    student.class_name
                        ?.toLowerCase()
                        .includes(search)

                    ||

                    student.section_name
                        ?.toLowerCase()
                        .includes(search)

                );

            }
        );


    // =====================================================
    // TABLE COLUMNS
    // =====================================================

    const columns = [

        {
            title: "#",

            width: 60,

            render: (
                _,
                __,
                index
            ) =>
                index + 1

        },


        {
            title: "Admission No",

            dataIndex: "admission_no",

            key: "admission_no"

        },


        {
            title: "Student Name",

            dataIndex: "student_name",

            key: "student_name"

        },


        {
            title: "Father Name",

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
            title: "Phone",

            dataIndex: "student_phone",

            key: "student_phone"

        },


        {
            title: "Status",

            dataIndex: "student_status",

            key: "student_status",

            render: (status) => (

                <Tag

                    color={

                        status === "Active"

                            ? "green"

                            : status === "Left"

                                ? "red"

                                : "orange"

                    }

                >

                    {status}

                </Tag>

            )

        },


        // =================================================
        // ACTION
        // =================================================

        {
            title: "Action",

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

                        size="small"

                        onClick={() =>
                            openStatusModal(
                                record
                            )
                        }

                    >

                        Status

                    </Button>

                </Space>

            )

        }

    ];


    // =====================================================
    // PAGE
    // =====================================================

    return (

        <div className="student-page">


            {/* =================================================
                ADD / UPDATE STUDENT
            ================================================= */}

            <Card

                title={
                    editingId
                        ? "UPDATE STUDENT"
                        : "ADD STUDENT"
                }

                className="student-card"

            >

                <Form

                    form={form}

                    layout="vertical"

                    onFinish={
                        handleSubmit
                    }

                >


                    {/* =================================================
                        ROW 1
                    ================================================= */}

                    <Row gutter={16}>


                        {/* ADMISSION NO */}

                        <Col
                            xs={24}
                            md={8}
                        >

                            <Form.Item

                                label="Admission No"

                                name="admission_no"

                            >

                                <Input

                                    placeholder="Admission No"

                                    disabled={
                                        !editingId
                                    }

                                />

                            </Form.Item>

                        </Col>


                        {/* STUDENT NAME */}

                        <Col
                            xs={24}
                            md={8}
                        >

                            <Form.Item

                                label="Student Name"

                                name="student_name"

                                rules={[
                                    {
                                        required: true,

                                        message:
                                            "Please enter student name"
                                    }
                                ]}

                            >

                                <Input

                                    placeholder="Student Name"

                                />

                            </Form.Item>

                        </Col>


                        {/* FATHER NAME */}

                        <Col
                            xs={24}
                            md={8}
                        >

                            <Form.Item

                                label="Father Name"

                                name="father_name"

                                rules={[
                                    {
                                        required: true,

                                        message:
                                            "Please enter father name"
                                    }
                                ]}

                            >

                                <Input

                                    placeholder="Father Name"

                                />

                            </Form.Item>

                        </Col>

                    </Row>


                    {/* =================================================
                        ROW 2
                    ================================================= */}

                    <Row gutter={16}>


                        {/* DOB */}

                        <Col
                            xs={24}
                            md={6}
                        >

                            <Form.Item

                                label="Date of Birth"

                                name="date_of_birth"

                            >

                                <DatePicker

                                    format="DD-MM-YYYY"

                                    style={{
                                        width: "100%"
                                    }}

                                />

                            </Form.Item>

                        </Col>


                        {/* GENDER */}

                        <Col
                            xs={24}
                            md={6}
                        >

                            <Form.Item

                                label="Gender"

                                name="gender"

                            >

                                <Select>

                                    <Select.Option value="Male">
                                        Male
                                    </Select.Option>

                                    <Select.Option value="Female">
                                        Female
                                    </Select.Option>

                                    <Select.Option value="Other">
                                        Other
                                    </Select.Option>

                                </Select>

                            </Form.Item>

                        </Col>


                        {/* CLASS */}

                        <Col
                            xs={24}
                            md={6}
                        >

                            <Form.Item

                                label="Class"

                                name="class_id"

                                rules={[
                                    {
                                        required: true,

                                        message:
                                            "Please select class"
                                    }
                                ]}

                            >

                                <Select

                                    placeholder="Select Class"

                                    onChange={() => {

                                        // form.setFieldValue(

                                        //     "section_id",

                                        //     undefined

                                        // );

                                    }}

                                >

                                    {classes.map(
                                        item => (

                                            <Select.Option

                                                key={
                                                    item.class_id
                                                }

                                                value={
                                                    item.class_id
                                                }

                                            >

                                                {
                                                    item.name
                                                }

                                            </Select.Option>

                                        )
                                    )}

                                </Select>

                            </Form.Item>

                        </Col>


                        {/* SECTION */}

                        <Col
                            xs={24}
                            md={6}
                        >

                            <Form.Item
                                name="section_id"
                                label="Section"
                            >
                                <Select
                                    disabled={!isAdmin}
                                    placeholder="Select Section"
                                    options={sections.map(section => ({
                                        value: section.section_id,
                                        label: section.section_name
                                    }))}
                                />
                            </Form.Item>

                        </Col>

                          {/* Campus */}

                        <Col
                            xs={24}
                            md={6}
                        >

                          <Form.Item
                                name="campus_id"
                                label="Campus"
                            >
                                <Select
                                    disabled={!isAdmin}
                                    placeholder="Select Campus"
                                    options={campuses.map(campus => ({
                                        value: campus.campus_id,
                                        label: campus.name
                                    }))}
                                />
                            </Form.Item>

                        </Col>

                    </Row>


                    {/* =================================================
                        ROW 3
                    ================================================= */}

                    <Row gutter={16}>


                        {/* ADMISSION DATE */}

                        <Col
                            xs={24}
                            md={6}
                        >

                            <Form.Item

                                label="Admission Date"

                                name="admission_date"

                            >

                                <DatePicker

                                    format="DD-MM-YYYY"

                                    style={{
                                        width: "100%"
                                    }}

                                />

                            </Form.Item>

                        </Col>


                        {/* STUDENT PHONE */}

                        <Col
                            xs={24}
                            md={6}
                        >

                            <Form.Item

                                label="Student Phone"

                                name="student_phone"

                            >

                                <Input

                                    placeholder="Student Phone"

                                />

                            </Form.Item>

                        </Col>


                        {/* FATHER PHONE */}

                        <Col
                            xs={24}
                            md={6}
                        >

                            <Form.Item

                                label="Father Phone"

                                name="father_phone"

                            >

                                <Input

                                    placeholder="Father Phone"

                                />

                            </Form.Item>

                        </Col>


                        {/* STATUS */}

                        <Col
                            xs={24}
                            md={6}
                        >

                            <Form.Item

                                label="Student Status"

                                name="student_status"

                            >

                                <Select>

                                    <Select.Option value="Active">
                                        Active
                                    </Select.Option>

                                    <Select.Option value="Inactive">
                                        Inactive
                                    </Select.Option>

                                    <Select.Option value="Left">
                                        Left
                                    </Select.Option>

                                </Select>

                            </Form.Item>

                        </Col>

                    </Row>


                    {/* =================================================
                        ROW 4
                    ================================================= */}

                    <Row gutter={16}>


                        {/* GUARDIAN */}

                        <Col
                            xs={24}
                            md={8}
                        >

                            <Form.Item

                                label="Guardian Name"

                                name="guardian_name"

                            >

                                <Input />

                            </Form.Item>

                        </Col>


                        {/* GUARDIAN PHONE */}

                        <Col
                            xs={24}
                            md={8}
                        >

                            <Form.Item

                                label="Guardian Phone"

                                name="guardian_phone"

                            >

                                <Input />

                            </Form.Item>

                        </Col>


                        {/* PREVIOUS SCHOOL */}

                        <Col
                            xs={24}
                            md={8}
                        >

                            <Form.Item

                                label="Previous School"

                                name="previous_school"

                            >

                                <Input />

                            </Form.Item>

                        </Col>

                    </Row>


                    {/* =================================================
                        ADDRESS
                    ================================================= */}

                    <Row gutter={16}>

                        <Col xs={24}>

                            <Form.Item

                                label="Address"

                                name="address"

                            >

                                <Input.TextArea

                                    rows={2}

                                />

                            </Form.Item>

                        </Col>

                    </Row>


                    {/* =================================================
                        REMARKS
                    ================================================= */}

                    <Row gutter={16}>

                        <Col xs={24}>

                            <Form.Item

                                label="Remarks"

                                name="remarks"

                            >

                                <Input.TextArea

                                    rows={2}

                                />

                            </Form.Item>

                        </Col>

                    </Row>


                    {/* =================================================
                        BUTTONS
                    ================================================= */}

                    <Space>

                        <Button

                            type="primary"

                            htmlType="submit"

                        >

                            {
                                editingId
                                    ? "UPDATE"
                                    : "SAVE"
                            }

                        </Button>


                        <Button
                            onClick={
                                resetForm
                            }
                        >

                            RESET

                        </Button>

                    </Space>

                </Form>

            </Card>


            {/* =================================================
                STUDENT LIST
            ================================================= */}

            <Card

                title="STUDENT LIST"

                className="student-table-card"

            >

                <div
                    style={{
                        marginBottom: 16
                    }}
                >

                    <Input

                        placeholder="Search Admission No, Student, Father, Class..."

                        value={
                            searchText
                        }

                        onChange={
                            e =>
                                setSearchText(
                                    e.target.value
                                )
                        }

                        allowClear

                        style={{
                            maxWidth: 450
                        }}

                    />

                </div>


                <Table

                    rowKey="student_id"

                    columns={columns}

                    dataSource={
                        filteredStudents
                    }

                    loading={
                        loading
                    }

                    bordered

                    scroll={{
                        x: 1200
                    }}

                    pagination={{

                        pageSize: 40,

                        showSizeChanger: true

                    }}

                />

            </Card>


            {/* =================================================
                STATUS MODAL
            ================================================= */}

            <Modal

                title={
                    statusStudent
                        ? `CHANGE STATUS - ${statusStudent.student_name}`
                        : "CHANGE STUDENT STATUS"
                }

                open={
                    statusModalOpen
                }

                onCancel={
                    closeStatusModal
                }

                footer={null}

                destroyOnClose

            >

                <Form

                    form={
                        statusForm
                    }

                    layout="vertical"

                    onFinish={
                        handleStatusUpdate
                    }

                >

                    <Form.Item

                        label="Student Status"

                        name="student_status"

                        rules={[
                            {
                                required: true,

                                message:
                                    "Please select status"
                            }
                        ]}

                    >

                        <Select>

                            <Select.Option value="Active">
                                Active
                            </Select.Option>

                            <Select.Option value="Inactive">
                                Inactive
                            </Select.Option>

                            <Select.Option value="Left">
                                Left
                            </Select.Option>

                        </Select>

                    </Form.Item>


                    <Space>

                        <Button
                            onClick={
                                closeStatusModal
                            }
                        >
                            CANCEL
                        </Button>


                        <Button

                            type="primary"

                            htmlType="submit"

                            loading={
                                statusLoading
                            }

                        >

                            UPDATE STATUS

                        </Button>

                    </Space>

                </Form>

            </Modal>


        </div>

    );

};


export default Student;
