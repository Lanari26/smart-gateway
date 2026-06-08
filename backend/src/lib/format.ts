/** Presentation helpers shared by the resource DTO mappers. */

const DATE_TIME = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const DATE = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: '2-digit',
  year: 'numeric',
});

/** e.g. "Jun 08, 2026, 03:24 PM" */
export const formatDateTime = (d: Date): string => DATE_TIME.format(d);

/** e.g. "Jun 08, 2026" */
export const formatDate = (d: Date): string => DATE.format(d);

/** First letter of a name, uppercased; falls back to '?'. */
export const avatarLetter = (name: string): string =>
  (name.trim().charAt(0) || '?').toUpperCase();
