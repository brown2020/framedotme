import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function PaymentSuccessLoading() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <LoadingSpinner label="Processing payment..." />
    </div>
  );
}
