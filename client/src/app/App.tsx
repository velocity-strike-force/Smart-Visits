import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { UserProvider } from './components/UserContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import PostVisit from './components/PostVisit';
import VisitDetail from './components/VisitDetail';
import Feedback from './components/Feedback';
import Analytics from './components/Analytics';

export default function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <div className="h-screen flex flex-col">
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="post-visit" element={<PostVisit />} />
              <Route path="visit/:id" element={<VisitDetail />} />
              <Route path="feedback/:id" element={<Feedback />} />
              <Route path="analytics" element={<Analytics />} />
            </Route>
          </Routes>
          <Toaster position="top-right" />
        </div>
      </BrowserRouter>
    </UserProvider>
  );
}