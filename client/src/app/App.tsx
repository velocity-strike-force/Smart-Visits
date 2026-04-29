import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { UserProvider } from "./components/UserContext";
import { ReferenceDataProvider } from "./referenceData/ReferenceDataContext";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import PostVisit from "./components/PostVisit";
import VisitDetail from "./components/VisitDetail";
import Feedback from "./components/Feedback";
import Analytics from "./components/Analytics";
import RequestVisit from "./components/RequestVisit";
import VisitRequests from "./components/VisitRequests";

export default function App() {
    return (
        <UserProvider>
            <ReferenceDataProvider>
                <BrowserRouter>
                    <div className="h-screen flex flex-col">
                        <Routes>
                            <Route path="/" element={<Layout />}>
                                <Route index element={<Dashboard />} />
                                <Route
                                    path="post-visit"
                                    element={<PostVisit />}
                                />
                                <Route
                                    path="visit/:id"
                                    element={<VisitDetail />}
                                />
                                <Route path="feedback" element={<Feedback />} />
                                <Route
                                    path="feedback/:id"
                                    element={<Feedback />}
                                />
                                <Route
                                    path="analytics"
                                    element={<Analytics />}
                                />
                                <Route
                                    path="request-visit"
                                    element={<RequestVisit />}
                                />
                                <Route
                                    path="visit-requests"
                                    element={<VisitRequests />}
                                />
                            </Route>
                        </Routes>
                        <Toaster
                            position="top-right"
                            toastOptions={{
                                classNames: {
                                    success:
                                        "!bg-green-600 !text-white !border-green-700",
                                },
                            }}
                        />
                    </div>
                </BrowserRouter>
            </ReferenceDataProvider>
        </UserProvider>
    );
}
