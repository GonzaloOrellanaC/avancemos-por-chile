const recentViewEvents = new Map<string, number>();

export function shouldTrackView(key: string, cooldownMs = 5000) {
  const now = Date.now();
  const lastTrackedAt = recentViewEvents.get(key);

  if (typeof lastTrackedAt === 'number' && now - lastTrackedAt < cooldownMs) {
    return false;
  }

  recentViewEvents.set(key, now);
  return true;
}