import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import './RicePurchase.css'
const RicePurchase = () => {
    const handleReset = (e) => {
     e.currentTarget.form.reset();
     setDate(today);   };

    const today = new Date().toLocaleDateString('en-CA')
    
    const [date , setDate] = useState(today)

    return (
        <div className='container-fluid rice-page'>
            <div className="row">
                <div className="col-12">
                    <div className="contract-card">


                    <div className="card sticky-top">
                        <div className="card-header">
                            <h2>Rice Purchase</h2>
                            <NavLink to="/" className="btn btn-primary">Back</NavLink>
                        </div>
                        <div className="card-body">
                            <form action="">
                                {/* Date */}
                <div className="row g-3">
                {/* GROUP 1 */}
                <div className="col-md-3">
                    <div className="group-box">
                        <h5>Arrival Details</h5>

                        <label>Date</label>
                        <input
                            type="date"
                            className="form-control mb-3"
                            name="date"
                            // value={date}
                              onClick={(e)=>setDate(e.target.value)}
                        />
                        <label>Trucks Number</label>
                        <input
                            type="number"
                            className="form-control mb-3"
                            placeholder="Number of Trucks"
                            name="trucks"
                        />
                        <label>Broker</label>
                        <input
                            id='allownce'
                            type="text"
                            className="form-control mb-3"
                            placeholder="Broker"
                            name="broker"
                            readOnly
                        />
                        <label>Item</label>
                        <input
                            id='allownce'
                            type="text"
                            className="form-control mb-3"
                            placeholder="Item"
                            name="item"
                            readOnly
                        />
                        
       
                    </div>
                </div>


                {/* GROUP 2 */}
                <div className="col-md-3">
                    <div className="group-box">
                        <h5>Rate & Deduction</h5>

                        <label>Rate</label>
                        <input
                            id='allownce'
                            type="number"
                            className="form-control"
                            placeholder="Rate"
                            name="rate"
                            readOnly
                        />
                        <label>Less Rate</label>
                        <input
                            type="number"
                            className="form-control"
                            placeholder="LessRate"
                            name="lessrate"
                        />
                        <label>Net Rate</label>
                        <input
                            id='allownce'
                            type="number"
                            className="form-control"
                            placeholder="Net Rate"
                            name="netrate"
                            readOnly
                        />

                    </div>
                </div>


                {/* GROUP 3 */}
                <div className="col-md-3">
                    <div className="group-box">
                        <h5>Weight Details</h5>

                        <label>Weight</label>
                        <input
                            id='allownce'
                            type="text"
                            className="form-control mb-3"
                            placeholder="Weight"
                            name="weight"
                            readOnly
                        />
                        <label>Less Weight</label>
                        <input
                            type="text"
                            className="form-control mb-3"
                            placeholder="Less Weight"
                            name="lessweight"
                        
                        />
                        <label>Net Weight</label>
                        <input
                            id='allownce'
                            type="text"
                            className="form-control mb-3"
                            placeholder="Net Weight"
                            name="netweight"
                        
                        />

                        
                    </div>
                </div>


                {/* GROUP 4 */}
                <div className="col-sm-1">
                    <div className="group-box">
                        <h5>Calculation</h5>
                         <label htmlFor="">Allownce</label>
                        <input
                            id='allownce'
                            type="text"
                            className="form-control mb-3"
                            placeholder="Allownce %"
                            name="allownce"
                            readOnly
                        />
                        
                        
                        

                        
                    </div>
                </div>
                {/* Group 5 */}
                <div className="col-sm-2">
                    <h5>Result</h5>
                    <label htmlFor="">Allownce Amount</label>
                        <input
                            id='allownce'
                            type="text"
                            className="form-control"
                            placeholder="Allownce Amount"
                            name="allownceamount"
                            readOnly
                        />
                        
                        <input
                            type="text"
                            className="form-control"
                            placeholder="kanta"
                            name="kanta"
                        />
                        
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Brokery"
                            name="brokery"
                        />
                        
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Filling Amount"
                            name="filling"
                        />
                        
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Add Amount"
                            name="addamount"
                        />
                        
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Less Amount"
                            name="lessamount"
                        />
                         <input
                            id='allownce'
                            type="text"
                            className="form-control"
                            placeholder="Net Amount"
                            name="netAmount"
                            readOnly
                        />
                </div>
            </div>


            {/* BUTTONS */}
            <div className="btn-set">
                                    <button  type='button' className='form-control-x btn btn-success'>Save</button>
                                    <button onClick={handleReset} type='button' className='form-control-x btn btn-danger'>Cancel</button>
                                    </div>

        </form>
                        </div>
                    </div>
                    </div>
                </div>
            </div>
                <div className="container-history">
                      <table class=" table w-100%">
                <thead class="thead-dark">
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

            
                </div>        
        </div>
        
        
)
}

export default RicePurchase
