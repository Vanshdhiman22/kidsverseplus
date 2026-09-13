const q = (question, options, answer, explanation) => ({ question, options, answer, explanation, xp: 10, marks: 1, novaFeedback: 'Great thinking!' })

const SUBJECTS = {
  literacy: {
    curriculum: { grade: 'Grade 1', board: 'CBSE', subject: 'Literacy', topic: 'Story Comprehension' },
    concept: { name: 'Understanding a Story', learning_objective: 'Find the character, action and main idea in a short story.' },
    icon: '📖', teaching: 'Read one sentence at a time. Notice who the sentence is about, what happens, and the most important idea.',
    example: 'Maya sees a small bird. She gives it water. Maya is helping the bird.', rule: 'Ask: Who is it about? What happened? What is the big idea?',
    learn: [q('Maya gives water to a small bird. Who is helping?', ['The bird','Maya','A teacher','Nova'], 'Maya', 'Maya is the person who gives the water.'), q('The red kite flew high in the sky. What flew high?', ['A bird','A plane','The kite','A cloud'], 'The kite', 'The sentence tells us that the kite flew high.'), q('Ravi planted a seed and watered it every day. What is the main idea?', ['Ravi lost a toy','Ravi cared for a seed','It was raining','The seed could talk'], 'Ravi cared for a seed', 'Planting and watering show that Ravi cared for the seed.')],
    test: [q('Sara opened her umbrella because it was raining. Why did Sara open it?', ['It was sunny','It was raining','She was sleeping','She was reading'], 'It was raining', 'The sentence gives the reason.'), q('Which word names a person?', ['Teacher','Jump','Blue','Quickly'], 'Teacher', 'A teacher is a person.'), q('The puppy wagged its tail. Which animal is in the sentence?', ['Cat','Puppy','Horse','Fish'], 'Puppy', 'The sentence is about a puppy.'), q('Which sentence is complete?', ['The happy','Runs very','Aman reads a book.','Under the'], 'Aman reads a book.', 'It tells who and what happened.'), q('Mina packed lunch before school. What happened first?', ['She went home','She packed lunch','She slept','She played'], 'She packed lunch', 'The word before tells the order.')],
  },
  evs: {
    curriculum: { grade: 'Grade 1', board: 'CBSE', subject: 'EVS / Science', topic: 'Living Things' },
    concept: { name: 'Living and Non-living', learning_objective: 'Recognise living things by what they need and do.' },
    icon: '🌱', teaching: 'Living things need air, water and food. They grow and change. Non-living things do not grow by themselves.',
    example: 'A plant starts as a seed, drinks water and grows new leaves. A stone does not grow.', rule: 'If it needs food or water and grows, it is living.',
    learn: [q('Which one is a living thing?', ['Rock','Plant','Chair','Ball'], 'Plant', 'A plant grows and needs water.'), q('What does a plant need to grow?', ['Water','Plastic','Paint','A television'], 'Water', 'Plants need water to live and grow.'), q('Which one cannot grow by itself?', ['Puppy','Tree','Stone','Butterfly'], 'Stone', 'A stone is non-living.')],
    test: [q('Which body part helps us smell?', ['Eyes','Nose','Ears','Hands'], 'Nose', 'We smell with our nose.'), q('Which animal lives in water?', ['Fish','Lion','Camel','Dog'], 'Fish', 'Fish live in water.'), q('What do we get from the Sun?', ['Light and heat','Rain only','Milk','Soil'], 'Light and heat', 'The Sun gives Earth light and heat.'), q('Which part of a plant is usually under the soil?', ['Flower','Leaf','Root','Fruit'], 'Root', 'Roots hold the plant and take in water.'), q('Which is good for keeping our surroundings clean?', ['Throwing wrappers','Using a bin','Wasting water','Breaking plants'], 'Using a bin', 'A bin keeps waste in the correct place.')],
  },
  computer: {
    curriculum: { grade: 'Grade 1', board: 'CBSE', subject: 'Computer', topic: 'Sequences' },
    concept: { name: 'Steps and Sequences', learning_objective: 'Put instructions in the correct order for a computer.' },
    icon: '💻', teaching: 'A sequence is a list of steps in order. Computers follow each instruction exactly, so every step must be clear.',
    example: 'To draw a square: move forward, turn, and repeat until all four sides are complete.', rule: 'Start at step one, follow the order, and check the result.',
    learn: [q('What should you do first to start a computer?', ['Turn on power','Open a game','Print a page','Move the mouse'], 'Turn on power', 'Power must be on before programs can run.'), q('Which device helps you type words?', ['Keyboard','Speaker','Monitor','Printer'], 'Keyboard', 'A keyboard has keys for typing.'), q('A robot moves forward, then turns right. Which action is second?', ['Move forward','Turn right','Stop first','Jump'], 'Turn right', 'The second step is turn right.')],
    test: [q('Which device shows pictures and text?', ['Monitor','Mouse','Microphone','Keyboard'], 'Monitor', 'The monitor is the screen.'), q('Which device moves the pointer?', ['Printer','Mouse','Speaker','Camera'], 'Mouse', 'A mouse controls the pointer.'), q('What is a set of ordered steps called?', ['Sequence','Colour','Sound','Folder'], 'Sequence', 'A sequence keeps steps in order.'), q('Which is a safe computer habit?', ['Share passwords','Keep water away','Hit the keys','Open every link'], 'Keep water away', 'Liquids can damage devices.'), q('What does a speaker produce?', ['Sound','Paper','Light only','Letters'], 'Sound', 'Speakers play sound.')],
  },
  general: {
    curriculum: { grade: 'Grade 1', board: 'CBSE', subject: 'General Awareness', topic: 'Our Community' },
    concept: { name: 'People Who Help Us', learning_objective: 'Recognise community helpers and safe everyday choices.' },
    icon: '🏘️', teaching: 'A community is made of people who live and work together. Different helpers keep us healthy, safe and connected.',
    example: 'A doctor helps us when we are sick. A firefighter helps during a fire. A teacher helps us learn.', rule: 'Think about the job, then choose the helper trained to do it.',
    learn: [q('Who helps us when we are sick?', ['Doctor','Pilot','Artist','Farmer'], 'Doctor', 'Doctors help care for sick people.'), q('Who teaches children at school?', ['Chef','Teacher','Driver','Tailor'], 'Teacher', 'Teachers help children learn.'), q('Which light means stop?', ['Green','Yellow','Red','Blue'], 'Red', 'A red traffic light means stop.')],
    test: [q('Who puts out fires?', ['Firefighter','Dentist','Shopkeeper','Painter'], 'Firefighter', 'Firefighters respond to fires.'), q('Where should we cross a busy road?', ['Anywhere','Zebra crossing','Between cars','At a turn'], 'Zebra crossing', 'A zebra crossing is marked for pedestrians.'), q('Which is India’s national flag?', ['Tricolour','All blue','All red','Black and white'], 'Tricolour', 'India’s flag has saffron, white and green bands.'), q('Who grows crops for us?', ['Farmer','Doctor','Teacher','Pilot'], 'Farmer', 'Farmers grow food crops.'), q('What should you do before eating?', ['Wash hands','Touch the floor','Run outside','Hide food'], 'Wash hands', 'Clean hands help prevent germs spreading.')],
  },
}

export function subjectDemoRaw(subject) {
  const data = SUBJECTS[subject]
  if (!data) return null
  const learning = { teaching_method: data.teaching, explanation: data.example, hints: [data.teaching.split('.')[0] + '.', data.example, data.rule], nova_script: `Let’s explore ${data.concept.name} together!`, nova_feedback: data.rule, image_url: `/art/world-${subject}.webp`, image_alt: `${data.concept.name} learning world` }
  return { curriculum: data.curriculum, concept: data.concept, theme_interest: 'Everyday Life', learning_content: learning, check_for_understanding: data.learn, test_questions: { one_time: false, questions: data.test }, battle_questions: data.test.slice(0, 3), challenge: { one_time: false, questions: data.test.slice(2, 3) } }
}
