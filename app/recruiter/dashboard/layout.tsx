export const dynamic = 'force-dynamic';
export const revalidate = 0;

import Sidebar from "@/components/layout/Sidebar";
export default function RecruiterDashboardLayout({
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
