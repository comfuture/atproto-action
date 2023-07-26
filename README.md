# ATProto Action

This action will run the ATProto tool on the given input file.
Currently only supports posting record to atproto service.

## Usage

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: comfuture/atproto-action@v1
        with:
          service: 'https://bsky.social'
          identifier: 'your-handle.bsky.social'
          password: ${{ secrets.BSKY_APP_PASSWORD }}
          content: 'Hello, world!'
```

## Inputs

```yaml
inputs:
  service:
    description: Atprotol service
    required: true
    default: 'https://bsky.social'
  identifier:
    description: Atprotol handle or email
    required: true
  password:
    description: Atprotol password
    required: true
  content:
    description: The content to post
    required: true
  richtext:
    description: Whether the content is richtext
    required: true
    default: true
```
