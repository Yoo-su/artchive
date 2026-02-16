export const BookMarketSkeleton = () => {
  return (
    <div className="mb-8 space-y-4 rounded-lg border bg-card p-4 animate-pulse">
      <div className="h-10 bg-gray-200 rounded w-full" />
      <div className="flex gap-4">
        <div className="h-10 bg-gray-200 rounded w-32" />
        <div className="h-10 bg-gray-200 rounded w-32" />
      </div>
      <div className="grid grid-cols-3 gap-6 mt-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-48 bg-gray-200 rounded" />
        ))}
      </div>
    </div>
  );
};
