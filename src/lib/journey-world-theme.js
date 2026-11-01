const themes = {
  maths: { label: 'Mathematics', description: 'A new discovery around every bend.', accent: '#6941df', bright: '#a48aff', tint: '#ede8ff', sky: '#edf2ff', icon: 'maths', art: '/art/world-maths.webp', sceneFilter: 'none' },
  literacy: { label: 'English', description: 'Big stories begin with little discoveries.', accent: '#ad4b22', bright: '#e7ad55', tint: '#fff0db', sky: '#fff7ed', icon: 'books', art: '/art/world-literacy.webp', sceneFilter: 'hue-rotate(-12deg) saturate(.88)' },
  evs: { label: 'EVS / Science', description: 'Follow your curiosity into the natural world.', accent: '#12745d', bright: '#53bd8d', tint: '#dcf6e9', sky: '#edf9f3', icon: 'nature', art: '/art/world-evs.webp', sceneFilter: 'hue-rotate(-8deg) saturate(1.08)' },
  computer: { label: 'Computer', description: 'Explore, think and build something brilliant.', accent: '#126b9f', bright: '#54c8ed', tint: '#e0f4ff', sky: '#edf8ff', icon: 'technology', art: '/art/world-computer.webp', sceneFilter: 'hue-rotate(18deg) saturate(.9)' },
  general: { label: 'General Awareness', description: 'There is a whole world waiting to be discovered.', accent: '#97620b', bright: '#edc35a', tint: '#fff3cd', sky: '#fff9e9', icon: 'discovery', art: '/art/world-general.webp', sceneFilter: 'sepia(.09) saturate(.95)' },
}

// Visual themes only. Topic IDs, publication and progress still come from the API.
export function journeyWorldTheme(subject, subjectName) {
  return themes[subject] || { ...themes.general, label: subjectName || 'Learning', description: 'Choose a topic. Let your next adventure begin.' }
}
