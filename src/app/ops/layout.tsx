import { Sidebar } from "@/components/layout/sidebar";

export default function OpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col pl-64">
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
