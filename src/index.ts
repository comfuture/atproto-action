import fetch from 'node-fetch'
import * as core from '@actions/core'
import { BskyAgent, RichText } from '@atproto/api'
import type { AppBskyFeedPost, AtpAgentFetchHandlerResponse } from '@atproto/api'

(globalThis as any).fetch = fetch

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
