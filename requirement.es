/*

   Expedition Requirement

 */

import * as et from './estype'
import { throwWith, enumFromTo } from './utils'

// NOTE: certainly if we allow "checkFleet" to return more info
// and allow any rendering method to have access to that info,
// we can give user more details, but there are drawbacks:
// - now that result of "checkFleet" cannot be directly used as if it's a boolean value
// - more i18n stuff means more maintenance effort
// - user rarely needs that much of detail
// so simply put, this doesn't justify the effort.

// every Requirement has the following fields:
// checkFleet: Fleet -> Bool
// data: type and parameter regarding this requirement,
//   type should be the same string that indexed the requirement in Req.
const Req = {}

const onNonEmpty = callback => fleet =>
  fleet.length > 0 && callback(fleet)

Req.FSLevel = level => ({
  checkFleet: onNonEmpty( fleet => fleet[0].level >= level ),
  data: {type: "FSLevel", level},
})


Req.FSType = estypeName => ({
  checkFleet: onNonEmpty( fleet =>
    et.isESType[estypeName](fleet[0].stype)),
  data: {type: "FSType", estype: estypeName},
})

Req.ShipCount = count => ({
  checkFleet: fleet => fleet.length >= count,
  data: {type: "ShipCount", count},
})

// equip -> bool
const isDrum = equip => equip.mstId === 75

// array of number -> number
const sum = arr => arr.reduce((x,y) => x+y, 0)

Req.DrumCarrierCount = count => ({
  checkFleet: fleet =>
    fleet.filter( ship =>
      ship.equips.some( isDrum )).length >= count,
  data: {type: "DrumCarrierCount", count},
})

Req.DrumCount = count => ({
  checkFleet: fleet =>
    sum(fleet.map( ship => ship.equips.filter( isDrum ).length )) >= count,
  data: {type: "DrumCount", count},
})

Req.LevelSum = lvlSum => ({
  checkFleet: fleet =>
    sum(fleet.map( ship => ship.level )) >= lvlSum,
  data: {type: "LevelSum", sum: lvlSum},
})

Req.SparkledCount = count => ({
  checkFleet: fleet =>
    fleet.filter( ship => ship.morale >= 50 ).length >= count,
  data: {type: "SparkledCount", count},
})

Req.ShipTypeCount = (count, etName) => ({
  checkFleet: fleet =>
    fleet.filter( ship =>  et.isESType[etName](ship.stype) ).length >= count,
  data: {type: "ShipTypeCount", count, estype: etName },
})

Req.Morale = morale => ({
  checkFleet: fleet => fleet.every( ship => ship.morale >= morale ),
  data: {type: "Morale", morale},
})

Req.Resupply = {
  checkFleet: fleet => fleet.every( ship => ! ship.needResupply ),
  data: {type: "Resupply"},
}

const renderReqData = data =>
    data.type === "FSLevel" ? `Flagship Level: ${data.level}`
  : data.type === "FSType" ? `Flagship Type: ${data.estype}`
  : data.type === "ShipCount" ? `Ship Count: ${data.count}`
  : data.type === "DrumCarrierCount" ? `Drum Carrier Count: ${data.count}`
  : data.type === "DrumCount" ? `Drum Count: ${data.count}`
  : data.type === "LevelSum" ? `Level Sum: ${data.sum}`
  : data.type === "SparkledCount" ? `Sparkled Ships: ${data.count}`
  : data.type === "ShipTypeCount" ?
      `Fleet should contain ${data.count} ships of type ${data.estype}`
  : data.type === "Morale" ? `Morale: >=${data.morale}`
  : data.type === "Resupply" ? `Fleet Needs Resupply`
  : throwWith (`Req of unknown type ${data.type}, full dump: ${JSON.stringify(data)}`)

// check a nested structure of requirements against a single fleet
// a requirement object is recognized by testing whether "checkFleet" exists
const checkAllReq = obj => fleet => {
  if (Array.isArray( obj ))
    return obj.map( x => checkAllReq(x)(fleet) )

  if (obj.checkFleet)
    return obj.checkFleet(fleet)

  const ret = {}
  for (const k in obj)
    ret[k] = checkAllReq(obj[k])(fleet)
  return ret
}

const collectUnmetReqs = (obj,result) => {
  if (Array.isArray( obj ))
    return [].concat(
      ...obj.map( (x,ind) => collectUnmetReqs(x,result[ind]) ))

  if (obj.checkFleet) {
    return result ? [] : [obj]
  }

  const ret = []
  for (const k in obj)
    ret.push( collectUnmetReqs(obj[k],result[k]) )
  return [].concat(... ret)
}

