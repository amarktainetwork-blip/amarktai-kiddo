import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Library from './pages/Library';
import Parent from './pages/Parent';
import { Contact, Privacy, Terms } from './pages/Legal';
import { Creativity, HowItWorks, ParentsInfo, SafetyInfo } from './pages/MarketingPages';

export default function App(){
  return <BrowserRouter><Routes>
    <Route path="/" element={<Home/>}/>
    <Route path="/login" element={<Login/>}/>
    <Route path="/register" element={<Register/>}/>
    <Route path="/how-it-works" element={<HowItWorks/>}/>
    <Route path="/creativity" element={<Creativity/>}/>
    <Route path="/for-parents" element={<ParentsInfo/>}/>
    <Route path="/safety" element={<SafetyInfo/>}/>
    <Route path="/privacy" element={<Privacy/>}/>
    <Route path="/terms" element={<Terms/>}/>
    <Route path="/contact" element={<Contact/>}/>
    <Route path="/dashboard" element={<Dashboard/>}/>
    <Route path="/chat" element={<Chat/>}/>
    <Route path="/library" element={<Library/>}/>
    <Route path="/parent" element={<Parent/>}/>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes></BrowserRouter>;
}
