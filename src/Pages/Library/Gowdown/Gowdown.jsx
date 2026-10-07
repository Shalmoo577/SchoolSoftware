import React, {useEffect ,  useState } from 'react'
 import './Gowdown.css'
import { NavLink } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';

const Gowdown = () => {

     const resetForm = () => 
         {
 
         setFormData({
             tb_warehousename: "",
             tb_address: "",
             tb_phonenumber: "",
             tb_remarks: "",
             
         });
 
         setEditId(null);
     };
 
 
     // =========================================
     // CANCEL / RESET BUTTON
     // =========================================
 
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
 
             resetForm();
 
             Swal.fire({
 
                 icon: "success",
 
                 title: "Cleared!",
 
                 text: "The form has been cleared.",
 
                 timer: 1200,
 
                 showConfirmButton: false
 
             });
 
         }
 
     };
 
 
     
  const [formData , setFormData] = useState({
          tb_warehousename: "",
          tb_phonenumber: "",
          tb_address: "",
          tb_remarks: "",
});
  const [searchTerm, setSearchTerm] = useState("");
//for table
  const [GowdownList, setGowdownList] = useState([]);

  const [editId, setEditId] = useState(null);

  const handleChage = (e) =>{
        setFormData({
          ...formData,
          [e.target.name]:e.target.value
        });
};
  //for table
   const fetchfortable = async () => {

        try {

            const response = await axios.get(
                "/api/fetchGowdownList"
            );

            console.log(
                "Gowdown:",
                response.data
            );

            setGowdownList(response.data);

        } catch (error) {

            console.error(
                "Error fetching Gowdowns:",
                error
            );

        }

    };

 const handleSubmit = async (e) => {
 
         e.preventDefault();
 
         // =====================================
         // VALIDATION
         // =====================================
 //warehousename: "", phonenumber: "",   address: "",   remarks: "",
         if (!formData.tb_warehousename.trim()) {
 
             Swal.fire({
 
                 icon: "warning",
 
                 title: "Warehouse Name Required",
 
                 text: "Please Insert Warehouse Name."
 
             });
 
             return;
 
         }
 
         if (!formData.tb_address.trim()) {
 
             Swal.fire({
 
                 icon: "warning",
 
                 title: "Address Required",
 
                 text: "Please enter Address of Warehouse."
 
             });
 
             return;
 
         }
 
         if (!formData.tb_phonenumber.trim()) {
 
             Swal.fire({
 
                 icon: "warning",
 
                 title: "Phone Number Required",
 
                 text: "Please enter Phone number."
 
             });
 
             return;
 
         }
 
 
         try {
 
             let response;
 
 
             // =================================
             // UPDATE
             // =================================
 
             if (editId !== null) {
 
                 console.log(
                     "Updating ID:",
                     editId
                 );
 
 
                 response = await axios.put(
 
                     `/api/update-gowdown/${editId}`,
 
                     {
                          tb_warehousename:formData.tb_warehousename.trim(),
 
                         tb_address:formData.tb_address.trim(),

                         tb_phonenumber:formData.tb_phonenumber.trim(),

                         tb_remarks:formData.tb_remarks.trim(),

 
                     }
 
                 );
 
             }
 
 
             // =================================
             // SAVE
             // =================================
 
             else {
 
                 console.log("Saving new account");
 
 
                 response = await axios.post(
 
                     "/api/Save-gowdown",
 
                     {
 
                         tb_warehousename:formData.tb_warehousename.trim(),
                          tb_address:formData.tb_address.trim(),
                          tb_phonenumber:formData.tb_phonenumber.trim(),
                         tb_remarks:formData.tb_remarks.trim(),
                         

                     }
 
                 );
 
             }
 
 
             // =================================
             // SUCCESS
             // =================================
 
             Swal.fire({
 
                 icon: "success",
 
                 title:
                     editId !== null
                         ? "Updated Successfully!"
                         : "Saved Successfully!",
 
                 text:
                     response.data.message ||
                     "Operation completed successfully.",
 
                 showConfirmButton: false,
 
                 timer: 1800
 
             });
 
 
             // =================================
             // CLEAR FORM
             // =================================
 
        
 
 
             // =================================
             // REFRESH TABLE
             // =================================
 
            await fetchfortable();
            resetForm();
 
         } catch (error) {
 
             console.error(
                 "Save/Update Error:",
                 error
             );
 
 
             Swal.fire({
 
                 icon: "error",
 
                 title:
                     editId !== null
                         ? "Update Failed"
                         : "Save Failed",
 
                 text:
                     error.response?.data?.message ||
                     "Something went wrong."
 
             });
 
         }
 
     };
    const filteredfetchfortable = GowdownList.filter((item) =>
    item.GOWDOWN_NAME?.toLowerCase().includes(searchTerm.toLowerCase())
  );
   useEffect(() => {
  
          fetchfortable();
  
      }, []);
  const handleEdit = (item) => {

        console.log("Editing:", item);

        setEditId(item.GOWDOWN_ID);

        setFormData({

            tb_warehousename:
                String(item.GOWDOWN_NAME),

             tb_phonenumber:
                String(item.PHONE_NUMBER),

             tb_address:
                String(item.ADDRESS),
              tb_remarks:
                String(item.REMARKS)

        });


        window.scrollTo({

            top: 0,

            behavior: "smooth"

        });

    };   

    const cancelEdit = () => {

        handleReset();

    };



