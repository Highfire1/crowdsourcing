// Centralized handling of AI/fake user IDs used in the application
export const AI_USER_IDS = {
  GEMINI_PRO: 'b8ac96f0-90ba-52ef-9682-2df39ace553e',
} as const

export const AI_USER_DISPLAY_NAMES = {
  [AI_USER_IDS.GEMINI_PRO]: 'gemini-pro',
} as const

export function isAIUser(userId: string | null | undefined): boolean {
  if (!userId) return false
  return (Object.values(AI_USER_IDS) as string[]).includes(userId)
}

export function getAIUserDisplayName(userId: string): string | null {
  return AI_USER_DISPLAY_NAMES[userId as keyof typeof AI_USER_DISPLAY_NAMES] || null
}

export function filterRealUserIds(userIds: (string | null)[]): string[] {
  return userIds.filter((id): id is string => id !== null && !isAIUser(id))
}

export function mapAIUsers(userIds: (string | null)[]): Record<string, string> {
  const userMap: Record<string, string> = {}
  
  userIds.forEach(id => {
    if (id && isAIUser(id)) {
      const displayName = getAIUserDisplayName(id)
      if (displayName) {
        userMap[id] = displayName
      }
    }
  })
  
  return userMap
}