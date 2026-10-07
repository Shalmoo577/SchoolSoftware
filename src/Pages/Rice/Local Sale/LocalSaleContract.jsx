import React, { useState } from 'react'
import '../Rice  Purchase/RicePurchase.css'

const LocalSaleContract = () => {
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
                <h2>Contract of Local Sale</h2>

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
                                        <label htmlFor="">Buyer Name</label>
                                        <select className='form-control' aria-placeholder='Select Broker' name='broker'>
                                            <option value="">Select Broker</option>
                                            <option value="">Lal</option>
                                            <option value="">Jillani</option>
                                            <option value="">Jai Shakti</option>
                                        </select>
                                    </div>
                                    <div className="col-4">
                                        <label htmlFor="">Buyer Contact No</label>
                                        <input type="text" 
                                        className='form-control' 
                                        placeholder='Buyer Contact Number' 
                                        name='buyercontactno' 
                                        
                                        />
                                    </div>
                                    <div className="col-4">
                                        <label htmlFor="">Expected Delivery Date</label>
                                        <input type="date" 
                                        className='form-control' 
                                        
                                        name='deldate' 
                                        
                                        
                                        />
                                    </div>
                                    <div className="col-4">
                                        <label htmlFor="">Invoice Number</label>
                                        <input type="text" 
                                        className='form-control' 
                                        placeholder='Invoice Number' 
                                        name='invoicenumber' 
                                        
                                        />
                                    </div>

                                    <div className="col-4">
                                        <label htmlFor="">Gowdown</label>
                                        <select className='form-control' aria-placeholder='Select Gowdown' name='gowdown'>
                                            <option value="">Select Gowdown</option>
                                            <option value="">Tpx</option>
                                            <option value="">Buksh Rice Mill</option>
                                            <option value="">Rheman Rice Mill</option>
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
                                        <label htmlFor="">Brand</label>
                                        <select className='form-control' aria-placeholder='Select Item' name='brand'>
                                            <option value="">Select Item</option>
                                            <option value="">Jefro</option>
                                            <option value="">Bull</option>
                                            <option value="">Copra</option>
                                        </select>
                                    </div>
                                    <div className="col-4">
                                        <label htmlFor="">Number of Bags</label>
                                        <input type="text" className='form-control' placeholder='No Of Bags' name='noofbags' />
                                    </div>

                                    <div className="col-4">
                                        <label htmlFor="">Kg per Bag</label>
                                        <input type="text" className='form-control' placeholder='Kg Per Bag' name='kgperbag' />
                                    </div>


                                    <div className="col-4">
                                        <label htmlFor="">Total Weight</label>
                                        <input type="text" className='form-control' placeholder='Total Weight' name='totalweight' readOnly />
                                    </div>


                                    <div className="col-4">
                                        <label htmlFor="">Rate</label>
                                        <input type="text" className='form-control' placeholder='Rate Per Kg' name='rate' />
                                    </div>

                                    <div className="col-4">
                                        <label htmlFor="">Total Amount</label>
                                        <input type="text" className='form-control' placeholder='Total Amount' name='totalamount' />
                                    </div>

                                    <div className="col-4">
                                        <label htmlFor="">Advance</label>
                                        <input type="text" className='form-control' placeholder='Advance Received' name='advance' />
                                    </div>

                                    <div className="col-4">
                                        <label htmlFor="">Remaining Amount</label>
                                        <input type="text" className='form-control' placeholder='Remaining Amount' name='remainingamount' />

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

export default LocalSaleContract
