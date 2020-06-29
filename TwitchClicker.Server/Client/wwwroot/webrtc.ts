interface Window {
    DotNet: DotNetReferenceType;
}

interface DotNetReferenceType {
    invokeMethod<T>(methodIdentifier: string, ...args: any[]): T;
    invokeMethodAsync<T>(methodIdentifier: string, ...args: any[]): Promise<T>;
}


class Communicate {
    private pc: RTCPeerConnection;
    private remoteVideo: HTMLVideoElement; 
    private remoteAudio: HTMLAudioElement; 
    private ref: DotNetReferenceType;

    constructor(ref: DotNetReferenceType) {
        this.ref = ref;
        this.remoteVideo = <HTMLVideoElement>document.getElementById("remoteVideo")[0];
        this.remoteAudio = <HTMLAudioElement>document.getElementById("remoteAudio")[0];
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
                this.pc.addTrack(track,stream);
            });

            return this.pc.createOffer().then(offer => {
                
                this.pc.setLocalDescription(offer);

                return this.ref.invokeMethodAsync("OnOfferAsync", offer);
                
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

function setupWebRTC(ref:DotNetReferenceType) {
    communicate = new Communicate(ref);
}

function start() {
    return communicate.setupConnectionAsync();
}