const districts={
  maths:{name:'Geometry Gardens',kind:'geometry',roof:'#a478ef',side:'#7946bf',wall:'#fff5e7',land:'#d4eac8'},
  literacy:{name:'Storybook Borough',kind:'stories',roof:'#f098ae',side:'#c96c8c',wall:'#fff5db',land:'#f0e1be'},
  evs:{name:'Wildleaf Reserve',kind:'nature',roof:'#69c8a8',side:'#3c987f',wall:'#e9fff4',land:'#c0e3b4'},
  computer:{name:'Circuit City',kind:'technology',roof:'#67d3ec',side:'#258ba8',wall:'#d8eef6',land:'#24354d'},
  general:{name:'Discovery Harbour',kind:'discovery',roof:'#8bb8ee',side:'#547eb8',wall:'#fff7e6',land:'#e8e6bd'},
}
export const stationDistrict=subject=>districts[subject]||districts.general
