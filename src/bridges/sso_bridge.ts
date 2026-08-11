import { ORIGINS } from '../shared/constants';
import { writeKV } from '../shared/db';

window.addEventListener('message', async (event) => {
  if (event.origin !== ORIGINS.SSO && event.origin !== ORIGINS.WEBMAIL) return;

  if (event.data?.type === 'WRITE_SSO_TOKEN' && event.data.token && event.source) {
    try {
      await writeKV('AurionAuth', 'keys', 'token', event.data.token);
      event.source.postMessage({ type: 'WRITE_SUCCESS' }, { targetOrigin: event.origin });
    } catch (error) {
      event.source.postMessage({ type: 'WRITE_ERROR', error: String(error) }, { targetOrigin: event.origin });
    }
  }
});