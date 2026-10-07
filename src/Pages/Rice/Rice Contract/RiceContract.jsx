import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'

const RiceContract = () => {
    const handleReset = (e) => {
        e.currentTarget.form.reset();
        setDate(today);    };

    const today = new Date().toLocaleDateString('en-CA');
    const [date , setDate] = useState(today);
    return (
        <div className='container-fluid'>
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <h2>Add New Rice Contract</h2>
                            <NavLink to="/" className="btn btn-primary">Back</NavLink>
                        </div>
                        <div className="card-body">
                            <form action="">
                                {/* Date */}
                                <div className="row">
                                    <div className="col-4">
                                        <label htmlFor="">Date</label>
                                        <input type="date" className='form-control' placeholder='Date' name='date'  value={date} onChange={(e)=>setDate(e.target.value)}  />
                                    </div>
                                    {/* Due Date */}

                                        <div className="col-4">
                                        <label htmlFor="">Due Date</label>
                                        <input type="date" className='form-control' placeholder='Due Date' name='d-date'  />
                                    </div>

                                    {/* Party */}
                                    <div className="col-4">
                                        <label htmlFor="">Broker</label>
                                        <select className='form-control' aria-placeholder='Select Broker' name='broker'>
                                            <option value="">Select Broker</option>
                                            <option value="">Lal</option>
                                            <option value="">Jillani</option>
                                            <option value="">Jai Shakti</option>
                                        </select>
                                    </div>
                                    {/* Item */}
                                    <div className="col-4">
                                        <label htmlFor="">Item</label>
                                        <select className='form-control' aria-placeholder='Select Item' name='item'>
                                            <option value="">Select Item</option>
                                            <option value="">Irri</option>
                                            <option value="">Broken</option>
                                            <option value="">B3</option>
                                        </select>
                                    </div>
                                        {/* No of Trucks */}
                                    <div className="col-4">
                                        <label htmlFor="">Trucks Soda</label>
                                        <input type="text" className='form-control' placeholder=' Number of Truck' name='nooftruck' />
                                    </div>
                                        {/* Rate */}
                                    <div className="col-4">
                                        <label htmlFor="">Rate</label>
                                        <input type="text" className='form-control' placeholder='Rates' name='rate' />
                                    </div>

                                   <div className="col-4">
                                        <label htmlFor="">Terms</label>
                                        <select className='form-control' aria-placeholder='Select' name='terms'>
                                            <option value="">Select</option>
                                            <option value="">Cash</option>
                                            <option value="">Credit</option>
                                            
                                        </select>
                                    </div>

                                    <div className="col-4">
                                        <label htmlFor="">Days</label>
                                        <input type="text" className='form-control' placeholder='Credit Days' name='Days' />
                                    </div>
                                        {/* remarks  */}
                                    <div className="col-12">
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

export default RiceContract
