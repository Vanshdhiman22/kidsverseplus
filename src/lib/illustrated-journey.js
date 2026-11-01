// Artwork coordinates only. Publication, topic identities and completion stay
// in journey-clouds and the existing API adapters.
export const ILLUSTRATED_WORLD_KEYS = ['maths', 'literacy', 'computer', 'evs', 'general']
export const MAP_SIZE = { width: 1000, height: 600 }

const layouts = {
  maths: {
    signs: [[185,405],[465,409],[680,430],[890,430],[890,258],[665,246],[410,246],[190,240],[265,89],[535,89]],
    parking: [[210,535],[460,527],[680,536],[875,539],[890,345],[665,340],[410,332],[185,326],[265,173],[535,175]],
    gate: [868,85], terminal:[865,174], left:48, right:980, badge:-48, lock:37,
    glints:[[495,590],[785,248]],
  },
  literacy: {
    signs: [[294,511],[500,514],[670,515],[864,511],[823,347],[617,348],[407,340],[215,327],[327,181],[556,181]],
    parking: [[230,551],[495,552],[670,549],[865,547],[825,387],[620,380],[410,367],[210,355],[327,216],[556,218]],
    gate:[861,61], terminal:[855,210], left:110, right:950, badge:-73, lock:-34,
    glints:[[111,332],[710,590]],
  },
  computer: {
    signs: [[140,490],[455,509],[710,524],[934,529],[920,342],[685,325],[447,316],[190,300],[345,163],[610,163]],
    parking: [[160,569],[455,575],[700,582],[910,584],[915,415],[685,394],[447,373],[190,348],[345,214],[610,211]],
    gate:[893,76], terminal:[890,183], left:60, right:990, badge:-85, lock:-32,
    glints:[[505,258],[770,419]],
  },
  evs: {
    signs: [[175,502],[425,527],[626,527],[869,527],[833,329],[607,334],[380,327],[190,322],[260,144],[520,144]],
    parking: [[160,568],[425,579],[625,579],[865,576],[855,390],[620,418],[380,420],[165,400],[260,187],[520,193]],
    gate:[850,64], terminal:[850,195], left:35, right:960, badge:-70, lock:-33,
    glints:[[350,378],[690,155]],
  },
  general: {
    signs: [[321,452],[535,504],[720,504],[887,510],[850,337],[630,340],[402,322],[178,322],[310,144],[558,155]],
    parking: [[315,556],[535,569],[720,568],[890,568],[850,391],[630,391],[402,374],[175,355],[310,199],[558,215]],
    gate:[869,94], terminal:[865,178], left:85, right:975, badge:-66, lock:-28,
    glints:[[95,220],[730,590]],
  },
}

const cache = new Map()
export function illustratedWorld(subject) {
  const key = Object.hasOwn(layouts, subject) ? subject : 'general'
  if (cache.has(key)) return cache.get(key)
  const layout = layouts[key]
  const route = createRoute(layout)
  const world = { ...layout, key, route,
    art:`/art/journey/worlds/${key}-town-v1.webp`,
    thumb:`/art/journey/worlds/${key}-thumb-v1.webp`,
  }
  cache.set(key, world)
  return world
}

function createRoute(layout) {
  const points = layout.parking.map(([x,y])=>({x,y}))
  let current={x:20,y:points[0].y}, length=0
  const samples=[{...current,distance:0}], stops=[]
  function cubic(end,a,b,stop) {
    const start=current
    let previous=start
    for(let step=1;step<=64;step++) {
      const t=step/64,u=1-t
      const p={x:u**3*start.x+3*u*u*t*a.x+3*u*t*t*b.x+t**3*end.x,y:u**3*start.y+3*u*u*t*a.y+3*u*t*t*b.y+t**3*end.y}
      length+=Math.hypot(p.x-previous.x,p.y-previous.y)
      samples.push({...p,distance:length});previous=p
    }
    current=end
    if(stop!==undefined)stops[stop]=length
  }
  const lane=(end,stop)=>cubic(end,{x:current.x+(end.x-current.x)/3,y:current.y},{x:current.x+(end.x-current.x)*2/3,y:end.y},stop)
  points.forEach((point,index)=>{
    if(index===4) {
      const midY=(current.y+point.y)/2
      const edge={x:layout.right,y:midY}
      cubic(edge,{x:layout.right,y:current.y},{x:layout.right,y:midY+35})
      cubic(point,{x:layout.right,y:point.y+35},{x:layout.right-10,y:point.y},index)
    } else if(index===8) {
      const midY=(current.y+point.y)/2
      const edge={x:layout.left,y:midY}
      cubic(edge,{x:layout.left,y:current.y},{x:layout.left,y:midY+30})
      cubic(point,{x:layout.left,y:point.y-5},{x:point.x-85,y:point.y},index)
    } else lane(point,index)
  })
  lane({x:layout.terminal[0],y:layout.terminal[1]})
  return { samples:samples.map(p=>({...p,percent:p.distance/length*100})),stops:stops.map(d=>d/length*100),length }
}

export function illustratedRoadPoint(route, percent) {
  const target=Math.max(0,Math.min(100,Number(percent)||0)),list=route.samples
  let low=0,high=list.length-1
  while(low<high) {const middle=(low+high)>>1;if(list[middle].percent<target)low=middle+1;else high=middle}
  const end=list[low],start=list[Math.max(0,low-1)]
  const t=(target-start.percent)/Math.max(.000001,end.percent-start.percent)
  return {x:start.x+(end.x-start.x)*t,y:start.y+(end.y-start.y)*t}
}
