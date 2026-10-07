import React, { useState } from 'react'
import '../Rice  Purchase/RicePurchase.css'
import { NavLink } from 'react-router-dom';
import './LocalSaleContract.css'

const LocalSale = () => {
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
                <h2>Delivery</h2>
                <div className="btn-set">
                <button id='btn-id' type='button' className='btn btn-primary '>Print</button>
                <NavLink to='/localsalecontract' id='btn-id' className='form-control btn btn-primary'>Back to Contract</NavLink>
                </div>

              </div>
              <div className="card-body">
                                  <form action="">
                                <div className="row">
                                    <div className="col-4">
                                        <label htmlFor="">Delivery Date</label>
                                        <input type="date" 
                                        className='form-control' 
                                        placeholder='Date' 
                                        name='date' 
                                        value={date} 
                                        onChange={(e)=>setDate(e.target.value)}
                                        />
                                    </div>
                                    
                                    <div className="col-4">
                                        <label htmlFor="">Buyer Name</label>
                                        <input type="text" 
                                        id='allownce'
                                        className='form-control' 
                                        placeholder='Buyer Name' 
                                        name='buyername' 
                                        readOnly
                                        />
                                    </div>
                                    <div className="col-4">
                                        <label htmlFor="">Buyer Contact No</label>
                                        <input type="text" 
                                        id='allownce'
                                        className='form-control' 
                                        placeholder='Buyer Contact Number' 
                                        name='buyercontactno' 
                                        readOnly
                                        
                                        />
                                    </div>
                                    
                                    <div className="col-4">
                                        <label htmlFor="">Container Number</label>
                                        <input type="text" 
                                        className='form-control' 
                                        placeholder='Container Number' 
                                        name='containernumber' 
                                        
                                        />
                                    </div>

                                    <div className="col-4">
                                        <label htmlFor="">Seal Number</label>
                                        <input type="text" 
                                        className='form-control' 
                                        placeholder='Seal Number' 
                                        name='sealnumber' 
                                        
                                        />
                                    </div>

                                    <div className="col-4">
                                        <label htmlFor="">Driver Number</label>
                                        <input type="text" 
                                        className='form-control' 
                                        placeholder='Driver Number' 
                                        name='drivernumber' 
                                        
                                        />
                                    </div>
                                    <div className="col-2">
                                        <label htmlFor="">Item</label>
                                        <select className='form-control' name='item'>
                                            <option value="">Select Item</option>
                                            <option value="">Irri-5</option>
                                            <option value="">Broken</option>
                                            <option value="">CSR</option>
                                        </select>
                                    </div>

                                    <div className="col-1">
                                        <label htmlFor="">Balance</label>
                                        <input id='allownce' type="text" className='form-control' placeholder='In Hand' name='balance' readOnly />
                                    </div>


                                    <div className="col-3">
                                        <label htmlFor="">Deliver Qty</label>
                                        <input type="text" className='form-control' placeholder='Deilver Qty' name='deliverqty' />
                                    </div>

                                    <div className="col-1">
                                        <label htmlFor="">Bags</label>
                                        <input type="text" className='form-control' placeholder='Bags' name='bags' />
                                    </div>

                                    <div className="col-1">
                                        <label htmlFor="">Rate</label>
                                        <input id='allownce' type="text" className='form-control' placeholder='Rate' name='rate' readOnly />
                                    </div>

                                    <div className="col-3 ">
                                        <label htmlFor="">Total Amount</label>
                                        <input id='allownce' type="text" className='form-control' placeholder='Total Amount' name='totalamount' readOnly />
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
      <div className="container-history">
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


      </div>
    </div>
  )
}

export default LocalSale
