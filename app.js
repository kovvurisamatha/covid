const express = require('express')
const path = require('path')
const app = express()
app.use(express.json())
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

let db = null
const dbPath = path.join(__dirname, 'covid19India.db')
const initializeAndStartDb = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error:${e.message}`)
    process.exit(1)
  }
}
initializeAndStartDb()
module.exports = app
const convertdbtoresponse = dbobject => {
  return {
    stateId: dbobject.state_id,
    stateName: dbobject.state_name,
    population: dbobject.population,
  }
}
//api1
app.get('/states/', async (request, response) => {
  const statesquery = `select * from state`
  const dbresponse = await db.all(statesquery)
  response.send(dbresponse.map(eachstate => convertdbtoresponse(eachstate)))
})
//api2
app.get('/states/:stateId', async (request, response) => {
  const {stateId} = request.params
  const getstatequery = `select * from state where 
  state_id=${stateId}`
  const state = await db.get(getstatequery)
  response.send(convertdbtoresponse(state))
})
//api3
app.post('/districts/', async (request, response) => {
  const district_details = request.body
  const {districtName, stateId, cases, cured, active, deaths} = district_details
  const adddistrictquery = `insert into district
  (district_name,state_id,cases,cured,active,deaths)
  values('${districtName}',${stateId},${cases},${cured},${active},${deaths})`
  const dbresponse = await db.run(adddistrictquery)
  const district_id = dbresponse.lastId
  response.send('District Successfully Added')
})
//api4
const getdistrict = dbobject => {
  return {
    districtId: dbobject.district_id,
    districtName: dbobject.district_name,
    stateId: dbobject.state_id,
    cases: dbobject.cases,
    cured: dbobject.cured,
    active: dbobject.active,
    deaths: dbobject.deaths,
  }
}
app.get('/districts/:districtId', async (request, response) => {
  const {districtId} = request.params
  const district_details = request.body
  const {districtName, stateId, cases, cured, active, deaths} = district_details
  const get_district = `select * from district 
  where district_id=${districtId}`
  const district = await db.get(get_district)
  response.send(getdistrict(district))
})
//api5
app.delete('/districts/:districtId', async (request, response) => {
  const {districtId} = request.params
  const deletequery = `delete from district where
  district_id=${districtId}`
  await db.run(deletequery)
  response.send('District Removed')
})
//api6
app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const district_details = request.body
  const {districtName, stateId, cases, cured, active, deaths} = district_details
  const districtquery = ` update district
  set district_name='${districtName}',state_id=${stateId},cases=${cases},
  cured=${cured},active=${active},deaths=${deaths} where 
  district_id=${districtId}`
  await db.run(districtquery)
  response.send('District Details Updated')
})
//api7
app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const getstatesstatsquery = `select
  sum(cases),sum(cured),sum(active),sum(deaths)
  from district where state_id=${stateId}`
  const stats = await db.get(getstatesstatsquery)
  response.send({
    totalCases: stats['sum(cases)'],
    totalCured: stats['sum(cured)'],
    totalActive: stats['sum(active)'],
    totalDeaths: stats['sum(deaths)'],
  })
})
//api8
app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictIdQuery = `select state_id from district
  where district_id=${districtId}`;
  const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery)
  const getStateNameQuery = `select state_name as stateName
  from state
  where state_id=${getDistrictIdQueryResponse.state_id}`
  const getStateNameQueryResponse = await db.get(getStateNameQuery)
  response.send(getStateNameQueryResponse);
})
