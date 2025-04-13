function RecordingSection() {
    try {
        const [isRecording, setIsRecording] = React.useState(false);
        const [recordedAudio, setRecordedAudio] = React.useState(null);
        const [importedMusic, setImportedMusic] = React.useState(null);
        const [recordedVolume, setRecordedVolume] = React.useState(1);
        const [musicVolume, setMusicVolume] = React.useState(1);
        const [isDraggingVoice, setIsDraggingVoice] = React.useState(false);
        const [isDraggingMusic, setIsDraggingMusic] = React.useState(false);
        const [voiceTrimStart, setVoiceTrimStart] = React.useState(0);
        const [voiceTrimEnd, setVoiceTrimEnd] = React.useState(30);
        const [musicTrimStart, setMusicTrimStart] = React.useState(0);
        const [musicTrimEnd, setMusicTrimEnd] = React.useState(30);
        const mediaRecorderRef = React.useRef(null);
        const chunksRef = React.useRef([]);

        const formatTime = (seconds) => {
            if (!seconds) return '0:00';
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        };

        // Rest of the component code remains exactly the same as in your current version
        const startRecording = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorderRef.current = new MediaRecorder(stream);
                chunksRef.current = [];

                mediaRecorderRef.current.ondataavailable = (e) => {
                    chunksRef.current.push(e.data);
                };

                mediaRecorderRef.current.onstop = () => {
                    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                    setRecordedAudio({
                        file: blob,
                        url: URL.createObjectURL(blob),
                        duration: 0
                    });
                };

                mediaRecorderRef.current.start();
                setIsRecording(true);
            } catch (error) {
                console.error('Error starting recording:', error);
                reportError(error);
            }
        };

        const stopRecording = () => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
                setIsRecording(false);
            }
        };

        const handleVoiceUpload = async (file) => {
            try {
                const url = URL.createObjectURL(file);
                const audio = new Audio();
                audio.src = url;
                
                await new Promise((resolve) => {
                    audio.onloadedmetadata = () => resolve();
                });

                setRecordedAudio({
                    file,
                    url,
                    duration: audio.duration
                });
                setVoiceTrimEnd(Math.min(30, audio.duration));
            } catch (error) {
                console.error('Error loading voice file:', error);
                alert('Error loading voice file. Please try again.');
            }
        };

        const handleMusicUpload = async (file) => {
            try {
                const url = URL.createObjectURL(file);
                const audio = new Audio();
                audio.src = url;
                
                await new Promise((resolve) => {
                    audio.onloadedmetadata = () => resolve();
                });

                setImportedMusic({
                    file,
                    url,
                    duration: audio.duration
                });
                setMusicTrimEnd(Math.min(30, audio.duration));
            } catch (error) {
                console.error('Error loading music file:', error);
                alert('Error loading music file. Please try again.');
            }
        };

        const handleVoiceDrop = (e) => {
            e.preventDefault();
            setIsDraggingVoice(false);
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('audio/')) {
                handleVoiceUpload(file);
            }
        };

        const handleMusicDrop = (e) => {
            e.preventDefault();
            setIsDraggingMusic(false);
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('audio/')) {
                handleMusicUpload(file);
            }
        };

        const deleteRecordedVoice = () => {
            if (recordedAudio) {
                URL.revokeObjectURL(recordedAudio.url);
                setRecordedAudio(null);
                setVoiceTrimStart(0);
                setVoiceTrimEnd(30);
            }
        };

        const deleteImportedMusic = () => {
            if (importedMusic) {
                URL.revokeObjectURL(importedMusic.url);
                setImportedMusic(null);
                setMusicTrimStart(0);
                setMusicTrimEnd(30);
            }
        };

        const mergeAndDownload = async () => {
            try {
                if (!recordedAudio || !importedMusic) {
                    alert('Please record audio or upload voice, and import music first');
                    return;
                }

                const audioContext = new AudioContext();
                const [recordedBuffer, musicBuffer] = await Promise.all([
                    fetch(recordedAudio.url)
                        .then(res => res.arrayBuffer())
                        .then(buffer => audioContext.decodeAudioData(buffer)),
                    fetch(importedMusic.url)
                        .then(res => res.arrayBuffer())
                        .then(buffer => audioContext.decodeAudioData(buffer))
                ]);

                const voiceStartSample = Math.floor(voiceTrimStart * recordedBuffer.sampleRate);
                const voiceEndSample = Math.floor(voiceTrimEnd * recordedBuffer.sampleRate);
                const musicStartSample = Math.floor(musicTrimStart * musicBuffer.sampleRate);
                const musicEndSample = Math.floor(musicTrimEnd * musicBuffer.sampleRate);
                const trimmedLength = Math.max(voiceEndSample - voiceStartSample, musicEndSample - musicStartSample);

                const mergedBuffer = audioContext.createBuffer(
                    2,
                    trimmedLength,
                    audioContext.sampleRate
                );

                for (let channel = 0; channel < mergedBuffer.numberOfChannels; channel++) {
                    const mergedData = mergedBuffer.getChannelData(channel);
                    const recordedData = recordedBuffer.getChannelData(Math.min(channel, recordedBuffer.numberOfChannels - 1));
                    const musicData = musicBuffer.getChannelData(Math.min(channel, musicBuffer.numberOfChannels - 1));

                    for (let i = 0; i < trimmedLength; i++) {
                        const voiceSample = i + voiceStartSample < voiceEndSample ? recordedData[i + voiceStartSample] * recordedVolume : 0;
                        const musicSample = i + musicStartSample < musicEndSample ? musicData[i + musicStartSample] * musicVolume : 0;
                        mergedData[i] = (voiceSample + musicSample) / 2;
                    }
                }

                const mergedAudio = audioBufferToWav(mergedBuffer);
                const url = URL.createObjectURL(new Blob([mergedAudio], { type: 'audio/wav' }));
                const a = document.createElement('a');
                a.href = url;
                a.download = 'ringtone.wav';
                a.click();
                URL.revokeObjectURL(url);
            } catch (error) {
                console.error('Error merging audio:', error);
                reportError(error);
            }
        };

        return (
            <div data-name="recording-section" className="p-8 bg-white rounded-xl shadow-lg mb-6">
                <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">Voice Recording & Music Mixing</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Voice Recording Section */}
                    <div data-name="voice-section" className="space-y-6">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                            <h3 className="text-xl font-semibold mb-4 text-gray-700 text-center">Voice Recording</h3>
                            <div className="flex items-center justify-center space-x-4 mb-6">
                                <button
                                    data-name="record-button"
                                    onClick={isRecording ? stopRecording : startRecording}
                                    className={`flex items-center px-6 py-3 rounded-full transition-all duration-300 ${
                                        isRecording 
                                            ? 'bg-red-500 hover:bg-red-600 shadow-red-200' 
                                            : 'bg-blue-500 hover:bg-blue-600 shadow-blue-200'
                                    } text-white shadow-lg transform hover:scale-105`}
                                >
                                    <i className={`fas ${isRecording ? 'fa-stop' : 'fa-microphone'} mr-2 text-lg`}></i>
                                    {isRecording ? 'Stop Recording' : 'Start Recording'}
                                </button>
                                {recordedAudio && (
                                    <button
                                        data-name="delete-recording"
                                        onClick={deleteRecordedVoice}
                                        className="flex items-center px-4 py-3 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors duration-300"
                                    >
                                        <i className="fas fa-trash mr-2"></i>
                                        Delete
                                    </button>
                                )}
                            </div>
                            
                            <div
                                data-name="voice-drop-zone"
                                className={`drag-drop-zone rounded-xl border-dashed border-2 ${
                                    isDraggingVoice 
                                        ? 'border-blue-400 bg-blue-50' 
                                        : 'border-gray-300 hover:border-blue-300'
                                } p-8 text-center transition-all duration-300`}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setIsDraggingVoice(true);
                                }}
                                onDragLeave={() => setIsDraggingVoice(false)}
                                onDrop={handleVoiceDrop}
                            >
                                <i className="fas fa-cloud-upload-alt text-4xl text-blue-400 mb-4"></i>
                                <p className="mb-4 text-gray-600">Or upload voice file</p>
                                <input
                                    data-name="voice-file-input"
                                    type="file"
                                    accept="audio/*"
                                    className="hidden"
                                    id="voice-file"
                                    onChange={(e) => handleVoiceUpload(e.target.files[0])}
                                />
                                <label
                                    htmlFor="voice-file"
                                    className="inline-flex items-center px-6 py-3 bg-white text-blue-500 border border-blue-500 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors duration-300"
                                >
                                    <i className="fas fa-file-audio mr-2"></i>
                                    Choose Voice File
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Music Section */}
                    <div data-name="music-section" className="space-y-6">
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
                            <h3 className="text-xl font-semibold mb-4 text-gray-700 text-center">Background Music</h3>
                            <div
                                data-name="music-drop-zone"
                                className={`drag-drop-zone rounded-xl border-dashed border-2 ${
                                    isDraggingMusic 
                                        ? 'border-purple-400 bg-purple-50' 
                                        : 'border-gray-300 hover:border-purple-300'
                                } p-8 text-center transition-all duration-300`}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setIsDraggingMusic(true);
                                }}
                                onDragLeave={() => setIsDraggingMusic(false)}
                                onDrop={handleMusicDrop}
                            >
                                <i className="fas fa-music text-4xl text-purple-400 mb-4"></i>
                                <p className="mb-4 text-gray-600">Import Background Music</p>
                                <input
                                    data-name="music-import"
                                    type="file"
                                    accept="audio/*"
                                    className="hidden"
                                    id="music-file"
                                    onChange={(e) => handleMusicUpload(e.target.files[0])}
                                />
                                <label
                                    htmlFor="music-file"
                                    className="inline-flex items-center px-6 py-3 bg-white text-purple-500 border border-purple-500 rounded-lg cursor-pointer hover:bg-purple-50 transition-colors duration-300"
                                >
                                    <i className="fas fa-file-audio mr-2"></i>
                                    Choose Music File
                                </label>
                            </div>

                            {importedMusic && (
                                <div className="mt-4 space-y-4">
                                    <audio 
                                        data-name="music-preview" 
                                        controls 
                                        src={importedMusic.url} 
                                        className="w-full rounded-lg shadow-sm" 
                                    />
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Duration: {formatTime(importedMusic.duration)}</span>
                                        <span>Selected: {formatTime(musicTrimEnd - musicTrimStart)} / 30s</span>
                                    </div>
                                    <AudioTimeline
                                        duration={importedMusic.duration}
                                        trimStart={musicTrimStart}
                                        trimEnd={musicTrimEnd}
                                        maxDuration={30}
                                        onTrimChange={(start, end) => {
                                            setMusicTrimStart(start);
                                            setMusicTrimEnd(end);
                                        }}
                                    />
                                    <button
                                        data-name="delete-music"
                                        onClick={deleteImportedMusic}
                                        className="flex items-center px-4 py-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors duration-300"
                                    >
                                        <i className="fas fa-trash mr-2"></i>
                                        Delete Music
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Volume Controls */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <VolumeControl
                        label="Recorded Voice Volume"
                        volume={recordedVolume}
                        onChange={setRecordedVolume}
                    />
                    <VolumeControl
                        label="Background Music Volume"
                        volume={musicVolume}
                        onChange={setMusicVolume}
                    />
                </div>

                {recordedAudio && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <audio 
                            data-name="voice-preview" 
                            controls 
                            src={recordedAudio.url} 
                            className="w-full rounded-lg shadow-sm mb-4" 
                        />
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Duration: {formatTime(recordedAudio.duration)}</span>
                            <span>Selected: {formatTime(voiceTrimEnd - voiceTrimStart)} / 30s</span>
                        </div>
                        <AudioTimeline
                            duration={recordedAudio.duration}
                            trimStart={voiceTrimStart}
                            trimEnd={voiceTrimEnd}
                            maxDuration={30}
                            onTrimChange={(start, end) => {
                                setVoiceTrimStart(start);
                                setVoiceTrimEnd(end);
                            }}
                        />
                    </div>
                )}

                {/* Action Button */}
                <div className="mt-8 text-center">
                    <DownloadButton
                        onClick={mergeAndDownload}
                        section="recording"
                        price={0.25}
                    />
                </div>
            </div>
        );
    } catch (error) {
        console.error('RecordingSection error:', error);
        reportError(error);
        return null;
    }
}
