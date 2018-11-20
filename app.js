'use strict';

const videoElement = document.getElementById('video');

let extensionInstalled = false;

document.getElementById('start').addEventListener('click', function() {
  // send screen-sharer request to content-script
  if (!extensionInstalled) {
    let message = 'Please install the extension:\n' +
        '1. Go to chrome://extensions\n' +
        '2. Check: "Enable Developer mode"\n' +
        '3. Click: "Load the unpacked extension..."\n' +
        '4. Choose "extension" folder from the repository\n' +
        '5. Reload this page';
    alert(message);
  }
  window.postMessage({type: 'SS_UI_REQUEST', text: 'start'}, '*');
});

// listen for messages from the content-script
window.addEventListener('message', function(event) {
//  if (event.origin !== window.location.origin) {
//    return;
//  }

  // content-script will send a 'SS_PING' msg if extension is installed
  if (event.data.type && (event.data.type === 'SS_PING')) {
    extensionInstalled = true;
  }

  // user chose a stream
  if (event.data.type && (event.data.type === 'SS_DIALOG_SUCCESS')) {
    startScreenStreamFrom(event.data.streamId);
  }

  // user clicked on 'cancel' in choose media dialog
  if (event.data.type && (event.data.type === 'SS_DIALOG_CANCEL')) {
    console.log('User cancelled!');
  }
});

let localStream = null;

function handleSuccess(screenStream) {
  localStream = screenStream;
  call();
//  videoElement.srcObject = screenStream;
//  videoElement.play();
}

function handleError(error) {
  console.log('getUserMedia() failed: ', error);
}

function startScreenStreamFrom(streamId) {
  let constraints = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: streamId,
        maxWidth: window.screen.width,
        maxHeight: window.screen.height
      }
    }
  };
  navigator.mediaDevices.getUserMedia(constraints).
      then(handleSuccess).catch(handleError);
}

let servers = {};

const offerOptions = {
  offerToReceiveAudio: 1,
  offerToReceiveVideo: 1,
};

let local_peer = new RTCPeerConnection(servers);
let remote_peer = new RTCPeerConnection(servers);

function call() {

  local_peer.onicecandidate = function(event){
    if(!event.candidate)
      return;
    remote_peer.addIceCandidate(event.candidate)
      .then(()=>{
        console.log('AddIceCandidate success.');
      }, (err)=>{
        console.error('AddIceCandidate failed.' + err);
      });
  };


  remote_peer.onicecandidate = function(event){
    if(!event.candidate)
      return;
    local_peer.addIceCandidate(event.candidate)
      .then(()=>{
        console.log('AddIceCandidate success.');
      }, (err)=>{
        console.error('AddIceCandidate failed.' + err);
      });
  };

  remote_peer.ontrack = function(evt){
    videoElement.srcObject = evt.streams[0];
    videoElement.play();
  };

  localStream.getTracks().forEach(track=> local_peer.addTrack(track, localStream));

  local_peer.createOffer()
    .then((session_desc)=>{

      local_peer.setLocalDescription(session_desc)
        .then(()=>{
          console.log("setLocalDescription success");
        })
        .catch((err)=>{
          console.error("setLocalDescription faild: " + err);
        });

      remote_peer.setRemoteDescription(session_desc)
        .then(()=>{
          console.log("setRemoteDescription success");
        })
        .catch((err)=>{
          console.error("setRemoteDescription faild: " + err);
        });

      remote_peer.createAnswer()
        .then((description)=>{

        remote_peer.setLocalDescription(description)
          .then(()=>{
            console.log("setLocalDescription success");
          })
          .catch((err)=>{
            console.error("setLocalDescription faild: " + err);
          });

        local_peer.setRemoteDescription(description)
          .then(()=>{
            console.log("setRemoteDescription success");
          })
          .catch((err)=>{
            console.error("setRemoteDescription faild: " + err);
          });
      });
    });
}
 