const mkSTypeReqs = function () {
  if (arguments.length % 2 === 1)
    throw "expecting even number of args"

  const ret = []
  for (let ind = 0; ind < arguments.length; ind += 2) {
    const count = arguments[ind]
    const etName = arguments[ind+1]
    if (! Number.isInteger( count ))
      throw `expecting an int on arg list (offset ${ind})`
    ret.push( Req.ShipTypeCount(count,etName) )
  }
  return ret
}

const expedReqs = (() => {
  const ret = new Array(40+1)

  const basicReqs = [ Req.Resupply ]
  const flagshipLevelAndShipCount = (fsl,sc) =>
    [Req.FSLevel(fsl), Req.ShipCount(sc)]

  // please check out "docs/morale-check.md" for
  // all of the following morale magic numbers

  // world 1

  ret[1] = [
    ...flagshipLevelAndShipCount(1,2),
    ...basicReqs,
    Req.Morale(28),
  ]

  ret[2] = [
    ...flagshipLevelAndShipCount(2,4),
    ...basicReqs,
    Req.Morale(13),
  ]

  ret[3] = [
    ...flagshipLevelAndShipCount(3,3),
    ...basicReqs,
    Req.Morale(22),
  ]

  ret[4] = [
    ...flagshipLevelAndShipCount(3,3),
    mkSTypeReqs(1,"CL", 2,"DD"),
    ...basicReqs,
  ]

  ret[5] = [
    ...flagshipLevelAndShipCount(3,4),
    mkSTypeReqs(1,"CL", 2,"DD"),
    ...basicReqs,
  ]

  ret[6] = [
    ...flagshipLevelAndShipCount(4,4),
    ...basicReqs,
    Req.Morale(1),
  ]

  ret[7] = [
    ...flagshipLevelAndShipCount(5,6),
    ...basicReqs,
  ]

  ret[8] = [
    ...flagshipLevelAndShipCount(6,6),
    ...basicReqs,
  ]

  // world 2

  ret[9] = [
    ...flagshipLevelAndShipCount(3,4),
    mkSTypeReqs(1,"CL",2,"DD"),
    ...basicReqs,
  ]

  ret[10] = [
    ...flagshipLevelAndShipCount(3,3),
    mkSTypeReqs(2,"CL"),
    ...basicReqs,
  ]

  ret[11] = [
    ...flagshipLevelAndShipCount(6,4),
    mkSTypeReqs(2,"DD"),
    ...basicReqs,
  ]

  ret[12] = [
    ...flagshipLevelAndShipCount(4,4),
    mkSTypeReqs(2,"DD"),
    ...basicReqs,
  ]

  ret[13] = [
    ...flagshipLevelAndShipCount(5,6),
    mkSTypeReqs(1,"CL",4,"DD"),
    ...basicReqs,
  ]

  ret[14] = [
    ...flagshipLevelAndShipCount(6,6),
    mkSTypeReqs(1,"CL",3,"DD"),
    ...basicReqs,
  ]

  ret[15] = [
    ...flagshipLevelAndShipCount(9,6),
    mkSTypeReqs(2,"CVLike",2,"DD"),
    ...basicReqs,
  ]

  ret[16] = [
    ...flagshipLevelAndShipCount(11,6),
    mkSTypeReqs(1,"CL",2,"DD"),
    ...basicReqs,
  ]

  // world 3

  ret[17] = [
    ...flagshipLevelAndShipCount(20,6),
    mkSTypeReqs(1,"CL",3,"DD"),
    ...basicReqs,
  ]

  ret[18] = [
    ...flagshipLevelAndShipCount(15,6),
    mkSTypeReqs(3,"CVLike",2,"DD"),
    ...basicReqs,
  ]

  ret[19] = [
    ...flagshipLevelAndShipCount(20,6),
    mkSTypeReqs(2,"BBV",2,"DD"),
    ...basicReqs,
  ]

  ret[20] = [
    ...flagshipLevelAndShipCount(1,2),
    mkSTypeReqs(1,"SSLike",1,"CL"),
    ...basicReqs,
  ]

  ret[21] = [
    ...flagshipLevelAndShipCount(15,5),
    Req.LevelSum(30),
    mkSTypeReqs(1,"CL",4,"DD"),
    Req.DrumCarrierCount(3),
    ...basicReqs,
  ]

  ret[22] = [
    ...flagshipLevelAndShipCount(30,6),
    Req.LevelSum(45),
    mkSTypeReqs(1,"CA",1,"CL",2,"DD"),
    ...basicReqs,
  ]

  ret[23] = [
    ...flagshipLevelAndShipCount(50,6),
    Req.LevelSum(200),
    mkSTypeReqs(2,"BBV",2,"DD"),
    ...basicReqs,
  ]

  ret[24] = [
    ...flagshipLevelAndShipCount(50,6),
    Req.LevelSum(200),
    mkSTypeReqs(1,"CL",4,"DD"),
    Req.FSType("CL"),
    ...basicReqs,
  ]

  // world 4

  ret[25] = [
    ...flagshipLevelAndShipCount(25,4),
    mkSTypeReqs(2,"CA",2,"DD"),
    ...basicReqs,
  ]

  ret[26] = [
    ...flagshipLevelAndShipCount(30,4),
    mkSTypeReqs(1,"CVLike",1,"CL",2,"DD"),
    ...basicReqs,
  ]

  ret[27] = [
    ...flagshipLevelAndShipCount(1,2),
    mkSTypeReqs(2,"SSLike"),
    ...basicReqs,
  ]

  ret[28] = [
    ...flagshipLevelAndShipCount(30,3),
    mkSTypeReqs(3,"SSLike"),
    ...basicReqs,
  ]

  ret[29] = [
    ...flagshipLevelAndShipCount(50,3),
    mkSTypeReqs(3,"SSLike"),
    ...basicReqs,
  ]

  ret[30] = [
    ...flagshipLevelAndShipCount(55,4),
    mkSTypeReqs(4,"SSLike"),
    ...basicReqs,
  ]

  ret[31] = [
    ...flagshipLevelAndShipCount(60,4),
    Req.LevelSum(200),
    mkSTypeReqs(4,"SSLike"),
    ...basicReqs,
  ]

  ret[32] = [
    ...flagshipLevelAndShipCount(5,3),
    mkSTypeReqs(1,"CT",2,"DD"),
    Req.FSType("CT"),
    ...basicReqs,
  ]

  // world 5

  ret[33] = [
    ...flagshipLevelAndShipCount(1,2),
    mkSTypeReqs(2,"DD"),
    ...basicReqs,
  ]

  ret[34] = [
    ...flagshipLevelAndShipCount(1,2),
    mkSTypeReqs(2,"DD"),
    ...basicReqs,
  ]

  ret[35] = [
    ...flagshipLevelAndShipCount(40,6),
    mkSTypeReqs(2,"CVLike",1,"CA",1,"DD"),
    ...basicReqs,
  ]

  ret[36] = [
    ...flagshipLevelAndShipCount(30,6),
    mkSTypeReqs(2,"AV",1,"CL",1,"DD"),
    ...basicReqs,
  ]

  ret[37] = [
    ...flagshipLevelAndShipCount(50,6),
    Req.LevelSum(200),
    mkSTypeReqs(1,"CL",5,"DD"),
    Req.DrumCarrierCount(4),
    ...basicReqs,
  ]

  ret[38] = [
    ...flagshipLevelAndShipCount(65,6),
    Req.LevelSum(240),
    mkSTypeReqs(5,"DD"),
    Req.DrumCarrierCount(4),
    Req.DrumCount(8),
    ...basicReqs,
  ]

  ret[39] = [
    ...flagshipLevelAndShipCount(3,5),
    Req.LevelSum(180),
    mkSTypeReqs(1,"AS",4,"SSLike"),
    ...basicReqs,
  ]

  ret[40] = [
    ...flagshipLevelAndShipCount(25,6),
    Req.LevelSum(150),
    mkSTypeReqs(1,"CL",2,"AV",2,"DD"),
    Req.FSType("CL"),
    ...basicReqs,
  ]

  return ret
})()

const expedGSReqs = (() => {
  const ret = new Array(40+1)

  ret[21] = [
    Req.SparkledCount(4),
    Req.DrumCount(3+1),
  ]

  ret[24] = [
    Req.SparkledCount(4),
    Req.DrumCount(0+4),
  ]

  ret[37] = [
    Req.SparkledCount(4),
    Req.DrumCount(4+1),
  ]

  ret[38] = [
    Req.SparkledCount(4),
    Req.DrumCount(8+2),
  ]

  ret[40] = [
    Req.SparkledCount(4),
    Req.DrumCount(0+4),
  ]

  enumFromTo(1,40).map( expedId => {
    if (!ret[expedId])
      ret[expedId] = []
  })

  return ret
})()

export {
  expedReqs,
  expedGSReqs,
  checkAllReq,
  collectUnmetReqs,
  renderReqData }
