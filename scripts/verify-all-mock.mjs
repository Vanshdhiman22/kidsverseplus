import {writeFileSync,mkdirSync} from 'node:fs'
import {verifyContract} from '../mock/verify-contract.mjs'
import {buildOpenApi} from '../mock/api-contracts.mjs'
const report=await verifyContract()
mkdirSync(new URL('../docs/verification/',import.meta.url),{recursive:true})
writeFileSync(new URL('../docs/verification/all-62-mock-api-responses.json',import.meta.url),JSON.stringify(report,null,2)+'\n')
writeFileSync(new URL('../docs/mock-demo/openapi.json',import.meta.url),JSON.stringify(buildOpenApi(),null,2)+'\n')
console.log(JSON.stringify({operations:report.verified_operations,screens:report.screens.length,captures:report.captures.length,bootstrap:report.bootstrap,restart_verified:report.restart_verified}))
