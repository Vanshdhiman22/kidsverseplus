import React, { useLayoutEffect, useRef, useState } from 'react'
import { Check, Lock, MapPin, ArrowRight } from 'lucide-react'
import { ILLUSTRATED_WORLD_KEYS, illustratedWorld, illustratedRoadPoint } from '../lib/illustrated-journey.js'
import './IllustratedStationWorld.css'

export default function IllustratedStationWorld({ subject, cloud, parked, selected, trip, engineEffects, reduced, onArrive, onVisit, onNextCloud, visible=true, onFallback, loading=false, error='' }) {
  const world=illustratedWorld(subject), route=world.route
  const car=useRef(null),position=useRef(route.stops[parked]??route.stops[0])
  const latest=useRef(onArrive);latest.current=onArrive
  const [failed,setFailed]=useState({})
  const [loaded,setLoaded]=useState({})
  const initialSubject=useRef(world.key)

  useLayoutEffect(()=>{
    position.current=route.stops[parked]??route.stops[0]
  },[world.key,cloud.offset])

  useLayoutEffect(()=>{
    let cancelled=false,frame=0
    const paint=distance=>{
      position.current=distance
      const point=illustratedRoadPoint(route,distance)
      const forward=illustratedRoadPoint(route,Math.min(100,distance+.12))
      const backward=illustratedRoadPoint(route,Math.max(0,distance-.12))
      const reverse=trip && (trip.gate?100:route.stops[trip.index]) < from
      const dx=(forward.x-backward.x)*(reverse?-1:1),dy=(forward.y-backward.y)*(reverse?-1:1)
      if(car.current) {
        car.current.style.left=`${point.x/10}%`
        car.current.style.top=`${point.y/6}%`
        car.current.style.setProperty('--car-facing',dx<0?'-1':'1')
        car.current.style.setProperty('--car-tilt',`${Math.max(-12,Math.min(12,Math.atan2(dy,Math.abs(dx))*180/Math.PI))}deg`)
      }
    }
    const from=position.current
    if(!trip){paint(route.stops[parked]??route.stops[0]);return}
    const destination=trip.gate?100:route.stops[trip.index]
    const duration=reduced?0:Math.min(3600,Math.max(950,Math.abs(destination-from)*48))
    const start=performance.now()
    const arrive=()=>{if(!cancelled)latest.current(trip)}
    if(!duration){paint(destination);queueMicrotask(arrive)}
    else {
      const tick=now=>{
        if(cancelled)return
        const t=Math.min(1,(now-start)/duration),e=t*t*(3-2*t)
        paint(from+(destination-from)*e)
        if(t<1)frame=requestAnimationFrame(tick)
        else arrive()
      }
      frame=requestAnimationFrame(tick)
    }
    return()=>{cancelled=true;cancelAnimationFrame(frame)}
  },[route,parked,trip?.id,reduced])

  const parkedPoint=illustratedRoadPoint(route,route.stops[parked]??route.stops[0])
  return <div className="illustrated-town" data-world={world.key} data-animations={engineEffects&&!reduced&&visible?'on':'off'}
    style={{'--badge-offset':`${world.badge/6}cqh`,'--lock-offset':`${world.lock/6}cqh`}}>
    <div className="illustrated-town__preview" style={{backgroundImage:`url('${world.thumb}')`}} aria-hidden="true" />
    {ILLUSTRATED_WORLD_KEYS.map(key=>{
      const art=illustratedWorld(key)
      return <img key={key} className={`illustrated-town__art ${key===world.key?'is-active':''} ${loaded[key]?'is-ready':''}`} src={art.art} width="1626" height="968" alt="" aria-hidden="true" draggable="false" decoding="async" fetchPriority={key===initialSubject.current?'high':'low'}
        onLoad={()=>setLoaded(old=>old[key]?old:{...old,[key]:true})} onError={()=>setFailed(old=>({...old,[key]:true}))} />
    })}
    <div key={world.key} className="illustrated-town__content">
    <div className="illustrated-town__sunlight" aria-hidden="true" />
    {world.glints.map(([x,y],i)=><span key={i} className="illustrated-town__water" style={{left:`${x/10}%`,top:`${y/6}%`,'--delay':`${i*-2}s`}} aria-hidden="true"/>)}
    {cloud.stations.map((station,index)=>{
      const [x,y]=world.signs[index]
      return <button key={station.number} type="button" className={`illustrated-town__station ${station.available?'is-published':'is-future'} ${station.completed?'is-complete':''} ${index===selected&&station.available?'is-current':''}`}
        style={{left:`clamp(8.5%,${x/10}%,91.5%)`,top:`${y/6}%`}}
        disabled={!station.available} onClick={()=>onVisit(index)} aria-current={index===selected&&station.available?'location':undefined}
        aria-label={`${station.available?'Open':loading?'Loading topic':error?'Unavailable station':'Coming soon, station'} ${station.number}${station.available?`: ${station.name}`:''}${station.completed?', completed':''}`}
        title={station.available?station.name:loading?'Loading your topics.':error?'Your topics could not load. Please try again.':'Topics will appear when they are published.'}>
        <span className="illustrated-town__number" aria-hidden="true">{String(station.number).padStart(2,'0')}</span>
        <span className="illustrated-town__sign" aria-hidden="true">{station.completed&&<Check size={13}/>}<span>{station.available?station.name:loading?'Loading…':error?'Unavailable':'Coming soon'}</span>{station.available&&<ArrowRight size={12}/>}</span>
        {!station.available&&!loading&&<span className="illustrated-town__lock" aria-hidden="true"><Lock size={17}/></span>}
      </button>
    })}
    <button ref={car} type="button" className={`illustrated-town__car ${trip?'is-driving':''}`} style={{left:`${parkedPoint.x/10}%`,top:`${parkedPoint.y/6}%`}}
      disabled={!cloud.available} onClick={()=>onVisit(selected)} aria-label={cloud.available?"Explore the topic at your car":"Nova’s preview car"}>
      <span className="illustrated-town__car-shadow" aria-hidden="true"/>
      <span className="illustrated-town__vehicle"><span className="illustrated-town__smoke" aria-hidden="true">{[0,1,2,3].map(i=><i key={i} style={{'--puff':i}}/>)}</span><img src="/art/journey-car.webp" width="540" height="489" alt="" draggable="false" decoding="async" /></span>
      <span className="illustrated-town__location"><MapPin size={12} fill="currentColor" aria-hidden="true"/>{!cloud.available?'Nova’s ride':trip?'On the way':'You are here'}</span>
    </button>
    <button type="button" className={`illustrated-town__gate ${cloud.canGoNext?'is-open':''}`} style={{left:`${world.gate[0]/10}%`,top:`${world.gate[1]/6}%`}} disabled={!cloud.canGoNext} onClick={onNextCloud} aria-label={`Phase ${cloud.phase+1}. ${cloud.canGoNext?'Drive to the next cloud':'Complete all ten topics to unlock'}`}>
      <strong>Phase {cloud.phase+1}</strong><span>{cloud.canGoNext?'Next cloud is ready!':'Complete 10 to unlock'}</span>
    </button>
    {failed[world.key]&&<div className="illustrated-town__fallback" role="status"><span>Your topics are ready to explore.</span><button type="button" onClick={onFallback}>Open topics <ArrowRight size={16}/></button></div>}
    </div>
  </div>
}
