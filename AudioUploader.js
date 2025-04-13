function AudioUploader() {
    try {
        const [audio, setAudio] = React.useState(null);
        const [trimStart, setTrimStart] = React.useState(0);
        const [trimEnd, setTrimEnd] = React.useState(30);
        const [isDragging, setIsDragging] = React.useState(false);

        const handleDrop = (e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('audio/')) {
                handleAudioFile(file);
            }
        };

        const handleFileInput = (e) => {
            const file = e.target.files[0];
            if (file) {
                handleAudioFile(file);
            }
        };

        const handleAudioFile = async (file) => {
            try {
                const url = URL.createObjectURL(file);
                const audioElement = document.createElement('audio');
                audioElement.src = url;
                
                await new Promise((resolve) => {
                    audioElement.onloadedmetadata = () => resolve();
                });

                setAudio({
                    file,
                    url,
                    duration: audioElement.duration
                });
                setTrimEnd(Math.min(30, audioElement.duration));
                audioElement.remove();
            } catch (error) {
                console.error('Error loading audio:', error);
                alert('Error loading audio file. Please try again.');
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
                a.download = 'trimmed_audio.wav';
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
                if (audio) {
                    URL.revokeObjectURL(audio.url);
                }
            };
        }, []);

        return (
            <div data-name="audio-uploader" className="p-6 bg-white rounded-lg shadow-lg mb-6">
                <h2 className="text-2xl font-bold mb-4 text-center">Audio Trimmer</h2>
                
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
                    <i className="fas fa-music text-4xl text-blue-400 mb-4"></i>
                    <p className="mb-4">Drag and drop audio file here or</p>
                    <input
                        data-name="file-input"
                        type="file"
                        accept="audio/*"
                        onChange={handleFileInput}
                        className="hidden"
                        id="audio-file"
                    />
                    <label
                        htmlFor="audio-file"
                        className="inline-flex items-center px-6 py-3 bg-white text-blue-500 border border-blue-500 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors duration-300"
                    >
                        Choose File
                    </label>
                </div>

                {audio && (
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
        console.error('AudioUploader error:', error);
        reportError(error);
        return null;
    }
}
