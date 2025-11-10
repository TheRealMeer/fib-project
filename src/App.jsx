import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SsoLogin from "./SsoLogin";
import ApiExample from "./ApiExample";
import SubscriptionPage from "./SubscriptionPage";
import TransactionsPage from "./TransactionsPage.JSX";
import { SubscriptionProvider } from "./components/SubscriptionContext";
import { UserProvider } from "./components/UserContext";

export default function App() {
  return (
    <SubscriptionProvider>
      <UserProvider>
        <Router>
          <Routes>
            <Route path="/" element={<SsoLogin />} />
            <Route path="/dashboard" element={<ApiExample />} />
            <Route path="/subscription" element={<SubscriptionPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
          </Routes>
        </Router>
      </UserProvider>
    </SubscriptionProvider>
  );
}
