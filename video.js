(function () {

})();
function videoPlayerJs(wrapper) {
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
    var videoAudioLevel = ge('video-audio-level');
    var videoNumeralProgress = ge('video-numeral-progress');
    var videoVisualProgress = ge('video-visual-progress');
    var videoFullscreen = ge('video-fullscreen');

    var vidTime = 0;
    var isPlaying = false;
    var vidDuration = 0;
    var vidDurationFmt = '';
    var audioLevel = 1;
    var isUserSliding = false;
    var muted = false;

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

    videoAudioLevel.addEventListener('input', function() {
        var val = (videoAudioLevel.value - (videoAudioLevel.min || 0)) / (videoAudioLevel.max || 100);
        val = Math.min(1, Math.max(0, val));
        emitter['audioLevel'](val);
    });

    videoVisualProgress.addEventListener('input', function() {
        var val = (videoAudioLevel.value - (videoAudioLevel.min || 0)) / (videoAudioLevel.max || 100);
        val = Math.min(1, Math.max(0, val));
        var time = val * vidDuration;
        emitter['timeupdate'](time);
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

    emitter['durationupdate'] = function(seconds) {
        vidDuration = seconds;
        vidDurationFmt = fmt(seconds);
        videoNumeralProgress.innerText = fmt(vidTime) + '/' + vidDurationFmt;
        emit('durationupdate');
    }   

    function setAudioLevelIcon() {
        videoAudio.classList.remove('audio-level-high');
        videoAudio.classList.remove('audio-level-muted');
        videoAudio.classList.remove('audio-level-low');
        videoAudio.classList.remove('audio-level-med');
        var level = muted ? 0 : audioLevel;
        var levelStr = level > 0.66 ? 'high' : level > 0.33 ? 'med' : level > 0 ? 'low' : 'muted';
        videoAudio.classList.add('audio-level-' + levelStr);
    }

    emitter['audioLevel'] = function (level) {
        if (muted && level !== 0) {
            audioLevel = level;
            return emitter['unmute']();
        }
        else if (level === 0) return emitter['mute']();
        else {
            audioLevel = level;
            setAudioLevelIcon();
            emit('audio-level', level);
        }
    };

    emitter['mute'] = function () {
        if (muted) return;
        muted = true;
        setAudioLevelIcon();
        emit('mute');
        emit('audio-level', 0);
    }

    emitter['unmute'] = function () {
        if (!muted) return;
        muted = false;
        setAudioLevelIcon();
        emit('unmute');
        emit('audio-level', audioLevel);
    }

    emitter['timeupdate'] = function (seconds) {
        vidTime = seconds;
        videoNumeralProgress.innerText = fmt(seconds) + '/' + vidDurationFmt;
    }

    return emitter;

    function fmt(seconds) {
        var hours = Math.floor(seconds / 3600) || '';
        if (hours) hours = hours += ':';
        var min = Math.floor((seconds / 60) % 60);
        var sec = Math.floor(seconds % 60);

        return hours + min + ':' + sec;
    }

    function eventEmitter() {
        var handlers = {};
        var isOnce = {};

        var emit = function emit(name) {
            for (var _len = arguments.length, data = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                data[_key - 1] = arguments[_key];
            }

            if (handlers[name]) {
                for (var handler, i = handlers[name].length - 1; i >= 0; i-- , handler = handlers[name][i]) {
                    handler.apply(undefined, data);
                    if (isOnce[name][i]) {
                        handlers[name].splice(i, 1);
                        isOnce[name].splice(i, 1);
                    }
                }
            }
        };

        var push = function push(isOnce, prepend, name, handler) {
            handlers[name] = handlers[name] || [];
            handlers[name][prepend ? 'unshift' : 'push'](handler);
            isOnce[name] = isOnce[name] || [];
            isOnce[name][prepend ? 'unshift' : 'push'](isOnce);
        };

        var addEventListener = push.bind(null, false, false);
        var once = push.bind(null, true, false);
        var prependListener = push.bind(null, false, true);
        var prependOnceListener = push.bind(null, true, true);

        var removeListener = function removeListener(name, handler) {
            if (handlers[name]) {
                while (handlers[name].indexOf(handler) !== -1) {
                    handlers[name].splice(handlers[name].indexOf(handler), 1);
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
