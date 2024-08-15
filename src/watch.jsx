// import React, { useRef, useEffect } from 'react';
// import io from 'socket.io-client';
// import adapter from 'webrtc-adapter';

// const socket = io('http://172.20.10.3:8000'); // Замените IP-адрес на адрес вашего сервера

// function Watch() {
//   const videoRef = useRef(null);
//   const peerRef = useRef(null);

//   useEffect(() => {
//     const peer = new RTCPeerConnection();

//     // Отправка сигнала на сервер
//     peer.onicecandidate = (event) => {
//       if (event.candidate) {
//         socket.emit('signal', {
//           type: 'candidate',
//           candidate: event.candidate,
//         });
//       }
//     };

//     // Получение сигнала от сервера
//     socket.on('signal', async (data) => {
//       try {
//         if (peer.signalingState === 'closed') return; // Проверка состояния подключения

//         if (data.type === 'offer') {
//           if (peer.signalingState !== 'stable') {
//             console.warn('Ignoring offer as signaling state is not stable');
//             return;
//           }

//           await peer.setRemoteDescription(new RTCSessionDescription(data.offer));
//           const answer = await peer.createAnswer();
//           await peer.setLocalDescription(answer);
//           socket.emit('signal', {
//             type: 'answer',
//             answer: peer.localDescription,
//           });
//         } else if (data.type === 'answer') {
//           if (peer.signalingState !== 'have-local-offer') {
//             console.warn('Ignoring answer as signaling state is not correct');
//             return;
//           }

//           await peer.setRemoteDescription(new RTCSessionDescription(data.answer));
//         } else if (data.type === 'candidate') {
//           await peer.addIceCandidate(new RTCIceCandidate(data.candidate));
//         }
//       } catch (error) {
//         console.error('Error handling signal:', error);
//       }
//     });

//     // Обработка входящего потока и установка его в video элемент
//     peer.ontrack = (event) => {
//       if (videoRef.current) {
//         videoRef.current.srcObject = event.streams[0];
//       }
//     };

//     peerRef.current = peer;

//     // Очистка при размонтировании компонента
//     return () => {
//       if (peerRef.current) {
//         peerRef.current.close();
//         peerRef.current = null;
//       }
//     };
//   }, []);

//   return (
//     <div>
//       <h2>Watch Stream</h2>
//       <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: 'auto' }} />
//     </div>
//   );
// }

// export default Watch;






import React, { useRef, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://172.20.10.3:8000'); // Замените IP-адрес на адрес вашего сервера

function Watch() {
  const videoRef = useRef(null);
  const [connected, setConnected] = useState(false);

  // Функция для подключения к трансляции
  const connectToStream = async () => {
    const peer = new RTCPeerConnection();

    // Отправка ICE кандидатов на сервер
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('signal', {
          type: 'candidate',
          candidate: event.candidate,
        });
      }
    };

    // Обработка входящих ICE кандидатов
    socket.on('signal', async (data) => {
      try {
        if (peer.signalingState === 'closed') {
          console.warn('RTCPeerConnection is closed');
          return;
        }

        if (data.type === 'offer') {
          await peer.setRemoteDescription(new RTCSessionDescription(data.offer));
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          socket.emit('signal', {
            type: 'answer',
            answer: peer.localDescription,
          });
        } else if (data.type === 'answer') {
          await peer.setRemoteDescription(new RTCSessionDescription(data.answer));
        } else if (data.type === 'candidate') {
          if (peer.remoteDescription) {
            await peer.addIceCandidate(new RTCIceCandidate(data.candidate));
          }
        }
      } catch (error) {
        console.error('Error handling signal:', error);
      }
    });

    // Обработка входящего потока и установка его в video элемент
    peer.ontrack = (event) => {
      if (videoRef.current) {
        videoRef.current.srcObject = event.streams[0];
      }
    };

    setConnected(true);
  };

  return (
    <div>
      <h2>Watch Stream</h2>
      <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: 'auto' }} />
      {!connected && <button onClick={connectToStream}>Connect to Stream</button>}
    </div>
  );
}

export default Watch;

