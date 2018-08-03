'use strict'

window['videoPlayerJs'] = function videoPlayerJs(wrapper) {
    if (wrapper.tagname === 'VIDEO')
        throw 'Pass in the element containing the video element, \
               not the video element itself';
    if (wrapper.getAttribute('class').indexOf('video-wrapper') === -1)
        throw 'Please pass in the element containing the video element,\
               and make sure the HTML is correct';

    var ge = function (c) { return wrapper.getElementsByClassName(c)[0]; }

    var video = ge('video');
    var videoPlay = ge('video-play');
    var videoAudio = ge('video-audio');
    var videoAudioBtn = ge('video-audio-btn');
    var videoAudioLevel = ge('video-volume');
    var videoNumeralProgress = ge('video-numeral-progress');
    var videoVisualProgress = ge('video-visual-progress');
    var videoFullscreen = ge('video-fullscreen');

    var vidTime = 0;
    var isPlaying = false;
    var vidDuration = 0;
    var vidDurationFmt = '';
    var vidVolume = 1;
    var isUserSliding = false;
    var muted = false;
    var fullscreen = false;
    var vidLenLong = false;
    var isScrubing = false;

    var r = eventEmitter();
    var emitter = r.emitter;
    var emit = r.emit;

    videoPlay.addEventListener('click', function () {
        if (!isPlaying) emitter['play']();
        else emitter['stop']();
    });

    videoAudioBtn.addEventListener('click', function () {
        if (muted) {
            emitter['unmute']();
        } else {
            emitter['mute']();
        }
    });

    videoAudioLevel.addEventListener('input', function () {
        var val = (videoAudioLevel.value - (videoAudioLevel.min || 0)) / (videoAudioLevel.max || 100);
        val = Math.min(1, Math.max(0, val));
        emitter['volume'](val);
    });

    videoVisualProgress.addEventListener('input', function () {
        var val = (videoVisualProgress.value - (videoVisualProgress.min || 0)) / (videoVisualProgress.max || 100);
        val = Math.min(1, Math.max(0, val));
        var time = val * vidDuration;
        if (!isScrubing) video.pause();
        isScrubing = true;
        emitter['scrub'](time);
    });

    videoVisualProgress.addEventListener('change', function() {
        isScrubing = false;
        if (isPlaying) video.play();
    });

    videoFullscreen.addEventListener('click', function () {
        if (fullscreen) emitter['windowedscreen']();
        else emitter['fullscreen']();
    });

    emitter['play'] = function () {
        if (isPlaying) return;
        isPlaying = true;
        videoPlay.classList.add('video-stop');
        emit('play');
    };

    emitter['stop'] = function () {
        if (!isPlaying) return;
        isPlaying = false;
        videoPlay.classList.remove('video-stop');
        emit('stop');
    };

    emitter['durationchange'] = function (seconds) {
        vidDuration = seconds;
        vidDurationFmt = fmt(seconds);
        videoNumeralProgress.innerText = fmt(vidTime) + '/' + vidDurationFmt;
        if ((vidDuration > 3600 || vidDuration > 3600) && !vidLenLong) videoVisualProgress.classList.add('video-length-long');
        else if ((vidDuration <= 3600 && vidDuration <= 3600) && vidLenLong) videoVisualProgress.classList.remove('video-length-long'); 
        emit('durationchange', seconds);
    };

    function setAudioLevelIcon() {
        videoAudio.classList.remove('volume-high');
        videoAudio.classList.remove('volume-muted');
        videoAudio.classList.remove('volume-low');
        videoAudio.classList.remove('volume-med');
        var level = muted ? 0 : vidVolume;
        var levelStr = level > 0.66 ? 'high' : level > 0.33 ? 'med' : level > 0 ? 'low' : 'muted';
        videoAudio.classList.add('volume-' + levelStr);
    };

    emitter['volume'] = function (level) {
        if (muted && level !== 0) {
            vidVolume = level;
            return emitter['unmute']();
        }
        else if (level === 0) return emitter['mute']();
        else {
            vidVolume = level;
            setAudioLevelIcon();
            emit('volume', level);
        }
    };

    emitter['mute'] = function () {
        if (muted) return;
        muted = true;
        setAudioLevelIcon();
        emit('mute');
        emit('volume', 0);
    };

    emitter['unmute'] = function () {
        if (!muted) return;
        muted = false;
        setAudioLevelIcon();
        emit('unmute');
        emit('volume', vidVolume);
    };

    emitter['timeupdate'] = function (seconds) {
        vidTime = seconds;
        videoNumeralProgress.innerText = fmt(seconds) + '/' + vidDurationFmt;
        var ratio = vidTime / vidDuration;
        var min = +videoNumeralProgress.min || 0;
        var span = (+videoNumeralProgress.max || 100) - min;
        if (!isScrubing) {
            videoVisualProgress.value = ratio * span + min;
        }
        emit('timeupdate', seconds);
    };

    emitter['scrub'] = function(seconds) {
        emitter['timeupdate'](seconds);
        emit('scrub', seconds);
    };

    emitter['fullscreen'] = function () {
        if (fullscreen) return;
        wrapper.classList.add('fullscreen');
        fullscreen = true;
        registerExitHandlers();
        if (wrapper.requestFullscreen) {
            wrapper.requestFullscreen();
        } else if (wrapper.msRequestFullscreen) {
            wrapper.msRequestFullscreen();
        } else if (wrapper.mozRequestFullScreen) {
            wrapper.mozRequestFullScreen();
        } else if (wrapper.webkitRequestFullscreen) {
            wrapper.webkitRequestFullscreen();
        }
        emit('fullscreen');
    };

    emitter['windowedscreen'] = function () {
        if (!fullscreen) return;
        unRegisterExitHandlers();
        fullscreen = false;
        if (wrapper.classList.contains('fullscreen')) {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        }
        wrapper.classList.remove('fullscreen');
        emit('windowedscreen');
    };

    emitter['wireupevents'] = function() {
        emitter.addEventListener('play', function() {
            video.play();
        });

        emitter.addEventListener('stop', function() {
            video.pause();
        });

        emitter.addEventListener('volume', function(level) {
            video.volume = level;
        });

        emitter.addEventListener('scrub', function(seconds) {
            video.currentTime = seconds;
        });

        video.addEventListener('durationchange', function() {
            emitter['durationchange'](video.duration);
        });

        video.addEventListener('timeupdate', function() {
            emitter['timeupdate'](video.currentTime);
        });

        video.addEventListener('ended', function() {
            emitter.stop();
        });
    };

    return emitter;

    function registerExitHandlers() {
        document.addEventListener('webkitfullscreenchange', exitHandler, false);
        document.addEventListener('mozfullscreenchange', exitHandler, false);
        document.addEventListener('fullscreenchange', exitHandler, false);
        document.addEventListener('MSFullscreenChange', exitHandler, false);
    }

    function unRegisterExitHandlers() {
        document.removeEventListener('webkitfullscreenchange', exitHandler, false);
        document.removeEventListener('mozfullscreenchange', exitHandler, false);
        document.removeEventListener('fullscreenchange', exitHandler, false);
        document.removeEventListener('MSFullscreenChange', exitHandler, false);
    }

    function exitHandler() {
        if (document.webkitIsFullScreen === false || document.mozFullScreen === false || document.msFullscreenElement === null) {
            if (fullscreen) {
                video.classList.remove('fullscreen');
                emitter['windowedscreen']();
            }
        }
    }

    function fmt(seconds) {
        function pad(n) {
            return (n < 10 ? "0" + n : n);
        }

        var h = Math.floor(seconds / 3600);
        var m = Math.floor(seconds / 60) - (h * 60);
        var s = Math.floor(seconds - h * 3600 - m * 60);

        var str = '';
        if (h) str += pad(h).slice(0, 2) + ':';
        str += pad(m) + ':' + pad(s);
        return str;
    }

    function eventEmitter() {
        var handlers = {};
        var isOnce = {};

        var emit = function emit(name) {
            for (var _len = arguments.length, data = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                data[_key - 1] = arguments[_key];
            }

            if (handlers[name]) {
                for (var handler, i = handlers[name].length - 1; i >= 0; i-- ) {
                    handler = handlers[name][i];
                    handler.apply(undefined, data);
                    if (isOnce[name][i]) {
                        handlers[name].splice(i, 1);
                        isOnce[name].splice(i, 1);
                    }
                }
            }
        };

        var push = function push(doOnce, prepend, name, handler) {
            handlers[name] = handlers[name] || [];
            handlers[name][prepend ? 'unshift' : 'push'](handler);
            isOnce[name] = isOnce[name] || [];
            isOnce[name][prepend ? 'unshift' : 'push'](doOnce);
        };

        var addEventListener = push.bind(null, false, false);
        var once = push.bind(null, true, false);
        var prependListener = push.bind(null, false, true);
        var prependOnceListener = push.bind(null, true, true);

        var removeListener = function removeListener(name, handler) {
            if (handlers[name]) {
                var i;
                while ((i = handlers[name].indexOf(handler)) !== -1) {
                    handlers[name].splice(i, 1);
                    isOnce[name].splice(i, 1);
                }
            }
        };

        var removeAllListeners = function removeAllListeners(name) {
            if (handlers[name]) handlers[name].length = 0;
        };

        var listeners = function listeners(name) {
            return handlers[name] && handlers[name].slice() || [];
        };

        return {
            emitter: {
                'addEventListener': addEventListener,
                'once': once,
                'removeListener': removeListener,
                'removeAllListeners': removeAllListeners,
                'listeners': listeners,
                'prependListener': prependListener,
                'prependOnceListener': prependOnceListener
            },
            emit: emit,
        };
    }

}
