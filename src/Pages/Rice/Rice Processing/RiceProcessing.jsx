import React, { useState } from 'react'
 import './RiceProcessing.css'
import { NavLink } from 'react-router-dom';
import { div } from 'framer-motion/client';


const RiceProcessing = () => {
      const handleReset = (e) => {
        e.currentTarget.form.reset();
        setDate(today);
      };
    
      const today = new Date().toLocaleDateString('en-CA')
      const [date, setDate] = useState(today)
    
  return (
    
    <div className='container-fluid rice-page'>
      <div className="row">
        <div className="col-12">
          <div className="contract-card">
            <div className="card sticky-top">
              <div className="card-header">
                <h2>Rice Processing</h2>
                <div className="col-4">
                                        <label htmlFor="">Select Date to Show Processing</label>
                                        <input type="date" 
                                        className='form-control' 
                                        
                                        name='selectdate' 
                                        value={date} 
                                        onChange={(e)=>setDate(e.target.value)}
                                        />
                                    </div>
              </div>
              <div className="card-body">
                                  <form action="">
                                <div className="row">
                                    <div className="col-4">
                                        <label htmlFor="">Processing Date</label>
                                        <input type="date" 
                                        className='form-control' 
                                        name='date' 
                                        value={date} 
                                        onChange={(e)=>setDate(e.target.value)}
                                        />
                                    </div>
                                    
                                    <div className="col-3">
                                        <label htmlFor="">Shipment Number</label>
                                        <input type="text" 
                                        className='form-control' 
                                        placeholder='Shipment Number' 
                                        name='shipmentnumber' 
                                        
                                        />
                                    </div>

                                    <div className="col-3">
                                        <label htmlFor="">Item</label>
                                        <select className='form-control' name='item'>
                                            <option value="">Select Item</option>
                                            <option value="">Irri-6</option>
                                            <option value="">Basmati</option>
                                            <option value="">1121</option>
                                        </select>
                                    </div>

                                    
                                    
                                    <div className="col-2">
                                        <label htmlFor="">Shift</label>
                                        <select className='form-control' name='shift'>
                                            <option value="">Select Shift</option>
                                            <option value="">Day</option>
                                            <option value="">Night</option>
                                            
                                        </select>
                                    </div>


                                    
                                    <div className="col-10">
                                        <label htmlFor="">Remarks</label>
                                        <input type="text" className='form-control' placeholder='Remarks' name='remarks' />
                                    </div>
                                    <div className="btn-set">
                                    <button  type='button' className='form-control-x btn btn-success'>Save</button>
                                    <button onClick={handleReset} type='button' className='form-control-x btn btn-danger'>Cancel</button>
                                    </div>
                                </div>
                            </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* <div className="row">
        
            <div className="col-12">
                <div className="card">
                <div className="card-header"> <h3>Process Here</h3></div>
                <div className="card-body">
                    <form action="">
                        
                    </form>
                </div>
                </div>
            </div>
       
      </div> */}
      {/* <div className="container-history">
        <table className=" table w-100%">
          <thead className="thead-dark">
            <tr>
              <th scope="col">#</th>
              <th scope="col">Date</th>
              <th scope="col">Due Date</th>
              <th scope="col">Broker</th>
              <th scope="col">Item</th>
              <th scope="col">Trucks</th>
              <th scope="col">Rate</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">1</th>
              <td>31-08-2026</td>
              <td>30-09-2026</td>
              <td>Lal Broker</td>
              <td>Irri-6 Rice</td>
              <td>5</td>
              <td>85</td>

            </tr>

          </tbody>
        </table>


      </div> */}
    </div>
  )
}

export default RiceProcessing
