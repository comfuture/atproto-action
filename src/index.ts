import fetch from 'node-fetch'
import * as core from '@actions/core'
import { BskyAgent, RichText, AppBskyFeedPost } from '@atproto/api'
import type { AtpAgentFetchHandler, AtpAgentFetchHandlerResponse } from '@atproto/api'

(globalThis as any).fetch = fetch // XXX This is a hack to make the agent work in nodejs

const fetchImpl: AtpAgentFetchHandler = async (
  httpUri: string,
  httpMethod: string,
  httpHeaders: Record<string, string>,
  httpReqBody: any): Promise<AtpAgentFetchHandlerResponse> => {

  core.setOutput('fetchImpl', `uri: ${httpUri} method: ${httpMethod} headers: ${JSON.stringify(httpHeaders)}`)
  
  const res = await fetch(httpUri, {
    method: httpMethod,
    headers: httpHeaders,
    body: httpReqBody,
  })

  return {
    status: res.status,
    headers: { ...res.headers } as Record<string, string>,
    body: res.ok ? res.body : undefined,
  }
}

BskyAgent.fetch = fetchImpl // XXX This is a hack to make the agent work in nodejs
BskyAgent.configure({
  fetch: fetchImpl
});


async function run(): Promise<void> {
  const service = core.getInput('service')
  const identifier = core.getInput('identifier')
  const password = core.getInput('password')
  const content = core.getInput('content')
  const isRichText = core.getInput('richtext') === 'true'

  const agent = new BskyAgent({ service })

  await agent.login({
    identifier,
    password,
  }).catch((err) => {
    core.setFailed(`Login failure: ${err}`)
    return
  })

  const post: Partial<AppBskyFeedPost.Record> = {
    $type: 'app.bsky.feed.post',
  }

  if (isRichText) {
    const rt = new RichText({ text: content })
    await rt.detectFacets(agent)
    post['text'] = rt.text
    post['facets'] = rt.facets
  } else {
    post['text'] = content
  }
  post['createdAt'] = new Date().toISOString()

  if (AppBskyFeedPost.isRecord(post)) {
    const res = AppBskyFeedPost.validateRecord(post)
    if (!res.success) {
      core.setFailed(`Invalid post: ${res.error}`)
      return
    }
  } else {
    core.setFailed('Invalid post')
    return
  }

  await agent.post(post)
}

run().catch((err) => {
  core.setFailed(err)
})
