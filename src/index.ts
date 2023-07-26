// import fetch from 'node-fetch'
import * as hc from '@actions/http-client'
import * as core from '@actions/core'
import { BskyAgent, RichText, AppBskyFeedPost } from '@atproto/api'
import type { AtpAgentFetchHandler, AtpAgentFetchHandlerResponse } from '@atproto/api'

// (globalThis as any).fetch = fetch // XXX This is a hack to make the agent work in nodejs

const fetchImpl: AtpAgentFetchHandler = async (
    httpUri: string,
    httpMethod: string,
    httpHeaders: Record<string, string>,
    httpReqBody: any): Promise<AtpAgentFetchHandlerResponse> => {
  const http = new hc.HttpClient('atproto')
  const allowdMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  if (!allowdMethods.includes(httpMethod.toUpperCase())) {
    throw new Error(`Unsupported HTTP method: ${httpMethod}`)
  }
  const res = await http.request(httpMethod, httpUri, httpReqBody, httpHeaders)
  const body = await res.readBody()
  return {
    status: res.message.statusCode,
    headers: { ...res.message.headers } as Record<string, string>,
    body: res.message.statusCode === 200 ? body : undefined,
  }
}

// BskyAgent.fetch = fetchImpl // XXX This is a hack to make the agent work in nodejs
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
