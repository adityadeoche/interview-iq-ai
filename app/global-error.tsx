"use client";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    // Only show actual fatal errors, not the RSC prefetch "Failed to fetch" phantom
    const isFetchPhantom = error?.message?.toLowerCase().includes('failed to fetch');
    if (isFetchPhantom) {
        // Silently reset — this is a dev-mode false positive from Turbopack
        return null;
    }

    return (
        <html>
            <body style={{ background: '#0d1117', color: '#e6edf3', fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', margin: 0 }}>
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                        Something went wrong
                    </h2>
                    <p style={{ color: '#8b949e', marginBottom: '1.5rem' }}>
                        {error?.message || 'An unexpected error occurred.'}
                    </p>
                    <button
                        onClick={reset}
                        style={{ background: '#2563eb', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        Try again
                    </button>
                </div>
            </body>
        </html>
    );
}
