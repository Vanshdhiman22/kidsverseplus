import {mkdir,writeFile} from 'node:fs/promises'
import {buildAssessmentOpenApi,assessmentOperations} from '../mock/assessment-contracts.mjs'
import {buildOpenApi,operations} from '../mock/api-contracts.mjs'
const directory=new URL('../docs/mock-demo/',import.meta.url)
await mkdir(directory,{recursive:true})
await writeFile(new URL('assessment-openapi.json',directory),JSON.stringify(buildAssessmentOpenApi(),null,2)+'\n')
await writeFile(new URL('openapi.json',directory),JSON.stringify(buildOpenApi(),null,2)+'\n')
console.log(`Exported the ${assessmentOperations.length}-operation assessment subset and full ${operations.length}-operation OpenAPI from runtime schemas.`)
