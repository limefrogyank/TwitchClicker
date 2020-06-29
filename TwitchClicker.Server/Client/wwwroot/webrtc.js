var Communicate = /** @class */ (function () {
    function Communicate(ref) {
        this.ref = ref;
        this.remoteVideo = document.getElementById("remoteVideo")[0];
        this.remoteAudio = document.getElementById("remoteAudio")[0];
    }
    Communicate.prototype.setupConnectionAsync = function () {
        var _this = this;
        this.pc = new RTCPeerConnection({});
        this.pc.onicecandidate = function (ev) {
            //window.external.notify(JSON.stringify(ev.candidate));
        };
        this.pc.ontrack = function (ev) {
            try {
                //window.external.notify("Got track event: " + ev.track.kind);
                if (ev.track.kind == "video") {
                    _this.remoteVideo.srcObject = ev.streams[0];
                }
                else if (ev.track.kind == "audio") {
                    _this.remoteAudio.srcObject = ev.streams[0];
                }
            }
            catch (err) {
                //window.external.notify(err.code + ": " + err.message);
            }
        };
        return navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then(function (stream) {
            stream.getTracks().forEach(function (track) {
                _this.pc.addTrack(track, stream);
            });
            return _this.pc.createOffer().then(function (offer) {
                _this.pc.setLocalDescription(offer);
                return _this.ref.invokeMethodAsync("OnOfferAsync", offer);
            });
        });
    };
    Communicate.prototype.processOffer = function (sdp) {
        try {
            this.setupConnectionAsync();
            //window.external.notify(sdp);
            var d = "offer";
            var desc = { type: d, sdp: sdp };
            this.pc.setRemoteDescription(desc);
            //window.external.notify("Success!");
        }
        catch (err) {
            //window.external.notify(err.code + ": " + err.message);
            //window.external.notify("Definitely an error");
        }
    };
    Communicate.prototype.processCandidate = function (candidate) {
        try {
            var cand = JSON.parse(candidate);
            this.pc.addIceCandidate(cand);
        }
        catch (err) {
            //window.external.notify(err.code + ": " + err.message);
        }
    };
    return Communicate;
}());
var communicate;
function setupWebRTC(ref) {
    communicate = new Communicate(ref);
}
function start() {
    return communicate.setupConnectionAsync();
}
//# sourceMappingURL=webrtc.js.map