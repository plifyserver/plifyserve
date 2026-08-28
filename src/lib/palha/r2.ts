import { createPresignedPost } from '@aws-sdk/s3-presigned-post'
import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CopyObjectCommand,
  CreateBucketCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { collectPalhaMediaUrls, type PalhaSiteSettings } from '@/lib/palha/site-settings-shared'

const DEFAULT_BUCKET = 'palha-media'

function requiredEnv(name: string) {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(
      `R2 não configurado: falta ${name}. Crie o bucket no Cloudflare, gere o token da API e cole as chaves no .env.`,
    )
  }
  return value
}

export function getPalhaR2Config() {
  const accountId = requiredEnv('R2_ACCOUNT_ID')
  const accessKeyId = requiredEnv('R2_ACCESS_KEY_ID')
  const secretAccessKey = requiredEnv('R2_SECRET_ACCESS_KEY')
  const bucket = process.env.R2_BUCKET_NAME?.trim() || DEFAULT_BUCKET
  const publicBaseUrl = requiredEnv('R2_PUBLIC_BASE_URL').replace(/\/+$/, '')
  return { accountId, accessKeyId, secretAccessKey, bucket, publicBaseUrl }
}

let client: S3Client | null = null
let ready: Promise<void> | null = null

function palhaR2Client() {
  if (client) return client
  const { accountId, accessKeyId, secretAccessKey } = getPalhaR2Config()
  client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  })
  client.middlewareStack.add(
    (next) => async (args) => {
      const request = args.request as { headers?: Record<string, string> }
      if (request.headers) {
        for (const header of Object.keys(request.headers)) {
          const name = header.toLowerCase()
          if (name.startsWith('x-amz-checksum') || name === 'x-amz-sdk-checksum-algorithm') {
            delete request.headers[header]
          }
        }
      }
      return next(args)
    },
    { step: 'build', name: 'stripR2ChecksumHeaders' },
  )
  return client
}

function palhaR2PublicUrl(key: string) {
  const { publicBaseUrl } = getPalhaR2Config()
  return `${publicBaseUrl}/${key.split('/').map(encodeURIComponent).join('/')}`
}

