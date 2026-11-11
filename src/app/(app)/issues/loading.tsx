import { CardSkeleton, LoadingShell, PageHeaderSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <LoadingShell>
      <div className="space-y-6">
        <PageHeaderSkeleton />
        <Skeleton className="h-11 w-full rounded-xl" />
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </LoadingShell>
  );
}
