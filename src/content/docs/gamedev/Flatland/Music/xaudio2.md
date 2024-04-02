---
title: The Basics of XAudio2
description: In this tutorial we will learn how to use XAudio2 and the Windows Media Foundation to load both uncompressed and compressed audio files from the hard drive and how to play them back using an event queue.
---

> If music be the food of love, play on [...]
>
> – Duke Orsino; Twelft Night

In this tutorial, we will learn how to use XAudio2 and the Windows Media Foundation to load both uncompressed and
compressed audio files from the hard drive and how to play them back using
the [event queue introduced in a previous tutorial](https://bell0bytes.eu/an-event-queue/).

To learn more about the history of the audio APIs under Windows, read the following
excellent [article](http://shanekirk.com/2015/10/a-brief-history-of-windows-audio-apis/) written by Shane.

## Introduction

XAudio2 is a rather low-level audio API for Windows, Xbox 360 and Windows Phone 8. It is the spiritual successor to
DirectSound on Windows and an improved version of the original XAudio on the Xbox 360. XAudio2 is backwards compatible
by operating through the XAudio API on the Xbox 360, through DirectSound on Windows XP, and through the low-level audio
mixer [WASAPI](https://en.wikipedia.org/wiki/Technical_features_new_to_Windows_Vista#Audio_stack_architecture) on
Windows Vista and higher.

The XAudio2 library is included in the March 2008 DirectX SDK. The latest version of XAudio2 is 2.9, which was released
for Windows 10.

### Features

XAudio2 provides a signal processing and mixing foundation for games. For example, it provides a flexible and
powerful [Digital Signal Processing](vhttps://en.wikipedia.org/wiki/Digital_signal_processing) (DSP) framework, with
which, for example, cat meows can be turned into scary monster sounds.

XAudio2 also facilitates combining different *voices* into single audio streams, called *submixing*, to, for example,
create an engine sound made up of composite parts, all of which are playing simultaneously. Another usage for submixing
could be to combine all game sound effects and all game music in different sets to allow the user to set different
volume levels for sounds and music.

DirectSound lacked support for compressed audio formats, and although with the Windows Media Foundation, it is possible
to load in countless compressed formats, it would be great to have native compressed support. With XAudio2 this dream
has come true, as it supports [ADPCM](https://en.wikipedia.org/wiki/Adaptive_differential_pulse-code_modulation)
natively.

The XAudio2 API is also "non-blocking", meaning that the game can safely make a set of method calls to XAudio2 at any
time, with a few exceptions, without long-running calls causing delays.

For a complete list of the most exciting features of XAudio2, check
the [MSDN](https://docs.microsoft.com/en-us/windows/desktop/xaudio2/xaudio2-introduction).

### Versions

This is a small list taken from the [MSDN](https://docs.microsoft.com/en-us/windows/desktop/xaudio2/xaudio2-versions).

#### XAudio 2.7 and earlier (Windows 7)

The first version of XAudio2, XAudio2 2.0, shipped in the March 2008 release of the DirectX SDK. The last version to
ship in the DirectX SDK was XAudio2 2.7, available in the last release of the DirectX SDK in June 2010.

#### XAudio 2.8 (Windows 8.x)

With Windows 8, XAudio2 was no longer part of the DirectX SDK, instead XAudio2 now ships as a system component. It is
automatically available and does not require redistribution with an app.

Here is a small list of changes from the previous versions:

* This new version supports Windows Store app development.
* Support for instantiating XAudio2 by CoCreateInstance has been removed.
* The Initialize function is now implicitly called by the creation process and has been removed from the IXAudio2
  interface.
* The X3DAudio and XAPOFX libraries are merged into XAudio2. App code still uses separate headers, X3DAUDIO.H and
  XPOFX.H, but now links to a single import library, XAUDIO2_8.LIB.
* xWMA support is not available in this version of XAudio2; xWMA will not be supported as an audio buffer format when
  calling CreateSourceVoice. Microsoft now recommends using
  the [Media Foundation Source Reader](https://msdn.microsoft.com/en-us/library/windows/desktop/dd940436(v=vs.85).aspx).

#### XAudio2 version 2.9

The newest XAudio2 version ships as part of Windows 10, XAUDIO2_9.DLL, alongside XAudio2.8 to support older
applications, and does not require redistribution.

XAudio2.9 has been updated with the following changes:

* New creation flags: XAUDIO2_DEBUG_ENGINE, XAUDIO2_STOP_ENGINE_WHEN_IDLE, XAUDIO2_1024_QUANTUM.
* xWMA support is available again in this version of XAudio2.

## The XAudio2 Engine

To initialize XAudio2, as with all things DirectX related, a pointer to an interface of an IXAudio2 object is required.
With the IXAudio2 interface it is possible to enumerate the available audio devices, to configure global API properties,
to create voices, and to monitor performance.

Most importantly, the interface can be used to create a master voice. A mastering voice is used to represent the actual
audio output device. Once a master voice is created, it can be used to create sound effects, bind them to the master
voice and play them back.

To initialize XAudio2
the [XAudio2Create](https://docs.microsoft.com/en-us/windows/desktop/api/xaudio2/nf-xaudio2-xaudio2create) helper
function can be used:

```cpp
XAUDIO2_STDAPI XAudio2Create(
  IXAudio2                           **ppXAudio2,
  UINT32 Flags                       X2DEFAULT,
  XAUDIO2_PROCESSOR XAudio2Processor X2DEFAULT
);
```

### IXAudio2 **ppXAudio2

If the function call was successful, the first parameter returns the address to a pointer to an interface of an XAudio2
object.

### UINT32 Flags X2DDEFAULT

For now we will simply set this to 0 and forget about it, i.e. we will use the default value.

### XAUDIO2_PROCESSOR XAudio2Processor X2DEFAULT

We can set this to *XAUDIO2_DEFAULT_PROCESSOR* which tells XAudio to use the default sound processor, or simply leave it
at the default value.

Once a pointer to the main XAudio engine is available, creating a master voice is done using
the [IXAudio2::CreateMasteringVoice](https://docs.microsoft.com/en-us/windows/desktop/api/xaudio2/nf-xaudio2-ixaudio2-createmasteringvoice)
method. This method takes many parameters, but all of them are initialized to the default values already — and we won't
use anything else in this tutorial. For now, just note that the first parameter returns the address of the new mastering
voice (if the function call was successful):

```cpp
HRESULT CreateMasteringVoice(
  IXAudio2MasteringVoice                   **ppMasteringVoice,
  UINT32 InputChannels                     X2DEFAULT,
  UINT32 InputSampleRate                   X2DEFAULT,
  UINT32 Flags                             X2DEFAULT,
  LPCWSTR szDeviceId                       X2DEFAULT,
  const XAUDIO2_EFFECT_CHAIN *pEffectChain X2DEFAULT,
  AUDIO_STREAM_CATEGORY StreamCategory     X2DEFAULT
);
```

As you can see, the creation of XAudio2 is straightforward:

```cpp
class AudioEngine
{
private:
    Microsoft::WRL::ComPtr<IXAudio2> dev;							// the main XAudio2 engine
	IXAudio2MasteringVoice* masterVoice;							// a mastering voice

	util::Expected<void> initialize();								// this function initializes the XAudio2 interface
	
public:
	// constructor and destructor
	AudioEngine();
	~AudioEngine();
};

util::Expected<void> AudioEngine::initialize()
{
	HRESULT hr = S_OK;

	// get an interface to the main XAudio2 device
	hr = XAudio2Create(dev.GetAddressOf());
	if (FAILED(hr))
		return std::runtime_error("Critical error: Unable to create the XAudio2 engine!");

#ifndef NDEBUG
    ...
#endif

	// create master voice
	hr = dev->CreateMasteringVoice(&masterVoice);
	if (FAILED(hr))
		return std::runtime_error("Critical error: Unable to create the XAudio2 mastering voice!");

	// return success
	return {};
}
```

Now that we have a mastering voice, we have to take a quick look at the key concepts of XAudio2. How do we play sound?
Well, in XAudio2 the audio data (probably read from a file on the hard drive) must be passed to a *SourceVoice*, which
is responsible for channeling the audio data to the mastering voice, which in turn then sends the audio from all source
voices to the actual audio device (most likely the speakers or a headset).

The only difficulty thus is to submit the audio data to a source voice. XAudio2 has no native support for loading sound
files, and thus we have to read in all associated metadata, like the number of channels, bits per sample, and so on,
ourselves. Having read the metadata, one must locate and read the actual audio data and submit it to a source voice.

## Loading Audio Files

Audio files supported by XAudio2 use
the [Resource Interchange File Format](https://en.wikipedia.org/wiki/Resource_Interchange_File_Format) (RIFF). We won't
elaborate on the details of the RIFF format just yet, but you can also check out
the [MSDN](https://msdn.microsoft.com/en-us/library/windows/desktop/ee415713%28v=vs.85%29.aspx) for more information.

To make things a bit easier (at least, I think it is easier), we will use
the [Windows Media Foundation (WMF)](https://docs.microsoft.com/en-us/windows/desktop/medfound/microsoft-media-foundation-sdk)
API to load sound files from the hard drive into a buffer. An additional benefit of using the Windows Media Foundation
is that it comes with support for compressed files, such as mp3.

As we are only interested in using the WMF to decode audio files, we basically only need one aspect of the huge WMF
complex,
the [IMFSourceReader](https://docs.microsoft.com/en-us/windows/desktop/api/mfreadwrite/nn-mfreadwrite-imfsourcereader),
which is a universal decoder for audio and media formats.

WMF uses *Media Types* to specify the format of a media stream. There are two parts to a *Media Type*, the *Major Type*
specifies the type of the media data, i.e. audio or video, while the *Sub Type* specifies the format of the data, for
example *compressed mp3* or *uncompressed wav*. We will use the source reader to get the details of the media we are
reading from disk, and then branch our program off accordingly.

Okay, enough theory, let us learn how to use the WMF's source reader to read in any type of supported audio, compressed
or uncompressed, and to extract the audio data into a buffer that can be used with XAudio2.

### Initializing the Windows Media Foundation

First things first, we have to include a few headers and load a few libraries into our application:

```cpp
// Windows Media Foundation
#include <mfapi.h>
#include <mfidl.h>
#include <mfreadwrite.h>

#pragma comment(lib, "mfreadwrite.lib")
#pragma comment(lib, "mfplat.lib")
#pragma comment(lib, "mfuuid")
```

To initialize the WMF framework, a call to
*[MFStartup](https://docs.microsoft.com/en-us/windows/desktop/api/mfapi/nf-mfapi-mfstartup)* is enough:

```cpp
HRESULT MFStartup(
  ULONG Version,
  DWORD dwFlags
);
```

The *Version* parameter simply sets the desired version of the WMF to use and the *dwFlags* parameter is optional for
C++, and we won't use it, we will thusly call the function in a completely straightforward manner:

```cpp
util::Expected<void> AudioEngine::initialize()
{
	HRESULT hr = S_OK;

	// initialize media foundation
	hr = MFStartup(MF_VERSION);
	if (FAILED(hr))
		return std::runtime_error("Critical error: Unable to start the Windows Media Foundation!");
        
    ...
}
```

Shutting the WMF down is just as easy, a simple call
to [MFShutdown](https://docs.microsoft.com/en-us/windows/desktop/api/mfapi/nf-mfapi-mfshutdown) is enough:

```cpp
AudioEngine::~AudioEngine()
{
	// shut down the media foundation
	MFShutdown();

	// destroy the master voice
	masterVoice->DestroyVoice();

	// stop the engine
	dev->StopEngine();

	util::ServiceLocator::getFileLogger()->print<util::SeverityType::info>("The audio component was successfully destroyed.");
}
```

### Initializing the Source Reader

Before being able to read files from the disk, we have to configure the source reader. To configure a WMF
object, [IMFAttributes](https://docs.microsoft.com/en-us/windows/desktop/api/mfobjects/nn-mfobjects-imfattributes)
interfaces, which provide a generic way to store attributes of an object, are used. To create such an attribute
interface, a single call to
the [MFCreateAttributes](https://docs.microsoft.com/en-us/windows/desktop/api/mfapi/nf-mfapi-mfcreateattributes) method
is enough:

```cpp
HRESULT MFCreateAttributes(
  IMFAttributes **ppMFAttributes,
  UINT32        cInitialSize
);
```

The function receives a pointer to the attribute interface and the initial number of elements allocated for the
attribute store.

Once we have the attribute interface, we can configure the object as we desire. What we actually do desire is to tell
the source reader that we want no latency, we are in Need for Speed (sic!). To do so, we use
the [IMFAttributes::SetUINT32](https://docs.microsoft.com/en-us/windows/desktop/api/mfobjects/nf-mfobjects-imfattributes-setuint32)
method:

```cpp
HRESULT SetUINT32(
  REFGUID guidKey,
  UINT32  unValue
);
```

The first parameter is the GUID of the value to set and the second paramter is the new value to set. The GUID for low
latency is: *MF_LOW_LATENCY*.

Here is our function call:

```cpp
Microsoft::WRL::ComPtr<IMFAttributes> sourceReaderConfiguration;// Windows Media Foundation Source Reader Configuration

util::Expected<void> AudioEngine::initialize()
{
	HRESULT hr = S_OK;

	// initialize media foundation
	hr = MFStartup(MF_VERSION);
	if (FAILED(hr))
		return std::runtime_error("Critical error: Unable to start the Windows Media Foundation!");

	// set media foundation reader to low latency
	hr = MFCreateAttributes(sourceReaderConfiguration.GetAddressOf(), 1);
	if (FAILED(hr))
		return std::runtime_error("Critical error: Unable to create Media Foundation Source Reader configuration!");
		
	hr = sourceReaderConfiguration->SetUINT32(MF_LOW_LATENCY, true);
	if (FAILED(hr))
		return std::runtime_error("Critical error: Unable to set Windows Media Foundation configuration!");

	// get an interface to the main XAudio2 device
	...
	
    // return success
	return {};
}
```

### Reading Audio Files

Now that the source reader is properly configured, loading in a file from the hard drive is done using
the [MFCreateSourceReaderFromURL](https://docs.microsoft.com/en-us/windows/desktop/api/mfreadwrite/nf-mfreadwrite-mfcreatesourcereaderfromurl)
function:

```cpp
HRESULT MFCreateSourceReaderFromURL(
  LPCWSTR         pwszURL,
  IMFAttributes   *pAttributes,
  IMFSourceReader **ppSourceReader
);
```

The first parameter specifies the location of the data in the hard drive, the second parameter holds the attributes of
the source reader we have just defined, and the last parameter receives a pointer to the actual source reader.

Calling this method is straightforward again:

```cpp
// the main audio engine powered by XAudio2 and Windows Media Foundation
class AudioEngine
{
private:
	Microsoft::WRL::ComPtr<IXAudio2> dev;							// the main XAudio2 engine
	IXAudio2MasteringVoice* masterVoice;							// a mastering voice
	Microsoft::WRL::ComPtr<IMFAttributes> sourceReaderConfiguration;// Windows Media Foundation Source Reader Configuration

	util::Expected<void> initialize();								// this function initializes the XAudio2 interface
	util::Expected<void> loadFile(const std::wstring& filename, std::vector<BYTE>& audioData, WAVEFORMATEX** wafeFormatEx, unsigned int& waveLength);	// load audio file from disk

public:
	// constructor and destructor
	AudioEngine();
	~AudioEngine();

	friend class AudioComponent;
};

util::Expected<void> AudioEngine::loadFile(const std::wstring& filename, ...)
{
	// handle errors
	HRESULT hr = S_OK;

    // create the source reader
	Microsoft::WRL::ComPtr<IMFSourceReader> sourceReader;
	hr = MFCreateSourceReaderFromURL(filename.c_str(), sourceReaderConfiguration.Get(), sourceReader.GetAddressOf());
	if (FAILED(hr))
		return std::runtime_error("Critical error: Unable to create source reader from URL!");
   
   ...
}
```

To make sure we are reading from an audio stream, we will disable all other streams, using the
*[SetStreamSelection](https://docs.microsoft.com/en-us/windows/desktop/api/mfreadwrite/nf-mfreadwrite-imfsourcereader-setstreamselection)*
method:

```cpp
HRESULT SetStreamSelection(
  DWORD dwStreamIndex,
  BOOL  fSelected
);
```

The first paramter specifies the stream to set. It can be set to *MF_SOURCE_READER_FIRST_VIDEO_STREAM* to set it to the
first video stream, to *MF_SOURCE_READER_FIRST_AUDIO_STREAM* to set it to the first audio stream and to
*MF_SOURCE_READER_ALL_STREAMS* to select all streams.

The second parameter is a simple boolean specifying whether a stream should be selected (true) or deselected (false).

Thus, what we have to do, is to deselect all streams and then select the first audio stream:

```cpp
util::Expected<void> AudioEngine::loadFile(const std::wstring& filename, ...)
{
    // stream index
	DWORD streamIndex = (DWORD)MF_SOURCE_READER_FIRST_AUDIO_STREAM;
    
    // create the source reader
	...
    
    // select the first audio stream, and deselect all other streams
	hr = sourceReader->SetStreamSelection((DWORD)MF_SOURCE_READER_ALL_STREAMS, false);
	if (FAILED(hr))
		return std::runtime_error("Critical error: Unable to disable streams!");

	hr = sourceReader->SetStreamSelection(streamIndex, true);
	if (FAILED(hr))
		return std::runtime_error("Critical error: Unable to enable first audio stream!");
}
```

Now that the source reader is attached to a file on the hard drive, we can query the source reader for the native media
type of the file, which will allow us to act accordingly, i.e. we will check if the file is indeed an audio file and
whether it is in a compressed or uncompressed format. If the file is uncompressed, we can simply manipulate its data, if
not, we will have to decode, or uncompress it first.

To get the media type of the file, a call to the
*[GetNativeMediaType](https://docs.microsoft.com/en-us/windows/desktop/api/mfreadwrite/nf-mfreadwrite-imfsourcereader-getnativemediatype)*
function is enough:

```cpp
HRESULT GetNativeMediaType(
  DWORD        dwStreamIndex,
  DWORD        dwMediaTypeIndex,
  IMFMediaType **ppMediaType
);
```

Here the first parameter specifies the stream to query, we will set this to the first audio stream. The second parameter
specifies which media type to query for, we will set this to 0. The last parameter returns a pointer to
an [IMFMediaType](https://docs.microsoft.com/en-us/windows/desktop/api/mfobjects/nn-mfobjects-imfmediatype) interface,
holding the information we desire.

As before, when configuring the source reader, to actually get the information we want, we have to work with
*attributes* using the GetGUID method as follows:

```cpp
// query information about the media file
Microsoft::WRL::ComPtr<IMFMediaType> nativeMediaType;
hr = sourceReader->GetNativeMediaType(streamIndex, 0, nativeMediaType.GetAddressOf());
if(FAILED(hr))
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
}
```

Now if the audio file is uncompressed, everything is fine, but if we are working with a compressed format, such as
*mp3*, for example, we have to decode it first. To do so, we simply request the source reader to decode it for us. The
source reader will then look through the system registry to find a suitable decoder and perform the decoding for us.

To tell the source reader what exactly we want it to do, we create a media type, set it to the format we want and then
set the current media type of the source reader appropriately.

Creating the media type is done using
the [MFCreateMediaType](https://docs.microsoft.com/en-us/windows/desktop/api/mfapi/nf-mfapi-mfcreatemediatype) function,
which only takes one parameter, the address of
an [IMFMediaType](https://docs.microsoft.com/en-us/windows/desktop/api/mfobjects/nn-mfobjects-imfmediatype) interface:

```cpp
Microsoft::WRL::ComPtr<IMFMediaType> partialType = nullptr;
hr = MFCreateMediaType(partialType.GetAddressOf());
if (FAILED(hr))
    return std::runtime_error("Critical error: Unable create media type!");
```

As we are used to now, we will set attributes by using the *SetGUID* method:

```cpp
// set the media type to "audio"
hr = partialType->SetGUID(MF_MT_MAJOR_TYPE, MFMediaType_Audio);
if (FAILED(hr))
	return std::runtime_error("Critical error: Unable to set media type to audio!");
    
// request uncompressed data
hr = partialType->SetGUID(MF_MT_SUBTYPE, MFAudioFormat_PCM);
if (FAILED(hr))
	return std::runtime_error("Critical error: Unable to set guid of media type to uncompressed!");

```

To submit our request to the source reader, we can use the
*[SetCurrentMediaType](https://docs.microsoft.com/en-us/windows/desktop/api/mfreadwrite/nf-mfreadwrite-imfsourcereader-setcurrentmediatype)*
method:

```cpp
HRESULT SetCurrentMediaType(
  DWORD        dwStreamIndex,
  DWORD        *pdwReserved,
  IMFMediaType *pMediaType
);
```

The first parameter once again specifies the stream to configure. As always, we will set this to the first audio stream.
The second parameter is reserved, and we will set it to NULL. The last parameter is a pointer to the media type to set.

Here is how to call this function in our example:

```cpp
hr = sourceReader->SetCurrentMediaType(streamIndex, NULL, partialType.Get());
if (FAILED(hr))
	return std::runtime_error("Critical error: Unable to set current media type!");
```

Okay, now that the source reader is properly configured to decode the audio file, we have to create the necessary
precautions to be able to store the decoded audio data in a format that XAudio2 can use. XAudio2 natively works with
audio files in
the [Resource Interchange File Format (RIFF)](https://en.wikipedia.org/wiki/Resource_Interchange_File_Format), such as
*.wav* files.

To do so, we create a
*[WAVEFORMATEX](https://docs.microsoft.com/en-us/windows/desktop/api/mmreg/ns-mmreg-twaveformatex)* object, which
specifies the data format of a wave audio stream, using the
*[IMFSourceReader::MFCreateWaveFormatExFromMFMediaType](https://docs.microsoft.com/en-us/windows/desktop/api/mfapi/nf-mfapi-mfcreatewaveformatexfrommfmediatype)*
method:

```cpp
HRESULT MFCreateWaveFormatExFromMFMediaType(
  IMFMediaType *pMFType,
  WAVEFORMATEX **ppWF,
  UINT32       *pcbSize,
  UINT32       Flags
);
```

The first parameter is a pointer to an IMFMediaType interface, specifying the type of the media to use, i.e. the current
media type of the source reader.

The second parameter returns the address of the WAVEFORMATEX structure that was just filled with the fmt chunk
specifying the audio data.

The third receives the address of an *unsigned int* that will be filled with the size of the above structure once the
function returns.

The last parameter is a flag that we do not need to use yet.

Here is how to use this function to create a wave format description from the source reader:

```cpp
util::Expected<void> AudioEngine::loadFile(const std::wstring& filename, WAVEFORMATEX** waveFormatEx, unsigned int& waveFormatLength, ...)
{
    ...

    // uncompress the data and load it into an XAudio2 Buffer
    Microsoft::WRL::ComPtr<IMFMediaType> uncompressedAudioType = nullptr;
    hr = sourceReader->GetCurrentMediaType(streamIndex, uncompressedAudioType.GetAddressOf());
    if (FAILED(hr))
        return std::runtime_error("Critical error: Unable to retrieve the current media type!");

    hr = MFCreateWaveFormatExFromMFMediaType(uncompressedAudioType.Get(), waveFormatEx, &waveFormatLength);
    if (FAILED(hr))
        return std::runtime_error("Critical error: Unable to create the wave format!");
        
    ...
}
```

Finally, there is only one step left to do: read all the audio data into a vector that we can later use to fill an
XAudio2 audio buffer structure.

To do so, we read samples of the audio file, convert the sample into a contiguous buffer and then store that buffer in
an array, or vector, or whatever, of bytes.

To read a sample of an audio file, we can use
the [ReadSample](https://docs.microsoft.com/en-us/windows/desktop/api/mfreadwrite/nf-mfreadwrite-imfsourcereader-readsample)
method:

```cpp
HRESULT ReadSample(
  DWORD     dwStreamIndex,
  DWORD     dwControlFlags,
  DWORD     *pdwActualStreamIndex,
  DWORD     *pdwStreamFlags,
  LONGLONG  *pllTimestamp,
  IMFSample **ppSample
);
```

As you can guess, the first parameter specifies the stream to pull the data from, we will set this to the first audio
stream.

The second parameter sets control flags, which we do not need at the moment.

The third parameter receives the zero-based index of the stream, we will simply set this to a nullptr, as we want to
read from the beginning of the stream. We will cover this in greater detail in the next tutorial.

The fourth parameter returns flags specifying the state of the source reader; we can use this to determine whether we
have reached the end of the file, for example.

The fifth parameter specifies the time stamp of the sample in nanoseconds. We don't need this for now and will set it
to "nullptr".

The last parameter receives a pointer to
the [IMFSample](https://docs.microsoft.com/en-us/windows/desktop/api/mfobjects/nn-mfobjects-imfsample) interface that we
want filled with the audio data.

To convert the audio sample into a contiguous buffer, the
*[ConvertToContiguousBuffer](https://docs.microsoft.com/en-us/windows/desktop/api/mfobjects/nf-mfobjects-imfsample-converttocontiguousbuffer)*
method can be used, which only takes one parameter, the address of
an [IMFMediaBuffer](https://docs.microsoft.com/en-us/windows/desktop/api/mfobjects/nn-mfobjects-imfmediabuffer) object
to be filled with the audio data.

The buffer can
be [locked](https://docs.microsoft.com/en-us/windows/desktop/api/mfobjects/nf-mfobjects-imfmediabuffer-lock)
and [unlocked](https://docs.microsoft.com/en-us/windows/desktop/api/mfobjects/nf-mfobjects-imfmediabuffer-unlock) to
load and store data.

And finally, behold the code to load data from an audio stream into a buffer:

```cpp
util::Expected<void> AudioEngine::loadFile(const std::wstring& filename, std::vector<BYTE>& audioData, WAVEFORMATEX** waveFormatEx, unsigned int& waveFormatLength)
{
	// handle errors
	HRESULT hr = S_OK;

	// stream index
	DWORD streamIndex = (DWORD)MF_SOURCE_READER_FIRST_AUDIO_STREAM;

	// create the source reader
	Microsoft::WRL::ComPtr<IMFSourceReader> sourceReader;
	hr = MFCreateSourceReaderFromURL(filename.c_str(), sourceReaderConfiguration.Get(), sourceReader.GetAddressOf());
	if (FAILED(hr))
		return std::runtime_error("Critical error: Unable to create source reader from URL!");

	// select the first audio stream, and deselect all other streams
	hr = sourceReader->SetStreamSelection((DWORD)MF_SOURCE_READER_ALL_STREAMS, false);
	if (FAILED(hr))
		return std::runtime_error("Critical error: Unable to disable streams!");

	hr = sourceReader->SetStreamSelection(streamIndex, true);
	if (FAILED(hr))
		return std::runtime_error("Critical error: Unable to enable first audio stream!");
		
	// query information about the media file
	Microsoft::WRL::ComPtr<IMFMediaType> nativeMediaType;
	hr = sourceReader->GetNativeMediaType(streamIndex, 0, nativeMediaType.GetAddressOf());
	if(FAILED(hr))
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

		hr = sourceReader->SetCurrentMediaType(streamIndex, NULL, partialType.Get());
		if (FAILED(hr))
			return std::runtime_error("Critical error: Unable to set current media type!");
	}

	// uncompress the data and load it into an XAudio2 Buffer
	Microsoft::WRL::ComPtr<IMFMediaType> uncompressedAudioType = nullptr;
	hr = sourceReader->GetCurrentMediaType(streamIndex, uncompressedAudioType.GetAddressOf());
	if (FAILED(hr))
		return std::runtime_error("Critical error: Unable to retrieve the current media type!");

	hr = MFCreateWaveFormatExFromMFMediaType(uncompressedAudioType.Get(), waveFormatEx, &waveFormatLength);
	if (FAILED(hr))
		return std::runtime_error("Critical error: Unable to create the wave format!");

	// ensure the stream is selected
	hr = sourceReader->SetStreamSelection(streamIndex, true);
	if (FAILED(hr))
		return std::runtime_error("Critical error: Unable to select audio stream!");

	// copy data into byte vector
	Microsoft::WRL::ComPtr<IMFSample> sample = nullptr;
	Microsoft::WRL::ComPtr<IMFMediaBuffer> buffer = nullptr;
	BYTE* localAudioData = NULL;
	DWORD localAudioDataLength = 0;

	while (true)
	{
		DWORD flags = 0;
		hr = sourceReader->ReadSample(streamIndex, 0, nullptr, &flags, nullptr, sample.GetAddressOf());
		if (FAILED(hr))
			return std::runtime_error("Critical error: Unable to read audio sample!");
			
		// check whether the data is still valid
		if (flags & MF_SOURCE_READERF_CURRENTMEDIATYPECHANGED)
			break;

		// check for eof
		if (flags & MF_SOURCE_READERF_ENDOFSTREAM)
			break;

		if (sample == nullptr)
			continue;

		// convert data to contiguous buffer
		hr = sample->ConvertToContiguousBuffer(buffer.GetAddressOf());
		if (FAILED(hr))
			return std::runtime_error("Critical error: Unable to convert audio sample to contiguous buffer!");

		// lock buffer and copy data to local memory
		hr = buffer->Lock(&localAudioData, nullptr, &localAudioDataLength);
		if (FAILED(hr))
			return std::runtime_error("Critical error: Unable to lock the audio buffer!");
			
		//for (size_t i = 0; i < localAudioDataLength; i++)
		//	audioData.push_back(localAudioData[i]);
        size_t currentSize = audioData.size();
        audioData.resize(currentSize + localAudioDataLength); 
        memcpy(&audioData.data()[currentSize], localAudioData, localAudioDataLength);
			
		// unlock the buffer
		hr = buffer->Unlock();
		localAudioData = nullptr;

		if (FAILED(hr))
			return std::runtime_error("Critical error while unlocking the audio buffer!");
	}

	// return success
	return { };
}
```

## Creating Sound Events

Now, with the ability to load audio files from the hard drive, let us think back to the last tutorial. We want to create
audio events to be played back in our game, using our event queue.

A sound event can loosely be defined as follows:

```cpp
// sound event class to store data that can't be stored in RIFF files
class SoundEvent
{
private:
	IXAudio2SourceVoice* sourceVoice;	// the XAudio2 source voice
	WAVEFORMATEX waveFormat;			// the format of the audio file
	unsigned int waveLength;			// the length of the wave
	std::vector<BYTE> audioData;		// the audio data
	XAUDIO2_BUFFER audioBuffer;			// the actual buffer with the audio data

	float fallof;						// falloff distance
	unsigned int priority;				// music priority
		
	unsigned int index;					// the index of the actual sound to play

public:
	SoundEvent();
	~SoundEvent();

	friend class AudioComponent;
};
```

I am sure all the members are self-explanatory, remember that the source voice is responsible for submitting the audio
data to the mastering voice of the XAudio2 engine.

In the demo created for this tutorial, I won't use the concept of sound falloff, sound priorities or playing multiple
short sounds to combat monotony, we will simply load the audio data read from a file into an XAudio2 buffer.

To do so, we simply convert the byte data read from the file into
an [XAudio2 audio buffer](https://docs.microsoft.com/en-us/windows/desktop/api/xaudio2/ns-xaudio2-xaudio2_buffer)
structure. To decouple this from the actual XAudio engine, we will create a new class, called the *AudioComponent*
class:

```cpp
class AudioComponent : public core::DepescheDestination
{
private:
	// the main audio engine
	AudioEngine* engine;				// the main audio engine: XAudio2 with Windows Media Component

	// handle message
	util::Expected<void> onMessage(const core::Depesche& depesche);
public:
	// constructor and destructor
	AudioComponent();
	~AudioComponent();

	// load files from disk
	util::Expected<void> loadFile(const std::wstring fileName, SoundEvent& soundEvent);

	// play sound
	util::Expected<void> playSoundEvent(const SoundEvent& soundEvent);
	util::Expected<void> stopSoundEvent(const SoundEvent& soundEvent);
};
```

On initialization, we *simply* create the XAudio2 engine:

```cpp
AudioComponent::AudioComponent()
{
	try { engine = new AudioEngine(); }
	catch (std::runtime_error& e) { throw e; }
}
```

The load file function of the audio component calls the load function from the XAudio2 engine that we just discussed and
then creates the appropriate XAudio2 structure:

```cpp
util::Expected<void> AudioComponent::loadFile(const std::wstring fileName, SoundEvent& soundEvent)
{
	// handle errors
	util::Expected<void> result;
	HRESULT hr = S_OK;

	// load file into wave
	WAVEFORMATEX* waveFormatEx;
	result = engine->loadFile(fileName, soundEvent.audioData, &waveFormatEx, soundEvent.waveLength);
	if (!result.isValid())
		return result;
	soundEvent.waveFormat = *waveFormatEx;

	// create source voice
	hr = engine->dev->CreateSourceVoice(&soundEvent.sourceVoice, soundEvent.waveFormat);
	if (FAILED(hr))
		return std::runtime_error("Critical error: Unable to create source voice!");

	ZeroMemory(&soundEvent.audioBuffer, sizeof(XAUDIO2_BUFFER));
	soundEvent.audioBuffer.AudioBytes = (UINT32)soundEvent.audioData.size();
	soundEvent.audioBuffer.pAudioData = (BYTE* const)&soundEvent.audioData[0];
	soundEvent.audioBuffer.pContext = nullptr;

	// return success
	return { };
}
```

The source voice is created using the [
*CreateSourceVoice*](https://docs.microsoft.com/en-us/windows/desktop/api/xaudio2/nf-xaudio2-ixaudio2-createsourcevoice)
method:

```cpp
HRESULT CreateSourceVoice(
  IXAudio2SourceVoice                      **ppSourceVoice,
  const WAVEFORMATEX                       *pSourceFormat,
  UINT32 Flags                             X2DEFAULT,
  float MaxFrequencyRatio                  X2DEFAULT,
  IXAudio2VoiceCallback *pCallback         X2DEFAULT,
  const XAUDIO2_VOICE_SENDS *pSendList     X2DEFAULT,
  const XAUDIO2_EFFECT_CHAIN *pEffectChain X2DEFAULT
);
```

Luckily for us, most of those parameters come preinitialised, all we have to do is put in the address of our source
voice (first parameter) and a pointer to the source format (second parameter).

To fill the XAudio2 audio buffer, we simply point it to the data collected from file on the hard drive.

## Playing Audio Files

To play an audio file, all that is left to do is to submit the audio data to the source voice and to start the source
voice.

Submitting audio data to a source voice is done using the
*[IXAudio2SourceVoice::SubmitSourceBuffer](https://docs.microsoft.com/en-us/windows/desktop/api/xaudio2/nf-xaudio2-ixaudio2sourcevoice-submitsourcebuffer)
method*, which simply takes an XAudio2 buffer structure as input.

Starting a voice is done using the
*[IXAudio2SourceVoice::Start](https://docs.microsoft.com/en-us/windows/desktop/api/xaudio2/nf-xaudio2-ixaudio2sourcevoice-start)
method*.

To stop a voice, use the
*[IXAudio2SourceVoice::Stop](https://docs.microsoft.com/en-us/windows/desktop/api/xaudio2/nf-xaudio2-ixaudio2sourcevoice-stop)
method*.

Here is the C++-code to play (and stop) an audio file:

```cpp
util::Expected<void> AudioComponent::playSoundEvent(const SoundEvent& audioEvent)
{
	// handle errors
	HRESULT hr = S_OK;

	// submit the audio buffer to the source voice
	hr = audioEvent.sourceVoice->SubmitSourceBuffer(&audioEvent.audioBuffer);
	if (FAILED(hr))
		return std::runtime_error("Critical error: Unable to submit source buffer!");

	// start the source voice
	audioEvent.sourceVoice->Start();

	// return success
	return { };
}

util::Expected<void> AudioComponent::stopSoundEvent(const SoundEvent& audioEvent)
{
	audioEvent.sourceVoice->Stop();

	// return success
	return { };
}
```

To add the audio component to our event queue, we simply play or stop a sound, depending on the type of the received
message. The actual sound event is passed in the *message* parameter of the *Depesche*:

```cpp
util::Expected<void> AudioComponent::onMessage(const core::Depesche& depesche)
{
	if (depesche.type == core::DepescheTypes::PlaySoundEvent)
	{
		// handle errors
		HRESULT hr = S_OK;

		// submit the audio buffer to the source voice
		hr = ((SoundEvent*)depesche.message)->sourceVoice->SubmitSourceBuffer(&((SoundEvent*)depesche.message)->audioBuffer);
		if (FAILED(hr))
			return std::runtime_error("Critical error: Unable to submit source buffer!");

		// start the source voice
		((SoundEvent*)depesche.message)->sourceVoice->Start();
	}
	else if (depesche.type == core::DepescheTypes::StopSoundEvent)
	{
		((SoundEvent*)depesche.message)->sourceVoice->Stop();
	}

	// return success
	return { };
}
```

As an example, I downloaded a few sounds, a meow sound, a barking sound, a button click sound and a menu music sound
from [freesound](https://freesound.org/), which is an excellent source for free audio files, created by the following
people:

* [Big Dog Barking](https://freesound.org/people/mich3d/sounds/24965/) by [mich3d](https://freesound.org/people/mich3d/)
* [Button Click](https://freesound.org/people/fins/sounds/146718/) by [fins](https://freesound.org/people/fins/)
* [Cat Meow](https://freesound.org/people/NoiseCollector/sounds/4914/)
  by [Noise Collector](https://freesound.org/people/NoiseCollector/)
* [Nodens (Field Song)](https://freesound.org/people/axtoncrolley/sounds/172707/)
  by [axtoncrolley](https://freesound.org/people/axtoncrolley/)

Here is an example of how to load the menu music and how to play it using the event queue:

```cpp
util::Expected<void> MainMenuState::initialize()
{
	...		
	
    if (firstCreation)
	{
		// create text format
        ...
		
        // create text layout
		...
		
        // load the button sound
		buttonSound = new audio::SoundEvent();
		result = dxApp.getAudioComponent().loadFile(dxApp.getFileSystemComponent().openFile(fileSystem::DataFolders::Sounds, L"button.wav"), *buttonSound);
		if (!result.isValid())
			return result;

		// load the menu music
		menuMusic = new audio::SoundEvent();
		result = dxApp.getAudioComponent().loadFile(dxApp.getFileSystemComponent().openFile(fileSystem::DataFolders::Music, L"menuMusic.mp3"), *menuMusic);
		if (!result.isValid())
			return result;
	}
		
	// create buttons
	...
	
    // send depesche to play music
	core::Depesche depesche(*this, dxApp.getAudioComponent(), core::DepescheTypes::PlaySoundEvent, menuMusic);
	dxApp.addMessage(depesche);
	
	// do not initialize the text layouts again
	firstCreation = false;

	// return success
	return { };
}
```

---

We have certainly learned a lot in this tutorial. You can download the source code
from [here](https://filedn.eu/ltgnTcOBnsYpGSo6BiuFrPL/Game%20Programming/Flatland/Music/XAudio2.7z).

---

Here is a video of the previous tutorial *game* of Cosmo chasing cats with music and sound files added:

<video width="800" height="450" controls>
<source src="https://filedn.eu/ltgnTcOBnsYpGSo6BiuFrPL/Videos/bell0bytes/Game%20Programming%20Tutorials/DirectX%2011/XAudio2%20Demo.mp4" type="video/mp4">
Your browser does not support HTML5 videos.
</video> 

---

In the next tutorial, we will learn how to use submix voices to band source voices together into larger sets.

---

## References

### Literature

(in alphabetic order)

* Game Programming Algorithms, by Sanjay Madhav
* Game Programming Patterns, by Robert Nystrom
* Microsoft Developer Network ([MSDN](https://msdn.microsoft.com/en-us/library/windows/desktop/ee663274(v=vs.85)))
* Tricks of the Windows Game Programming Gurus, by André LaMothe
* Wikipedia

### Audio

* [button](https://freesound.org/people/fins/sounds/146718/) by [fins](https://freesound.org/people/fins/)
* [Big Dog Barking](https://freesound.org/people/mich3d/sounds/24965/) by [mich3d](https://freesound.org/people/mich3d/)
* [Button Click](https://freesound.org/people/fins/sounds/146718/) by [fins](https://freesound.org/people/fins/)
* [Cat Meow](https://freesound.org/people/NoiseCollector/sounds/4914/)
  by [Noise Collector](https://freesound.org/people/NoiseCollector/)
* [Nodens (Field Song)](https://freesound.org/people/axtoncrolley/sounds/172707/)
  by [axtoncrolley](https://freesound.org/people/axtoncrolley/)

### Art

* [Cat and Dog](https://opengameart.org/content/cat-dog-free-sprites) by [pzUH](https://opengameart.org/users/pzuh)
* [GUI Buttons](https://opengameart.org/content/gui-buttons-vol1)
  by [looneybits](https://opengameart.org/users/looneybits)
* [Menu Buttons](https://opengameart.org/content/buttons-with-hover)
  by [Soundemperor](https://opengameart.org/users/soundemperor).
* [Music](https://www.deviantart.com/ironflower86/art/Music-22830510)
  by [ironflower86](https://www.deviantart.com/ironflower86)
* [TexturePacker](https://www.codeandweb.com/texturepacker)
* Wikipedia