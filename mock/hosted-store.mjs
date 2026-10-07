import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {createMockApi} from './api.mjs'
import {createContentRepository} from './content-repository.mjs'

// Review-scale adapter: PostgreSQL is authoritative; /tmp is disposable working
// storage. A row lock serializes calls across every serverless instance. Keep
// the tested SQLite contract engine, including its versioned content snapshots.
export function createHostedMock({pool,namespace='kidsverse-mock-v1',maxBytes=16*1024*1024}={}) {
  if(!pool||!/^kidsverse-mock-[a-z0-9-]{1,64}$/.test(namespace))throw Error('Isolated mock database namespace required')
  return async function handle(...args) {
    const client=await pool.connect()
    let directory,api,transaction=false
    try {
      await client.query('BEGIN');transaction=true
      await client.query("SET LOCAL statement_timeout = '20000'")
      await client.query("SET LOCAL lock_timeout = '10000'")
      // Includes first-time schema creation and row initialization in the lock.
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))',[namespace])
      await client.query('CREATE TABLE IF NOT EXISTS kidsverse_mock_snapshots (namespace text PRIMARY KEY, payload bytea, revision bigint NOT NULL DEFAULT 0, updated_at timestamptz NOT NULL DEFAULT now())')
      await client.query('INSERT INTO kidsverse_mock_snapshots(namespace) VALUES($1) ON CONFLICT DO NOTHING',[namespace])
      const {rows}=await client.query('SELECT payload FROM kidsverse_mock_snapshots WHERE namespace=$1 FOR UPDATE',[namespace])
      if(rows[0].payload?.length>maxBytes)throw Error('Mock database size limit reached')
      directory=await mkdtemp(join(tmpdir(),'kv-hosted-'))
      const filename=join(directory,'mock.sqlite')
      if(rows[0].payload)await writeFile(filename,rows[0].payload)
      api=createMockApi({contentRepository:createContentRepository({filename})})
      const result=await api(...args)
      // Close flushes the SQLite WAL before persisting the complete database.
      api.close();api=null
      const payload=await readFile(filename)
      if(payload.length>maxBytes)throw Error('Mock database size limit reached')
      await client.query('UPDATE kidsverse_mock_snapshots SET payload=$2, revision=revision+1, updated_at=now() WHERE namespace=$1',[namespace,payload])
      await client.query('COMMIT');transaction=false
      return result
    } finally {
      try {if(transaction)await client.query('ROLLBACK')} finally {
        api?.close()
        if(directory)await rm(directory,{recursive:true,force:true})
        client.release()
      }
    }
  }
}
