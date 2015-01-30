/**
 * Copyright 2014 Mozilla Foundation
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// Class: NetStream
module Shumway.AVM2.AS.flash.net {
  import notImplemented = Shumway.Debug.notImplemented;
  import assert = Shumway.Debug.assert;
  import asCoerceString = Shumway.AVM2.Runtime.asCoerceString;
  import somewhatImplemented = Shumway.Debug.somewhatImplemented;
  import wrapJSObject = Shumway.AVM2.Runtime.wrapJSObject;
  import events = Shumway.AVM2.AS.flash.events;
  import net = Shumway.AVM2.AS.flash.net;
  import utils = Shumway.AVM2.AS.flash.utils;
  import FileLoadingService = Shumway.FileLoadingService;
  import AVM2 = Shumway.AVM2.Runtime.AVM2;
  import VideoPlaybackEvent = Shumway.Remoting.VideoPlaybackEvent;
  import VideoControlEvent = Shumway.Remoting.VideoControlEvent;
  import ISoundSource = flash.media.ISoundSource;

  declare var MediaSource;
  declare var URL;
  declare var Promise;
  declare var window;

  export class NetStream extends flash.events.EventDispatcher implements ISoundSource {
    _isDirty: boolean;

    // Called whenever the class is initialized.
    static classInitializer: any = null;
    
    // Called whenever an instance of the class is initialized.
    static initializer: any = null;
    
    // List of static symbols to link.
    static classSymbols: string [] = null; // [];
    
    // List of instance symbols to link.
    static instanceSymbols: string [] = null; // ["attach", "close", "attachAudio", "attachCamera", "send", "bufferTime", "bufferTime", "maxPauseBufferTime", "maxPauseBufferTime", "backBufferTime", "backBufferTime", "backBufferLength", "step", "bufferTimeMax", "bufferTimeMax", "receiveAudio", "receiveVideo", "receiveVideoFPS", "pause", "resume", "togglePause", "seek", "publish", "time", "currentFPS", "bufferLength", "liveDelay", "bytesLoaded", "bytesTotal", "decodedFrames", "videoCodec", "audioCodec", "onPeerConnect", "call"];

    constructor (connection: flash.net.NetConnection, peerID: string = "connectToFMS") {
      false && super(undefined);
      events.EventDispatcher.instanceConstructorNoInitialize.call(this);
      this._connection = connection;
      this._peerID = asCoerceString(peerID);
      this._id = flash.display.DisplayObject.getNextSyncID();
      this._isDirty = true;
      this._soundTransform = new flash.media.SoundTransform();

      this._contentTypeHint = null;
      this._checkPolicyFile = true;

      this._videoStream = new VideoStream();
      this._videoStream._onEnsurePlay = function () {
        this._notifyVideoControl(VideoControlEvent.Pause, {
          paused: false,
          time: NaN
        });
      }.bind(this);
    }

    _connection: flash.net.NetConnection;
    _peerID: string;

    _id: number;

    /**
     * Only one video can be attached to this |NetStream| object. If we attach another video, then
     * the previous attachement is lost. (Validated through experimentation.)
     */
    _videoReferrer: flash.media.Video;

    private _videoStream: VideoStream;
    private _contentTypeHint;

    // JS -> AS Bindings
    static DIRECT_CONNECTIONS: string = "directConnections";
    static CONNECT_TO_FMS: string = "connectToFMS";
    
    attach: (connection: flash.net.NetConnection) => void;
    close: () => void;
    attachAudio: (microphone: flash.media.Microphone) => void;
    attachCamera: (theCamera: flash.media.Camera, snapshotMilliseconds?: number /*int*/) => void;
    send: (handlerName: string) => void;
    bufferTime: number;
    maxPauseBufferTime: number;
    backBufferTime: number;
    backBufferLength: number;
    step: (frames: number /*int*/) => void;
    bufferTimeMax: number;
    receiveAudio: (flag: boolean) => void;
    receiveVideo: (flag: boolean) => void;
    receiveVideoFPS: (FPS: number) => void;
    pause: () => void;
    resume: () => void;
    togglePause: () => void;
    seek: (offset: number) => void;
    publish: (name?: string, type?: string) => void;
    time: number;
    currentFPS: number;
    bufferLength: number;
    liveDelay: number;
    bytesLoaded: number /*uint*/;
    bytesTotal: number /*uint*/;
    decodedFrames: number /*uint*/;
    videoCodec: number /*uint*/;
    audioCodec: number /*uint*/;
    onPeerConnect: (subscriber: flash.net.NetStream) => boolean;
    call: () => void;
    
    // AS -> JS Bindings

    // _maxPauseBufferTime: number;
    // _backBufferTime: number;
    _inBufferSeek: boolean;
    // _backBufferLength: number;
    // _bufferTimeMax: number;
    // _info: flash.net.NetStreamInfo;
    // _multicastInfo: flash.net.NetStreamMulticastInfo;
    // _time: number;
    // _currentFPS: number;
    // _bufferLength: number;
    // _liveDelay: number;
    // _bytesLoaded: number /*uint*/;
    // _bytesTotal: number /*uint*/;
    // _decodedFrames: number /*uint*/;
    // _videoCodec: number /*uint*/;
    // _audioCodec: number /*uint*/;
    private _soundTransform: flash.media.SoundTransform;
    private _checkPolicyFile: boolean;
    private _client: ASObject;
    private _objectEncoding: number /*uint*/;
    // _multicastPushNeighborLimit: number;
    // _multicastWindowDuration: number;
    // _multicastRelayMarginDuration: number;
    // _multicastAvailabilityUpdatePeriod: number;
    // _multicastFetchPeriod: number;
    // _multicastAvailabilitySendToAll: boolean;
    // _farID: string;
    // _nearNonce: string;
    // _farNonce: string;
    // _peerStreams: any [];
    // _audioReliable: boolean;
    // _videoReliable: boolean;
    // _dataReliable: boolean;
    // _audioSampleAccess: boolean;
    // _videoSampleAccess: boolean;
    // _useHardwareDecoder: boolean;
    // _useJitterBuffer: boolean;
    // _videoStreamSettings: flash.media.VideoStreamSettings;

    dispose(): void {
      notImplemented("public flash.net.NetStream::dispose"); return;
    }

    _getVideoStreamURL(): string {
      return this._videoStream.url;
    }

    play(url: string): void {
      flash.media.SoundMixer._registerSoundSource(this);

      // (void) -> void ???
      url = asCoerceString(url);

      var service: IVideoElementService = AVM2.instance.globals['Shumway.Player.Utils'];
      service.registerEventListener(this._id, this.processVideoEvent.bind(this));

      if (this._connection && this._connection.uri) {
        this._videoStream.playInConnection(this._connection, url);
      } else if (url === null && !this._connection) {
        this._videoStream.openInDataGenerationMode();
      } else {
        this._videoStream.play(url, this.checkPolicyFile);
      }

      this._notifyVideoControl(VideoControlEvent.Init, {
        url: this._videoStream.url
      });
    }
    play2(param: flash.net.NetStreamPlayOptions): void {
      param = param;
      notImplemented("public flash.net.NetStream::play2"); return;
    }
    get info(): flash.net.NetStreamInfo {
      notImplemented("public flash.net.NetStream::get info"); return;
      // return this._info;
    }
    get multicastInfo(): flash.net.NetStreamMulticastInfo {
      notImplemented("public flash.net.NetStream::get multicastInfo"); return;
      // return this._multicastInfo;
    }
    get soundTransform(): flash.media.SoundTransform {
      return this._soundTransform;
    }
    set soundTransform(sndTransform: flash.media.SoundTransform) {
      this._soundTransform = sndTransform;
      flash.media.SoundMixer._updateSoundSource(this);
    }
    get checkPolicyFile(): boolean {
      return this._checkPolicyFile;
    }
    set checkPolicyFile(state: boolean) {
      state = !!state;
      this._checkPolicyFile = state;
    }
    get client(): ASObject {
      return this._client;
    }
    set client(object: ASObject) {
      somewhatImplemented("public flash.net.NetStream::set client");
      this._client = object;
    }
    get objectEncoding(): number /*uint*/ {
      notImplemented("public flash.net.NetStream::get objectEncoding"); return;
      // return this._objectEncoding;
    }
    get multicastPushNeighborLimit(): number {
      notImplemented("public flash.net.NetStream::get multicastPushNeighborLimit"); return;
      // return this._multicastPushNeighborLimit;
    }
    set multicastPushNeighborLimit(neighbors: number) {
      neighbors = +neighbors;
      notImplemented("public flash.net.NetStream::set multicastPushNeighborLimit"); return;
      // this._multicastPushNeighborLimit = neighbors;
    }
    get multicastWindowDuration(): number {
      notImplemented("public flash.net.NetStream::get multicastWindowDuration"); return;
      // return this._multicastWindowDuration;
    }
    set multicastWindowDuration(seconds: number) {
      seconds = +seconds;
      notImplemented("public flash.net.NetStream::set multicastWindowDuration"); return;
      // this._multicastWindowDuration = seconds;
    }
    get multicastRelayMarginDuration(): number {
      notImplemented("public flash.net.NetStream::get multicastRelayMarginDuration"); return;
      // return this._multicastRelayMarginDuration;
    }
    set multicastRelayMarginDuration(seconds: number) {
      seconds = +seconds;
      notImplemented("public flash.net.NetStream::set multicastRelayMarginDuration"); return;
      // this._multicastRelayMarginDuration = seconds;
    }
    get multicastAvailabilityUpdatePeriod(): number {
      notImplemented("public flash.net.NetStream::get multicastAvailabilityUpdatePeriod"); return;
      // return this._multicastAvailabilityUpdatePeriod;
    }
    set multicastAvailabilityUpdatePeriod(seconds: number) {
      seconds = +seconds;
      notImplemented("public flash.net.NetStream::set multicastAvailabilityUpdatePeriod"); return;
      // this._multicastAvailabilityUpdatePeriod = seconds;
    }
    get multicastFetchPeriod(): number {
      notImplemented("public flash.net.NetStream::get multicastFetchPeriod"); return;
      // return this._multicastFetchPeriod;
    }
    set multicastFetchPeriod(seconds: number) {
      seconds = +seconds;
      notImplemented("public flash.net.NetStream::set multicastFetchPeriod"); return;
      // this._multicastFetchPeriod = seconds;
    }
    get multicastAvailabilitySendToAll(): boolean {
      notImplemented("public flash.net.NetStream::get multicastAvailabilitySendToAll"); return;
      // return this._multicastAvailabilitySendToAll;
    }
    set multicastAvailabilitySendToAll(value: boolean) {
      value = !!value;
      notImplemented("public flash.net.NetStream::set multicastAvailabilitySendToAll"); return;
      // this._multicastAvailabilitySendToAll = value;
    }
    get farID(): string {
      notImplemented("public flash.net.NetStream::get farID"); return;
      // return this._farID;
    }
    get nearNonce(): string {
      notImplemented("public flash.net.NetStream::get nearNonce"); return;
      // return this._nearNonce;
    }
    get farNonce(): string {
      notImplemented("public flash.net.NetStream::get farNonce"); return;
      // return this._farNonce;
    }
    get peerStreams(): any [] {
      notImplemented("public flash.net.NetStream::get peerStreams"); return;
      // return this._peerStreams;
    }
    get audioReliable(): boolean {
      notImplemented("public flash.net.NetStream::get audioReliable"); return;
      // return this._audioReliable;
    }
    set audioReliable(reliable: boolean) {
      reliable = !!reliable;
      notImplemented("public flash.net.NetStream::set audioReliable"); return;
      // this._audioReliable = reliable;
    }
    get videoReliable(): boolean {
      notImplemented("public flash.net.NetStream::get videoReliable"); return;
      // return this._videoReliable;
    }
    set videoReliable(reliable: boolean) {
      reliable = !!reliable;
      notImplemented("public flash.net.NetStream::set videoReliable"); return;
      // this._videoReliable = reliable;
    }
    get dataReliable(): boolean {
      notImplemented("public flash.net.NetStream::get dataReliable"); return;
      // return this._dataReliable;
    }
    set dataReliable(reliable: boolean) {
      reliable = !!reliable;
      notImplemented("public flash.net.NetStream::set dataReliable"); return;
      // this._dataReliable = reliable;
    }
    get audioSampleAccess(): boolean {
      notImplemented("public flash.net.NetStream::get audioSampleAccess"); return;
      // return this._audioSampleAccess;
    }
    set audioSampleAccess(reliable: boolean) {
      reliable = !!reliable;
      notImplemented("public flash.net.NetStream::set audioSampleAccess"); return;
      // this._audioSampleAccess = reliable;
    }
    get videoSampleAccess(): boolean {
      notImplemented("public flash.net.NetStream::get videoSampleAccess"); return;
      // return this._videoSampleAccess;
    }
    set videoSampleAccess(reliable: boolean) {
      reliable = !!reliable;
      notImplemented("public flash.net.NetStream::set videoSampleAccess"); return;
      // this._videoSampleAccess = reliable;
    }
    appendBytes(bytes: flash.utils.ByteArray): void {
      var chunk = new Uint8Array((<any> bytes)._buffer, 0, bytes.length);
      // We need to pass cloned data, since the bytes can be reused and
      // VideoStream.appendBytes can hold data for some time.
      this._videoStream.appendBytes(chunk);
    }
    appendBytesAction(netStreamAppendBytesAction: string): void {
      this._videoStream.appendBytesAction(netStreamAppendBytesAction);
    }
    get useHardwareDecoder(): boolean {
      notImplemented("public flash.net.NetStream::get useHardwareDecoder"); return;
      // return this._useHardwareDecoder;
    }
    set useHardwareDecoder(v: boolean) {
      v = !!v;
      notImplemented("public flash.net.NetStream::set useHardwareDecoder"); return;
      // this._useHardwareDecoder = v;
    }
    get useJitterBuffer(): boolean {
      notImplemented("public flash.net.NetStream::get useJitterBuffer"); return;
      // return this._useJitterBuffer;
    }
    set useJitterBuffer(value: boolean) {
      value = !!value;
      notImplemented("public flash.net.NetStream::set useJitterBuffer"); return;
      // this._useJitterBuffer = value;
    }
    get videoStreamSettings(): flash.media.VideoStreamSettings {
      notImplemented("public flash.net.NetStream::get videoStreamSettings"); return;
      // return this._videoStreamSettings;
    }
    set videoStreamSettings(settings: flash.media.VideoStreamSettings) {
      settings = settings;
      notImplemented("public flash.net.NetStream::set videoStreamSettings"); return;
      // this._videoStreamSettings = settings;
    }
    invoke(index: number /*uint*/): any {
      index = index >>> 0;
      return this._invoke(index, Array.prototype.slice.call(arguments, 1));
    }
    invokeWithArgsArray(index: number /*uint*/, p_arguments: any []): any {
      index = index >>> 0; p_arguments = p_arguments;
      return this._invoke.call(this, index, p_arguments);
    }

    get inBufferSeek(): boolean {
      return this._inBufferSeek;
    }

    set inBufferSeek(value: boolean) {
      this._inBufferSeek = !!value;
    }

    private _invoke(index: number, args: any[]): any {
      var simulated = false, result;
      switch (index) {
        case 4: // set bufferTime
          this._videoStream.bufferTime = args[0];
          simulated = true;
          break;
        case 202: // call, e.g. ('pause', null, paused, time)
          switch (args[1]) {
            case 'pause':
              simulated = true;
              this._notifyVideoControl(VideoControlEvent.Pause, {
                paused: !!args[3],
                time: args[4] / 1000
              });
              break;
            case 'seek':
              simulated = true;
              this._notifyVideoControl(VideoControlEvent.Seek, {
                time: args[3] / 1000
              });
              break;
          }
          break;
        case 300: // time
          result = this._notifyVideoControl(VideoControlEvent.GetTime, null);
          simulated = true;
          break;
        case 302: // get bufferTime
          result = this._videoStream.bufferTime;
          simulated = true;
          break;
        case 303: // get bufferLength
          result = this._notifyVideoControl(VideoControlEvent.GetBufferLength, null);
          simulated = true;
          break;
        case 305: // get bytesLoaded
          result = this._notifyVideoControl(VideoControlEvent.GetBytesLoaded, null);
          simulated = true;
          break;
        case 306: // get bytesTotal
          result = this._notifyVideoControl(VideoControlEvent.GetBytesTotal, null);
          simulated = true;
          break;
      }
      // (index:uint) -> any
      (simulated ? somewhatImplemented : notImplemented)(
        "NetStream._invoke (" + index + ")");
      return result;
    }

    private _notifyVideoControl(eventType: VideoControlEvent, data: any): any {
      var service: IVideoElementService = AVM2.instance.globals['Shumway.Player.Utils'];
      return service.notifyVideoControl(this._id, eventType, data);
    }

    processVideoEvent(eventType: VideoPlaybackEvent, data: any): void {
      this._videoStream.processVideoPlaybackEvent(eventType, data);

      switch (eventType) {
        case VideoPlaybackEvent.Initialized:
          flash.media.SoundMixer._updateSoundSource(this);
          break;
        case VideoPlaybackEvent.PlayStart:
          this.dispatchEvent(new events.NetStatusEvent(events.NetStatusEvent.NET_STATUS,
            false, false, wrapJSObject({code: "NetStream.Play.Start", level: "status"})));
          break;
        case VideoPlaybackEvent.PlayStop:
          this.dispatchEvent(new events.NetStatusEvent(events.NetStatusEvent.NET_STATUS,
            false, false, wrapJSObject({code: "NetStream.Play.Stop", level: "status"})));

          flash.media.SoundMixer._unregisterSoundSource(this);
          break;
        case VideoPlaybackEvent.BufferFull:
          this.dispatchEvent(new events.NetStatusEvent(events.NetStatusEvent.NET_STATUS,
            false, false, wrapJSObject({code: "NetStream.Buffer.Full", level: "status"})));
          break;
        case VideoPlaybackEvent.BufferEmpty:
          this.dispatchEvent(new events.NetStatusEvent(events.NetStatusEvent.NET_STATUS,
            false, false, wrapJSObject({code: "NetStream.Buffer.Empty", level: "status"})));
          break;
        case VideoPlaybackEvent.Error:
          var code = data.code === 4 ? "NetStream.Play.NoSupportedTrackFound" :
              data.code === 3 ? "NetStream.Play.FileStructureInvalid" : "NetStream.Play.StreamNotFound";
          this.dispatchEvent(new events.NetStatusEvent(events.NetStatusEvent.NET_STATUS,
            false, false, wrapJSObject({code: code, level: "error"})));
          break;
        case VideoPlaybackEvent.Seeking:
          this.dispatchEvent(new events.NetStatusEvent(events.NetStatusEvent.NET_STATUS,
            false, false, wrapJSObject({code: "NetStream.Seek.Notify", level: "status"})));
          break;
        case VideoPlaybackEvent.Metadata:
          if (this._client) {
            var metadata = {};
            metadata.asSetPublicProperty('width', data.videoWidth);
            metadata.asSetPublicProperty('height', data.videoHeight);
            metadata.asSetPublicProperty('duration', data.duration);
            this._client.asCallPublicProperty('onMetaData', [metadata]);
          }
          break;
      }
    }

    stopSound() {
      this.pause();
    }

    updateSoundLevels(volume: number) {
      this._notifyVideoControl(VideoControlEvent.SetSoundLevels, {
        volume: volume
      });
    }
  }

  export interface IVideoElementService {
    registerEventListener(id: number, listener: (eventType: VideoPlaybackEvent, data: any) => void);
    notifyVideoControl(id: number, eventType: VideoControlEvent, data: any): any;
  }

  enum VideoStreamState {
    CLOSED = 0,
    OPENED =  1,
    ENDED = 2,
    OPENED_DATA_GENERATION = 3,
    ERROR = 4
  }

  /**
   * Helper class that encapsulates VIDEO/MediaSource operations and
   * buffers data before passing to the MSE.
   */
  class VideoStream {
    private _domReady: PromiseWrapper<any>;
    private _metadataReady: PromiseWrapper<any>;
    private _started: boolean;
    private _buffer: string;
    private _bufferTime: number;
    private _url: string;
    private _contentTypeHint: string;
    private _state: VideoStreamState;
    private _mediaSource;
    private _mediaSourceBuffer;
    private _mediaSourceBufferLock: Promise<any>;

    get state(): VideoStreamState {
      return this._state;
    }

    get bufferTime(): number {
      return this._bufferTime;
    }

    constructor() {
      this._domReady = new PromiseWrapper<any>();
      this._metadataReady = new PromiseWrapper<any>();
      this._started = false;
      this._buffer = 'empty';
      this._bufferTime = 0.1;
      this._url = null;
      this._mediaSource = null;
      this._mediaSourceBuffer = null;
      this._contentTypeHint = null;
      this._state = VideoStreamState.CLOSED;
    }

    get url(): string {
      return this._url;
    }

    play(url: string, checkPolicyFile: boolean) {
      release || assert(this._state === VideoStreamState.CLOSED);

      this._state = VideoStreamState.OPENED;
      var isMediaSourceEnabled = mediaSourceOption.value;
      if (isMediaSourceEnabled && typeof MediaSource === 'undefined') {
        console.warn('MediaSource API is not enabled, falling back to regular playback');
        isMediaSourceEnabled = false;
      }
      if (!isMediaSourceEnabled) {
        somewhatImplemented("public flash.net.NetStream::play");
        this._url = FileLoadingService.instance.resolveUrl(url);
        return;
      }

      var mediaSource = new MediaSource();
      mediaSource.addEventListener('sourceopen', function(e) {
        this._mediaSource = mediaSource;
      }.bind(this));
      mediaSource.addEventListener('sourceend', function(e) {
        this._mediaSource = null;
      }.bind(this));

      if (!url) {
        this._url = null;
        return;
      }

      this._url = URL.createObjectURL(mediaSource);

      var request = new net.URLRequest(url);
      request._checkPolicyFile = checkPolicyFile;
      var stream = new net.URLStream();
      stream.addEventListener('httpStatus', function (e) {
        var responseHeaders = e.asGetPublicProperty('responseHeaders');
        var contentTypeHeader = responseHeaders.filter(function (h) {
          return h.asGetPublicProperty('name') === 'Content-Type';
        })[0];
        if (contentTypeHeader) {
          var hint: string = contentTypeHeader.asGetPublicProperty('value');
          if (hint !== 'application/octet-stream') {
            this._contentTypeHint = hint;
          }
        }
      }.bind(this));
      stream.addEventListener('progress', function (e) {
        var available = stream.bytesAvailable;
        var bytes = new utils.ByteArray();
        stream.readBytes(bytes, 0, available);
        var chunk = new Uint8Array((<any> bytes)._buffer, 0, bytes.length);
        this.appendBytes(chunk);
      }.bind(this));
      stream.addEventListener('complete', function (e) {
        this.appendBytesAction('endSequence'); // NetStreamAppendBytesAction.END_SEQUENCE
      }.bind(this));
      stream.load(request);
    }

    playInConnection(connection: NetConnection, streamPath: string) {
      this.openInDataGenerationMode();

      var self = this;
      var mux: RtmpJs.MP4.MP4Mux;
      var mp4 = {
        packets: 0,
        init: function (metadata) {
          if (!metadata.asGetPublicProperty('audiocodecid') && !metadata.asGetPublicProperty('videocodecid')) {
            return; // useless metadata?
          }
          var parsedMetadata = RtmpJs.MP4.parseFLVMetadata(metadata);
          mux = new RtmpJs.MP4.MP4Mux(parsedMetadata);
          mux.ondata = function (data) {
            self.appendBytes(new Uint8Array(data));
          }.bind(this);
        },
        packet: function (type, data, timestamp) {
          mux.pushPacket(type, new Uint8Array(data), timestamp);
        },
        generate: function () {
          mux.flush();
        }
      };

      connection._createRtmpStream((ns: RtmpJs.INetStream, streamId: number) => {
        ns.ondata = function (message) {
          console.log('#packet (' + message.typeId + '): @' + message.timestamp);
          if (message.data.length > 0) {
            mp4.packet(message.typeId, message.data, message.timestamp);
          }
        };
        ns.oncallback = function () {
          console.log('#callback');
        };
        ns.onscriptdata = function (type, data) {
          console.log('#object: ' + type);
          if (type === 'onMetaData') {
            mp4.init(data);
          }
        };
        ns.play(streamPath);
      });
    }

    openInDataGenerationMode() {
      release || assert(this._state === VideoStreamState.CLOSED);
      this._state = VideoStreamState.OPENED_DATA_GENERATION;
      var mediaSource = new MediaSource();
      mediaSource.addEventListener('sourceopen', function(e) {
        this._mediaSource = mediaSource;
        this._ensurePlaying();
      }.bind(this));
      mediaSource.addEventListener('sourceend', function(e) {
        this._mediaSource = null;
      }.bind(this));

      this._url = URL.createObjectURL(mediaSource);
    }

    appendBytes(bytes: Uint8Array) {
      release || assert(this._state === VideoStreamState.OPENED_DATA_GENERATION ||
                        this._state === VideoStreamState.OPENED);
      if (this._mediaSource) {
        if (!this._mediaSourceBuffer) {
          var contentType = this._contentTypeHint || this._detectContentType(bytes);
          this._mediaSourceBufferLock = Promise.resolve(undefined);
          this._mediaSourceBuffer = this._mediaSource.addSourceBuffer(contentType);
        }
        var buffer = this._mediaSourceBuffer;
        // We need to chain all appendBuffer operations using 'update' event.
        this._mediaSourceBufferLock = this._mediaSourceBufferLock.then(function () {
          buffer.appendBuffer(bytes);
          return new Promise(function (resolve) {
            buffer.addEventListener('update', function updateHandler() {
              buffer.removeEventListener('update', updateHandler);
              resolve();
            });
          });
        });
      }
      somewhatImplemented("public flash.net.NetStream::appendBytes");
    }

    appendBytesAction(netStreamAppendBytesAction: string) {
      release || assert(this._state === VideoStreamState.OPENED_DATA_GENERATION ||
                        this._state === VideoStreamState.OPENED);
      netStreamAppendBytesAction = asCoerceString(netStreamAppendBytesAction);
      if (netStreamAppendBytesAction === 'endSequence') {
        this._mediaSourceBufferLock.then(function () {
          if (this._mediaSource) {
            this._mediaSource.endOfStream();
          }
          this.close();
        }.bind(this));
      }
      somewhatImplemented("public flash.net.NetStream::appendBytesAction");
    }

    close() {
      this._state = VideoStreamState.CLOSED;
    }

    _onEnsurePlay: () => any;
    private _ensurePlaying() {
      if (!this._onEnsurePlay) {
        return;
      }
      this._onEnsurePlay();
    }

    private _detectContentType(bytes: Uint8Array): string {
      // TODO check bytes for content type
      return 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
    }

    processVideoPlaybackEvent(eventType: VideoPlaybackEvent, data: any) {
      switch (eventType) {
        case VideoPlaybackEvent.Initialized:
          this._domReady.resolve(undefined);
          break;
        case VideoPlaybackEvent.PlayStart:
          if (this._started) {
            break;
          }
          this._started = true;
          break;
        case VideoPlaybackEvent.PlayStop:
          this._started = false;
          break;
        case VideoPlaybackEvent.BufferFull:
          this._buffer = 'full';
          break;
        case VideoPlaybackEvent.Progress:
          this._buffer = 'progress';
          break;
        case VideoPlaybackEvent.BufferEmpty:
          this._buffer = 'empty';
          break;
        case VideoPlaybackEvent.Metadata:
          this._metadataReady.resolve({
            videoWidth: data.videoWidth,
            videoHeight: data.videoHeight
          });
          break;
      }
    }
  }
}
