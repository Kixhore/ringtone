function VolumeControl({ label, volume, onChange }) {
    try {
        return (
            <div data-name="volume-control" className="space-y-2">
                <label className="block text-sm font-medium">{label}</label>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    className="volume-slider"
                />
            </div>
        );
    } catch (error) {
        console.error('VolumeControl error:', error);
        reportError(error);
        return null;
    }
}
