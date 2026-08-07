import React from 'react';

export const HotelCardSkeleton: React.FC = () => {
  return (
    <div className="panel-card p-4 flex flex-col md:flex-row gap-4 border border-acc-200 dark:border-acc-800">
      <div className="w-full md:w-64 h-48 skeleton-box rounded shrink-0"></div>
      <div className="flex-1 space-y-3">
        <div className="h-5 w-3/4 skeleton-box"></div>
        <div className="h-3 w-1/2 skeleton-box"></div>
        <div className="space-y-1.5 pt-2">
          <div className="h-3 w-5/6 skeleton-box"></div>
          <div className="h-3 w-4/6 skeleton-box"></div>
        </div>
        <div className="pt-4 flex justify-between items-center">
          <div className="h-4 w-28 skeleton-box"></div>
          <div className="h-8 w-32 skeleton-box"></div>
        </div>
      </div>
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="panel-card p-4 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center">
          <div className="h-4 w-12 skeleton-box"></div>
          <div className="h-4 flex-1 skeleton-box"></div>
          <div className="h-4 w-24 skeleton-box"></div>
          <div className="h-4 w-20 skeleton-box"></div>
        </div>
      ))}
    </div>
  );
};
