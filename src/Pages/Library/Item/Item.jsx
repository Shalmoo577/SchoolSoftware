import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import './Item.css';
import axios from 'axios';
import Swal from 'sweetalert2';

const Item = () => {

  const [formData, setFormData] = useState({
    tb_item: "",
    tb_select_warehouse: "",
    tb_remarks: "",
  });

  const [gowdownData, setGowdownData] = useState([]);
  const [editId, setEditId] = useState(null);
  const [getItemList , setGetItemList] = useState([]);
  
const handleEdit = (item) => {

    setEditId(item.Item_ID);

    setFormData({
        tb_item: item.Item_Name,
        tb_select_warehouse: item.Gowdown,
        tb_remarks: item.Remarks
    });

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
};
const cancelEdit = () => {

    setEditId(null);

    setFormData({
        tb_item: "",
        tb_select_warehouse: "",
        tb_remarks:""
    });

};
  // Handle Input Changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Handle Reset
  const handleReset = async () => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Are you sure?",
      text: "All entered data will be cleared.",
      showCancelButton: true,
      confirmButtonText: "Yes, clear it",
      cancelButtonText: "No, keep it",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6"
    });

    if (result.isConfirmed) {
      setFormData({
        tb_item: "",
        tb_select_warehouse: "",
        tb_remarks: "",
      });

      Swal.fire({
        icon: "success",
        title: "Cleared!",
        text: "The form has been cleared.",
        timer: 1200,
        showConfirmButton: false
      });
    }
  };

const fetchItemsData = async () => {

        try {

            const response = await axios.get(
                "/api/item-table"
            );

            setGetItemList(response.data);

        } catch (error) {

        }
    };

  // Fetch Gowdown from DB

  useEffect(() => {
    const getGowdown = async () => {
        try {
            const response = await axios.get(
                "/api/gowdownList"
            );

            

            setGowdownData(response.data);
        } catch (error) {
           
        }
        
    };

     getGowdown();
      fetchItemsData();
}, []);  

// Save Items
 const handleSubmit = async (e) => {

    e.preventDefault();


    if (!formData.tb_item.trim()) {

        Swal.fire({
            icon: "warning",
            title: "Please insert an Item",
            text: "Required."
        });

        return;
    }


    if (!formData.tb_select_warehouse) {

        Swal.fire({
            icon: "warning",
            title: "Please Select Gowdown Required",
            text: "Required."
        });

        return;
    }


    try {

        let response;


        // =========================
        // UPDATE
        // =========================

        if (editId) {

            response = await axios.put(
                `/api/update-item/${editId}`,
                {
                        tb_item: formData.tb_item.trim(), 
                       tb_select_warehouse: formData.tb_select_warehouse,
                       tb_remarks: formData.tb_remarks.trim()
                }
            );

        }

        // =========================
        // SAVE
        // =========================

        else {

            response = await axios.post(
                "/api/Saving_Item",
                {
                        tb_item: formData.tb_item.trim(), 
                       tb_select_warehouse: formData.tb_select_warehouse,
                       tb_remarks: formData.tb_remarks.trim()
                }
            );

        }


        Swal.fire({
            icon: "success",
            title: editId
                ? "Updated Successfully!"
                : "Saved Successfully!",

            text: response.data.message,

            showConfirmButton: false,

            timer: 1800
        });


        // Clear

        setFormData({
                      tb_item: "",
                       tb_select_warehouse:"",
                       tb_remarks: ""

        });


        setEditId(null);


        // Refresh table

        fetchItemsData();


    } catch (error) {

      

        Swal.fire({
            icon: "error",
            title: editId
                ? "Update Failed"
                : "Save Failed",

            text:
                error.response?.data?.message ||
                "Something went wrong."
        });

    }


};



  return (
    <div className='container-fluid rice-page'>
      <div className="row">
        <div className="col-12">
          <div className="contract-card">
            <div className="card sticky-top">
              <div className="card-header">
                <h2>Add Rice Item</h2>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-6">
                      <label>Item Name</label>
                      <input
                        value={formData.tb_item}
                        onChange={handleChange}
                        type="text"
                        className='form-control'
                        placeholder='Item Name'
                        name='tb_item'
                      />
                    </div>

                    <div className="col-6">
                      <label>Warehouse</label>
                      <select
                        className="form-control"
                        name="tb_select_warehouse"
                        value={formData.tb_select_warehouse}
                        onChange={handleChange}
                      >
                        <option value="">Select Warehouse</option>
                        {gowdownData.map((gowdown) => {
                       

                      return (
                        <option
                          key={gowdown.GOWDOWN_ID}
                          value={gowdown.GOWDOWN_ID}
                        >
                          {gowdown.GOWDOWN_NAME}
                        </option>
                      );
                    })}
                      </select>
                    </div>

                    <div className="col-12 mt-2">
                      <label>Remarks</label>
                      <input
                        value={formData.tb_remarks}
                        onChange={handleChange}
                        type="text"
                        className='form-control'
                        placeholder='Remarks'
                        name='tb_remarks'
                      />
                    </div>

                    <div className="btn-set mt-3">
                     <button
                            type="submit"
                            className={`form-control-x btn ${
                                editId ? "btn-warning" : "btn-success"
                            } me-2`}
                        >
                            {editId ? "Update" : "Save"}
                        </button>
                      <button
                            type="button"
                            onClick={editId ? cancelEdit : handleReset}
                            className="form-control-x btn btn-danger"
                        >
                            {editId ? "Cancel Edit" : "Cancel"}
                        </button>
                    </div>
                    
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="container-history mt-4">
    <div className="table-card">
        <div className="table-card-header">
            <div>
                <h4>Items List</h4>
                <span>
                    {getItemList.length} Items
                </span>
            </div>

        </div>


        <div className="table-responsive">

            <table className="table control-table mb-0">

                <thead>

                    <tr>

                        <th>#</th>

                        <th>Item ID</th>

                        <th>Item Name</th>

                        <th>Gowdown ID</th>

                        <th>Gowdown Name</th>

                        <th className="text-center">
                            Action
                        </th>

                    </tr>

                </thead>


                <tbody>

                    {getItemList.length > 0 ? (

                        getItemList.map((item, index) => (

                            <tr
                                key={item.Item_ID}
                                onClick={() => handleEdit(item)}
                                className={
                                    editId === item.Item_ID
                                        ? "selected-row"
                                        : ""
                                }
                            >

                                <td>
                                    <span className="row-number">
                                        {index + 1}
                                    </span>
                                </td>


                                <td>
                                    <span className="gowdown-id">
                                        {item.Item_ID}
                                    </span>
                                </td>


                                <td>
                                    <strong>
                                        {item.Item_Name}
                                    </strong>
                                </td>

                                <td>
                                    {item.gowdown}
                                </td>

                                <td>
                                    {item.GOWDOWN_NAME}
                                </td>


                                <td className="text-center">

                                    <button
                                        type="button"
                                        className="edit-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEdit(item);
                                        }}
                                    >
                                        ✎ Edit
                                    </button>

                                </td>

                            </tr>

                        ))

                    ) : (

                        <tr>
                            <td
                                colSpan="5"
                                className="empty-table"
                            >
                                No Control Accounts saved yet.
                            </td>

                        </tr>

                    )}

                </tbody>

            </table>

        </div>

    </div>

</div>
    </div>
  );
};

export default Item;