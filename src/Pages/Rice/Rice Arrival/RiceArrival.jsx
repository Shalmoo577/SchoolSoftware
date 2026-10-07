import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import './RiceArrival.css'

const RiceArrival = () => {
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
                <h2>Rice Arrival</h2>

              </div>
              <div className="card-body">
                                  <form action="">
                                <div className="row">
                                    <div className="col-4">
                                        <label htmlFor="">Date</label>
                                        <input type="date" 
                                        className='form-control' 
                                        placeholder='Date' 
                                        name='date' 
                                        value={date} 
                                        onChange={(e)=>setDate(e.target.value)}
                                        />
                                    </div>
                                    <div className="col-4">
                                        <label htmlFor="">Broker</label>
                                        <select className='form-control' aria-placeholder='Select Broker' name='broker'>
                                            <option value="">Select Broker</option>
                                            <option value="">Lal</option>
                                            <option value="">Jillani</option>
                                            <option value="">Jai Shakti</option>
                                        </select>
                                    </div>
                                    <div className="col-4">
                                        <label htmlFor="">Item</label>
                                        <select className='form-control' aria-placeholder='Select Item' name='item'>
                                            <option value="">Select Item</option>
                                            <option value="">Irri</option>
                                            <option value="">Broken</option>
                                            <option value="">B3</option>
                                        </select>
                                    </div>

                                    <div className="col-4">
                                        <label htmlFor="">Truck Number</label>
                                        <input type="text" className='form-control' placeholder='Truck Number' name='truckno' />
                                    </div>

                                    <div className="col-4">
                                        <label htmlFor="">No of Bags</label>
                                        <input type="text" className='form-control' placeholder='Bags' name='bags' />
                                    </div>


                                    <div className="col-4">
                                        <label htmlFor="">Loading Weight</label>
                                        <input type="text" className='form-control' placeholder='Loading Weight' name='l-weight' />
                                    </div>


                                    <div className="col-4">
                                        <label htmlFor="">Destignation Weight</label>
                                        <input type="text" className='form-control' placeholder='Destignation Weight' name='d-weight' />
                                    </div>

                                    <div className="col-4">
                                        <label htmlFor="">Broken</label>
                                        <input type="text" className='form-control' placeholder='Broken' name='broken' />
                                    </div>

                                    <div className="col-4">
                                        <label htmlFor="">Moisture</label>
                                        <input type="text" className='form-control' placeholder='Moisture' name='moisture' />
                                    </div>

                                    <div className="col-4">
                                        <label htmlFor="">Filling</label>
                                        <input type="text" className='form-control' placeholder='Filling in Rupees' name='filling' />

                                    </div>

                                    <div className="col-4">
                                        <label htmlFor="">Station</label>
                                        <input type="text" className='form-control' placeholder='Station' name='station' />
                                    </div>


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

export default RiceArrival
