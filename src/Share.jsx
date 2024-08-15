import React, { useRef, useEffect } from 'react';
import io from 'socket.io-client';
import Peer from 'simple-peer';

const socket = io('http://172.20.10.3:8000'); // Замените YOUR_SERVER_IP на ваш IP

function Share() {
  const videoRef = useRef(null);
  const peerRef = useRef(null);

  useEffect(() => {
    async function startScreenShare() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        console.error('getDisplayMedia API is not supported in this browser');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false, // Можно включить, если хотите передавать системное аудио
        });

        videoRef.current.srcObject = stream;

        const peer = new Peer({
          initiator: window.location.hash === '#1',
          trickle: false,
          stream: stream,
        });

        peer.on('signal', (data) => {
          socket.emit('signal', data);
        });

        socket.on('signal', (data) => {
          peer.signal(data);
        });

        peer.on('stream', (remoteStream) => {
          videoRef.current.srcObject = remoteStream;
        });

        peerRef.current = peer;

        console.log('я подключился к серверу, ')
      } catch (err) {
        console.error('Error accessing display media:', err);
      }
    }

    startScreenShare();
  }, []);

  return (
    <div>
      <h2>Screen Sharing</h2>
      <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: 'auto' }} />
    </div>
  );
}

export default Share;
