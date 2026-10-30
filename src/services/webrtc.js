export function createStreamPeerConnection() {
  const iceServers = [{ urls: import.meta.env.VITE_STUN_URL || 'stun:stun.l.google.com:19302' }]
  const turnUrl = import.meta.env.VITE_TURN_URL
  if (turnUrl) {
    iceServers.push({
      urls: turnUrl.split(',').map((url) => url.trim()).filter(Boolean),
      username: import.meta.env.VITE_TURN_USERNAME,
      credential: import.meta.env.VITE_TURN_CREDENTIAL,
    })
  }
  return new RTCPeerConnection({ iceServers })
}