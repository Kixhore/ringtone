function App() {
    try {
        React.useEffect(() => {
            // Intersection Observer for scroll animations
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            }, {
                threshold: 0.1
            });

            // Observe all elements with animation class
            document.querySelectorAll('.animate-fade-in-up').forEach((el) => {
                observer.observe(el);
            });

            return () => observer.disconnect();
        }, []);

        return (
            <div data-name="app" className="min-h-screen gradient-bg">
                <div className="relative">
                    {/* Background decorative elements */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
                        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
                        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
                    </div>

                    {/* Main content */}
                    <div className="relative max-w-6xl mx-auto px-4 py-12">
                    <header className="text-center mb-20 animate-fade-in-up">
                            <div className="app-title-wrapper">
                                <h1 className="app-title text-11xl ">
                                    Ringtone Maker
                                </h1>
                                <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                                Create, mix, and edit your perfect ringtone with our modern audio tools
                            </p>
                            </div>
                        </header>
                          
                        


                        <main className="space-y-12">
                            <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                                <div className="card p-8">
                                    <RecordingSection />
                                </div>
                            </div>

                            <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                                <div className="card p-8">
                                    <AudioUploader />
                                </div>
                            </div>

                            <div className="animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                                <div className="card p-8">
                                    <VideoConverter />
                                </div>
                            </div>
                            <div className="animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
                                <div className="card">
                                    <ReportForm />
                                </div>
                            </div>
                        </main>

                        <footer className="mt-16 text-center animate-fade-in-up">
                            <p className="text-blue-100 text-sm">
                                Create amazing ringtones with ease
                            </p>
                        </footer>
                    </div>
                </div>
            </div>
        );
    } catch (error) {
        console.error('App error:', error);
        reportError(error);
        return null;
    }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
