import React, {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from "react";
import Purchases, { CustomerInfo } from "react-native-purchases";

const FREE_COUNTER_LIMIT = 1;

interface SubscriptionContextType {
  isPro: boolean;
  isLoading: boolean;
  canAddCounter: (currentCount: number) => boolean;
  purchasePro: () => Promise<{ success: boolean; error?: string }>;
  restorePurchases: () => Promise<{ success: boolean; error?: string }>;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

function checkIsPro(customerInfo: CustomerInfo): boolean {
  return customerInfo.entitlements.active["lifetime"] !== undefined;
}

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        setIsPro(checkIsPro(customerInfo));
      } catch (e) {
        console.warn("RevenueCat: could not fetch customer info", e);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();

    // Listen for real-time updates (e.g. after purchase completes in background)
    Purchases.addCustomerInfoUpdateListener((info) => {
      setIsPro(checkIsPro(info));
    });

    return () => {
      // Cleanup handled by RevenueCat automatically
    };
  }, []);

  // Returns true if the user is allowed to add another counter
  const canAddCounter = (currentCount: number): boolean => {
    if (isPro) return true;
    return currentCount < FREE_COUNTER_LIMIT;
  };

  const purchasePro = async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      const offerings = await Purchases.getOfferings();
      const lifetimePackage = offerings.current?.availablePackages[0];

      if (!lifetimePackage) {
        return { success: false, error: "No offerings available." };
      }

      const { customerInfo } = await Purchases.purchasePackage(lifetimePackage);
      setIsPro(checkIsPro(customerInfo));
      return { success: true };
    } catch (e: any) {
      // RevenueCat throws a specific error when user cancels — don't treat as error
      if (e?.userCancelled) {
        return { success: false };
      }
      return { success: false, error: e?.message ?? "Purchase failed." };
    }
  };

  const restorePurchases = async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      const customerInfo = await Purchases.restorePurchases();
      const pro = checkIsPro(customerInfo);
      setIsPro(pro);
      return { success: pro };
    } catch (e: any) {
      return { success: false, error: e?.message ?? "Restore failed." };
    }
  };

  return (
    <SubscriptionContext.Provider
      value={{ isPro, isLoading, canAddCounter, purchasePro, restorePurchases }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const ctx = useContext(SubscriptionContext);
  if (!ctx)
    throw new Error("useSubscription must be used inside SubscriptionProvider");
  return ctx;
};
