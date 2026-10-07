import React from 'react'
import ttiImage from '../../assets/tti logo.webp'
import './Navbar1.css'
import { FaListUl,FaBowlRice  } from "react-icons/fa6";
import { MdDashboard,MdOutlineAccountBalance ,MdOutlineSettings } from "react-icons/md";
import { ImUsers } from "react-icons/im";
import { NavLink } from 'react-router-dom';
import { GiCargoShip } from "react-icons/gi";

const Navbar1 = () => {
  return (
    <div className='sidebar'>
      <div className="logo-content">
        <div className="logo">
          <i  id='btn'><FaListUl /></i>
            <div className="logo-name">
                TransTrade Int'L
            </div>
            
            <img src={ttiImage} alt="" />
        </div>
      </div>
      <ul className='nav-list'>
        <li>
          <a href="">
            <i className='icon'><MdDashboard /></i>
            <span className='link-names'>Dashboard</span>
          </a>
          <span className='tooltip'>Dashboard</span>
        </li>

          <li>
          <a href="">
            <i className='icon'><ImUsers /></i>
            <span className='link-names'>Users</span>
          </a>
          <span className='tooltip'>Users</span>
        </li>
          <li>
          <a href="#">
            <i className='icon'><MdOutlineAccountBalance /></i>
            <span className='link-names'>Account Module</span>
          </a>
          <span className='tooltip'>Account</span>

          <ul>
              <li><NavLink to ="">Journal Voucher (JV)</NavLink> </li>
              <li><NavLink to ="">Bank Payment (BP)</NavLink></li>
              <li><NavLink to ="">Bank Receipt (BR)</NavLink></li>
              <li><NavLink to ="">Cash Payment (CP)</NavLink></li>
              <li><NavLink to ="">Cash Receipt (CR)</NavLink></li>
              <li><NavLink to ="">Purchase Invoice (PI)</NavLink></li>
              
              </ul>
        </li>
        <li>
          <a href="">
            <i className='icon'><FaBowlRice /></i>
            <span className='link-names'>Rice Module</span>
          </a>
          <span className='tooltip'>Rice</span>
          <ul>
                        <li><NavLink to ="./RiceContract"> Rice Contract (RC)</NavLink> </li>
                        <li><NavLink to ="./RiceArrival">Rice Arrival (RA)</NavLink></li>
                        <li><NavLink to ="./RicePurchase">Rice Purchase (RP)</NavLink></li>
                        <li><NavLink to ="./LocalSaleContract">Local Sale Contract (LSC)</NavLink></li>
                        <li><NavLink to ="./LocalSale">Delivery Local Sale (DLS)</NavLink></li>
                        
                        
                        </ul>
        </li>
        <li>
          <a href="">
            <i className='icon'><GiCargoShip  /></i>
            <span className='link-names'>Export Module</span>
          </a>
          <span className='tooltip'>Export</span>
            <ul>
                        <li><NavLink to ="">Commercial Invoice (Invoice)</NavLink> </li>
                        <li><NavLink to ="">Packing List (Packing)</NavLink></li>
                       <li><NavLink to ="">Draft Invoice (Invoice)</NavLink> </li>
                       <li><NavLink to ="">Draft Packing List (Packing)</NavLink></li>
                       <li><NavLink to ="">Draft B/L (BL)</NavLink></li>   
                        </ul>
        </li>
        <li>
          <a href="">
            <i className='icon'><MdOutlineSettings /></i>
            <span className='link-names'>Setting</span>
          </a>
          <span className='tooltip'>Dashboard</span>
        </li>
        </ul>
      
    </div>
  )
}

export default Navbar1
