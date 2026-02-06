import { memo } from 'react';

const DashboardPage = () => {
  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold tracking-tight">Boshqaruv paneli</h1>
      <p className="text-muted-foreground mt-2">Tez kunda...</p>
    </main>
  );
};

export default memo(DashboardPage);