import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs";
import {
    Button,
    Spin,
    message
} from "antd";

import {
    PrinterOutlined,
    ArrowLeftOutlined
} from "@ant-design/icons";

import "./FeeReceiptPrint.css";

const FeeReceiptPrint = () => {

    const { receiptNo } = useParams();

    const [loading, setLoading] = useState(true);
    const [receipt, setReceipt] = useState(null);
    const [company, setCompany] = useState({});

    useEffect(() => {
        loadReceipt();
    }, [receiptNo]);

    const loadReceipt = async () => {

        try {

            setLoading(true);

            const [
                receiptRes,
                companyRes
            ] = await Promise.all([

                axios.get(
                    `/api/fee-receipts/print/${receiptNo}`
                ),

                axios.get(
                    "/api/company-profile"
                )
            ]);

            setReceipt(
                receiptRes.data
            );

            setCompany(
                companyRes.data || {}
            );

        } catch (error) {

            console.error(
                "Receipt Print Error:",
                error
            );

            message.error(
                error.response?.data?.message ||
                "Unable to load fee receipt"
            );

        } finally {

            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const formatDate = (date) => {

        if (!date) {
            return "-";
        }

        return dayjs(date).format(
            "DD-MM-YYYY"
        );
    };

    const formatMonth = (date) => {

        if (!date) {
            return "-";
        }

        return dayjs(date).format(
            "MMMM YYYY"
        );
    };

    const money = (value) => {

        return Number(
            value || 0
        ).toLocaleString(
            "en-PK",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );
    };

    if (loading) {

        return (
            <div className="receipt-loading">
                <Spin size="large" />
            </div>
        );
    }

    if (!receipt) {

        return (
            <div className="receipt-error">

                <h3>
                    Fee receipt not found.
                </h3>

                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() =>
                        window.history.back()
                    }
                >
                    Back
                </Button>

            </div>
        );
    }

    return (
        <div className="receipt-page">

            {/* ============================================
                ACTIONS
            ============================================ */}

            <div className="receipt-actions no-print">

                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() =>
                        window.history.back()
                    }
                >
                    Back
                </Button>

                <Button
                    type="primary"
                    icon={<PrinterOutlined />}
                    onClick={handlePrint}
                >
                    Print Receipt
                </Button>

            </div>

            {/* ============================================
                RECEIPT
            ============================================ */}

            <div className="fee-receipt">

                {/* COMPANY HEADER */}

                <div className="company-header">

                    {company.logo && (
                        <img
                            src={
                                company.logo.startsWith("http")
                                    ? company.logo
                                    : `http://localhost:5000/${company.logo}`
                            }
                            alt="School Logo"
                            className="company-logo"
                        />
                    )}

                    <div className="company-info">

                        <h1>
                            {company.company_name ||
                                "SCHOOL / COMPANY NAME"}
                        </h1>

                        {company.address && (
                            <div>
                                {company.address}
                            </div>
                        )}

                        <div className="company-contact">

                            {company.phone && (
                                <span>
                                    Phone: {company.phone}
                                </span>
                            )}

                            {company.email && (
                                <span>
                                    Email: {company.email}
                                </span>
                            )}

                            {company.website && (
                                <span>
                                    {company.website}
                                </span>
                            )}

                        </div>

                    </div>

                </div>

                {/* TITLE */}

                <div className="receipt-title">
                    FEE PAYMENT RECEIPT
                </div>

                {/* RECEIPT HEADER */}

                <div className="receipt-meta">

                    <div>
                        <strong>
                            Receipt No:
                        </strong>

                        <span>
                            {receipt.receipt_no}
                        </span>
                    </div>

                    <div>
                        <strong>
                            Payment Date:
                        </strong>

                        <span>
                            {formatDate(
                                receipt.payment_date
                            )}
                        </span>
                    </div>

                    <div>
                        <strong>
                            Challan No:
                        </strong>

                        <span>
                            {receipt.challan_no || "-"}
                        </span>
                    </div>

                    <div>
                        <strong>
                            Fee Month:
                        </strong>

                        <span>
                            {formatMonth(
                                receipt.fee_month
                            )}
                        </span>
                    </div>

                </div>

                {/* STUDENT INFORMATION */}

                <div className="section-heading">
                    STUDENT INFORMATION
                </div>

                <div className="student-info">

                    <div className="info-row">

                        <div>
                            <strong>
                                Student Name:
                            </strong>

                            <span>
                                {receipt.student_name ||
                                    "-"}
                            </span>
                        </div>

                        <div>
                            <strong>
                                Admission No:
                            </strong>

                            <span>
                                {receipt.admission_no ||
                                    "-"}
                            </span>
                        </div>

                    </div>

                    <div className="info-row">

                        <div>
                            <strong>
                                Father Name:
                            </strong>

                            <span>
                                {receipt.father_name ||
                                    "-"}
                            </span>
                        </div>

                        <div>
                            <strong>
                                Class:
                            </strong>

                            <span>
                                {receipt.class_name ||
                                    "-"}
                            </span>
                        </div>

                    </div>

                    <div className="info-row">

                        <div>
                            <strong>
                                Section:
                            </strong>

                            <span>
                                {receipt.section_name ||
                                    "-"}
                            </span>
                        </div>

                        <div>
                            <strong>
                                Academic Year:
                            </strong>

                            <span>
                                {receipt.academic_year ||
                                    "-"}
                            </span>
                        </div>

                    </div>

                </div>

                {/* PAYMENT DETAILS */}

                <div className="section-heading">
                    PAYMENT DETAILS
                </div>

                <table className="payment-table">

                    <thead>

                        <tr>

                            <th>
                                Description
                            </th>

                            <th>
                                Amount
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        <tr>

                            <td>
                                Fee for{" "}
                                {formatMonth(
                                    receipt.fee_month
                                )}
                            </td>

                            <td className="amount">
                                {money(
                                    receipt.amount_paid
                                )}
                            </td>

                        </tr>

                        <tr>

                            <td className="right">
                                Fee Net Amount
                            </td>

                            <td className="amount">
                                {money(
                                    receipt.net_amount
                                )}
                            </td>

                        </tr>

                        <tr>

                            <td className="right">
                                Total Paid
                            </td>

                            <td className="amount">
                                {money(
                                    receipt.paid_amount
                                )}
                            </td>

                        </tr>

                        <tr className="balance-row">

                            <td className="right">
                                Remaining Balance
                            </td>

                            <td className="amount">
                                {money(
                                    receipt.remaining_balance
                                )}
                            </td>

                        </tr>

                        <tr className="received-row">

                            <td className="right">
                                <strong>
                                    AMOUNT RECEIVED
                                </strong>
                            </td>

                            <td className="amount">
                                <strong>
                                    {money(
                                        receipt.amount_paid
                                    )}
                                </strong>
                            </td>

                        </tr>

                    </tbody>

                </table>

                {/* PAYMENT INFORMATION */}

                <div className="payment-information">

                    <div>

                        <strong>
                            Payment Method:
                        </strong>

                        <span>
                            {receipt.payment_method ||
                                "-"}
                        </span>

                    </div>

                    <div>

                        <strong>
                            Reference No:
                        </strong>

                        <span>
                            {receipt.reference_no ||
                                "-"}
                        </span>

                    </div>

                </div>

                {/* REMARKS */}

                {receipt.remarks && (

                    <div className="remarks">

                        <strong>
                            Remarks:
                        </strong>

                        <span>
                            {receipt.remarks}
                        </span>

                    </div>

                )}

                {/* AMOUNT IN WORDS */}

                <div className="amount-words">

                    <strong>
                        Amount Received:
                    </strong>

                    <span>
                        {money(
                            receipt.amount_paid
                        )}
                    </span>

                </div>

                {/* SIGNATURES */}

                <div className="signature-area">

                    <div>

                        <div className="signature-line"></div>

                        <strong>
                            Cashier
                        </strong>

                    </div>

                    <div>

                        <div className="signature-line"></div>

                        <strong>
                            Authorized Signature
                        </strong>

                    </div>

                </div>

                <div className="receipt-footer">

                    This receipt is computer generated.
                    Please keep it for your records.

                </div>

            </div>

        </div>
    );
};

export default FeeReceiptPrint;