import React, { createContext, useState, useContext, useEffect } from "react";

const SubscriptionContext = createContext();

export const useSubscription = () => useContext(SubscriptionContext);

export const SubscriptionProvider = ({ children }) => {
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("subscription");
    if (saved) setSubscription(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (subscription) {
      localStorage.setItem("subscription", JSON.stringify(subscription));
    }
  }, [subscription]);

  return (
    <SubscriptionContext.Provider value={{ subscription, setSubscription }}>
      {children}
    </SubscriptionContext.Provider>
  );
};
