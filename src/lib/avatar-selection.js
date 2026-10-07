export function selectApiAvatar(profile, characters, items) {
  const face=Number(profile.face) || 1
  const character=characters.find(c=>c.slug===`explorer-${face}`) || characters[face-1]
  const slug=profile.outfit || 'explorer'
  const outfit=items.find(i=>i.category==='outfit' && i.slug===slug)
    || items.find(i=>i.category==='outfit' && slug==='explorer' && i.slug==='explorers-jacket')
  if(!character || !outfit)throw new Error('This avatar is not available in the API catalog. Choose a supported avatar.')
  return {character_id:character.id,outfit_item_id:outfit.id}
}
