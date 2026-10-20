import type { TFunction } from '../i18n/useT';
import { useUi } from '../store/useUi';
import type { Wheel } from '../types';
import { shareUrl } from './share';

/** Shares the wheel: the native share sheet on touch devices, otherwise copy to clipboard. */
export async function shareWheel(wheel: Wheel, t: TFunction): Promise<void> {
  const { showToast } = useUi.getState();
  const url = shareUrl(wheel);
  const hasImages = wheel.items.some((i) => i.imageId);
  const note = hasImages ? ` ${t('share.imagesNote')}` : '';

  const touch = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  if (touch && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: 'SpinDecide', text: t('share.text', { name: wheel.name }), url });
      if (hasImages) showToast(t('share.imagesNote'));
      return;
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    showToast(t('share.copied') + note);
  } catch {
    // Put the link in the address bar so it can be copied by hand.
    history.replaceState(null, '', url);
    showToast(t('share.failed'));
  }
}
