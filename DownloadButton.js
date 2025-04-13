function DownloadButton({ onClick, section, price }) {
    try {
        const [showPaymentModal, setShowPaymentModal] = React.useState(false);
        const [isAnimating, setIsAnimating] = React.useState(false);
        const downloadCount = getDownloadCount(section);
        const needsPayment = downloadCount >= DOWNLOAD_LIMIT;
        const [hasVoice, setHasVoice] = React.useState(false);
        const [hasMusic, setHasMusic] = React.useState(false);
        const [currentFileId, setCurrentFileId] = React.useState(null);

        // Subscribe to file upload status changes and generate file ID
        React.useEffect(() => {
            const checkInterval = setInterval(() => {
                const voiceElement = document.querySelector('audio[data-name="voice-preview"]');
                const musicElement = document.querySelector('audio[data-name="music-preview"]');
                
                setHasVoice(!!voiceElement);
                setHasMusic(!!musicElement);

                if (voiceElement && musicElement) {
                    // Generate a unique ID based on the audio content
                    const voiceUrl = voiceElement.src;
                    const musicUrl = musicElement.src;
                    const combinedId = `${voiceUrl}-${musicUrl}`;
                    setCurrentFileId(btoa(combinedId)); // Convert to base64 for shorter ID
                }
            }, 500);

            return () => clearInterval(checkInterval);
        }, []);

        const handleClick = () => {
            if (!hasVoice || !hasMusic || !currentFileId) {
                return;
            }

            setIsAnimating(true);
            
            if (needsPayment && !isFileDownloaded(section, currentFileId)) {
                setTimeout(() => {
                    setIsAnimating(false);
                    setShowPaymentModal(true);
                }, 600);
            } else {
                setTimeout(() => {
                    setIsAnimating(false);
                    if (!isFileDownloaded(section, currentFileId)) {
                        incrementDownloadCount(section, currentFileId);
                    }
                    onClick();
                }, 600);
            }
        };

        const handlePaymentSuccess = () => {
            onClick();
        };

        const isEnabled = hasVoice && hasMusic;
        const isAlreadyDownloaded = currentFileId && isFileDownloaded(section, currentFileId);

        return (
            <div data-name="download-section" className="space-y-4 flex flex-col items-center">
                <button
                    data-name="download-button"
                    onClick={handleClick}
                    disabled={!isEnabled}
                    className={`
                        relative overflow-hidden px-6 py-3 rounded-full font-medium
                        transition-all duration-300 transform
                        flex items-center space-x-3
                        ${isEnabled 
                            ? isAlreadyDownloaded
                                ? 'bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 text-white cursor-pointer'
                                : 'bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white cursor-pointer'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }
                        ${isAnimating ? 'scale-95' : 'scale-100'}
                        shadow-lg hover:shadow-xl
                    `}
                >
                    <i className={`fas ${isAlreadyDownloaded ? 'fa-cloud-download-alt' : 'fa-download'} ${isAnimating ? 'animate-bounce' : ''}`}></i>
                    <span>
                        {isAlreadyDownloaded 
                            ? 'Download Again' 
                            : needsPayment 
                                ? 'Unlock Download' 
                                : 'Download'}
                    </span>
                    
                    {/* Ripple effect */}
                    <span className={`
                        absolute inset-0 bg-white opacity-25 
                        transition-transform duration-500 ease-out
                        ${isAnimating ? 'scale-[3] opacity-0' : 'scale-0'}
                    `}></span>
                </button>

                {!isEnabled && (
                    <div className="text-center space-y-2">
                        <p className="text-red-500 text-sm">
                            <i className="fas fa-exclamation-circle mr-2"></i>
                            Please upload both voice and music files
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className={`flex items-center ${hasVoice ? 'text-green-500' : 'text-gray-400'}`}>
                                <i className={`fas fa-${hasVoice ? 'check-circle' : 'times-circle'} mr-1`}></i>
                                Voice
                            </span>
                            <span className={`flex items-center ${hasMusic ? 'text-green-500' : 'text-gray-400'}`}>
                                <i className={`fas fa-${hasMusic ? 'check-circle' : 'times-circle'} mr-1`}></i>
                                Music
                            </span>
                        </div>
                    </div>
                )}

                {isEnabled && !needsPayment && !isAlreadyDownloaded && (
                    <p className="text-sm text-gray-600">
                        {DOWNLOAD_LIMIT - downloadCount} free downloads remaining
                    </p>
                )}

                {isEnabled && needsPayment && !isAlreadyDownloaded && (
                    <div className="text-sm text-center">
                        <p className="text-blue-600">
                            <i className="fas fa-lock mr-1"></i>
                            Premium feature
                        </p>
                        <p className="text-gray-600">
                            Unlock unlimited downloads for ${price}
                        </p>
                    </div>
                )}

                {isAlreadyDownloaded && (
                    <p className="text-sm text-purple-600">
                        <i className="fas fa-info-circle mr-1"></i>
                        You've downloaded this file before
                    </p>
                )}

                <PaymentModal
                    isOpen={showPaymentModal}
                    onClose={() => setShowPaymentModal(false)}
                    amount={price}
                    section={section}
                    onSuccess={handlePaymentSuccess}
                />
            </div>
        );
    } catch (error) {
        console.error('DownloadButton error:', error);
        reportError(error);
        return null;
    }
}
