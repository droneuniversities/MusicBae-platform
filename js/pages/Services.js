const { useState, useEffect } = React;

function ServicesPage() {
    const [isVisible, setIsVisible] = useState(false);
    const { theme } = window.useApp();
    const isDark = theme === 'dark';

    useEffect(() => {
        setIsVisible(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    return (
        <div className={`min-h-screen animated-bg section-texture bg-dots transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div className={`absolute inset-0 ${isDark ? 'bg-black/40' : 'bg-white/20'}`}></div>
                <div className="relative z-10 container mx-auto px-4 py-20 text-center">
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-400 bg-clip-text text-transparent">
                        Audio Services
                    </h1>
                    <p className={`text-xl md:text-2xl mb-8 max-w-4xl mx-auto ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                        Professional music production services to elevate your sound and advance your career
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-16 relative z-10">
                {/* Call to Action Section */}
                <div className={`${isDark ? 'card card-dark' : 'card'} mb-16 p-8 md:p-12`}>
                    <div className="text-center mb-12">
                        <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Do you need help finishing your productions?
                        </h2>
                        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-8">
                            <span className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                                GET SIGNED. BE HEARD.
                            </span>
                        </div>
                        <p className={`text-lg md:text-xl max-w-4xl mx-auto leading-relaxed ${isDark ? 'text-white/80' : 'text-gray-600'}`}>
                            What we offer is more than just a foot in the door, we will work alongside you to help you achieve your music career goals. Our goal is your success. Our focus is on helping you build a long-lasting sustainable career.
                        </p>
                    </div>
                </div>

                {/* Services Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                    {/* Mixing & Mastering */}
                    <div className={`${isDark ? 'card card-dark' : 'card'} hover:border-blue-400/50 transition-all duration-300 hover:scale-105 group`}>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-sky-400 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                            </div>
                            <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Mixing & Mastering</h3>
                            <p className={isDark ? 'text-white/70' : 'text-gray-600'}>
                                Professional audio engineering to make your tracks radio-ready and industry-standard quality.
                            </p>
                        </div>
                    </div>

                    {/* Arrangement */}
                    <div className={`${isDark ? 'card card-dark' : 'card'} hover:border-sky-400/50 transition-all duration-300 hover:scale-105 group`}>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-r from-sky-400 to-cyan-400 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                                </svg>
                            </div>
                            <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Arrangement</h3>
                            <p className={isDark ? 'text-white/70' : 'text-gray-600'}>
                                Expert arrangement services to structure your ideas into compelling, complete compositions.
                            </p>
                        </div>
                    </div>


                    {/* Production Mentoring */}
                    <div className={`${isDark ? 'card card-dark' : 'card'} hover:border-indigo-400/50 transition-all duration-300 hover:scale-105 group`}>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-r from-indigo-400 to-blue-400 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
                                </svg>
                            </div>
                            <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Production Mentoring</h3>
                            <p className={isDark ? 'text-white/70' : 'text-gray-600'}>
                                One-on-one mentoring sessions to improve your production skills and workflow.
                            </p>
                        </div>
                    </div>

                </div>

                {/* Schedule Section */}
                <div className={`${isDark ? 'card card-dark' : 'card'} mb-16 p-8 md:p-12`}>
                    <div className="text-center">
                        <h2 className={`text-3xl md:text-4xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            A TRULY DYNAMIC PROGRAM THAT WORKS AROUND YOUR SCHEDULE
                        </h2>
                        <p className={`text-lg mb-8 max-w-3xl mx-auto ${isDark ? 'text-white/80' : 'text-gray-600'}`}>
                            We understand that every artist has different commitments and timelines. Our flexible approach ensures we can work with your schedule to deliver the best results.
                        </p>
                        <a 
                            href="https://vegasmediahouse.com/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-primary text-lg px-8 py-4"
                        >
                            Ask us how →
                        </a>
                    </div>
                </div>

                {/* Why Choose Us */}
                <div className="text-center mb-16">
                    <h2 className={`text-3xl md:text-4xl font-bold mb-12 ${isDark ? 'text-white' : 'text-gray-900'}`}>Why Choose Our Audio Services?</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-sky-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                            </div>
                            <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Proven Track Record</h3>
                            <p className={isDark ? 'text-white/70' : 'text-gray-600'}>
                                Successfully helped artists get signed and chart in the Beatport Top 100
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-20 h-20 bg-gradient-to-r from-sky-400 to-cyan-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                            </div>
                            <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Personalized Approach</h3>
                            <p className={isDark ? 'text-white/70' : 'text-gray-600'}>
                                Every artist gets a customized plan tailored to their specific goals and style
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-20 h-20 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                            </div>
                            <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Career Focused</h3>
                            <p className={isDark ? 'text-white/70' : 'text-gray-600'}>
                                We don't just finish tracks - we build sustainable, long-term music careers
                            </p>
                        </div>
                    </div>
                </div>

                 {/* Logo Section */}
                 <div className="text-center py-12">
                     <div className="flex justify-center">
                         <img 
                             src={isDark ? "/assets/images/music-baee-with-dots.webp" : "/assets/images/music-baee-logo-with-dots.webp"} 
                             alt="MusicBae Logo" 
                             className="max-w-xs max-h-32 object-contain"
                         />
                     </div>
                 </div>
            </div>
        </div>
    );
}

// Export for use in other components
window.ServicesPage = ServicesPage;
