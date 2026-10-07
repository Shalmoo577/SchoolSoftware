import React, { useState } from 'react'
import './Navbar.css'
import Image from '../../assets/Ahad.jpeg'
import cload from '../../assets/cload.jpg'
import { NavLink } from 'react-router-dom'
import { FaBeer,FaUserFriends  } from 'react-icons/fa'
import { FaArrowRightArrowLeft } from "react-icons/fa6";
import { MdDashboard } from "react-icons/md";
import { HiHomeModern } from "react-icons/hi2";
import { GrLogout } from "react-icons/gr";

const Navbar = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false)

  const hide = () => {
    setIsOpen(!isOpen)
  }
  return (
    <div className="main-container">
      <div className={`side-bar ${isOpen ? "hide" : "show"}`}>
        <div className="toggle" onClick={hide}>
          <FaArrowRightArrowLeft className='jb'/>
        </div>
        <div className="user-details">
          <div className="img">
            <img src={Image} alt="" />
          </div>
        </div>
        <div className={`title ${isOpen ? "hide" : "show"} `}>
          <h2>Abdul Ahad</h2>
        </div>
        <div className="mai ">
          <h5>main</h5>
        </div>
        <nav className={`navb ${isOpen ? "hide": "show"}`}>
          <ul>
            <li> 
              <i className='side-icon'><MdDashboard /></i>
             <NavLink to="./Dashboard">Dashboard</NavLink>
            </li>
          </ul>
          <ul>
            <li className='icon'> <i className='side-icon'><FaBeer/></i>
             <span>Library</span>
             <ul>
              <li> <i className='side-icon'> <HiHomeModern /></i> <NavLink to="">Gowdown</NavLink> </li>
              <li><NavLink to="" className="sub">Items</NavLink> </li>
              </ul>
            </li>
          </ul>
          <ul>
            <li>
              <a href="#">Account Module</a>
             
             <ul>
              <li><NavLink to ="">Journal Voucher (JV)</NavLink> </li>
              <li><NavLink to ="">Bank Payment (BP)</NavLink></li>
              <li><NavLink to ="">Bank Receipt (BR)</NavLink></li>
              <li><NavLink to ="">Cash Payment (CP)</NavLink></li>
              <li><NavLink to ="">Cash Receipt (CR)</NavLink></li>
              <li><NavLink to ="">Purchase Invoice (PI)</NavLink></li>
              
              </ul>
            </li>
          </ul>
          <ul>
            <li> <a href="#">Rice Module</a>
             
             <ul>
              <li><NavLink to ="./RiceContract"> Rice Contract (RC)</NavLink> </li>
              <li><NavLink to ="./RiceArrival">Rice Arrival (RA)</NavLink></li>
              <li><NavLink to ="./RicePurchase">Rice Purchase (RP)</NavLink></li>
              <li><NavLink to ="./LocalSaleContract">Local Sale Contract (LSC)</NavLink></li>
              <li><NavLink to ="./LocalSale">Delivery Local Sale (DLS)</NavLink></li>
              
              
              </ul>
            </li>
          </ul>
           <ul>
            <li>
             Draft Export For Bank
             <ul>
              <li><NavLink to ="">Invoice (Invoice)</NavLink> </li>
              <li><NavLink to ="">Packing List (Packing)</NavLink></li>
              <li><NavLink to ="">B/L (BL)</NavLink></li>
              
              </ul>
            </li>
            
          </ul>
          <ul>
              <li>Export Module</li>
              <ul>
              <li><NavLink to ="">Commercial Invoice (Invoice)</NavLink> </li>
              <li><NavLink to ="">Packing List (Packing)</NavLink></li>
              
              </ul>
            </ul>
            <ul>
              <li> <a href="#">Setting</a> </li>
              <ul>
              <li> <i className='side-icon'><FaUserFriends /></i><NavLink to ="">Users Role</NavLink> </li>
              <li><i className='side-icon'><GrLogout /></i> <NavLink to ="./Dashboard">Logout</NavLink></li>
              
              </ul>
            </ul>
        </nav>
      </div>
      <main> {children}</main>
    </div>
  )
}

export default Navbar
