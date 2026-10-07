import React, { useRef, useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { SearchOutlined } from "@ant-design/icons";
import {
  Card,
  Row,
  Col,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Button,
  Table,
  Space,
} from "antd";

import dayjs from "dayjs";

const API = "/api";

const BankPayment2 = () => {
  const [form] = Form.useForm();

  const fileNoAutoFill = Form.useWatch("file_no", form);

  const [vno, setVno] = useState("");
  const [tableData, setTableData] = useState([]);

  const [getSa, setGetSa] = useState([]);
  const [banks, setBanks] = useState([]);

  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);

  const [editingVno, setEditingVno] = useState(null);

  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showLessAccount, setShowLessAccount] = useState(false);

  const [searchCheque, setSearchCheque] = useState("");
  const [searchVoucher, setSearchVoucher] = useState("");

  const addAccountRef = useRef(null);
  const lessToAccount = useRef(null);

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadNextVoucher();
    loadTable();
    loadAccounts();
  }, []);

  // =====================================================
  // FILE NO -> BILL NO
  // =====================================================

  useEffect(() => {
    if (fileNoAutoFill !== undefined) {
      form.setFieldsValue({
        bill_no: fileNoAutoFill || "",
      });
    }
  }, [fileNoAutoFill, form]);

  // =====================================================
  // FILTER TABLE
  // =====================================================

  const filteredData = tableData.filter((item) => {
    const matchesVoucher = String(item.vno || "")
      .toLowerCase()
      .includes(searchVoucher.toLowerCase());

    const matchesCheque = String(item.chq_no || "")
      .toLowerCase()
      .includes(searchCheque.toLowerCase());

    return matchesVoucher && matchesCheque;
  });

  // =====================================================
  // NORMALIZE API DATA
  // =====================================================

  const extractArray = (responseData) => {
    if (Array.isArray(responseData)) {
      return responseData;
    }

    if (Array.isArray(responseData?.data)) {
      return responseData.data;
    }

    if (Array.isArray(responseData?.rows)) {
      return responseData.rows;
    }

    if (Array.isArray(responseData?.result)) {
      return responseData.result;
    }

    return [];
  };

  
  // =====================================================
  // LOAD NEXT VOUCHER
  // =====================================================

  const loadNextVoucher = async () => {
    try {
      const response = await axios.get(
        `${API}/bank-payment/next-vno`
      );

      setVno(response.data?.vno || "");
    } catch (error) {
      console.error("Voucher error:", error);

      Swal.fire(
        "Error",
        "Unable to generate voucher number",
        "error"
      );
    }
  };

  // =====================================================
  // LOAD ACCOUNTS AND BANKS
  // =====================================================

    const loadAccounts = async () => {

        try {

            const saResponse = await axios.get(
                "/api/subsidiary-accounts"
            );

            const bankResponse = await axios.get(
                "/api/banks"
            );

            setGetSa(
                saResponse.data
            );

            setBanks(
                bankResponse.data
            );

        } catch (error) {

            console.error(
                "Account loading error:",
                error
            );
        }
    };


  // =====================================================
  // LOAD TABLE
  // =====================================================

  const loadTable = async () => {
    try {
      setTableLoading(true);

      const response = await axios.get(`${API}/list`);

      const data = extractArray(response.data);

      setTableData(data);
    } catch (error) {
      console.error("Table error:", error);

      Swal.fire(
        "Error",
        "Unable to load bank payment vouchers",
        "error"
      );
    } finally {
      setTableLoading(false);
    }
  };

  // =====================================================
  // CALCULATE AMOUNTS
  // =====================================================

  const calculateNetAmount = () => {
    const amount =
      Number(form.getFieldValue("amount")) || 0;

    const addAmount =
      Number(form.getFieldValue("add_amount")) || 0;

    const lessAmount =
      Number(form.getFieldValue("less_amount")) || 0;

    setShowAddAccount(addAmount > 0);
    setShowLessAccount(lessAmount > 0);

    const subAmount = amount + addAmount;
    const netAmount = subAmount - lessAmount;

    form.setFieldsValue({
      sub_amount: subAmount,
      net_amount: netAmount,
    });
  };

  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      const payload = {
        vno,

        post_date: values.post_date
          ? values.post_date.format("YYYY-MM-DD")
          : null,

        voucher_date: values.voucher_date
          ? values.voucher_date.format("YYYY-MM-DD")
          : null,

        chq_date: values.chq_date
          ? values.chq_date.format("YYYY-MM-DD")
          : null,

        sa_id: values.sa_id || null,
        bank_id: values.bank_id || null,

        chq_no: values.chq_no || "",
        file_no: values.file_no || "",
        bill_no: values.bill_no || "",
        narration: values.narration || "",

        amount: Number(values.amount || 0),

        add_amount: Number(values.add_amount || 0),

        add_amount_sa_id:
          values.add_amount_sa_id || null,

        sub_amount: Number(values.sub_amount || 0),

        less_amount: Number(values.less_amount || 0),

        less_amount_sa_id:
          values.less_amount_sa_id || null,

        net_amount: Number(values.net_amount || 0),
      };

      console.log("SUBMIT PAYLOAD:", payload);

      if (editingVno) {
        await axios.put(
          `${API}/bank-payment/${editingVno}`,
          payload
        );

        await Swal.fire(
          "Updated",
          "Bank payment updated successfully",
          "success"
        );
      } else {
        await axios.post(
          `${API}/bank-payment`,
          payload
        );

        await Swal.fire(
          "Saved",
          "Bank payment saved successfully",
          "success"
        );
      }

      resetForm();
      await loadTable();
    } catch (error) {
      console.error("Save error:", error);

      Swal.fire(
        "Error",
        error.response?.data?.message ||
          "Unable to save bank payment",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // EDIT
  // =====================================================

  const handleEdit = async (record) => {
    try {

      const response = await axios.get(
        `${API}/bank-payment/${record.vno}`
      );

      const item = response.data;

      console.log("EDIT RESPONSE:", item);

      setEditingVno(record.vno);
      setVno(record.vno);

      const addAccountId =
        item.add_amount_Sa_ID ??
        item.saMasterAddAccount ??
        item.addAccountId;

      const lessAccountId =
        item.less_amount_Sa_ID ??
        item.saMasterLessAccount ??
        item.lessAccountId;

      form.setFieldsValue({
        post_date: item.post_date
          ? dayjs(item.post_date)
          : null,

        voucher_date: item.voucher_date
          ? dayjs(item.voucher_date)
          : null,

        chq_date: item.chq_date
          ? dayjs(item.chq_date)
          : null,

        sa_id:
            item.sa_id,

        bank_id:
          item.bank_id,

        chq_no: item.chq_no || "",
        file_no: item.file_no || "",
        bill_no: item.bill_no || "",
        narration: item.narration || "",

        amount: Number(item.amount || 0),

        add_amount: Number(item.add_amount || 0),

        add_amount_sa_id:
          item.saMasterAddAccount,

        sub_amount: Number(item.sub_amount || 0),

        less_amount: Number(item.less_amount || 0),

        less_amount_sa_id:
           item.saMasterLessAccount,

        net_amount: Number(item.net_amount || 0),
      });

    if (Number(record.add_amount || 0) > 0) {

        setShowAddAccount(true);

    } else {

        setShowAddAccount(false);

        // Clear old selected account
        form.setFieldValue("add_amount_sa_id", null);
    }

        if (Number(record.less_amount || 0) > 0) {

        setShowLessAccount(true);

    } else {

        setShowLessAccount(false);

        // Clear old selected account
        form.setFieldValue("less_amount_sa_id", null);
 }
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error("Edit error:", error);

      Swal.fire(
        "Error",
        "Unable to load voucher",
        "error"
      );
    }
  };

  // =====================================================
  // DELETE
  // =====================================================

  const handleDelete = async (record) => {
    const targetVno = record.vno;

    const result = await Swal.fire({
      title: "Delete Voucher?",
      text: `Voucher ${targetVno} will be deleted.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(
        `${API}/bank-payment/${targetVno}`
      );

      await Swal.fire(
        "Deleted",
        "Bank payment deleted successfully",
        "success"
      );

      if (editingVno === targetVno) {
        resetForm();
      }

      await loadTable();
    } catch (error) {
      console.error("Delete error:", error);

      Swal.fire(
        "Error",
        error.response?.data?.message ||
          "Unable to delete voucher",
        "error"
      );
    }
  };

  // =====================================================
  // PRINT
  // =====================================================

  const handlePrint = async (record) => {
    try {
      const [
        voucherResponse,
        companyResponse,
      ] = await Promise.all([
        axios.get(
          `${API}/bank-payment/print/${record.vno}`
        ),

        axios.get(`${API}/company-profile`),
      ]);

      const voucher =
        voucherResponse.data?.voucher || {};

      const accounts =
        voucherResponse.data?.accounts || [];

      const company =
        companyResponse.data || {};

      const printWindow = window.open(
        "",
        "_blank",
        "width=900,height=700"
      );

      if (!printWindow) {
        Swal.fire(
          "Popup Blocked",
          "Please allow popups for this website.",
          "warning"
        );

        return;
      }

      const accountRows = accounts
        .map((account) => {
          const debit =
            Number(account.DEBIT || 0);

          const credit =
            Number(account.CREDIT || 0);

          return `
            <tr>
              <td>${account.SA_Name || ""}</td>
              <td class="amount">
                ${
                  debit > 0
                    ? debit.toLocaleString()
                    : ""
                }
              </td>
              <td class="amount">
                ${
                  credit > 0
                    ? credit.toLocaleString()
                    : ""
                }
              </td>
            </tr>
          `;
        })
        .join("");

      printWindow.document.write(`
        <html>
          <head>
            <title>
              Bank Payment Voucher - ${
                voucher.vno || ""
              }
            </title>

            <style>
              body {
                font-family: Arial, sans-serif;
                padding: 20px;
              }

              .voucher {
                border: 1px solid #000;
                padding: 20px;
              }

              .header {
                text-align: center;
                margin-bottom: 20px;
              }

              .company {
                font-size: 24px;
                font-weight: bold;
              }

              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 15px;
              }

              th,
              td {
                border: 1px solid #000;
                padding: 8px;
              }

              .amount {
                text-align: right;
              }
            </style>
          </head>

          <body>
            <div class="voucher">

              <div class="header">
                <div class="company">
                  ${company.company_name || ""}
                </div>

                <div>
                  ${company.address || ""}
                </div>

                <h3>
                  BANK PAYMENT VOUCHER
                </h3>
              </div>

              <div>
                <strong>Voucher No:</strong>
                ${voucher.vno || ""}
              </div>

              <div>
                <strong>Narration:</strong>
                ${voucher.narration || ""}
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Account</th>
                    <th>Debit</th>
                    <th>Credit</th>
                  </tr>
                </thead>

                <tbody>
                  ${accountRows}
                </tbody>
              </table>

            </div>

            <script>
              window.onload = function() {
                window.print();
              };
            </script>
          </body>
        </html>
      `);

      printWindow.document.close();
    } catch (error) {
      console.error("Print error:", error);

      Swal.fire(
        "Error",
        "Unable to print voucher",
        "error"
      );
    }
  };

  // =====================================================
  // RESET
  // =====================================================

  const resetForm = () => {
    form.resetFields();

    setEditingVno(null);

    setShowAddAccount(false);
    setShowLessAccount(false);

    form.setFieldsValue({
      post_date: dayjs(),
      voucher_date: dayjs(),
      chq_date: dayjs(),

      amount: 0,
      add_amount: 0,
      sub_amount: 0,
      less_amount: 0,
      net_amount: 0,

      sa_id: undefined,
      bank_id: undefined,
      add_amount_sa_id: undefined,
      less_amount_sa_id: undefined,
    });

    loadNextVoucher();
  };

  // =====================================================
  // TABLE COLUMNS
  // =====================================================

  const columns = [
    {
      title: "Voucher #",
      dataIndex: "vno",
      key: "vno",
      width: 100,
    },

    {
      title: "Voucher Date",
      dataIndex: "voucher_date",
      key: "voucher_date",
      width: 120,

      render: (date) =>
        date
          ? dayjs(date).format("DD-MM-YYYY")
          : "",
    },

    {
      title: "Cheque No",
      dataIndex: "chq_no",
      key: "chq_no",
      width: 170,
    },

    {
      title: "Bill No",
      dataIndex: "bill_no",
      key: "bill_no",
      width: 150,
    },

    {
      title: "Amount",
      dataIndex: "net_amount",
      key: "net_amount",
      width: 130,
      align: "center",

      render: (amount) =>
        Number(amount || 0).toLocaleString(),
    },

    {
      title: "Narration",
      dataIndex: "narration",
      key: "narration",
    },

    {
      title: "Action",
      key: "action",
      width: 200,
      fixed: "right",

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
            danger
            size="small"
            onClick={() =>
              handleDelete(record)
            }
          >
            Delete
          </Button>

          <Button
            size="small"
            onClick={() =>
              handlePrint(record)
            }
          >
            Print
          </Button>
        </Space>
      ),
    },
  ];

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div style={{ padding: 20 }}>
      <Card
        title={`Bank Payment Voucher (${
          editingVno
            ? `Editing #${editingVno}`
            : "New"
        })`}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          onFinishFailed={(errorInfo) => {
            console.log(
              "Form Validation Failed:",
              errorInfo
            );
          }}
          initialValues={{
            post_date: dayjs(),
            voucher_date: dayjs(),
            chq_date: dayjs(),

            amount: 0,
            add_amount: 0,
            sub_amount: 0,
            less_amount: 0,
            net_amount: 0,
          }}
        >
          {/* =====================================================
              ROW 1
          ===================================================== */}

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item label="Voucher No">
                <Input
                  value={vno}
                  disabled
                />
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item
                name="voucher_date"
                label="Voucher Date"
              >
                <DatePicker
                  style={{ width: "100%" }}
                  format="DD-MM-YYYY"
                />
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item
                name="post_date"
                label="Post Date"
              >
                <DatePicker
                  style={{ width: "100%" }}
                  format="DD-MM-YYYY"
                />
              </Form.Item>
            </Col>

            <Col span={6}>
            <Form.Item
                                            label="Debit Account"
                                            name="sa_id"
            
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        "Please select debit account"
                                                }
                                            ]}
                                        >
            
                                            <Select
                                                showSearch
                                                placeholder="Select debit account"
            
                                                optionFilterProp="label"
            
                                                options={
                                                    getSa.map(
                                                        item => ({
                                                            value:
                                                                item.Sa_ID,
            
                                                            label:
                                                                item.SA_Name
                                                     })
                                                    )
                                                }
                                            />
            
                                        </Form.Item>


            </Col>
          </Row>

          {/* =====================================================
              ROW 2
          ===================================================== */}

          <Row gutter={16}>
            <Col span={6}>
                <Form.Item
                                              label="Bank Account"
                                              name="bank_id"
              
                                              rules={[
                                                  {
                                                      required: true,
                                                      message:
                                                          "Please select bank"
                                                  }
                                              ]}
                                          >
              
                                              <Select
                                                  showSearch
                                                  placeholder="Select bank"
              
                                                  optionFilterProp="label"
              
                                                  options={
                                                      banks.map(
                                                          item => ({
                                                              value:
                                                                  item.Sa_ID,
              
                                                              label:
                                                                  item.SA_Name
                                                          })
                                                      )
                                                  }
                                              />
              
                                          </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item
                name="chq_no"
                label="Cheque No"
              >
                <Input
                  placeholder="Cheque Number"
                />
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item
                name="chq_date"
                label="Cheque Date"
              >
                <DatePicker
                  style={{ width: "100%" }}
                  format="DD-MM-YYYY"
                />
              </Form.Item>
            </Col>

            <Col span={3}>
              <Form.Item
                name="file_no"
                label="File No"
              >
                <Input placeholder="File No" />
              </Form.Item>
            </Col>

            <Col span={3}>
              <Form.Item
                name="bill_no"
                label="Bill No"
              >
                <Input placeholder="Bill No" />
              </Form.Item>
            </Col>
          </Row>

          {/* =====================================================
              ROW 3
          ===================================================== */}

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="narration"
                label="Narration"
              >
                <Input.TextArea
                  rows={1}
                  placeholder="Voucher details..."
                />
              </Form.Item>
            </Col>
            </Row>

            <Row>
            <Col span={16}>
              {/* =================================================
                  AMOUNT
              ================================================= */}

              <Row gutter={16}>
                <Col span={6}>
                  <Form.Item
                    name="amount"
                    label="Amount"
                  >
                    <InputNumber
                      style={{
                        width: "100%",
                      }}
                      min={0}
                      onChange={
                        calculateNetAmount
                      }
                    />
                  </Form.Item>
                </Col>
                    {/* // add amount */}
                <Col span={4}>
                  <Form.Item
                    name="add_amount"
                    label="Add Amount"
                  >
                    <InputNumber
                      style={{
                        width: "100%",
                      }}
                      min={0}
                      onChange={
                        calculateNetAmount
                      }
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          showAddAccount
                        ) {
                          e.preventDefault();

                          addAccountRef.current?.focus();
                        }
                      }}
                    />
                  </Form.Item>
                  </Col>
                  {/* // sub amount */}
                     <Col span={4}>
                  <Form.Item
                    name="sub_amount"
                    label="Sub Total"
                  >
                    <InputNumber
                      style={{
                        width: "100%",
                      }}
                      disabled
                    />
                  </Form.Item>
                </Col>
                {/* // Less Amount */}
                <Col span={4}>
                  <Form.Item
                    name="less_amount"
                    label="Less Amount"
                  >
                    <InputNumber
                      style={{
                        width: "100%",
                      }}
                      min={0}
                      onChange={
                        calculateNetAmount
                      }
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          showLessAccount
                        ) {
                          e.preventDefault();

                          lessToAccount.current?.focus();
                        }
                      }}
                    />
                  </Form.Item>
                </Col>
                {/* // net Amount */}
                 <Col span={4}>
                  <Form.Item
                    name="net_amount"
                    label="Net Amount"
                  >
                    <InputNumber
                      style={{
                        width: "100%",
                      }}
                      disabled
                    />
                  </Form.Item>
                </Col>

                </Row>
              <Row gutter={8}>

                {showAddAccount && (
                  <Col span={8}>
                    <Form.Item
                      name="add_amount_sa_id"
                      label="Add Account"
                             rules={[
                                                        {
                                                            required: true,
                                                            message:
                                                                "Please select debit account"
                                                        }
                                                    ]}
                                                >
                    
                                                    <Select
                                                        showSearch
                                                        placeholder="Select debit account"
                    
                                                        optionFilterProp="label"
                    
                                                        options={
                                                            getSa.map(
                                                                item => ({
                                                                    value:
                                                                        item.Sa_ID,
                    
                                                                    label:
                                                                        item.SA_Name
                                                             })
                                                            )
                                                        }
                                                    />
                    </Form.Item>
                  </Col>
                )}
              
                {showLessAccount && (
                  <Col span={8}>
                    <Form.Item
                      name="less_amount_sa_id"
                      label="Less Account"
                             rules={[
                                                        {
                                                            required: true,
                                                            message:
                                                                "Please select debit account"
                                                        }
                                                    ]}
                                                >
                    
                                                    <Select
                                                        showSearch
                                                        placeholder="Select debit account"
                    
                                                        optionFilterProp="label"
                    
                                                        options={
                                                            getSa.map(
                                                                item => ({
                                                                    value:
                                                                        item.Sa_ID,
                    
                                                                    label:
                                                                        item.SA_Name
                                                             })
                                                            )
                                                        }
                                                    />
                    </Form.Item>
                  </Col>
                )}
              </Row>

              {/* =================================================
                  NET AMOUNT
              ================================================= */}

              <Row gutter={8}>
               

                <Col
                  span={12}
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    marginBottom: 24,
                  }}
                >
                  <Space>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                    >
                      {editingVno
                        ? "Update"
                        : "Save"}
                    </Button>

                    <Button
                      onClick={resetForm}
                    >
                      Cancel
                    </Button>
                  </Space>
                </Col>
              </Row>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* =====================================================
          VOUCHER TABLE
      ===================================================== */}

      <Card
        title="Vouchers List"
        style={{ marginTop: 20 }}
      >
        <Row
          gutter={16}
          style={{ marginBottom: 16 }}
        >
          <Col span={6}>
            <Input
              prefix={
                <SearchOutlined />
              }
              placeholder="Search by Voucher #"
              value={searchVoucher}
              onChange={(e) =>
                setSearchVoucher(
                  e.target.value
                )
              }
            />
          </Col>

          <Col span={6}>
            <Input
              prefix={
                <SearchOutlined />
              }
              placeholder="Search by Cheque #"
              value={searchCheque}
              onChange={(e) =>
                setSearchCheque(
                  e.target.value
                )
              }
            />
          </Col>
        </Row>

        <Table
          rowKey="vno"
          columns={columns}
          dataSource={filteredData}
          loading={tableLoading}
          pagination={{
            pageSize: 10,
          }}
          scroll={{
            x: 1000,
          }}
        />
      </Card>
    </div>
  );
};

export default BankPayment2;
