---
title: Streaming Music with XAudio2
description: In this tutorial we will learn how to implement an audio streaming technique using XAudio2 and the Windows Media Foundation's source reader in asynchronous mode.
---

> Sam was the only member of the party who had not been over the river before. He had a strange feeling as the slow
> gurgling stream slipped by: his old life lay behind in the mists, dark adventure lay in front.
>
> – J.R.R. Tolkien, The Lord of the Rings

Streaming is the process of playing back an audio file while maintaining only a small portion of its data in memory,
which allows for large audio files, such as background music, to be played back, with very little memory usage.

To stream an audio file, its data must be read in in chunks instead of completely loading all of it at once. To do so,
the audio data is read asynchronously, and the data chunks are stored in a queue of buffers. Once a buffer is filled, it
is submitted to a source voice, which then processes the buffer, i.e. plays back the audio data. Once the source voice
is finished playing the data inside a buffer, the buffer again becomes available for reading more data. This process
allows for large audio files to be played back with minimal memory consumption. Obviously, to harness the power of this
technique, the streaming code should be placed in a separate thread, where it can sleep while it waits for long-running
disk and audio operations to finish. XAudio2 uses callback structures to wake those threads by triggering events when
audio operations have finished.

In this tutorial, we will learn how to implement the just described technique using the Windows Media Foundation's
source reader in asynchronously mode.

## Asynchronous Reading