return (
    
    <div className='container-fluid rice-page'>
      <div className="row">
        <div className="col-12">
          <div className="contract-card">
            <div className="card sticky-top">
              <div className="card-header">
                <h2>Add New Gowdown</h2></div>
              <div className="card-body">
                                  <form onSubmit={handleSubmit}>
                                <div className="row">
                                    
                                    <div className="col-10">
                                        <label htmlFor="">New Warehoue Name</label>
                                        <input type="text" 
                                        className='form-control' 
                                        placeholder='Warehouse Name' 
                                        name='tb_warehousename' 
                                        value={formData.tb_warehousename}
                                        onChange={handleChage}
                                        
                                        />
                                    </div>
                                    
                                    <div className="col-4">
                                        <label htmlFor="">Phone Number</label>
                                        <input type="text" className='form-control' placeholder='Phone' name='tb_phonenumber' 
                                        value={formData.tb_phonenumber}
                                        onChange={handleChage}
                                        />
                                    </div>
                                      <div className="col-8">
                                        <label htmlFor="">Address</label>
                                        <input type="text" className='form-control' placeholder='Address' name='tb_address' 
                                        value={formData.tb_address}
                                        onChange={handleChage}
                                        />
                                    </div>

                                    
                                     <div className="col-12">
                                        <label htmlFor="">Remarks</label>
                                        <input type="text" className='form-control' placeholder='Remarks' name='tb_remarks'
                                        value={formData.tb_remarks}
                                        onChange={handleChage}
                                        />
                                    </div>
                                    
                                     <div className="btn-set">
                                            <button type="submit" className="form-control-x btn btn-success">
                                                {editId !== null
                                                    ? "Update"
                                                    : "Save"}
                                            </button>
                                            {editId !== null ? (
                                                <button
                                                    type="button"
                                                    onClick={
                                                        cancelEdit
                                                    }
                                                    className="form-control-x btn btn-danger"
                                                >
                                                    Cancel Edit
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={
                                                        handleReset
                                                    }
                                                    className="form-control-x btn btn-danger"
                                                >
                                                    Cancel
                                                </button>
                                            )}

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
                    <div className="table-card-header ">
                        <div className="abc">
                            <h4>Subsidary Accounts</h4>
                              <span>
                                {GowdownList.length}
                                {" "}
                                Accounts

                            </span>

                                    <div className="table-search">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="🔍 Search Gowdown ..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>

                          
                        </div>

                    </div>


                    <div className="table-responsive">

                        <table className="table control-table mb-0">


                            <thead>

                                <tr>

                                    <th>#</th>

                                    <th>Gowdown ID</th>

                                    <th>Gowdown Name</th>

                                    <th>Address</th>

                                    <th>Phone Number</th>

                                    <th className="text-center">
                                        Action
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

    {filteredfetchfortable.length > 0 ? (

        filteredfetchfortable.map((item, index) => (

            <tr
                key={item.GOWDOWN_ID}
                onClick={() => handleEdit(item)}
                className={
                    editId === item.GOWDOWN_ID
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
                    <span className="GOWDOWN_ID">
                        {item.GOWDOWN_ID}
                    </span>
                </td>

                <td>
                    <strong>
                        {item.GOWDOWN_NAME}
                    </strong>
                </td>

                <td>
                    <strong>
                        {item.ADDRESS}
                    </strong>
                </td>

                <td>
                    <strong>
                        {item.PHONE_NUMBER}
                    </strong>
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
                colSpan="10"
                className="empty-table"
            >
                {searchTerm
                    ? "No Subsidary Account found."
                    : "No Subsidary Accounts saved yet."
                }
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

export default Gowdown
