import React, {useEffect, useState } from 'react'
import './PPBags.css'
import { NavLink } from 'react-router-dom';
import Swal from 'sweetalert2';
import axios from 'axios';


    const PPBags = () => {
    
    const [formData , setFormData] = useState({ 
          
          tb_bagsize : "", 
          tb_brandname: "",
          tb_kg :"",
          tb_remarks:"" 
          });
      const [PPBagsData,setPPBagsData]= useState([]);
      const [editId, setEditId] = useState(null);
      const [searchBrand, setSearchBrand] = useState("");

const handleEdit = (item) => {

    setEditId(item.PP_BAG_ID);

    setFormData({
        tb_bagsize: item.PP_BAG_SIZE,
        tb_brandname: item.PP_BAG_BRAND,
        tb_kg: item.PP_BAG_KG,
        tb_remarks: item.REMARKS
    });

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
};
const cancelEdit = () => {

    setEditId(null);

    setFormData({
        tb_bagsize: "",
        tb_brandname: "",
        tb_remarks:"",
        tb_kg:""
    });

};

          const handleChange = (e)=>{
            setFormData({
            ...formData,
            [e.target.name]: e.target.value
            });
          };

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
          tb_bagsize : "", 
          tb_brandname: "",
          tb_kg :"",
          tb_remarks:"" 
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

 const getPPBags = async () => {

  try {
            const response = await axios.get(
                "/api/ppbag-table"
            );
           

            setPPBagsData(response.data);
        } catch (error) {
           
        }
       
    };


 useEffect(() => {
     
      getPPBags();
}, []);  


    // Save Items
 const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.tb_bagsize.trim()) {

        Swal.fire({
            icon: "warning",
            title: "Please insert an Bag Size",
            text: "Required."
        });

        return;
    }


    if (!formData.tb_brandname.trim())
{ 
        Swal.fire({
            icon: "warning",
            title: "Please Insert Brand Name",
            text: "Required."
        });

        return;
      }

        if (!formData.tb_kg.trim())
        { 
        Swal.fire({
            icon: "warning",
            title: "Please Insert Packing In Kg",
            text: "Required."
        });

        return;
    }

        if (!formData.tb_remarks.trim())
    { 
        Swal.fire({
            icon: "warning",
            title: "Please Insert Brand Name",
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
                `/api/update-ppbag/${editId}`,
                {
                       tb_bagsize : formData.tb_bagsize.trim(), 
                       tb_brandname: formData.tb_brandname.trim(),
                       tb_kg: formData.tb_kg.trim(),
                       tb_remarks: formData.tb_remarks.trim()
                }
            );

        }

        // =========================
        // SAVE
        // =========================

        else {

            response = await axios.post(
                "/api/Saving_PPBag",
                {
                      tb_bagsize : formData.tb_bagsize.trim(), 
                       tb_brandname: formData.tb_brandname.trim(),
                       tb_kg: formData.tb_kg.trim(),
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
                      tb_bagsize: "",
                       tb_brandname:"",
                       tb_kg: "",
                       tb_remarks:""

        });


        setEditId(null);


        // Refresh table

          getPPBags();


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
      const filteredgetPPBags = PPBagsData.filter((item) =>
    item.PP_BAG_BRAND?.toLowerCase().includes(searchBrand.toLowerCase())
);
 
  return (
    
    <div className='container-fluid rice-page'>
      <div className="row">
        <div className="col-12">
          <div className="contract-card">
            <div className="card sticky-top">
              <div className="card-header">
                <h2>Add Size of P.P Bag and Brand</h2></div>
              <div className="card-body">
                                  <form onSubmit={handleSubmit}>
                                <div className="row">
                                    
                                    <div className="col-6">
                                        <label htmlFor="">Add Size of Bag</label>
                                        <input type="text" 
                                        className='form-control' 
                                        placeholder='Size Of Bag' 
                                        name='tb_bagsize' 
                                        value={formData.tb_bagsize}
                                        onChange={handleChange}
                                        
                                        />
                                    </div>
                                    <div className="col-6">
                                        <label htmlFor="">Brand Name</label>
                                        <input type="text" className='form-control' placeholder='Brand Name' 
                                        name='tb_brandname'
                                        value={formData.tb_brandname}
                                        onChange={handleChange}
                                        />
                                    </div>
                                    
                                    <div className="col-6">
                                        <label htmlFor="">KG</label>
                                        <input type="text" className='form-control' placeholder='KG' 
                                        name='tb_kg' 
                                        value={formData.tb_kg}
                                        onChange={handleChange}
                                        />
                                    </div>

                                     <div className="col-12">
                                        <label htmlFor="">Remarks</label>
                                        <input type="text" className='form-control' placeholder='Remarks' 
                                        name='tb_remarks' 
                                        value={formData.tb_remarks}
                                        onChange={handleChange}
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
            <div className='abc'>
                <h4>Bags List</h4>
                <span>
                    {PPBagsData.length} Items
                </span>
                <div className="table-search">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="🔍 Search Brandh Account..."
                                            value={searchBrand}
                                            onChange={(e) => setSearchBrand(e.target.value)}
                                        />
                                    </div>
            </div>

        </div>


        <div className="table-responsive">

            <table className="table control-table mb-0">

                <thead>

                    <tr>

                        <th>#</th>

                        <th>PP BAG ID</th>

                        <th>PP BAG SIZE</th>

                        <th>PP BAG BRAND</th>

                        <th>PP BAG KG</th>

                        <th className="text-center">
                            Action
                        </th>

                    </tr>

                </thead>


                <tbody>

                    {PPBagsData.length > 0 ? (

                        PPBagsData.filter((item)=>item.PP_BAG_BRAND ?.toLowerCase().
                        includes(searchBrand.toLowerCase())).
                        map((item, index) => (

                            <tr
                                key={item.PP_BAG_ID}
                                onClick={() => handleEdit(item)}
                                className={
                                    editId === item.PP_BAG_ID
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
                                        {item.PP_BAG_ID}
                                    </span>
                                </td>


                                <td>
                                    <strong>
                                        {item.PP_BAG_SIZE}
                                    </strong>
                                </td>

                                <td>
                                    {item.PP_BAG_BRAND}
                                </td>

                                <td>
                                    {item.PP_BAG_KG}
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

)
}

export default PPBags
