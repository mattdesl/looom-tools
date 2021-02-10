import { writable, get as getStoreData } from 'svelte/store';
import { getContext, setContext } from 'svelte';

export const KEY = {};

export function getTarget () {
  return getContext(KEY);
}

export function createTarget () {
  const store = writable(undefined);
  store.get = () => getStoreData(store);
  setContext(KEY, store);
  return store;
}
