// Authored local battle fixtures, deliberately separate from the test bank.
const raw={
 literacy:[['Mia finds a lost puppy and takes it home. Who finds the puppy?',['Mia','The puppy','Nova'],'Mia'],['The kite flies high. What flies?',['A kite','A train','A boat'],'A kite'],['A story says the garden is quiet. Which word describes the garden?',['Quiet','Garden','Says'],'Quiet']],
 evs:[['Which one is living?',['A plant','A stone','A spoon'],'A plant'],['Which does a plant need to grow?',['Water','Plastic','Paint'],'Water'],['Which animal can fly?',['A sparrow','A fish','An earthworm'],'A sparrow']],
 computer:[['What should you do before typing in a document?',['Open the document','Turn off the computer','Unplug the screen'],'Open the document'],['Which device helps you type letters?',['Keyboard','Speaker','Monitor'],'Keyboard'],['Which is a sensible order?',['Open, type, save','Save, close, type','Close, save, open'],'Open, type, save']],
 general:[['Who helps put out fires?',['Firefighter','Baker','Tailor'],'Firefighter'],['Who helps us learn in school?',['Teacher','Pilot','Farmer'],'Teacher'],['Who grows food on a farm?',['Farmer','Dentist','Driver'],'Farmer']]
}
export const battleFixtures=Object.fromEntries(Object.entries(raw).map(([subject,rows])=>[subject,rows.map(([instruction,options,answer])=>({instruction,options:options.map(label=>({key:label,label})),answer}))]))
