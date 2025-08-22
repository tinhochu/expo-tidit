export const POST_TYPES = {
  JUST_SOLD: 'Just Sold',
  JUST_LISTED: 'Just Listed',
  JUST_RENTED: 'Just Rented',
  OPEN_HOUSE: 'Open House',
  UNDER_CONTRACT: 'Under Contract',
  BACK_ON_MARKET: 'Back on Market',
}

export const getPostTypeLabel = (postType: string) => {
  return POST_TYPES[postType as keyof typeof POST_TYPES]
}

export const getPostTypeValue = (postType: string) => {
  return Object.keys(POST_TYPES).find((key) => POST_TYPES[key as keyof typeof POST_TYPES] === postType)
}
