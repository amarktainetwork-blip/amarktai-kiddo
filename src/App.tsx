import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import Library from './pages/Library';
import Parent from './pages/Parent';
import { Contact, Privacy, Terms } from './pages/Legal';
import { Creativity, HowItWorks, MeetBuddies, ParentsInfo, SafetyInfo } from './pages/MarketingPages';

export default function App(){
  return <BrowserRouter><Routes>
    <Route path="/" element={<Home/>}/>
    <Route path="/login" element={<Login/>}/>
    <Route path="/register" element={<Register/>}/>
    <Route path="/how-it-works" element={<Navigate to="/" replace/>}/>
    <Route path="/creativity" element={<Navigate to="/" replace/>}/>
    <Route path="/buddies" element={<Navigate to="/" replace/>}/>
    <Route path="/for-parents" element={<Navigate to="/" replace/>}/>
    <Route path="/safety" element={<Navigate to="/" replace/>}/>
    <Route path="/privacy" element={<Privacy/>}/>
    <Route path="/terms" element={<Terms/>}/>
    <Route path="/contact" element={<Contact/>}/>
    <Route path="/dashboard" element={<Navigate to="/" replace/>}/>
    <Route path="/chat" element={<Navigate to="/" replace/>}/>
    <Route path="/library" element={<Navigate to="/" replace/>}/>
    <Route path="/parent" element={<Navigate to="/" replace/>}/>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes></BrowserRouter>;
}
