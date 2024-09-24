const socket = io.connect('https://video-chat-nodejs-fotv.onrender.com/');
const $ = selector => document.querySelector(selector);

// Query DOM
const $handle = $('#handle'),
      $join = $('#join'),
      localVideo = document.getElementById('local-video'),
      remoteVideo = document.getElementById('remote-video');

// WebRTC variables
let localStream, remoteStream;
let peerConnection;
const iceServers = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }, // Google's public STUN server
    ]
};

// Emit join event to establish connection
$join.addEventListener('click', () => {
    const handle = $handle.value;
    if (!handle) {
        alert("Please enter your handle");
        return;
    }

    // Get local video/audio stream
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
            localStream = stream;
            localVideo.srcObject = stream;

            // Create WebRTC peer connection
            peerConnection = new RTCPeerConnection(iceServers);

            // Add local stream to the peer connection
            localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

            // Handle remote stream
            peerConnection.ontrack = event => {
                remoteStream = event.streams[0];
                remoteVideo.srcObject = remoteStream;
            };

            // Handle ICE candidates
            peerConnection.onicecandidate = event => {
                if (event.candidate) {
                    socket.emit('candidate', event.candidate);
                }
            };

            // Create and send offer
            peerConnection.createOffer()
                .then(offer => {
                    peerConnection.setLocalDescription(offer);
                    socket.emit('offer', { offer });
                });
        })
        .catch(error => console.error("Error accessing media devices.", error));
});

// Listen for WebRTC signaling messages
socket.on('offer', data => {
    peerConnection = new RTCPeerConnection(iceServers);

    // Add local stream to the peer connection
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    // Handle remote stream
    peerConnection.ontrack = event => {
        remoteStream = event.streams[0];
        remoteVideo.srcObject = remoteStream;
    };

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit('candidate', event.candidate);
        }
    };

    // Set remote description and create answer
    peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer))
        .then(() => peerConnection.createAnswer())
        .then(answer => {
            peerConnection.setLocalDescription(answer);
            socket.emit('answer', { answer });
        });
});

socket.on('answer', data => {
    peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
});

socket.on('candidate', data => {
    peerConnection.addIceCandidate(new RTCIceCandidate(data));
});
