import wave
import struct
import math

# Audio parameters
num_channels = 1
sample_rate = 44100
duration = 1.0 # 1 second loop
num_frames = int(sample_rate * duration)
comptype = "NONE"
compname = "not compressed"

# Open wave file
wav_file = wave.open("H5_Demo/assets/audio/reeling.wav", "w")
wav_file.setparams((num_channels, 2, sample_rate, num_frames, comptype, compname))

max_amp = 32767.0
freq = 5.0 # Ratchet clicks per second
click_duration = 0.05 # VERY fast click
click_frames = int(sample_rate * click_duration)

for i in range(num_frames):
    time = i / float(sample_rate)
    
    # Are we in a click window?
    click_phase = (time * freq) % 1.0
    
    if click_phase < (click_duration * freq):
        # Generate some noise mixed with a high frequency beep
        noise = (math.sin(time * 1000 * 2 * math.pi) * 0.5 + math.sin(time * 5000 * 2 * math.pi) * 0.5)
        value = int(max_amp * noise * 0.5) # 50% volume
    else:
        value = 0
        
    data = struct.pack('<h', value)
    wav_file.writeframesraw(data)

wav_file.close()
