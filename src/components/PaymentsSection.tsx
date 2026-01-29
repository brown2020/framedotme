"use client";

import type { ReactElement } from "react";
import { useAuthStore } from "@/zustand/useAuthStore";
import { usePaymentsStore } from "@/zustand/usePaymentsStore";
import { useEffect } from "react";

export function PaymentsSection(): ReactElement {
  const uid = useAuthStore((state) => state.uid);
  const authReady = useAuthStore((state) => state.authReady);
  const { payments, paymentsLoading, paymentsError, fetchPayments } =
    usePaymentsStore();

  useEffect(() => {
    // Only fetch payments when both uid exists AND auth is fully ready
    // This ensures Firebase client SDK is initialized before Firestore queries
    if (uid && authReady) {
      fetchPayments(uid);
    }
  }, [uid, authReady, fetchPayments]);

  return (
    <div className="flex flex-col w-full gap-4">
      <h2 className="text-2xl font-bold text-gray-900">Payment History</h2>

      {paymentsLoading && (
        <div className="text-gray-500 text-center py-8">Loading payments...</div>
      )}
      {paymentsError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          Error: {paymentsError}
        </div>
      )}
      {!paymentsLoading && !paymentsError && (
        <div className="flex flex-col gap-2">
          {payments.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              No payments yet. Purchase credits to get started!
            </div>
          ) : (
            payments.map((payment, index) => (
              <div
                key={payment.docId || `${payment.id}-${index}`}
                className="border border-gray-200 p-6 rounded-xl bg-white shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-medium text-gray-500">
                    Payment #{payments.length - index}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    payment.status === "succeeded" || payment.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : payment.status === "failed"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {payment.status}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Amount</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {payment.currency || "$"}
                      {(payment.amount / 100).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Date</div>
                    <div className="text-base text-gray-900">
                      {payment.createdAt
                        ? payment.createdAt.toDate().toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })
                        : "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Platform</div>
                    <div className="text-base text-gray-900 capitalize">
                      {payment.platform}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Type</div>
                    <div className="text-base text-gray-900 capitalize">
                      {payment.mode.replace("-", " ")}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-xs text-gray-400">
                    Transaction ID: {payment.id}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
