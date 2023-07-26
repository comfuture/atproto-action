import fetch, { Headers, HeadersInit } from 'node-fetch'
import * as core from '@actions/core'
import { BskyAgent, RichText } from '@atproto/api'
import type { AppBskyFeedPost, AtpAgentFetchHandlerResponse } from '@atproto/api'

BskyAgent.configure({
  async fetch(httpUri: string, httpMethod: string, httpHeaders: Record<string, string>, httpReqBody: any): Promise<AtpAgentFetchHandlerResponse> {
    const res = await fetch(httpUri, {
      method: httpMethod,
      headers: httpHeaders,
      body: httpReqBody,
    })

    return {
      status: res.status,
      headers: {...res.headers} as Record<string, string>,
      body: res.ok ? res.body : undefined,
    }
  }
})

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
  })

  const post: AppBskyFeedPost.Record = {
    $type: 'app.bsky.feed.post',
    text: '',
    createdAt: new Date().toISOString(),
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

  await agent.post(post)
}

run().catch((err) => {
  core.error(err)
})
