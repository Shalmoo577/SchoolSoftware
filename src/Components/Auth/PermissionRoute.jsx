import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Spin } from "antd";
import {
    getUserPermissions,
    getPagePermission
} from "./permission";

const PermissionRoute = ({
    children,
    pageKey
}) => {

    const [loading, setLoading] = useState(true);
    const [allowed, setAllowed] = useState(false);

    const userData =
        localStorage.getItem("user");


    useEffect(() => {

        const checkPermission = async () => {

            /* -----------------------------------------
               NO LOGIN
            ----------------------------------------- */

            if (!userData) {

                setAllowed(false);
                setLoading(false);

                return;
            }


            /* -----------------------------------------
               PARSE USER
            ----------------------------------------- */

            let user;

            try {

                user = JSON.parse(userData);

            } catch (error) {

                console.error(
                    "Invalid user data:",
                    error
                );

                localStorage.removeItem("user");

                setAllowed(false);
                setLoading(false);

                return;
            }


            /* -----------------------------------------
               DEVELOPER
            ----------------------------------------- */

            if (
                Number(user?.is_developer) === 1
            ) {

                setAllowed(true);
                setLoading(false);

                return;
            }


            /* -----------------------------------------
               VALIDATION
            ----------------------------------------- */

            if (
                !user?.user_id ||
                !pageKey
            ) {

                setAllowed(false);
                setLoading(false);

                return;
            }


            try {

                /* -------------------------------------
                   LOAD PERMISSIONS
                ------------------------------------- */

                const permissions =
                    await getUserPermissions(
                        user.user_id
                    );


                /* -------------------------------------
                   FIND PAGE
                ------------------------------------- */

                const pagePermission =
                    getPagePermission(
                        permissions,
                        pageKey
                    );


                console.log(
                    "PermissionRoute:",
                    {
                        pageKey,
                        pagePermission,
                        can_view:
                            pagePermission?.can_view
                    }
                );


                /* -------------------------------------
                   FINAL CHECK
                ------------------------------------- */

                if (
                    pagePermission &&
                    Number(
                        pagePermission.can_view
                    ) === 1
                ) {

                    setAllowed(true);

                } else {

                    setAllowed(false);

                }

            } catch (error) {

                console.error(
                    "Permission check error:",
                    error
                );

                setAllowed(false);

            } finally {

                setLoading(false);

            }
        };


        checkPermission();

    }, [userData, pageKey]);


    /* =================================================
       LOADING
    ================================================= */

    if (loading) {

        return (
            <div
                style={{
                    minHeight: "50vh",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center"
                }}
            >
                <Spin size="large" />
            </div>
        );
    }


    /* =================================================
       LOGIN
    ================================================= */

    if (!userData) {

        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }


    /* =================================================
       ACCESS DENIED
    ================================================= */

    if (!allowed) {

        return (
            <Navigate
                to="/dashboard"
                replace
            />
        );
    }


    /* =================================================
       ACCESS GRANTED
    ================================================= */

    return children;
};

export default PermissionRoute;