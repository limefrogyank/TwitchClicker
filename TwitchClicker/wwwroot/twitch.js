function setupWebRTC(ref) {
    communicate = new Communicate(ref);
}
function startWebRTC() {
    return communicate.setupConnectionAsync();
}
;
var authData = { registration: "", token: "", userId: "" };
var refs = new Map();
var count = 0;
var listenCount = 0;
var listenCallbacks = new Map();
function registerListener(ref) {
    refs.set((count++).toString(), ref);
    authData.registration = count.toString();
    return authData;
}
function send(type, content) {
    window.Twitch.ext.send(type, "application/json", content);
}
function listen(ref, type) {
    var listenCallbackId = (listenCount++).toString();
    var callback = (target, contentType, message) => {
        ref.invokeMethodAsync("OnListenHandlerAsync", message);
    };
    listenCallbacks.set(listenCallbackId, callback);
    window.Twitch.ext.listen(type, callback);
}
function unlisten(type, listenCallbackId) {
    window.Twitch.ext.unlisten(type, listenCallbacks.get(listenCallbackId));
    listenCallbacks.delete(listenCallbackId);
}
var tests = (auth) => { };
window.Twitch.ext.onAuthorized(auth => {
    authData = auth;
    refs.forEach(v => {
        v.invokeMethodAsync("OnAuthorizedHandlerAsync", authData);
    });
});
class Communicate {
    constructor(ref) {
        this.ref = ref;
        this.remoteVideo = document.getElementById("remoteVideo");
        this.remoteAudio = document.getElementById("remoteAudio");
    }
    setupConnectionAsync() {
        this.pc = new RTCPeerConnection({});
        this.pc.onicecandidate = (ev) => {
            //window.external.notify(JSON.stringify(ev.candidate));
        };
        this.pc.ontrack = (ev) => {
            try {
                //window.external.notify("Got track event: " + ev.track.kind);
                if (ev.track.kind == "video") {
                    this.remoteVideo.srcObject = ev.streams[0];
                }
                else if (ev.track.kind == "audio") {
                    this.remoteAudio.srcObject = ev.streams[0];
                }
            }
            catch (err) {
                //window.external.notify(err.code + ": " + err.message);
            }
        };
        return navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then(stream => {
            stream.getTracks().forEach(track => {
                this.pc.addTrack(track, stream);
            });
            return this.pc.createOffer().then(offer => {
                this.pc.setLocalDescription(offer);
                return offer;
                //return this.ref.invokeMethodAsync("OnOfferAsync", offer);
            });
        });
    }
    processOffer(sdp) {
        try {
            this.setupConnectionAsync();
            //window.external.notify(sdp);
            let d = "offer";
            var desc = { type: d, sdp: sdp };
            this.pc.setRemoteDescription(desc);
            //window.external.notify("Success!");
        }
        catch (err) {
            //window.external.notify(err.code + ": " + err.message);
            //window.external.notify("Definitely an error");
        }
    }
    processCandidate(candidate) {
        try {
            var cand = JSON.parse(candidate);
            this.pc.addIceCandidate(cand);
        }
        catch (err) {
            //window.external.notify(err.code + ": " + err.message);
        }
    }
}
let communicate;
//# sourceMappingURL=twitch.js.map