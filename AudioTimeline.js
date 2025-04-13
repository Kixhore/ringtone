function AudioTimeline({ duration, trimStart, trimEnd, maxDuration, onTrimChange }) {
    try {
        const timelineRef = React.useRef(null);
        const [isDragging, setIsDragging] = React.useState(null);
        const [startPos, setStartPos] = React.useState(trimStart / duration * 100);
        const [endPos, setEndPos] = React.useState(trimEnd / duration * 100);

        const handleStart = (handle, e) => {
            e.preventDefault(); // Prevent default to avoid unwanted behaviors
            setIsDragging(handle);
        };

        const handleMove = (e) => {
            if (!isDragging || !timelineRef.current) return;

            // Get the correct position whether it's a mouse or touch event
            const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
            const rect = timelineRef.current.getBoundingClientRect();
            const pos = ((clientX - rect.left) / rect.width) * 100;
            const clampedPos = Math.max(0, Math.min(100, pos));
            
            if (isDragging === 'start') {
                const newStartPos = clampedPos;
                if (newStartPos < endPos) {
                    const newDuration = duration * (endPos - newStartPos) / 100;
                    if (newDuration <= maxDuration) {
                        setStartPos(newStartPos);
                        onTrimChange(newStartPos * duration / 100, trimEnd);
                    }
                }
            } else if (isDragging === 'end') {
                const newEndPos = clampedPos;
                if (newEndPos > startPos) {
                    const newDuration = duration * (newEndPos - startPos) / 100;
                    if (newDuration <= maxDuration) {
                        setEndPos(newEndPos);
                        onTrimChange(trimStart, newEndPos * duration / 100);
                    }
                }
            }
        };

        const handleEnd = () => {
            setIsDragging(null);
        };

        // Add event listeners for both mouse and touch events
        React.useEffect(() => {
            if (isDragging) {
                // Mouse events
                document.addEventListener('mousemove', handleMove);
                document.addEventListener('mouseup', handleEnd);
                
                // Touch events
                document.addEventListener('touchmove', handleMove, { passive: false });
                document.addEventListener('touchend', handleEnd);
                document.addEventListener('touchcancel', handleEnd);

                return () => {
                    // Clean up mouse events
                    document.removeEventListener('mousemove', handleMove);
                    document.removeEventListener('mouseup', handleEnd);
                    
                    // Clean up touch events
                    document.removeEventListener('touchmove', handleMove);
                    document.removeEventListener('touchend', handleEnd);
                    document.removeEventListener('touchcancel', handleEnd);
                };
            }
        }, [isDragging]);

        // Update positions when trim values change
        React.useEffect(() => {
            if (duration > 0) {
                setStartPos((trimStart / duration) * 100);
                setEndPos((trimEnd / duration) * 100);
            }
        }, [trimStart, trimEnd, duration]);

        const formatTime = (seconds) => {
            if (!seconds) return '0:00';
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        };

        // Calculate time markers
        const timeMarkers = React.useMemo(() => {
            if (!duration || duration <= 0) return [0];
            
            const markers = [];
            const maxMarkers = 10;
            let interval = Math.max(Math.ceil(duration / maxMarkers), 1);
            
            if (interval * maxMarkers > duration) {
                interval = Math.ceil(duration / maxMarkers);
            }

            for (let time = 0; time <= duration && markers.length < maxMarkers; time += interval) {
                markers.push(Math.min(time, duration));
            }

            if (markers[markers.length - 1] < duration) {
                markers.push(duration);
            }

            return markers;
        }, [duration]);

        return (
            <div data-name="audio-timeline-wrapper" className="relative">
                <div data-name="audio-timeline" className="timeline-container" ref={timelineRef}>
                    <div
                        data-name="timeline-slider"
                        className="timeline-slider"
                        style={{
                            left: `${startPos}%`,
                            width: `${endPos - startPos}%`
                        }}
                    >
                        <div
                            data-name="timeline-handle-start"
                            className="timeline-handle left"
                            onMouseDown={(e) => handleStart('start', e)}
                            onTouchStart={(e) => handleStart('start', e)}
                            style={{ touchAction: 'none' }} // Prevent default touch actions
                        >
                            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs">
                                {formatTime(trimStart)}
                            </div>
                        </div>
                        <div
                            data-name="timeline-handle-end"
                            className="timeline-handle right"
                            onMouseDown={(e) => handleStart('end', e)}
                            onTouchStart={(e) => handleStart('end', e)}
                            style={{ touchAction: 'none' }} // Prevent default touch actions
                        >
                            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs">
                                {formatTime(trimEnd)}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div data-name="timeline-markers" className="absolute top-0 left-0 w-full h-full pointer-events-none">
                    {timeMarkers.map((time, index) => (
                        <div
                            key={`marker-${index}`}
                            className="absolute h-2 w-px bg-gray-400"
                            style={{ 
                                left: `${(time / duration) * 100}%`, 
                                top: '0' 
                            }}
                        >
                            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 text-xs text-gray-500">
                                {formatTime(time)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    } catch (error) {
        console.error('AudioTimeline error:', error);
        reportError(error);
        return null;
    }
}