function palhaR2ObjectKey(folder: string, filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin'
  const safeFolder = folder.replace(/[^a-zA-Z0-9/_-]/g, '').replace(/^\/+|\/+$/g, '')
  return `${safeFolder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
}

async function ensurePalhaR2Bucket() {
  if (ready) return ready
  ready = (async () => {
    const s3 = palhaR2Client()
    const { bucket } = getPalhaR2Config()
    try {
      await s3.send(new HeadBucketCommand({ Bucket: bucket }))
    } catch {
      try {
        await s3.send(new CreateBucketCommand({ Bucket: bucket }))
      } catch {
        throw new Error(
          `Bucket R2 "${bucket}" não encontrado. Crie esse bucket no Cloudflare e confira R2_BUCKET_NAME no .env.`,
        )
      }
    }
  })().catch((err) => {
    ready = null
    throw err
  })
  return ready
}

export async function createPalhaR2SignedUpload(folder: string, filename: string, contentType?: string) {
  await ensurePalhaR2Bucket()
  const s3 = palhaR2Client()
  const { bucket } = getPalhaR2Config()
  const key = palhaR2ObjectKey(folder, filename)
  const type = contentType || 'application/octet-stream'
  const signedUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
    {
      expiresIn: 60 * 30,
      signableHeaders: new Set(['host']),
      unhoistableHeaders: new Set([
        'content-type',
        'x-amz-checksum-crc32',
        'x-amz-checksum-crc32c',
        'x-amz-sdk-checksum-algorithm',
        'x-amz-checksum-algorithm',
        'x-amz-content-sha256',
      ]),
    },
  )
  let postUrl = ''
  let postFields: Record<string, string> = {}
  try {
    const posted = await createPresignedPost(s3, {
      Bucket: bucket,
      Key: key,
      Expires: 60 * 30,
      Conditions: [['content-length-range', 1, 10 * 1024 * 1024 * 1024]],
      Fields: { key },
    })
    postUrl = posted.url
    postFields = posted.fields
  } catch {
    postUrl = ''
    postFields = {}
  }
  return {
    path: key,
    token: signedUrl,
    signedUrl,
    postUrl,
    postFields,
    publicUrl: palhaR2PublicUrl(key),
    contentType: type,
  }
}

export async function uploadPalhaR2Object(folder: string, file: File) {
  await ensurePalhaR2Bucket()
  const s3 = palhaR2Client()
  const { bucket } = getPalhaR2Config()
  const key = palhaR2ObjectKey(folder, file.name)
  const body = Buffer.from(await file.arrayBuffer())
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: file.type || 'application/octet-stream',
    }),
  )
  return palhaR2PublicUrl(key)
}

function palhaR2KeyFromPublicUrl(url: string) {
  try {
    const { publicBaseUrl } = getPalhaR2Config()
    const base = publicBaseUrl.endsWith('/') ? publicBaseUrl : `${publicBaseUrl}/`
    if (!url.startsWith(base)) return null
    const key = decodeURIComponent(url.slice(base.length)).replace(/^\/+/, '')
    if (!key || key.includes('..') || key.startsWith('/')) return null
    return key
  } catch {
    return null
  }
}

async function deletePalhaR2Key(key: string) {
  const s3 = palhaR2Client()
  const { bucket } = getPalhaR2Config()
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
}

export type PalhaR2ObjectUsage = {
  key: string
  size: number
}

export async function listPalhaR2Usage(prefix = '') {
  await ensurePalhaR2Bucket()
  const s3 = palhaR2Client()
  const { bucket } = getPalhaR2Config()
  const objects: PalhaR2ObjectUsage[] = []
  let token: string | undefined
  do {
    const listed = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix || undefined,
        ContinuationToken: token,
      }),
    )
    for (const object of listed.Contents || []) {
      if (object.Key) objects.push({ key: object.Key, size: Number(object.Size || 0) })
    }
    token = listed.IsTruncated ? listed.NextContinuationToken : undefined
  } while (token)
  return objects
}

async function listPalhaR2Keys(prefix: string) {
  return (await listPalhaR2Usage(prefix)).map((object) => object.key)
}

export function palhaR2KeyFromUrl(url: string) {
  return palhaR2KeyFromPublicUrl(url)
}

export function isPalhaGalleryObjectKey(key: string) {
  return Boolean(key) && key.startsWith('gallery/') && !key.includes('..') && !key.startsWith('/')
}

const MIN_MULTIPART_PART = 5 * 1024 * 1024

type PalhaChunkedState = {
  sessionId: string
  uploadId: string
  key: string
  contentType: string
  parts: { ETag: string; PartNumber: number }[]
}

function palhaChunkStateKey(sessionId: string) {
  return `tmp/mpu/${sessionId}/state.json`
}

function palhaChunkScratchKey(sessionId: string) {
  return `tmp/mpu/${sessionId}/scratch`
}

function isPalhaUploadId(uploadId: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uploadId)
}

async function readR2Buffer(key: string) {
  const s3 = palhaR2Client()
  const { bucket } = getPalhaR2Config()
  try {
    const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
    const bytes = await obj.Body?.transformToByteArray()
    if (!bytes?.length) return null
    return Buffer.from(bytes)
  } catch {
    return null
  }
}

async function putR2Buffer(key: string, body: Buffer, contentType: string) {
  const s3 = palhaR2Client()
  const { bucket } = getPalhaR2Config()
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  )
}

async function readChunkedState(uploadId: string) {
  const raw = await readR2Buffer(palhaChunkStateKey(uploadId))
  if (!raw) return null
  try {
    return JSON.parse(raw.toString('utf8')) as PalhaChunkedState
  } catch {
    return null
  }
}

async function writeChunkedState(state: PalhaChunkedState) {
  await putR2Buffer(palhaChunkStateKey(state.sessionId), Buffer.from(JSON.stringify(state)), 'application/json')
}

export async function startPalhaR2ChunkedUpload(folder: string, filename: string, contentType?: string) {
  await ensurePalhaR2Bucket()
  const s3 = palhaR2Client()
  const { bucket } = getPalhaR2Config()
  const key = palhaR2ObjectKey(folder, filename)
  const type = contentType || 'application/octet-stream'
  const created = await s3.send(
    new CreateMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      ContentType: type,
    }),
  )
  if (!created.UploadId) throw new Error('Não foi possível iniciar o envio no R2.')
  const sessionId = crypto.randomUUID()
  const state: PalhaChunkedState = {
    sessionId,
    uploadId: created.UploadId,
    key,
    contentType: type,
    parts: [],
  }
  await writeChunkedState(state)
  return {
    uploadId: sessionId,
    path: key,
    publicUrl: palhaR2PublicUrl(key),
    contentType: type,
  }
}

export async function appendPalhaR2Chunk(sessionId: string, chunk: Buffer) {
  if (!isPalhaUploadId(sessionId)) throw new Error('Envio inválido.')
  const s3 = palhaR2Client()
  const { bucket } = getPalhaR2Config()
  const state = await readChunkedState(sessionId)
  if (!state) throw new Error('Envio expirado. Tente de novo.')
  const scratch = await readR2Buffer(palhaChunkScratchKey(sessionId))
  const combined = scratch ? Buffer.concat([scratch, chunk]) : chunk
  if (combined.length >= MIN_MULTIPART_PART) {
    const partNumber = state.parts.length + 1
    const uploaded = await s3.send(
      new UploadPartCommand({
        Bucket: bucket,
        Key: state.key,
        UploadId: state.uploadId,
        PartNumber: partNumber,
        Body: combined,
      }),
    )
    if (!uploaded.ETag) throw new Error('Falha ao gravar um trecho do vídeo.')
    state.parts.push({ ETag: uploaded.ETag, PartNumber: partNumber })
    await writeChunkedState(state)
    try {
      await deletePalhaR2Key(palhaChunkScratchKey(sessionId))
    } catch {
      // O próximo trecho sobrescreve o rascunho.
    }
  } else {
    await putR2Buffer(palhaChunkScratchKey(sessionId), combined, 'application/octet-stream')
  }
}

export async function finishPalhaR2ChunkedUpload(sessionId: string) {
  if (!isPalhaUploadId(sessionId)) throw new Error('Envio inválido.')
  const s3 = palhaR2Client()
  const { bucket } = getPalhaR2Config()
  const state = await readChunkedState(sessionId)
  if (!state) throw new Error('Envio expirado. Tente de novo.')
  try {
    const scratch = await readR2Buffer(palhaChunkScratchKey(sessionId))
    if (scratch?.length) {
      const partNumber = state.parts.length + 1
      const uploaded = await s3.send(
        new UploadPartCommand({
          Bucket: bucket,
          Key: state.key,
          UploadId: state.uploadId,
          PartNumber: partNumber,
          Body: scratch,
        }),
      )
      if (!uploaded.ETag) throw new Error('Falha ao gravar o final do vídeo.')
      state.parts.push({ ETag: uploaded.ETag, PartNumber: partNumber })
    }
    if (!state.parts.length) throw new Error('O vídeo chegou vazio.')
    await s3.send(
      new CompleteMultipartUploadCommand({
        Bucket: bucket,
        Key: state.key,
        UploadId: state.uploadId,
        MultipartUpload: {
          Parts: state.parts.map((part) => ({ ETag: part.ETag, PartNumber: part.PartNumber })),
        },
      }),
    )
  } catch (err) {
    try {
      await s3.send(
        new AbortMultipartUploadCommand({
          Bucket: bucket,
          Key: state.key,
          UploadId: state.uploadId,
        }),
      )
    } catch {
      // Melhor abortar em silêncio do que deixar o upload pendurado.
    }
    throw err
  }
  try {
    await deletePalhaR2Key(palhaChunkStateKey(sessionId))
    await deletePalhaR2Key(palhaChunkScratchKey(sessionId))
  } catch {
    // O vídeo já está no lugar.
  }
  return {
    path: state.key,
    publicUrl: palhaR2PublicUrl(state.key),
    contentType: state.contentType,
  }
}

export async function palhaR2ObjectExists(key: string) {
  const s3 = palhaR2Client()
  const { bucket } = getPalhaR2Config()
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
    return true
  } catch {
    return false
  }
}

export async function stampPalhaR2ContentType(key: string, contentType: string) {
  if (!contentType) return
  const s3 = palhaR2Client()
  const { bucket } = getPalhaR2Config()
  await s3.send(
    new CopyObjectCommand({
      Bucket: bucket,
      Key: key,
      CopySource: `${bucket}/${key.split('/').map(encodeURIComponent).join('/')}`,
      ContentType: contentType,
      MetadataDirective: 'REPLACE',
    }),
  )
}

export async function getPalhaR2Object(key: string, range?: string) {
  const s3 = palhaR2Client()
  const { bucket } = getPalhaR2Config()
  return s3.send(new GetObjectCommand({ Bucket: bucket, Key: key, Range: range }))
}

function downloadFileName(name: string, fallback: string) {
  const cleaned = name.replace(/["\r\n\\]/g, '').trim() || fallback
  return cleaned.slice(0, 160)
}

export async function createPalhaR2OriginalDownload(key: string, filename: string) {
  const s3 = palhaR2Client()
  const { bucket } = getPalhaR2Config()
  const head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
  const name = downloadFileName(filename || key.split('/').pop() || '', 'arquivo')
  const ascii = name.replace(/[^\w.\- ]+/g, '_') || 'arquivo'
  const contentType = head.ContentType || 'application/octet-stream'
  const url = await getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`,
      ResponseContentType: contentType,
    }),
    { expiresIn: 300 },
  )
  return {
    url,
    filename: name,
    contentType,
    bytes: Number(head.ContentLength || 0),
  }
}

export async function purgeRemovedPalhaR2Media(_previous: PalhaSiteSettings, next: PalhaSiteSettings) {
  const kept = new Set(
    [...collectPalhaMediaUrls(next)].map(palhaR2KeyFromPublicUrl).filter((key): key is string => Boolean(key)),
  )
  const stored = [...(await listPalhaR2Keys('photos/')), ...(await listPalhaR2Keys('gallery/'))]
  for (const key of stored) {
    if (kept.has(key)) continue
    try {
      await deletePalhaR2Key(key)
    } catch {
      // O JSON já foi salvo; um arquivo órfão não deve reverter a exclusão.
    }
  }
}
