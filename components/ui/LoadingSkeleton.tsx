interface SkeletonProps {
  className?: string;
  rounded?: boolean;
}

export function Skeleton({ className = '', rounded }: SkeletonProps) {
  return (
    <div
      className={[
        'animate-pulse bg-gray-200',
        rounded ? 'rounded-full' : 'rounded-md',
        className,
      ].join(' ')}
      aria-hidden="true"
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="card p-3 flex gap-3">
      <Skeleton className="w-20 h-20 shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <div className="flex justify-between items-center pt-1">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
    </div>
  );
}

export function SectionSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="container-store py-4 space-y-4">
      <Skeleton className="h-5 w-40" />
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export default function LoadingSkeleton() {
  return (
    <div className="container-store py-4 space-y-4">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}