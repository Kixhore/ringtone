function VideoConverter() {
    try {
        const [video, setVideo] = React.useState(null);
        const [audio, setAudio] = React.useState(null);
        const [trimStart, setTrimStart] = React.useState(0);
        const [trimEnd, setTrimEnd] = React.useState(30);
        const [isDragging, setIsDragging] = React.useState(false);
        const [isConverting, setIsConverting] = React.useState(false);
        const videoRef = React.useRef(null);
        const audioContextRef = React.useRef(null);

        const handleDrop = (e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('video/')) {
                handleVideoFile(file);
            }
        };

        const handleFileInput = (e) => {
            const file = e.target.files[0];
            if (file) {
                handleVideoFile(file);
            }
        };

        const cleanupAudioContext = () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
        };

        const handleVideoFile = async (file) => {
            try {
                setIsConverting(true);
                cleanupAudioContext();

                const videoUrl = URL.createObjectURL(file);
                setVideo({ file, url: videoUrl });

                // Create a video element for extraction
                const videoElement = document.createElement('video');
                videoElement.src = videoUrl;
                await new Promise((resolve) => {
                    videoElement.onloadedmetadata = () => resolve();
                });

                // Create audio context and source
                audioContextRef.current = new AudioContext();
                const destination = audioContextRef.current.createMediaStreamDestination();
                const source = audioContextRef.current.createMediaElementSource(videoElement);
                source.connect(destination);

                // Set up media recorder
                const mediaRecorder = new MediaRecorder(destination.stream);
                const audioChunks = [];

                mediaRecorder.ondataavailable = (event) => {
                    audioChunks.push(event.data);
                };

                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    const audioUrl = URL.createObjectURL(audioBlob);
                    setAudio({
                        file: audioBlob,
                        url: audioUrl,
                        duration: videoElement.duration
                    });
                    setTrimEnd(Math.min(30, videoElement.duration));
                    setIsConverting(false);
                    videoElement.remove();
                    cleanupAudioContext();
                };

                // Start recording and playing
                mediaRecorder.start();
                videoElement.currentTime = 0;
                await videoElement.play();

                videoElement.onended = () => {
                    mediaRecorder.stop();
                    videoElement.pause();
                };
            } catch (error) {
                console.error('Error processing video:', error);
                alert('Error processing video: ' + error.message);
                setIsConverting(false);
                cleanupAudioContext();
            }
        };

        const handleTrim = async () => {
            try {
                if (!audio) return;

                const audioContext = new AudioContext();
                const audioBuffer = await fetch(audio.url)
                    .then(res => res.arrayBuffer())
                    .then(buffer => audioContext.decodeAudioData(buffer));

                const startSample = Math.floor(trimStart * audioBuffer.sampleRate);
                const endSample = Math.floor(trimEnd * audioBuffer.sampleRate);
                const trimmedBuffer = audioContext.createBuffer(
                    audioBuffer.numberOfChannels,
                    endSample - startSample,
                    audioBuffer.sampleRate
                );

                for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
                    const channelData = audioBuffer.getChannelData(channel);
                    const trimmedData = trimmedBuffer.getChannelData(channel);
                    for (let i = 0; i < trimmedBuffer.length; i++) {
                        trimmedData[i] = channelData[i + startSample];
                    }
                }

                const trimmedAudio = audioBufferToWav(trimmedBuffer);
                const url = URL.createObjectURL(new Blob([trimmedAudio], { type: 'audio/wav' }));
                const a = document.createElement('a');
                a.href = url;
                a.download = 'video_audio.wav';
                a.click();
                URL.revokeObjectURL(url);
            } catch (error) {
                console.error('Error trimming audio:', error);
                alert('Error trimming audio. Please try again.');
            }
        };

        const formatTime = (seconds) => {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        };

        React.useEffect(() => {
            return () => {
                if (video) URL.revokeObjectURL(video.url);
                if (audio) URL.revokeObjectURL(audio.url);
                cleanupAudioContext();
            };
        }, []);

        return (
            <div data-name="video-converter" className="p-6 bg-white rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-4 text-center ">Video to Audio Converter</h2>
                
                <div
                    data-name="drop-zone"
                    className={`drag-drop-zone p-8 text-center ${isDragging ? 'active' : ''}`}
                    onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                >
                    <i className="fas fa-video text-4xl text-red-400 mb-4"></i>
                    <p className="mb-4">Drag and drop video file here or</p>
                    <input
                        data-name="file-input"
                        type="file"
                        accept="video/*"
                        onChange={handleFileInput}
                        className="hidden"
                        id="video-file"
                    />
                    <label
                        htmlFor="video-file"
                        className="inline-flex items-center px-6 py-3 bg-white text-red-500 border border-red-500 rounded-lg cursor-pointer hover:bg-red-50 transition-colors duration-300"
                        
                    >
                        Choose File
                    </label>
                </div>

                {video && (
                    <div className="mt-4">
                        <video 
                            data-name="video-preview" 
                            controls 
                            src={video.url} 
                            className="w-full mb-4"
                            ref={videoRef}
                            muted
                        />
                        {isConverting && (
                            <div className="text-center py-4">
                                <i className="fas fa-spinner fa-spin mr-2"></i>
                                Converting video to audio...
                            </div>
                        )}
                    </div>
                )}

                {audio && !isConverting && (
                    <div className="mt-4 space-y-4 text-center">
                        <audio data-name="audio-preview" controls src={audio.url} className="w-full" />
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Full Duration: {formatTime(audio.duration)}</span>
                            <span>Selected: {formatTime(trimEnd - trimStart)} / 30s</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                            <span>{formatTime(trimStart)}</span>
                            <span>{formatTime(trimEnd)}</span>
                        </div>
                        <AudioTimeline
                            duration={audio.duration}
                            trimStart={trimStart}
                            trimEnd={trimEnd}
                            maxDuration={30}
                            onTrimChange={(start, end) => {
                                setTrimStart(start);
                                setTrimEnd(end);
                            }}
                        />
                        <button
                            data-name="trim-download-button"
                            onClick={handleTrim}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                            disabled={trimEnd - trimStart > 30}
                        >
                            <i className="fas fa-download mr-2"></i>
                            Trim and Download
                        </button>
                        {trimEnd - trimStart > 30 && (
                            <p className="text-red-500 text-sm">
                                Selected duration exceeds 30 seconds. Please adjust the selection.
                            </p>
                        )}
                    </div>
                )}
            </div>
        );
    } catch (error) {
        console.error('VideoConverter error:', error);
        reportError(error);
        return null;
    }
}
