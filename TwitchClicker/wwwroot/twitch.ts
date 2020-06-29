
interface Window {
    Twitch: Twitch;  
    DotNet: DotNetStuff;
}

interface Twitch {
    ext: TwitchExt;
}
interface TwitchExt {
    onAuthorized(callback: (authData: AuthData) => void);
    send(target: string, contentType: string, message: Object);
    send(target: string, contentType: string, message: string);
    listen(target: String, callback: (target: string, contentType: string, message: string) => void);
    unlisten(target: String, callback: (target: string, contentType: string, message: string) => void);
}

interface DotNetStuff {
    invokeMethod<T>(methodIdentifier: string, ...args: any[]): T;
    invokeMethodAsync<T>(methodIdentifier: string, ...args: any[]): Promise<T>;
}

interface DotNetReferenceType {
    invokeMethod<T>(methodIdentifier: string, ...args: any[]): T;
    invokeMethodAsync<T>(methodIdentifier: string, ...args: any[]): Promise<T>;
}

interface AuthData {
    token: string;
    userId: string;
    registration: string;
}


function setupWebRTC(ref: DotNetReferenceType):void {
    communicate = new Communicate(ref);
}

function startWebRTC(): Promise<RTCSessionDescriptionInit> {
    return communicate.setupConnectionAsync();
};


var authData: AuthData = { registration: "", token: "", userId: "" };

var refs: Map<string, DotNetReferenceType> = new Map<string, DotNetReferenceType>();
var count = 0;

var listenCount = 0;
var listenCallbacks: Map<string, (target: string, contentType: string, message: string) => void> = new Map<string, (target: string, contentType: string, message: string) => void>();

function registerListener(ref:DotNetReferenceType) : AuthData {
    refs.set((count++).toString(), ref);
    authData.registration = count.toString();
    return authData;
}

function send(type:string, content: any) {
    window.Twitch.ext.send(type, "application/json", content);
}

function listen(ref: DotNetReferenceType, type:string) {
    var listenCallbackId = (listenCount++).toString();
    var callback: (target: string, contentType: string, message: string) => void = (target, contentType, message) => {
        ref.invokeMethodAsync("OnListenHandlerAsync", message);
    };

    listenCallbacks.set(listenCallbackId, callback);
    window.Twitch.ext.listen(type, callback);
}

function unlisten(type:string, listenCallbackId: string) {
    window.Twitch.ext.unlisten(type, listenCallbacks.get(listenCallbackId));

    listenCallbacks.delete(listenCallbackId);
}

var tests = (auth: AuthData) => { };

window.Twitch.ext.onAuthorized( auth => {
    authData = auth;

    refs.forEach(v => {
        v.invokeMethodAsync("OnAuthorizedHandlerAsync", authData);
    });    
});



class Communicate {
    private pc: RTCPeerConnection;
    private remoteVideo: HTMLVideoElement;
    private remoteAudio: HTMLAudioElement;
    private ref: DotNetReferenceType;

    constructor(ref: DotNetReferenceType) {
        this.ref = ref;
        this.remoteVideo = <HTMLVideoElement>document.getElementById("remoteVideo");
        this.remoteAudio = <HTMLAudioElement>document.getElementById("remoteAudio");
    }

    public setupConnectionAsync() {
        this.pc = new RTCPeerConnection({});
        this.pc.onicecandidate = (ev) => {
            //window.external.notify(JSON.stringify(ev.candidate));

        };

        this.pc.ontrack = (ev) => {
            try {
                //window.external.notify("Got track event: " + ev.track.kind);
                if (ev.track.kind == "video") {
                    this.remoteVideo.srcObject = ev.streams[0];
                } else if (ev.track.kind == "audio") {
                    this.remoteAudio.srcObject = ev.streams[0];
                }
            } catch (err) {
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

    public processOffer(sdp: string) {
        try {
            this.setupConnectionAsync();
            //window.external.notify(sdp);
            let d: RTCSdpType = "offer";
            var desc = { type: d, sdp: sdp };
            this.pc.setRemoteDescription(desc);
            //window.external.notify("Success!");
        }
        catch (err) {
            //window.external.notify(err.code + ": " + err.message);
            //window.external.notify("Definitely an error");
        }
    }

    public processCandidate(candidate: string) {
        try {
            var cand = JSON.parse(candidate);
            this.pc.addIceCandidate(cand);
        } catch (err) {
            //window.external.notify(err.code + ": " + err.message);
        }
    }
}

let communicate: Communicate;

