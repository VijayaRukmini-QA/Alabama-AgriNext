/** Unique throwaway address on yopmail (public inbox: never put anything sensitive in it). */
export function uniqueYopmailEmail(prefix = 'agcustomer'): string {
  return `${prefix}${Date.now()}@yopmail.com`;
}

/** Yopmail inbox (login) name = local part of the address. */
export function inboxName(email: string): string {
  return email.split('@')[0];
}
