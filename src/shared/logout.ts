export function handleLogoutFlow(
  callerSource: MessageEventSource, 
  callerOrigin: string, 
  cleanupTask: () => Promise<void>
) {
  const channel = new BroadcastChannel('aurion-session-bus');
  let responded = false;
  const requestId = Math.random().toString(36).substring(2);

  const cleanupAndClose = () => {
    clearTimeout(timeoutId);
    channel.removeEventListener('message', handleMessage);
    channel.close();
  };

  const handleMessage = (msgEvent: MessageEvent) => {
    if (msgEvent.data?.type === 'RESPONSE_LOGOUT_REQUEST' && msgEvent.data.requestId === requestId) {
      responded = true;
      cleanupAndClose();
      callerSource.postMessage({ type: 'LOGOUT_SUCCESS' }, { targetOrigin: callerOrigin });
    }
  };

  channel.addEventListener('message', handleMessage);
  channel.postMessage({ type: 'LOGOUT_REQUEST', requestId });

  const timeoutId = setTimeout(async () => {
    if (!responded) {
      cleanupAndClose();
      try {
        await cleanupTask();
      } catch (err) {
        console.error('Erreur lors du nettoyage :', err);
      } finally {
        callerSource.postMessage({ type: 'LOGOUT_SUCCESS' }, { targetOrigin: callerOrigin });
      }
    }
  }, 1500);
}