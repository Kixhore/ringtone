function audioBufferToWav(buffer) {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    const blockAlign = numChannels * bitDepth / 8;
    const byteRate = sampleRate * blockAlign;
    const dataSize = buffer.length * blockAlign;
    const headerSize = 44;
    const totalSize = headerSize + dataSize;
    
    const arrayBuffer = new ArrayBuffer(totalSize);
    const dataView = new DataView(arrayBuffer);
    
    // RIFF chunk descriptor
    writeString(dataView, 0, 'RIFF');
    dataView.setUint32(4, 36 + dataSize, true);
    writeString(dataView, 8, 'WAVE');
    
    // fmt sub-chunk
    writeString(dataView, 12, 'fmt ');
    dataView.setUint32(16, 16, true);
    dataView.setUint16(20, format, true);
    dataView.setUint16(22, numChannels, true);
    dataView.setUint32(24, sampleRate, true);
    dataView.setUint32(28, byteRate, true);
    dataView.setUint16(32, blockAlign, true);
    dataView.setUint16(34, bitDepth, true);
    
    // data sub-chunk
    writeString(dataView, 36, 'data');
    dataView.setUint32(40, dataSize, true);
    
    // write audio data
    const offset = 44;
    const channelData = [];
    for (let i = 0; i < numChannels; i++) {
        channelData[i] = buffer.getChannelData(i);
    }
    
    let pos = 0;
    while (pos < buffer.length) {
        for (let i = 0; i < numChannels; i++) {
            const sample = Math.max(-1, Math.min(1, channelData[i][pos]));
            const int = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
            dataView.setInt16(offset + (pos * blockAlign) + (i * 2), int, true);
        }
        pos++;
    }
    
    return arrayBuffer;
}

function writeString(dataView, offset, string) {
    for (let i = 0; i < string.length; i++) {
        dataView.setUint8(offset + i, string.charCodeAt(i));
    }
}