The Source Reader operates either in synchronous mode or asynchronous mode. In
the [previous tutorial](https://bell0bytes.eu/the-basics-of-xaudio2/) we used the Source Reader in synchronous mode,
which is the default. In synchronous mode,
the [IMFSourceReader::ReadSample](https://docs.microsoft.com/en-us/windows/desktop/api/mfreadwrite/nf-mfreadwrite-imfsourcereader-readsample)
method blocks while the media source produces the next sample. The larger the audio file we are trying to load, the
longer the calling thread is blocked. Obviously, this is not what we want for a game.

In asynchronous mode, the ReadSample returns immediately and the work is performed on another thread. After the
operation is complete, the Source Reader calls the application through
the [IMFSourceReaderCallback](https://docs.microsoft.com/en-us/windows/desktop/api/mfreadwrite/nn-mfreadwrite-imfsourcereadercallback)
callback interface. To use asynchronous mode, a pointer to a callback structure must be provided on creation of the
source reader.

The callback interface has the following three methods:

### IMFSourceReaderCallback::OnEvent

This method is called when the source reader receives certain events from the media source.

### IMFSourceReaderCallback::OnFlush

This method is called when the IMFSourceReader::Flush method completes.

### IMFSourceReaderCallback::OnReadSample

This method is called when the IMFSourceReader::ReadSample method completes.

## Implementing the Callback Interface

```cpp
// callback structure for the WMF Source Reader
struct SourceReaderCallback : public IMFSourceReaderCallback
{
	Microsoft::WRL::ComPtr<IMFSample>	sample;				// the sample that was read in
	HANDLE								hReadSample;		// handle to the read sample
	bool								endOfStream;		// true iff the end of the file was reached
	HRESULT								status;				// the status of the stream
	std::mutex							guard;				// thread-safety

	STDMETHOD(QueryInterface) (REFIID iid, _COM_Outptr_ void** ppv) override 
	{
		if (!ppv)
			return E_POINTER;

		if (_uuidof(IMFSourceReaderCallback) == iid)
		{
			*ppv = this;
			return S_OK;
		}

		*ppv = nullptr;
		return E_NOINTERFACE;
	}
	STDMETHOD_(ULONG, AddRef)() override { return 1; }
	STDMETHOD_(ULONG, Release)() override { return 1; }
	STDMETHOD(OnReadSample)(_In_ HRESULT hrStatus, _In_ DWORD dwStreamIndex, _In_ DWORD dwStreamFlags, _In_ LONGLONG llTimestamp, _In_opt_ IMFSample *pSample) override
	{
		UNREFERENCED_PARAMETER(dwStreamIndex);
		UNREFERENCED_PARAMETER(llTimestamp);

		std::lock_guard<std::mutex> lock(guard);
		if (SUCCEEDED(hrStatus))
		{
			if (pSample)
			{
				sample = pSample;
			}
		}

		if (dwStreamFlags & MF_SOURCE_READERF_ENDOFSTREAM)
		{
			endOfStream = true;
		}

		status = hrStatus;
		SetEvent(hReadSample);

		return S_OK;
	}
	STDMETHOD(OnFlush)(_In_ DWORD) override { return S_OK; };
	STDMETHOD(OnEvent)(_In_ DWORD, _In_ IMFMediaEvent *) override { return S_OK; };

	void Restart();

    SourceReaderCallback();
	virtual ~SourceReaderCallback();
};
```

There isn't much to say about this structure. I won't elaborate on the COM stuff, as it is rather tedious, just note
that whenever we read a sample, all we really have to do is to check whether we reached the end of the audio file or
not.

## Preparing the XAudio2 Engine

The XAudio2 class received a few new methods and members:

```cpp
// the main audio engine powered by XAudio2 and Windows Media Foundation
class AudioEngine
{
private:
	Microsoft::WRL::ComPtr<IXAudio2> dev;							// the main XAudio2 engine
	IXAudio2MasteringVoice* masterVoice;							// a mastering voice
	Microsoft::WRL::ComPtr<IMFAttributes> sourceReaderConfiguration;// Windows Media Foundation Source Reader Configuration

	// streaming variables
	SourceReaderCallback sourceReaderCallback;						// callback class for the source reader
	StreamingVoiceCallback streamingVoiceCallback;					// callback class for the source voice
	static const int maxBufferCount = 3;							// maximal numbers of buffers used during streaming
	bool stopStreaming = false;										// breaks the streaming thread
		
	// initialization
	util::Expected<void> initialize();								// this function initializes the XAudio2 interface
		
	// read audio data from the harddrive
	util::Expected<void> loadFile(const std::wstring& filename, std::vector<BYTE>& audioData, WAVEFORMATEX** wafeFormatEx, unsigned int& waveLength);	// load audio file from disk
		
	// stream audio
	util::Expected<void> createAsyncReader(const std::wstring& filename, IMFSourceReader** sourceReader, WAVEFORMATEX* wfx, size_t wfxSize);			// creates a source reader in asyncrononous mode
	util::Expected<void> streamFile(const std::wstring& filename, XAUDIO2_VOICE_SENDS sendList, const bool loop = false);								// streams a file from the harddrive
	util::Expected<void> loopStream(IMFSourceReader* const sourceReader, IXAudio2SourceVoice* const sourceVoice, const bool loop = false);				// the actual loop of the streaming function

public:
	// constructor and destructor
	AudioEngine();
	~AudioEngine();

	friend class AudioComponent;
};
```

### SourceReaderCallback sourceReaderCallback

This is a callback structure similar to the above described callback structure for the source reader, but this one is
used while playing the audio chunks. We will talk more about this soon.

### StreamingVoiceCallback streamingVoiceCallback;

This is the callback structure for the source voice as explained above.

### static const int maxBufferCount = 3

This member defines the maximal number of buffers to use during streaming.

### bool stopStreaming = false;

This boolean member tells the streaming function whether it is time to go to bed or to happily continue streaming audio.

In the next section, we will talk about the following three functions in greater detail:

### createAsyncReader

This method creates a source reader in asyncrononous mode.

### streamFile

This method streams an audio file from the harddrive.

### loopStream

This method is the actual workhorse for the audio streaming.

## Asyncronous Source Reader

As for synchronous reading, to stream a file, we first have to attach a source reader to a file on the hard drive. To
get asynchronous reading, we set the corresponding attribute of the source reader as follows:

```cpp
// set the source reader to asyncronous mode
hr = sourceReaderConfiguration->SetUnknown(MF_SOURCE_READER_ASYNC_CALLBACK, &sourceReaderCallback);
if (FAILED(hr))
	return std::runtime_error("Critical error: Unable to set the source reader callback class for asyncronous read!");
```

Basically, this attaches our above defined callback structure to the source reader. The rest is just the same as in the
synchronous case, and thus I will simply paste the C++-code here:

```cpp
util::Expected<void> AudioEngine::createAsyncReader(const std::wstring& filename, IMFSourceReader** sourceReader, WAVEFORMATEX* wfx, size_t wfxSize)
{
	// handle errors
	HRESULT hr = S_OK;

	// set the source reader to asyncronous mode
	hr = sourceReaderConfiguration->SetUnknown(MF_SOURCE_READER_ASYNC_CALLBACK, &sourceReaderCallback);
	if (FAILED(hr))
		return std::runtime_error("Critical error: Unable to set the source reader callback class for asyncronous read!");

	// create the source reader
	hr = MFCreateSourceReaderFromURL(filename.c_str(), sourceReaderConfiguration.Get(), sourceReader);
	if (FAILED(hr))
		return std::runtime_error("Critical error: Unable to create source reader from URL!");

	// stream index
	DWORD streamIndex = (DWORD)MF_SOURCE_READER_FIRST_AUDIO_STREAM;

	// select the first audio stream, and deselect all other streams
	hr = (*sourceReader)->SetStreamSelection((DWORD)MF_SOURCE_READER_ALL_STREAMS, false);
	if (FAILED(hr))
		return std::runtime_error("Critical error: Unable to disable streams!");

	hr = (*sourceReader)->SetStreamSelection(streamIndex, true);
	if (FAILED(hr))
		return std::runtime_error("Critical error: Unable to enable first audio stream!");

	// query information about the media file
	Microsoft::WRL::ComPtr<IMFMediaType> nativeMediaType;
	hr = (*sourceReader)->GetNativeMediaType(streamIndex, 0, nativeMediaType.GetAddressOf());
	if (FAILED(hr))
		return std::runtime_error("Critical error: Unable to query media information!");

	// make sure that this is really an audio file
	GUID majorType{};
	hr = nativeMediaType->GetGUID(MF_MT_MAJOR_TYPE, &majorType);
	if (majorType != MFMediaType_Audio)
		return std::runtime_error("Critical error: the requested file is not an audio file!");

	// check whether the audio file is compressed or uncompressed
	GUID subType{};
	hr = nativeMediaType->GetGUID(MF_MT_MAJOR_TYPE, &subType);
	if (subType == MFAudioFormat_Float || subType == MFAudioFormat_PCM)
	{
		// the audio file is uncompressed
	}
	else
	{
		// the audio file is compressed; we have to decompress it first
		// to do so, we inform the SourceReader that we want uncompressed data
		// this causes the SourceReader to look for decoders to perform our request
		Microsoft::WRL::ComPtr<IMFMediaType> partialType = nullptr;
		hr = MFCreateMediaType(partialType.GetAddressOf());
		if (FAILED(hr))
			return std::runtime_error("Critical error: Unable create media type!");

		// set the media type to "audio"
		hr = partialType->SetGUID(MF_MT_MAJOR_TYPE, MFMediaType_Audio);
		if (FAILED(hr))
			return std::runtime_error("Critical error: Unable to set media type to audio!");

		// request uncompressed data
		hr = partialType->SetGUID(MF_MT_SUBTYPE, MFAudioFormat_PCM);
		if (FAILED(hr))
			return std::runtime_error("Critical error: Unable to set guid of media type to uncompressed!");

		hr = (*sourceReader)->SetCurrentMediaType(streamIndex, NULL, partialType.Get());
		if (FAILED(hr))
			return std::runtime_error("Critical error: Unable to set current media type!");
	}
	
	// uncompress the data
	Microsoft::WRL::ComPtr<IMFMediaType> uncompressedAudioType = nullptr;
	hr = (*sourceReader)->GetCurrentMediaType(streamIndex, uncompressedAudioType.GetAddressOf());
	if (FAILED(hr))
		return std::runtime_error("Critical error: Unable to retrieve the current media type!");

	UINT32 waveFormatSize = 0;
	WAVEFORMATEX* waveFormat = nullptr;
	hr = MFCreateWaveFormatExFromMFMediaType(uncompressedAudioType.Get(), &waveFormat, &waveFormatSize);
	if (FAILED(hr))
		return std::runtime_error("Critical error: Unable to create the wave format!");

	// ensure the stream is selected
    hr = (*sourceReader)->SetStreamSelection(streamIndex, true);
	if (FAILED(hr))
		return std::runtime_error("Critical error: Unable to select audio stream!");

	// copy data
	memcpy_s(wfx, wfxSize, waveFormat, waveFormatSize);
	CoTaskMemFree(waveFormat);

	// return success
	return { };
}
```

## Final Preparations

The *streamFile* method basically prepares the source reader for asynchronous reading and then loops over the audio data
for as long as we desire, using an XAudio2 source voice to play back the audio chunks that are available. To play back
those chunks, another callback structure is needed,
a [source voice callback structure](https://docs.microsoft.com/en-us/windows/desktop/api/xaudio2/nn-xaudio2-ixaudio2voicecallback):

```cpp
// callback structure for XAudio2 voices
struct StreamingVoiceCallback : public IXAudio2VoiceCallback
{
	HANDLE hBufferEndEvent;

	STDMETHOD_(void, OnVoiceProcessingPassStart)(UINT32) override { };
	STDMETHOD_(void, OnVoiceProcessingPassEnd)() override { };
	STDMETHOD_(void, OnStreamEnd)() override { };
	STDMETHOD_(void, OnBufferStart)(void*) override { };
	STDMETHOD_(void, OnBufferEnd)(void*) override { SetEvent(hBufferEndEvent); };
	STDMETHOD_(void, OnLoopEnd)(void*) override { };
	STDMETHOD_(void, OnVoiceError)(void*, HRESULT) override { };

	StreamingVoiceCallback();
	virtual ~StreamingVoiceCallback();
};
```

Once again, we will ignore the tedious COM stuff; we then realize that there really isn't much to do here — the only
event we are interested in handling currently is when we reach the end of a buffer, this is done, what a surprise, in
the *OnBufferEnd* method.

```cpp
util::Expected<void> AudioEngine::streamFile(const std::wstring& filename, XAUDIO2_VOICE_SENDS sendList, const bool loop)
{
	// handle errors
	HRESULT hr = S_OK;
	util::Expected<void> result;

	DWORD streamIndex = (DWORD)MF_SOURCE_READER_FIRST_AUDIO_STREAM;

    // create the asyncronous source reader
	Microsoft::WRL::ComPtr<IMFSourceReader> sourceReader;
	WAVEFORMATEX waveFormat;
	result = createAsyncReader(filename, sourceReader.GetAddressOf(), &waveFormat, sizeof(waveFormat));
	if (!result.isValid())
		return result;

	// create the source voice
	IXAudio2SourceVoice* sourceVoice;
	hr = dev->CreateSourceVoice(&sourceVoice, &waveFormat, 0, XAUDIO2_DEFAULT_FREQ_RATIO, &streamingVoiceCallback, &sendList, NULL);
	if (FAILED(hr))
		return std::runtime_error("Critical error: Unable to create the source voice for streaming!");
	sourceVoice->Start();

	// loop
	result = loopStream(sourceReader.Get(), sourceVoice, loop);
	if (!result.isValid())
		return result;

	sourceReader->Flush(streamIndex);
	sourceVoice->DestroyVoice();
	sourceReader = nullptr;

	// return success
	return { };
}
```

## Looping

The actual work is done in the looping function. Once again, as in the synchronous case, we will enter an endless loop.
This time though, we will have two actual breaking conditions: if the stream is specified to loop, the only way to get
out of the *forever* loop is to set the *stopStreaming* boolean to true; else it is also possible to break the loop from
reaching the end of the audio file.

```cpp
util::Expected<void> AudioEngine::loopStream(IMFSourceReader* const sourceReader, IXAudio2SourceVoice* const sourceVoice, const bool loop)
{
    ...
	
    for (;;)
	{
		if (stopStreaming)
			break;
    
        ...
        
		if (sourceReaderCallback.endOfStream)
		{
			if (loop)
			{
                ...
			}
			else
				break;
		}
    }
}
```

As before, the first thing to do is to get a sample of the audio data:

```cpp
util::Expected<void> AudioEngine::loopStream(IMFSourceReader* const sourceReader, IXAudio2SourceVoice* const sourceVoice, const bool loop)
{
	DWORD streamIndex = (DWORD)MF_SOURCE_READER_FIRST_AUDIO_STREAM;
	...

	for (;;)
	{
		...

		hr = sourceReader->ReadSample(streamIndex, 0, nullptr, nullptr, nullptr, nullptr);
		if (FAILED(hr))
			return std::runtime_error("Critical error: Unable to read source sample!");

		WaitForSingleObject(sourceReaderCallback.hReadSample, INFINITE);
    }
    ...
}
```

Notice that this time we have set all but the first parameter of the *ReadSample* method to zero, indicating that we
indeed want to read the audio data in asynchronous mode. Once the sample is read in, we check if we have reached the end
of the file and, if that is the case, whether we should restart the stream (loop) or to stop streaming:

```cpp
util::Expected<void> AudioEngine::loopStream(IMFSourceReader* const sourceReader, IXAudio2SourceVoice* const sourceVoice, const bool loop)
{
	DWORD streamIndex = (DWORD)MF_SOURCE_READER_FIRST_AUDIO_STREAM;
    
    ...
	
    for (;;)
	{
		if (stopStreaming)
			break;

		hr = sourceReader->ReadSample(streamIndex, 0, nullptr, nullptr, nullptr, nullptr);
		if (FAILED(hr))
			return std::runtime_error("Critical error: Unable to read source sample!");

		WaitForSingleObject(sourceReaderCallback.hReadSample, INFINITE);

		if (sourceReaderCallback.endOfStream)
		{
			if (loop)
			{
				// restart the stream
				sourceReaderCallback.Restart();
				PROPVARIANT var = { 0 };
				var.vt = VT_I8;
				hr = sourceReader->SetCurrentPosition(GUID_NULL, var);
				if (SUCCEEDED(hr))
					continue;
				else
					return std::runtime_error("Critical error: Unable to set the source reader position!");
			}
			else
				break;
            ...
		}
    }
}
```

The restart function of the callback structure simply sets the *end of stream* boolean to false and empties the sample.
*[PROPVARIANT](https://docs.microsoft.com/en-us/windows/desktop/api/propidl/ns-propidl-tagpropvariant)s* are used to set
properties of objects, in this case, we simply reset the current position of the source reader to the beginning of the
audio file (*GUID_NULL*). By passing *VT_I8*, we specify that the type of the property is an 8-byte signed integer in
the little-endian byte order format.

Okay, with all the looping and breaking stuff out of the way, it is time to actually read the data and to prepare it to
be played back by an XAudio2 source voice. This is actually similar to the synchronous case:

```cpp
util::Expected<void> AudioEngine::loopStream(IMFSourceReader* const sourceReader, IXAudio2SourceVoice* const sourceVoice, const bool loop)
{
	DWORD streamIndex = (DWORD)MF_SOURCE_READER_FIRST_AUDIO_STREAM;
	DWORD currentStreamBuffer = 0;
	HRESULT hr = S_OK;
	size_t bufferSize[maxBufferCount] = { 0 };
	std::unique_ptr<uint8_t[]> buffers[maxBufferCount];

	for (;;)
	{
		if (stopStreaming)
			break;

		hr = sourceReader->ReadSample(streamIndex, 0, nullptr, nullptr, nullptr, nullptr);
		...

		if (sourceReaderCallback.endOfStream)
		...
        
		Microsoft::WRL::ComPtr<IMFMediaBuffer> mediaBuffer;
		hr = sourceReaderCallback.sample->ConvertToContiguousBuffer(mediaBuffer.GetAddressOf());
		if (FAILED(hr))
			...

		BYTE* audioData = nullptr;
		DWORD sampleBufferLength = 0;

		hr = mediaBuffer->Lock(&audioData, nullptr, &sampleBufferLength);
		if (FAILED(hr))
			...

		if (bufferSize[currentStreamBuffer] < sampleBufferLength)
		{
			buffers[currentStreamBuffer].reset(new uint8_t[sampleBufferLength]);
			bufferSize[currentStreamBuffer] = sampleBufferLength;
		}

		memcpy_s(buffers[currentStreamBuffer].get(), sampleBufferLength, audioData, sampleBufferLength);

		hr = mediaBuffer->Unlock();
		if (FAILED(hr))
			...

		// wait until the XAudio2 source has played enough data
		// we want to have only maxBufferCount-1 buffers on the queue to make sure that there is always one free buffer for the Media Foundation streamer
		XAUDIO2_VOICE_STATE state;
		for (;;)
		{
			sourceVoice->GetState(&state);
			if (state.BuffersQueued < maxBufferCount - 1)
				break;

			WaitForSingleObject(streamingVoiceCallback.hBufferEndEvent, INFINITE);
		}

		XAUDIO2_BUFFER buf = { 0 };
		buf.AudioBytes = sampleBufferLength;
		buf.pAudioData = buffers[currentStreamBuffer].get();
		sourceVoice->SubmitSourceBuffer(&buf);

		currentStreamBuffer++;
		currentStreamBuffer %= maxBufferCount;
	}

    ...
}
```

The beginning is just the same as for the synchronous case: we have to convert the sample data into a contiguous buffer.
Once done, the data is copied into an array of bytes. The only real difference is here:

```cpp
// wait until the XAudio2 source has played enough data
// we want to have only maxBufferCount-1 buffers on the queue to make sure that there is always one free buffer for the Media Foundation streamer
XAUDIO2_VOICE_STATE state;
for (;;)
{
	sourceVoice->GetState(&state);
	if (state.BuffersQueued < maxBufferCount - 1)
		break;

	WaitForSingleObject(streamingVoiceCallback.hBufferEndEvent, INFINITE);
}
```

If there is no free buffer, we have to wait until the source voice is done playing back the audio data before we can
start filling the next buffer.

And that's it, here is the entire function in all of its glory:

```cpp
util::Expected<void> AudioEngine::loopStream(IMFSourceReader* const sourceReader, IXAudio2SourceVoice* const sourceVoice, const bool loop)
{
	DWORD streamIndex = (DWORD)MF_SOURCE_READER_FIRST_AUDIO_STREAM;
	DWORD currentStreamBuffer = 0;
	HRESULT hr = S_OK;
	size_t bufferSize[maxBufferCount] = { 0 };
	std::unique_ptr<uint8_t[]> buffers[maxBufferCount];

	for (;;)
	{
		if (stopStreaming)
			break;

		hr = sourceReader->ReadSample(streamIndex, 0, nullptr, nullptr, nullptr, nullptr);
		if (FAILED(hr))
			return std::runtime_error("Critical error: Unable to read source sample!");

		WaitForSingleObject(sourceReaderCallback.hReadSample, INFINITE);

		if (sourceReaderCallback.endOfStream)
		{
			if (loop)
			{
				// restart the stream
				sourceReaderCallback.Restart();
				PROPVARIANT var = { 0 };
				var.vt = VT_I8;
				hr = sourceReader->SetCurrentPosition(GUID_NULL, var);
				if (SUCCEEDED(hr))
					continue;
				else
					return std::runtime_error("Critical error: Unable to set the source reader position!");
			}
			else
				break;
		}

		Microsoft::WRL::ComPtr<IMFMediaBuffer> mediaBuffer;
		hr = sourceReaderCallback.sample->ConvertToContiguousBuffer(mediaBuffer.GetAddressOf());
		if (FAILED(hr))
			return std::runtime_error("Critical error: Unable to convert audio data to contiguous buffer!");

		BYTE* audioData = nullptr;
		DWORD sampleBufferLength = 0;

		hr = mediaBuffer->Lock(&audioData, nullptr, &sampleBufferLength);
		if (FAILED(hr))
			return std::runtime_error("Critical error: Unable to create lock the media buffer!");

		if (bufferSize[currentStreamBuffer] < sampleBufferLength)
		{
			buffers[currentStreamBuffer].reset(new uint8_t[sampleBufferLength]);
			bufferSize[currentStreamBuffer] = sampleBufferLength;
		}

		memcpy_s(buffers[currentStreamBuffer].get(), sampleBufferLength, audioData, sampleBufferLength);

		hr = mediaBuffer->Unlock();
		if (FAILED(hr))
			return std::runtime_error("Critical error: Unable to unlock the media buffer!");

		// wait until the XAudio2 source has played enough data
		// we want to have only maxBufferCount-1 buffers on the queue to make sure that there is always one free buffer for the Media Foundation streamer
		XAUDIO2_VOICE_STATE state;
		for (;;)
		{
			sourceVoice->GetState(&state);
			if (state.BuffersQueued < maxBufferCount - 1)
				break;

			WaitForSingleObject(streamingVoiceCallback.hBufferEndEvent, INFINITE);
		}

		XAUDIO2_BUFFER buf = { 0 };
		buf.AudioBytes = sampleBufferLength;
		buf.pAudioData = buffers[currentStreamBuffer].get();
		sourceVoice->SubmitSourceBuffer(&buf);

		currentStreamBuffer++;
		currentStreamBuffer %= maxBufferCount;
	}

	if(FAILED(hr))
		return std::runtime_error("Critical error: Unable to loop through the media stream!");

	// return success
	return { };
}
```

## Stream Events

To use our powerful new streaming ability, we will create a structure to handle *stream events*:

```cpp
struct StreamEvent
{
	std::wstring filename;
	bool loop = false;
	AudioTypes type = AudioTypes::Music;

	StreamEvent() : filename(L""), loop(false), type(AudioTypes::Music) {};
	StreamEvent(const std::wstring& filename, const bool loop, const AudioTypes type) : filename(filename), loop(loop), type(type) { };
	~StreamEvent() {};

	friend class AudioComponent;
};
```

A stream event links to an audio files on the hard drive, obviously the audio file we want to stream, it defines whether
it intends to be looped or not, and it specifies its type, i.e. whether it is a music file or a sound effect. This is
important to send the source voice into the correct submix voice.

To be able to stream music files while playing the game, the audio component of our game calls the above implemented
XAudio2 streaming function from a worker thread:

```cpp
class AudioComponent : public core::DepescheDestination
{
private:
    ...
	
    // the main audio engine
	AudioEngine* engine;				// the main audio engine: XAudio2 with Windows Media Component

	// streaming
	std::thread* streamingThread;
	
    // handle message
	util::Expected<void> onMessage(const core::Depesche& depesche);

public:
    ...
    
	// stream files from disk
	util::Expected<void> streamFile(const std::wstring fileName, const AudioTypes type, const bool loop);
	void endStream();

	...
};

util::Expected<void> AudioComponent::streamFile(const std::wstring fileName, const AudioTypes type, const bool loop)
{ 
	engine->stopStreaming = false;
	if(type == AudioTypes::Music)
		streamingThread = new std::thread(&AudioEngine::streamFile, engine, fileName, musicSendList, loop);
	else if(type == AudioTypes::Sound)
		streamingThread = new std::thread(&AudioEngine::streamFile, engine, fileName, soundsSendList, loop);

	// return success
	return { };
}
```

In C++-11, starting a new thread is straightforward, we simply have to create a new
*[std::thread](http://www.cplusplus.com/reference/thread/thread/)*. As parameters, we have to input the function we want
to be executed on the new thread, in this case, the *streamFile* method from the *AudioEngine* class, we then specify
the instance of the class (*engine*), and finally pass the desired parameters for the *streamFile* function.

To stop a stream, we simply set the *stopStreaming* variable of the XAudio2 engine to true:

```cpp
void AudioComponent::endStream()
{
	engine->stopStreaming = true;

	if (streamingThread->joinable())
		streamingThread->join();
}
```

And finally, incorporating the new streaming ability into our message system, is as easy as snapping our fingers:

```cpp
enum DepescheTypes { ActiveKeyMap, Gamepad, Damage, PlaySoundEvent, StopSoundEvent, BeginStream, EndStream };

util::Expected<void> AudioComponent::onMessage(const core::Depesche& depesche)
{
	if (depesche.type == core::DepescheTypes::PlaySoundEvent)
	...
	
    else if (depesche.type == core::DepescheTypes::StopSoundEvent)
	...
    
    else if (depesche.type == core::DepescheTypes::BeginStream)
	{
		// begin streaming music
		if (depesche.message == nullptr)
			return std::runtime_error("Critical error: depesche was empty!");

		util::Expected<void> result = streamFile(((StreamEvent*)depesche.message)->filename, ((StreamEvent*)depesche.message)->type, ((StreamEvent*)depesche.message)->loop);
		if (!result.isValid())
			return result;
	}
	else if (depesche.type == core::DepescheTypes::EndStream)
		endStream();
...
}
```

And here is an example of how to stream the menu music from the previous tutorial, instead of loading it in, which saves
a lot of memory, and is a lot faster as well:

```cpp
// menu music
audio::StreamEvent* menuMusic;

// load the menu music
menuMusic = new audio::StreamEvent(dxApp.getFileSystemComponent().openFile(fileSystem::DataFolders::Music, L"menuMusic.mp3"), true, audio::AudioTypes::Music);

if (!musicIsPlaying)
{
	// send depesche to play music
	core::Depesche depesche(*this, dxApp.getAudioComponent(), core::DepescheTypes::BeginStream, menuMusic);
	dxApp.addMessage(depesche);
}
musicIsPlaying = true;
```

---

Wow, we had to implement many new ideas to be able to stream audio data from the hard drive, but it was definitely worth
it! You can download the source code
from [here](https://filedn.eu/ltgnTcOBnsYpGSo6BiuFrPL/Game%20Programming/Flatland/Music/streaming.7z).

---

Rejoice, we have now gathered enough knowledge to program a few simple games, such as Tetris, Breakout and Pac-Man.

In the next tutorial, we will implement a basic Tetris clone.

---

## References

### Literature

(in alphabetic order)

* Game Programming Algorithms, by Sanjay Madhav
* Game Programming Patterns, by Robert Nystrom
* Microsoft Developer Network ([MSDN](https://msdn.microsoft.com/en-us/library/windows/desktop/ee663274(v=vs.85)))
* Tricks of the Windows Game Programming Gurus, by André LaMothe
* Wikipedia