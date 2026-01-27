import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function ProfileLoading() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <LoadingSpinner label="Loading profile..." />
    </div>
  );
}
