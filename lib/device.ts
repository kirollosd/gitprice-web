/** Optional client hints when the UA string alone is ambiguous. */
export type DeviceHints = {
  coarsePointer?: boolean;
  maxTouchPoints?: number;
  /** CSS pixels; used with coarse pointer as a phone fallback. */
  viewportWidth?: number;
};

const PHONE_UA = /iphone|ipod|android.+mobile|windows phone|mobile(?!.*ipad)/i;
const TABLET_UA = /ipad|android(?!.+mobile)|tablet/i;

/**
 * Phone vs desktop from User-Agent, with an optional coarse-pointer + narrow-viewport fallback
 * for ambiguous bots / desktop-mode phones. iPad and other tablets count as desktop (CWS CTA).
 */
export function isPhoneUserAgent(ua: string, hints?: DeviceHints): boolean {
  const s = ua ?? "";
  if (PHONE_UA.test(s) && !TABLET_UA.test(s)) return true;
  if (TABLET_UA.test(s)) return false;
  if (hints?.coarsePointer && (hints.maxTouchPoints ?? 0) > 0 && (hints.viewportWidth ?? Infinity) < 768) {
    return true;
  }
  return false;
}
