export const dynamic = 'force-dynamic';
export const revalidate = 0;

import Sidebar from "@/components/layout/Sidebar";
// The middleware already enforces authentication for all /dashboard routes.
// No need for a client-side auth re-check here — it causes a loading delay.
export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-bg-primary">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                <div className="max-w-6xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
