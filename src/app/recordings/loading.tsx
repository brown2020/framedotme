import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function RecordingsLoading() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <LoadingSpinner label="Loading recordings..." />
    </div>
  );
}
